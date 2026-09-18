import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, ChevronLeft, Calendar, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { getResenhaOfflineOrCache, prefetchResenha, getResenhaCache, type ResenhaItem } from '@/services/atualizacaoService';
import LeiOrdinariaDetail from '@/components/vademecum/artigo/LeiOrdinariaDetail';
import type { LeiOrdinaria } from '@/services/legislacaoService';

const TIPO_BADGES: Record<string, string> = {
  'Lei': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Lei Ordinária': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Lei Complementar': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Decreto': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Medida Provisória': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Outro': 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
};

function cleanText(t: string | null): string | null {
  if (!t) return null;
  return t
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const raw = dateStr.slice(0, 10);
    const parts = raw.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${d} ${meses[m] || ''}`;
    }
  } catch {
    /* ignore */
  }
  return dateStr;
}

export const DesktopRadarLeisCarousel = memo(() => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<ResenhaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLei, setSelectedLei] = useState<LeiOrdinaria | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      // 1) Carrega imediato do cache em memória ou IndexedDB (0ms)
      const offline = await getResenhaOfflineOrCache();
      if (active && offline && offline.length > 0) {
        setItems(offline);
        setLoading(false);
      }

      // 2) Sincroniza em background com o banco
      try {
        await prefetchResenha();
        if (!active) return;
        const fresh = getResenhaCache();
        if (fresh && fresh.length > 0) {
          setItems(fresh);
        }
      } catch (e) {
        console.warn('[DesktopRadarLeisCarousel] Falha ao sincronizar resenha:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenDetail = useCallback((item: ResenhaItem) => {
    const cleaned = cleanText(item.texto_completo);
    const lei: LeiOrdinaria = {
      id: item.id,
      numero_lei: item.numero_ato,
      ementa: item.ementa,
      ano: parseInt(item.data_publicacao?.slice(0, 4) || item.data_dou?.slice(0, 4) || '2026', 10),
      data_publicacao: item.data_publicacao || item.data_dou,
      texto_completo: cleaned,
      url: item.url,
      ordem: 0,
      explicacao: item.explicacao,
    };
    setSelectedLei(lei);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -420 : 420;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Data em destaque
  const latestDateText = items.length > 0 && items[0].data_dou
    ? formatDate(items[0].data_dou)
    : new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className="relative z-20 w-full rounded-3xl overflow-hidden shadow-2xl bg-[#121316]/95 border border-white/10 p-6 backdrop-blur-xl">
      {/* Background sutil grafite/zinc com gradiente premium */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* HEADER DO RADAR DE LEIS */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shadow-inner text-white">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-white text-[17px] font-bold uppercase tracking-widest flex items-center gap-2">
                RADAR DE LEIS
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DOU AO VIVO
              </span>
            </div>
            <p className="font-body text-zinc-400 text-[12px] mt-0.5">
              Últimas publicações normativas e atos do Diário Oficial da União
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Controles de navegação por seta */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Anterior"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Próximo"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/radar-360')}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.15] active:scale-95 border border-white/15 hover:border-white/30 text-[12.5px] font-semibold text-white transition-all shadow-md"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* LISTA / CARROSSEL DE LEIS (CARDS CINZAS) */}
      <div
        ref={scrollerRef}
        className="relative z-10 flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading ? (
          /* Skeletons cinzas */
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[330px] h-[195px] shrink-0 rounded-2xl bg-zinc-800/50 border border-white/5 p-4 flex flex-col justify-between animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-white/10 rounded-full" />
                <div className="h-4 w-16 bg-white/10 rounded-md" />
              </div>
              <div className="space-y-2 my-auto">
                <div className="h-5 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-5/6 bg-white/10 rounded" />
              </div>
              <div className="h-8 w-full bg-white/10 rounded-xl" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="w-full py-10 flex flex-col items-center justify-center text-center">
            <Scale className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-zinc-400 font-body text-sm">Nenhum ato legislativo encontrado no momento.</p>
            <button
              onClick={() => navigate('/radar-360')}
              className="mt-3 text-xs text-amber-400 hover:underline font-semibold"
            >
              Abrir Radar 360 Completo
            </button>
          </div>
        ) : (
          items.slice(0, 15).map((item) => {
            const badgeClass = TIPO_BADGES[item.tipo_ato] || TIPO_BADGES['Outro'];
            const dateFormatted = formatDate(item.data_dou || item.data_publicacao);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="group snap-start w-[330px] h-[195px] shrink-0 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800/95 border border-white/10 hover:border-white/25 p-4 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
              >
                {/* TOPO: Tipo de Ato + Data */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                    {item.tipo_ato}
                  </span>
                  {dateFormatted && (
                    <span className="flex items-center gap-1 text-[11.5px] font-body text-zinc-400">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {dateFormatted}
                    </span>
                  )}
                </div>

                {/* CENTRO: Título / Número da Lei + Ementa Prévia */}
                <div className="my-auto py-1">
                  <h4 className="font-display font-bold text-[14.5px] text-white group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
                    {item.numero_ato}
                  </h4>
                  <p className="font-body text-[12px] text-zinc-300/90 line-clamp-2 mt-1 leading-relaxed">
                    {item.ementa || 'Sem ementa disponível.'}
                  </p>
                </div>

                {/* RODAPÉ: Botão de Ver Lei */}
                <div className="pt-2 border-t border-white/5">
                  <div className="w-full py-1.5 px-3 rounded-xl bg-white/[0.08] group-hover:bg-white/[0.14] border border-white/10 group-hover:border-white/25 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white transition-all">
                    <FileText className="w-3.5 h-3.5 text-zinc-300 group-hover:text-amber-300 transition-colors" />
                    <span>Ver lei completa</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALHE DA LEI */}
      {selectedLei && (
        <LeiOrdinariaDetail
          item={selectedLei}
          onClose={() => setSelectedLei(null)}
        />
      )}
    </section>
  );
});

DesktopRadarLeisCarousel.displayName = 'DesktopRadarLeisCarousel';
export default DesktopRadarLeisCarousel;
