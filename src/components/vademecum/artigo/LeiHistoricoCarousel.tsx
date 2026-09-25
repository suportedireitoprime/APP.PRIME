import React, { useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '@/components/vademecum/artigo/ArtigoBottomSheet';
import { haptic } from '@/lib/nativeHaptics';
import { getScrapedAlteracoes, type ScrapedArticleUpdate } from '@/data/leiAlteracoesScraped';

export type DbAlteracao = {
  artigo_numero: string;
  tipo_alteracao: string;
  texto_anterior: string | null;
  texto_atual: string | null;
  detectado_em: string;
};

export type HistoricoCarouselItem = {
  artigo: ArtigoLei;
  artigoDisplay: string;
  tipo: string;
  referencia: string;
  ano: number;
  snippet: string;
  leiNome: string;
  textoAntigo?: string;
  textoNovo?: string;
  linkLei?: string;
};

interface LeiHistoricoCarouselProps {
  artigos: ArtigoLei[];
  dbAlteracoes?: DbAlteracao[];
  tabelaNome?: string | null;
  leiId?: string | null;
  leiNome?: string;
  onOpenArtigo: (artigo: ArtigoLei, modInfo: ModificationInfo) => void;
  onOpenVerTodos: () => void;
}

function getBadgeStyle(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) {
    return 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
  }
  if (t.startsWith('incluid') || t.startsWith('acrescid')) {
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
  }
  if (t.startsWith('redacao') || t.startsWith('alterad')) {
    return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
  }
  if (t.startsWith('renumerad')) {
    return 'bg-sky-500/15 text-sky-400 border border-sky-500/25';
  }
  if (t.startsWith('vigencia') || t.startsWith('producao')) {
    return 'bg-purple-500/15 text-purple-400 border border-purple-500/25';
  }
  return 'bg-white/[0.06] text-zinc-300 border border-white/[0.08]';
}

function cleanArtigoNumber(val: string): string {
  return (val || '').replace(/[^0-9]/g, '').trim();
}

function formatArtigoDisplay(val: string): string {
  const trimmed = (val || '').trim();
  if (/^art/i.test(trimmed)) return trimmed;
  return `Art. ${trimmed}`;
}

function extractTipoFromMotivo(motivo: string, hasTextoAntigo: boolean): string {
  const m = motivo.toLowerCase();
  if (m.includes('revogad')) return 'Revogado';
  if (m.includes('incluíd') || m.includes('incluid') || m.includes('acrescid')) return 'Incluído';
  if (m.includes('redação dada') || m.includes('redacao') || m.includes('alterad')) return 'Alterado';
  if (m.includes('vigência') || m.includes('vigencia')) return 'Vigência';
  return hasTextoAntigo ? 'Alterado' : 'Incluído';
}

function extractLeiNomeFromMotivo(motivo: string): string {
  const match = motivo.match(
    /(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provisória)\s+n[º°]?\s*[\d.]+(?:,\s*de\s*\d{4})?/i
  );
  if (match) return match[0];
  const parenMatch = motivo.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];
  return motivo || 'Legislação Modificadora';
}

export const LeiHistoricoCarousel: React.FC<LeiHistoricoCarouselProps> = ({
  artigos,
  dbAlteracoes = [],
  tabelaNome,
  leiId,
  leiNome = 'Legislação',
  onOpenArtigo,
  onOpenVerTodos,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Carrega as alterações reais extraídas da varredura do Planalto
  const { items, totalAlteracoes } = useMemo(() => {
    // 1. Obtém as alterações reais da varredura
    const scrapedList = getScrapedAlteracoes(tabelaNome || null, leiId || null);

    // Mapeamento rápido de número de artigo para ArtigoLei
    const artigoByNumber = new Map<string, ArtigoLei>();
    for (const a of artigos) {
      const clean = cleanArtigoNumber(a.numero);
      if (clean && !artigoByNumber.has(clean)) {
        artigoByNumber.set(clean, a);
      }
    }

    const result: HistoricoCarouselItem[] = [];
    const seenKeys = new Set<string>();

    // Processa alterações raspadas do Planalto
    for (const scraped of scrapedList) {
      const numClean = cleanArtigoNumber(scraped.artigo);
      const key = `${numClean || scraped.artigo}-${scraped.ano}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const matchedArtigo = numClean ? artigoByNumber.get(numClean) : undefined;
      const artigoObj: ArtigoLei = matchedArtigo || {
        id: `scraped-${scraped.artigo}`,
        numero: scraped.artigo.replace(/^art\.?\s*/i, '').trim(),
        caput: scraped.texto_novo || scraped.motivo,
      };

      const tipo = extractTipoFromMotivo(scraped.motivo, Boolean(scraped.texto_antigo));
      const leiModificadora = extractLeiNomeFromMotivo(scraped.motivo);

      // Snippet limpo de exibição no card
      let snippet = (scraped.texto_novo || scraped.motivo || artigoObj.caput || '')
        .replace(/\([^)]*\)/g, '')
        .replace(/^Art\.\s*\d+[º°]?\s*[-–.]?/i, '')
        .trim();

      if (!snippet) {
        snippet = scraped.motivo || 'Alteração legislativa oficial identificada no Planalto.';
      }

      result.push({
        artigo: artigoObj,
        artigoDisplay: formatArtigoDisplay(scraped.artigo),
        tipo,
        referencia: scraped.motivo,
        ano: scraped.ano || 2026,
        snippet,
        leiNome: leiModificadora,
        textoAntigo: scraped.texto_antigo,
        textoNovo: scraped.texto_novo,
        linkLei: scraped.link_lei,
      });
    }

    // 2. Mescla alterações salvas no Supabase (legislacao_alteracoes)
    for (const dbItem of dbAlteracoes) {
      const numClean = cleanArtigoNumber(dbItem.artigo_numero);
      const ano = dbItem.detectado_em ? new Date(dbItem.detectado_em).getFullYear() : 2026;
      const key = `${numClean || dbItem.artigo_numero}-${ano}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const matchedArtigo = numClean ? artigoByNumber.get(numClean) : undefined;
      const artigoObj: ArtigoLei = matchedArtigo || {
        id: `db-${dbItem.artigo_numero}`,
        numero: dbItem.artigo_numero.replace(/^art\.?\s*/i, '').trim(),
        caput: dbItem.texto_atual || dbItem.texto_anterior || '',
      };

      const tipo = dbItem.tipo_alteracao === 'artigo_revogado' ? 'Revogado'
        : dbItem.tipo_alteracao === 'artigo_novo' ? 'Incluído'
        : dbItem.tipo_alteracao === 'texto_alterado' ? 'Alterado'
        : 'Alteração';

      result.push({
        artigo: artigoObj,
        artigoDisplay: formatArtigoDisplay(dbItem.artigo_numero),
        tipo,
        referencia: 'Atualização oficial registrada na varredura',
        ano,
        snippet: (dbItem.texto_atual || dbItem.texto_anterior || '').slice(0, 140),
        leiNome: 'Atualização Planalto',
        textoAntigo: dbItem.texto_anterior || undefined,
        textoNovo: dbItem.texto_atual || undefined,
      });
    }

    // Ordena do mais recente para o mais antigo (ex: 2026 antes de 2025, 2024...)
    result.sort((a, b) => (b.ano || 0) - (a.ano || 0));

    return {
      items: result.slice(0, 15),
      totalAlteracoes: result.length,
    };
  }, [artigos, dbAlteracoes, tabelaNome, leiId]);

  if (items.length === 0) return null;

  return (
    <div className="w-full mb-3 select-none">
      {/* Cabeçalho oficial no mesmo padrão do início do aplicativo (CarouselHeaderTitle) */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Risquinho vertical padrão oficial ampliado */}
          <span className="w-1.5 h-5 rounded-full bg-primary shadow-sm shadow-primary/60 shrink-0" />
          <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2 pointer-events-auto uppercase tracking-widest truncate">
            HISTÓRICO
            <span className="text-[12px] font-medium tracking-normal text-zinc-400 normal-case">
              ({totalAlteracoes} atualizações)
            </span>
          </h3>
        </div>

        {/* Botão Ver todos padrão pílula translúcida do início do app */}
        <button
          type="button"
          onClick={onOpenVerTodos}
          className="group pointer-events-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 backdrop-blur-md border border-white/10 hover:border-white/20 text-[12px] font-semibold text-foreground/90 hover:text-white transition-all shadow-sm"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Carrossel Horizontal de Cards com rolagem suave e sem bordas claras */}
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
                    tipo: item.tipo,
                    referencia: item.referencia,
                    ano: item.ano,
                    leiNome: item.leiNome,
                    parteModificada: 'Dispositivo',
                    linhasModificadas: [],
                  });
                }}
                className="snap-start shrink-0 w-[220px] sm:w-[245px] rounded-2xl bg-[#121316] hover:bg-[#17181e] border border-white/[0.04] hover:border-white/[0.08] p-3.5 flex flex-col justify-between shadow-xl shadow-black/60 backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
              >
                {/* Glow sutil ao passar o cursor */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Topo do Card: Número do Artigo e Badges */}
                <div className="flex items-center justify-between gap-1.5 mb-2 relative z-10">
                  <span className="font-bold text-[14px] sm:text-[15px] text-white group-hover:text-primary transition-colors flex items-center gap-1">
                    {item.artigoDisplay}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.05]">
                      {item.ano}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none shrink-0 ${badgeClass}`}>
                      {item.tipo}
                    </span>
                  </div>
                </div>

                {/* Trecho modificado */}
                <div className="flex-1 relative z-10 mb-2.5">
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>

                {/* Rodapé do Card: Lei Modificadora */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/[0.04] relative z-10">
                  <span className="truncate max-w-[160px] font-medium text-zinc-400">
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
