import React, { useMemo, useRef } from 'react';
import { History, ChevronRight, Calendar, Sparkles, ChevronLeft } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '@/components/vademecum/artigo/ArtigoBottomSheet';
import { haptic } from '@/lib/nativeHaptics';

export type DbAlteracao = {
  artigo_numero: string;
  tipo_alteracao: string;
  texto_anterior: string | null;
  texto_atual: string | null;
  detectado_em: string;
};

export type HistoricoModItem = {
  artigo: ArtigoLei;
  tipo: string;
  referencia: string;
  ano: number;
  parteModificada: string;
  leiNome: string;
  linhasModificadas: number[];
  fromMonitor?: boolean;
};

interface LeiHistoricoCarouselProps {
  artigos: ArtigoLei[];
  dbAlteracoes?: DbAlteracao[];
  onOpenArtigo: (artigo: ArtigoLei, modInfo: ModificationInfo) => void;
  onOpenVerTodos: () => void;
}

const modRegex = /\((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi;
const yearRegex = /\b(1\d{3}|20\d{2})\b/;
const typeRegex = /^\((Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)/i;

function getBadgeStyle(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) {
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  }
  if (t.startsWith('incluid') || t.startsWith('acrescid')) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (t.startsWith('redacao') || t.startsWith('alterad')) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  if (t.startsWith('renumerad')) {
    return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
  }
  if (t.startsWith('vigencia') || t.startsWith('producao')) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  return 'bg-white/10 text-zinc-300 border-white/10';
}

export const LeiHistoricoCarousel: React.FC<LeiHistoricoCarouselProps> = ({
  artigos,
  dbAlteracoes = [],
  onOpenArtigo,
  onOpenVerTodos,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Extrai as modificações legislativas mais recentes dos artigos e mescla com alterações do scraper
  const items = useMemo(() => {
    const result: HistoricoModItem[] = [];
    const seenArtigos = new Set<string>();

    // 1. Alterações estruturadas encontradas nos textos dos artigos
    for (const artigo of artigos) {
      const lines = artigo.caput.split('\n').filter((l) => l.trim());
      const refGroups = new Map<string, { indices: number[]; tipo: string; ref: string; ano: number }>();

      for (let li = 0; li < lines.length; li++) {
        const lineMatches = lines[li].match(modRegex);
        if (!lineMatches) continue;
        const ref = lineMatches[lineMatches.length - 1];
        const refKey = ref.replace(/^\(/, '').replace(/\)$/, '');
        const tm = ref.match(typeRegex);
        const ym = ref.match(yearRegex);
        let tipo = tm ? tm[1].replace(/\s+dada/i, '') : 'Alteração';
        if (/^redaç/i.test(tipo)) tipo = 'Alterada';
        const ano = ym ? parseInt(ym[1], 10) : 0;
        if (!refGroups.has(refKey)) {
          refGroups.set(refKey, { indices: [], tipo, ref: refKey, ano });
        }
        refGroups.get(refKey)!.indices.push(li);
      }

      if (refGroups.size === 0) continue;

      for (const [, group] of refGroups) {
        let parteModificada = 'Artigo inteiro';
        if (group.indices.length < lines.length) {
          const firstModLine = lines[group.indices[0]];
          if (/^§\s*\d+[º°]?/i.test(firstModLine)) {
            const pMatch = firstModLine.match(/^(§\s*\d+[º°]?)/i);
            parteModificada = pMatch ? pMatch[1].replace(/°/g, 'º') : '§';
          } else if (/^[IVXLC]+\s*[-–.]/i.test(firstModLine)) {
            const iMatch = firstModLine.match(/^([IVXLC]+)/i);
            parteModificada = iMatch ? `Inciso ${iMatch[1]}` : 'Inciso';
          } else if (/^[a-z]\)/i.test(firstModLine)) {
            const aMatch = firstModLine.match(/^([a-z]\))/i);
            parteModificada = aMatch ? `Alínea ${aMatch[1]}` : 'Alínea';
          } else if (/^Parágrafo\s+único/i.test(firstModLine)) {
            parteModificada = 'Parágrafo único';
          } else if (/caput/i.test(group.ref)) {
            parteModificada = 'Caput';
          }
        }
        const leiMatch = group.ref.match(
          /(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provisória)\s+n[º°]?\s*[\d.]+(?:,\s*de\s*\d{4})?/i
        );
        const leiNome = leiMatch ? leiMatch[0] : group.ref;
        result.push({
          artigo,
          tipo: group.tipo,
          referencia: group.ref,
          ano: group.ano,
          parteModificada,
          leiNome,
          linhasModificadas: group.indices,
        });
        seenArtigos.add(String(artigo.numero).replace(/^art\.?\s*/i, '').trim());
      }
    }

    // 2. Mescla alterações detectadas pelo scraper no banco caso não estejam repetidas
    for (const alt of dbAlteracoes) {
      const numClean = alt.artigo_numero.replace(/^art\.?\s*/i, '').trim();
      if (!seenArtigos.has(numClean)) {
        const found = artigos.find(
          (a) => String(a.numero).replace(/^art\.?\s*/i, '').trim() === numClean
        );
        if (found) {
          const ano = alt.detectado_em ? new Date(alt.detectado_em).getFullYear() : 0;
          result.push({
            artigo: found,
            tipo: alt.tipo_alteracao || 'Alteração',
            referencia: alt.tipo_alteracao,
            ano,
            parteModificada: 'Artigo',
            leiNome: 'Atualização recente',
            linhasModificadas: [],
            fromMonitor: true,
          });
          seenArtigos.add(numClean);
        }
      }
    }

    // Ordena do mais recente para o mais antigo e limita ao top 15 para o carrossel
    return result.sort((a, b) => b.ano - a.ano).slice(0, 15);
  }, [artigos, dbAlteracoes]);

  if (items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mb-3 select-none">
      {/* Cabeçalho com o 'risquinho' decorativo, título 'Histórico' e botão 'Ver todos' */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Risquinho vertical padrão oficial */}
          <div className="w-1 h-3.5 rounded-full bg-primary shadow-sm shadow-primary/60 shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white/95 flex items-center gap-1.5 truncate">
            Histórico
            <span className="text-[10px] font-medium tracking-normal text-zinc-400 normal-case">
              ({items.length} atualizações)
            </span>
          </h2>
          {/* Linha gradiente sutil ("risquinho horizontal") */}
          <div className="hidden sm:block h-px w-16 md:w-28 bg-gradient-to-r from-white/20 to-transparent shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenVerTodos}
            className="text-[11px] sm:text-xs font-semibold text-primary hover:text-red-400 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
          >
            Ver todos
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Carrossel Horizontal de Cards com rolagem suave */}
      <div className="relative group/carousel">
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item, idx) => {
            const badgeClass = getBadgeStyle(item.tipo);
            return (
              <div
                key={`${item.artigo.id}-${item.referencia}-${idx}`}
                onClick={() => {
                  haptic.selection();
                  onOpenArtigo(item.artigo, {
                    artigo_numero: item.artigo.numero,
                    tipo: item.tipo,
                    referencia: item.referencia,
                    ano: item.ano,
                    leiNome: item.leiNome,
                    parteModificada: item.parteModificada,
                    linhasModificadas: item.linhasModificadas,
                    fromMonitor: item.fromMonitor,
                  });
                }}
                className="snap-start shrink-0 w-[210px] sm:w-[230px] rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-3 flex flex-col justify-between shadow-lg shadow-black/40 backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
              >
                {/* Efeito sutil de gradiente de fundo ao hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Topo do Card: Número do Artigo e Badge de Tipo */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5 relative z-10">
                  <span className="font-bold text-sm text-white group-hover:text-primary transition-colors flex items-center gap-1">
                    Art. {item.artigo.numero}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border leading-none shrink-0 ${badgeClass}`}
                  >
                    {item.tipo}
                  </span>
                </div>

                {/* Parte Modificada e Snippet */}
                <div className="flex-1 relative z-10 mb-2">
                  <p className="text-[10px] font-semibold text-zinc-300 mb-0.5 line-clamp-1">
                    {item.parteModificada}
                  </p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.artigo.caput.replace(/\([^)]*\)/g, '').trim()}
                  </p>
                </div>

                {/* Rodapé do Card: Lei / Ano da Atualização */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/5 relative z-10">
                  <span className="truncate max-w-[150px] font-medium text-zinc-400">
                    {item.leiNome}
                  </span>
                  {item.ano > 0 && (
                    <span className="font-semibold text-zinc-300 shrink-0 ml-1">
                      {item.ano}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeiHistoricoCarousel;
