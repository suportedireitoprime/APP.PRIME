import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowRight, X } from 'lucide-react';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { haptic } from '@/lib/nativeHaptics';

export function GlobalResumoMiniPlayer() {
  const { livroAtual, tocando, togglePlay, fechar, setAberto, aberto, tempo, dur } = useResumoLivroPlayer();

  if (!livroAtual || aberto) return null;

  const progress = dur > 0 ? tempo / dur : 0;
  const eqBars = [0, 1, 2, 3];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="fixed left-0 right-0 z-[80] px-3 pointer-events-none"
        style={{
          // Sobe mais acima da bottom nav (botão central elevado "Ferramentas")
          bottom: `calc(9.5rem + var(--sai-bottom))`,
        }}
      >
        <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md shadow-2xl shadow-black/60 flex items-center gap-2 pl-1.5 pr-1.5 py-1.5 relative overflow-hidden">
          {/* Reflexo passando */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-120%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
          />

          {/* Barra de progresso interna sutil */}
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/80 to-amber-400/80 transition-[width] duration-200"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />

          <button
            onClick={() => {
              haptic.selection();
              togglePlay();
            }}
            aria-label={tocando ? 'Pausar' : 'Continuar'}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition flex items-center justify-center relative z-10"
          >
            {tocando ? (
              <Pause className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Equalizer indicando áudio tocando */}
          <div className="flex items-end gap-[2px] h-5 flex-shrink-0 pl-0.5 relative z-10" aria-hidden>
            {eqBars.map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-primary"
                initial={{ height: 4 }}
                animate={
                  tocando
                    ? { height: [4, 14, 7, 16, 5, 12, 4] }
                    : { height: 4 }
                }
                transition={
                  tocando
                    ? { duration: 0.9 + i * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }
                    : { duration: 0.2 }
                }
              />
            ))}
          </div>

          <button
            onClick={() => {
              haptic.selection();
              setAberto(true);
            }}
            className="flex-1 min-w-0 text-left px-1 relative z-10"
            aria-label="Abrir player"
          >
            <p className="text-[12px] font-semibold text-white truncate leading-tight">
              {livroAtual.titulo}
            </p>
            <p className="text-[10.5px] text-white/60 truncate leading-tight">
              Resumo em Áudio
            </p>
          </button>

          <button
            onClick={() => {
              haptic.selection();
              fechar();
            }}
            aria-label="Fechar player"
            className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 active:scale-95 transition flex items-center justify-center relative z-10"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>

          <button
            onClick={() => {
              haptic.selection();
              setAberto(true);
            }}
            aria-label="Abrir player expandido"
            className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-white/10 active:scale-95 transition flex items-center justify-center relative z-10 overflow-hidden"
          >
            <motion.span
              className="inline-flex"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-5 h-5 text-white/90" strokeWidth={2.4} />
            </motion.span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
