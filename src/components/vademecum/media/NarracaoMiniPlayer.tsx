import { useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowRight, X } from 'lucide-react';
import { useNarracaoFlutuante } from '@/stores/useNarracaoFlutuante';
import CSSEqualizer from '@/components/ui/CSSEqualizer';

/**
 * Mini player flutuante que aparece quando a pessoa fecha o artigo mas
 * a narração continua tocando. Renderizado globalmente no App.
 *
 * Otimizado para 120fps:
 * - Equalizer via CSS @keyframes (scaleY) em vez de Framer Motion height
 * - Shine via CSS animation em vez de Framer repeat: Infinity
 * - Arrow nudge via CSS animation
 * - Barra de progresso via scaleX em vez de width
 */
const NarracaoMiniPlayer = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const audio = useNarracaoFlutuante((s) => s.audio);
  const artigo = useNarracaoFlutuante((s) => s.artigo);
  const tabelaNome = useNarracaoFlutuante((s) => s.tabelaNome);
  const leiNome = useNarracaoFlutuante((s) => s.leiNome);
  const isPlaying = useNarracaoFlutuante((s) => s.isPlaying);
  const progress = useNarracaoFlutuante((s) => s.progress);
  const returnPath = useNarracaoFlutuante((s) => s.returnPath);
  const toggle = useNarracaoFlutuante((s) => s.toggle);
  const close = useNarracaoFlutuante((s) => s.close);

  const visible = !!audio && !!artigo;

  // Item 10: Injeta variável CSS --miniplayer-height no root para adaptação de padding no leitor
  useEffect(() => {
    if (visible && artigo) {
      document.documentElement.style.setProperty('--miniplayer-height', '4rem');
      return () => {
        document.documentElement.style.removeProperty('--miniplayer-height');
      };
    } else {
      document.documentElement.style.removeProperty('--miniplayer-height');
    }
  }, [visible, artigo]);

  const handleReopen = () => {
    if (!returnPath || !artigo) return;
    const goEvent = () => {
      window.dispatchEvent(
        new CustomEvent('narracao-flutuante:reopen', {
          detail: { artigo, tabelaNome },
        }),
      );
    };
    if (location.pathname === returnPath) {
      goEvent();
    } else {
      navigate(returnPath);
      setTimeout(goEvent, 200);
    }
  };

  return (
    <AnimatePresence>
      {visible && artigo && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed left-0 right-0 z-[10000] px-3 pointer-events-none"
          style={{
            // Sobe mais acima da bottom nav (botão central elevado "Ferramentas")
            bottom: `calc(9.5rem + var(--sai-bottom))`,
          }}
        >
          <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md shadow-2xl shadow-black/60 flex items-center gap-2 pl-1.5 pr-1.5 py-1.5 relative overflow-hidden">
            {/* Reflexo passando — CSS animation (compositor-only, zero JS) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent mini-player-shine"
              style={{ animation: 'mini-player-shine 4s ease-in-out infinite' }}
            />

            {/* Barra de progresso — scaleX em vez de width (zero reflow) */}
            <div
              className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/80 to-amber-400/80"
              style={{
                transform: `scaleX(${progress})`,
                transformOrigin: 'left',
                transition: 'transform 0.2s linear',
              }}
            />

            <button
              onClick={toggle}
              aria-label={isPlaying ? 'Pausar' : 'Continuar'}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 active:opacity-70 transition flex items-center justify-center relative z-10"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Equalizer — CSS @keyframes scaleY (compositor GPU, zero main thread) */}
            <CSSEqualizer playing={isPlaying} bars={4} height="20px" className="pl-0.5 relative z-10" />

            <button
              onClick={handleReopen}
              className="flex-1 min-w-0 text-left px-1 relative z-10"
              aria-label="Voltar ao artigo"
            >
              <p className="text-[12px] font-semibold text-white truncate leading-tight">
                {/^\d/.test(artigo.numero) ? `Art. ${artigo.numero}` : artigo.numero}
              </p>
              <p className="text-[10.5px] text-white/60 truncate leading-tight">
                {leiNome || tabelaNome || 'Narrando'}
              </p>
            </button>

            {/* Fechar */}
            <button
              onClick={close}
              aria-label="Fechar player"
              className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 active:opacity-70 transition flex items-center justify-center relative z-10"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            {/* Seta com nudge — CSS animation (zero JS) */}
            <button
              onClick={handleReopen}
              aria-label="Abrir artigo"
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

NarracaoMiniPlayer.displayName = 'NarracaoMiniPlayer';
export default NarracaoMiniPlayer;
