import React, { useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '@/components/vademecum/artigo/ArtigoBottomSheet';
import { haptic } from '@/lib/nativeHaptics';
import { getScrapedAlteracoes, extractMesAno, type ScrapedArticleUpdate } from '@/data/leiAlteracoesScraped';

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
  mes?: string;
  mesAno: string;
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
  onOpenComparativo?: (item: HistoricoCarouselItem) => void;
  onOpenVerTodos: () => void;
}

function getBadgeStyle(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) {
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  }
  if (t.startsWith('incluid') || t.startsWith('acrescid')) {
    return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  }
  if (t.startsWith('redacao') || t.startsWith('alterad')) {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }
  if (t.startsWith('renumerad')) {
    return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
  }
  if (t.startsWith('vigencia') || t.startsWith('producao')) {
    return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
  }
  return 'bg-primary/20 text-primary border border-primary/30';
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
  onOpenComparativo,
  onOpenVerTodos,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Carrega as alterações reais extraídas da varredura do Planalto com mês abreviado / ano
  const { items, totalAlteracoes } = useMemo(() => {
    const scrapedList = getScrapedAlteracoes(tabelaNome || null, leiId || null);

    const artigoByNumber = new Map<string, ArtigoLei>();
    for (const a of artigos) {
      const clean = cleanArtigoNumber(a.numero);
      if (clean && !artigoByNumber.has(clean)) {
        artigoByNumber.set(clean, a);
      }
    }

    const result: HistoricoCarouselItem[] = [];
    const seenKeys = new Set<string>();

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
      const { mes, mesAno } = extractMesAno(scraped.motivo, scraped.ano, scraped.data_completa);

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
        mes: scraped.mes || mes,
        mesAno: scraped.mes_ano || mesAno,
        snippet,
        leiNome: leiModificadora,
        textoAntigo: scraped.texto_antigo,
        textoNovo: scraped.texto_novo,
        linkLei: scraped.link_lei,
      });
    }

    // Mescla alterações do Supabase
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

      const d = dbItem.detectado_em ? new Date(dbItem.detectado_em) : new Date();
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesName = meses[d.getMonth()] || 'Jan';
      const mesAno = `${mesName}/${ano}`;

      result.push({
        artigo: artigoObj,
        artigoDisplay: formatArtigoDisplay(dbItem.artigo_numero),
        tipo,
        referencia: 'Atualização oficial registrada na varredura',
        ano,
        mes: mesName,
        mesAno,
        snippet: (dbItem.texto_atual || dbItem.texto_anterior || '').slice(0, 140),
        leiNome: 'Atualização Planalto',
        textoAntigo: dbItem.texto_anterior || undefined,
        textoNovo: dbItem.texto_atual || undefined,
      });
    }

    result.sort((a, b) => (b.ano || 0) - (a.ano || 0));

    return {
      items: result.slice(0, 15),
      totalAlteracoes: result.length,
    };
  }, [artigos, dbAlteracoes, tabelaNome, leiId]);

  if (items.length === 0) return null;

  return (
    <div className="w-full mt-2 sm:mt-3 mb-3 select-none">
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
          className="group pointer-events-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 backdrop-blur-md border border-white/10 hover:border-white/20 text-[12px] font-semibold text-foreground/90 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Carrossel Horizontal de Cards com rolagem suave e cor vermelha da marca */}
      <div className="relative group/carousel -mr-3 sm:-mr-4 md:-mr-6">
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pl-1 pr-4 sm:pr-6 py-1 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item, idx) => {
            const badgeClass = getBadgeStyle(item.tipo);
            return (
              <div
                key={`${item.artigo.id}-${item.referencia}-${idx}`}
                onClick={() => {
                  haptic.selection();
                  if (onOpenComparativo) {
                    onOpenComparativo(item);
                  } else {
                    onOpenArtigo(item.artigo, {
                      tipo: item.tipo,
                      referencia: item.referencia,
                      ano: item.ano,
                      leiNome: item.leiNome,
                      parteModificada: 'Dispositivo',
                      linhasModificadas: [],
                    });
                  }
                }}
                className="snap-start shrink-0 w-[220px] sm:w-[245px] rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/25 hover:border-primary/40 p-3.5 flex flex-col justify-between shadow-xl shadow-black/60 backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
              >
                {/* Glow sutil ao passar o cursor */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Topo do Card: Número do Artigo e Badge de Tipo */}
                <div className="flex items-center justify-between gap-1.5 mb-2 relative z-10">
                  <span className="font-bold text-[14px] sm:text-[15px] text-white group-hover:text-primary transition-colors flex items-center gap-1 drop-shadow-sm">
                    {item.artigoDisplay}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none shrink-0 shadow-sm ${badgeClass}`}>
                    {item.tipo}
                  </span>
                </div>

                {/* Trecho modificado */}
                <div className="flex-1 relative z-10 mb-2.5">
                  <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed font-normal">
                    {item.snippet}
                  </p>
                </div>

                {/* Rodapé do Card: Lei Modificadora e Mês/Ano com listra sutil */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-primary/20 relative z-10">
                  <span className="truncate max-w-[150px] font-medium text-zinc-300">
                    {item.leiNome}
                  </span>
                  <span className="font-bold text-zinc-200 shrink-0 ml-1 tracking-wider">
                    {item.mesAno}
                  </span>
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
