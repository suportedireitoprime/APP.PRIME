import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Pause, ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLeisCantadasPlayer } from "@/contexts/LeisCantadasPlayerContext";
import { haptic } from "@/lib/nativeHaptics";
import CSSEqualizer from "@/components/ui/CSSEqualizer";

/**
 * Mini player global das Leis Cantadas — 120fps otimizado:
 * - Equalizer via CSS @keyframes scaleY (compositor GPU)
 * - Shine via CSS animation (zero Framer rAF)
 * - Arrow nudge via CSS animation
 * - Progress bar via scaleX (zero reflow)
 * - React.memo
 */
const GlobalLeisCantadasMiniPlayer = memo(() => {
  const { atual, tocando, togglePlay, setAberto, aberto, fechar, tempo, dur } = useLeisCantadasPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const onPage = location.pathname === "/leis-cantadas";
  const visivel = !!atual && !(aberto && onPage);

  const abrir = () => {
    haptic.selection();
    if (location.pathname !== "/leis-cantadas") {
      navigate("/leis-cantadas");
    }
    setAberto(true);
  };

  const progress = dur > 0 ? tempo / dur : 0;

  return (
    <AnimatePresence>
      {visivel && atual && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed left-0 right-0 z-[80] px-3 pointer-events-none"
          style={{
            bottom: `calc(9.5rem + var(--sai-bottom))`,
          }}
        >
          <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md shadow-2xl shadow-black/60 flex items-center gap-2 pl-1.5 pr-1.5 py-1.5 relative overflow-hidden">
            {/* Reflexo passando — CSS animation (compositor-only) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent mini-player-shine"
              style={{ animation: 'mini-player-shine 4s ease-in-out infinite' }}
            />

            {/* Barra de progresso — scaleX (zero reflow) */}
            <div
              className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/80 to-amber-400/80"
              style={{
                transform: `scaleX(${progress})`,
                transformOrigin: 'left',
                transition: 'transform 0.2s linear',
              }}
            />

            <button
              onClick={() => {
                haptic.selection();
                togglePlay();
              }}
              aria-label={tocando ? 'Pausar' : 'Continuar'}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 active:opacity-70 transition flex items-center justify-center relative z-10"
            >
              {tocando ? (
                <Pause className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Equalizer — CSS @keyframes scaleY (compositor GPU) */}
            <CSSEqualizer playing={tocando} bars={4} height="20px" className="pl-0.5 relative z-10" />

            <button
              onClick={abrir}
              className="flex-1 min-w-0 text-left px-1 relative z-10"
              aria-label="Abrir player"
            >
              <p className="text-[12px] font-semibold text-white truncate leading-tight">
                {atual.titulo || `Art. ${atual.numero_artigo}`}
              </p>
              <p className="text-[10.5px] text-white/60 truncate leading-tight">
                Leis Cantadas
              </p>
            </button>

            <button
              onClick={() => {
                haptic.selection();
                fechar();
              }}
              aria-label="Fechar player"
              className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 active:opacity-70 transition flex items-center justify-center relative z-10"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            {/* Seta com nudge — CSS animation (zero JS) */}
            <button
              onClick={abrir}
              aria-label="Abrir player expandido"
              className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 active:opacity-70 transition flex items-center justify-center relative z-10 overflow-hidden"
            >
              <span
                className="inline-flex arrow-nudge-anim"
                style={{ animation: 'arrow-nudge 1.2s ease-in-out infinite' }}
              >
                <ArrowRight className="w-5 h-5 text-white/90" strokeWidth={2.4} />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GlobalLeisCantadasMiniPlayer.displayName = 'GlobalLeisCantadasMiniPlayer';
export default GlobalLeisCantadasMiniPlayer;
