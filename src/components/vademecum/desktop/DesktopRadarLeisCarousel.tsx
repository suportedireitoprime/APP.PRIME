import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Calendar, FileText } from 'lucide-react';
import { getResenhaOfflineOrCache, prefetchResenha, getResenhaCache, type ResenhaItem } from '@/services/atualizacaoService';
import LeiOrdinariaDetail from '@/components/vademecum/artigo/LeiOrdinariaDetail';
import type { LeiOrdinaria } from '@/services/legislacaoService';
import brasaoImg from '@/assets/brasao-republica.webp';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TIPO_BADGES: Record<string, string> = {
  'Lei': 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  'Lei Ordinária': 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  'Lei Complementar': 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  'Decreto': 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  'Medida Provisória': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  'Outro': 'bg-zinc-700/20 text-zinc-300 border-zinc-600/25',
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
    const amount = direction === 'left' ? -380 : 380;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="relative z-20 w-full px-5 pb-5 pt-2">
      {/* HEADER DO RADAR DE LEIS */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-3.5 pb-3">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="font-display text-white text-[16px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
              <span className="w-1 h-5 rounded-full bg-white" />
              NOTÍCIAS JURÍDICAS
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-body bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DOU AO VIVO
              </span>
            </h3>
            <p className="font-body text-zinc-400 text-[11.5px] ml-3">
              Últimas publicações normativas e atos do Diário Oficial da União
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Controles de navegação por seta */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Anterior"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Próximo"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/radar-360')}
            className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 hover:border-white/20 text-[11.5px] font-semibold text-white transition-all shadow-sm"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* LISTA / CARROSSEL DE LEIS (CARDS VAZADOS E COMPACTOS COM BRASÃO) */}
      <div
        ref={scrollerRef}
        className="relative z-10 flex gap-3.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading ? (
          /* Skeletons vazados */
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[290px] h-[155px] shrink-0 rounded-2xl bg-transparent border border-white/10 p-3.5 flex flex-col justify-between animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10" />
                  <div className="h-4 w-16 bg-white/10 rounded-full" />
                </div>
                <div className="h-3 w-12 bg-white/10 rounded" />
              </div>
              <div className="space-y-1.5 my-auto">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
              </div>
              <div className="h-6 w-full bg-white/10 rounded-lg" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="w-full py-8 flex flex-col items-center justify-center text-center">
            <FileText className="w-7 h-7 text-zinc-500 mb-1.5" />
            <p className="text-zinc-400 font-body text-xs">Nenhum ato legislativo encontrado no momento.</p>
            <button
              onClick={() => navigate('/radar-360')}
              className="mt-2 text-xs text-amber-400 hover:underline font-semibold"
            >
              Abrir Radar 360 Completo
            </button>
          </div>
        ) : (
          items.slice(0, 20).map((item) => {
            const badgeClass = TIPO_BADGES[item.tipo_ato] || TIPO_BADGES['Outro'];
            const dateFormatted = formatDate(item.data_dou || item.data_publicacao);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="group snap-start w-[290px] h-[155px] shrink-0 rounded-2xl bg-transparent hover:bg-white/[0.04] border border-white/15 hover:border-white/30 p-3.5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm"
              >
                {/* TOPO: Brasão + Badge de Tipo + Data */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={brasaoImg} alt="Brasão da República" className="w-6 h-6 shrink-0 object-contain drop-shadow" />
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border truncate ${badgeClass}`}>
                      {item.tipo_ato}
                    </span>
                  </div>
                  {dateFormatted && (
                    <span className="flex items-center gap-1 text-[11px] font-body text-zinc-400 shrink-0">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {dateFormatted}
                    </span>
                  )}
                </div>

                {/* CENTRO: Título / Número da Lei + Ementa Prévia */}
                <div className="my-auto py-0.5">
                  <h4 className="font-display font-bold text-[13.5px] text-white group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
                    {item.numero_ato}
                  </h4>
                  <p className="font-body text-[11.5px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                    {item.ementa || 'Sem ementa disponível.'}
                  </p>
                </div>

                {/* RODAPÉ: Botão Vazado de Ver Lei */}
                <div className="pt-1.5 border-t border-white/5">
                  <div className="w-full py-1 px-2.5 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.1] border border-white/10 group-hover:border-white/20 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-300 group-hover:text-white transition-all">
                    <FileText className="w-3 h-3 text-zinc-400 group-hover:text-amber-300 transition-colors" />
                    <span>Ver lei completa</span>
                    <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALHE DA LEI */}
      {createPortal(
        <AnimatePresence>
          {selectedLei && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[100] bg-black/85"
                onClick={() => setSelectedLei(null)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className="fixed z-[101] inset-x-0 mx-auto top-[4vh] bottom-[4vh] bg-background border border-border rounded-2xl flex flex-col w-[880px] max-w-[92vw] shadow-2xl overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto pb-6 relative">
                  <LeiOrdinariaDetail
                    lei={selectedLei}
                    onBack={() => setSelectedLei(null)}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
});

DesktopRadarLeisCarousel.displayName = 'DesktopRadarLeisCarousel';
export default DesktopRadarLeisCarousel;
