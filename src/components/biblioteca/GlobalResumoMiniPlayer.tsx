import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Headphones } from 'lucide-react';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { haptic } from '@/lib/nativeHaptics';

export function GlobalResumoMiniPlayer() {
  const { livroAtual, tocando, togglePlay, fechar, setAberto, aberto } = useResumoLivroPlayer();
  const capaUrl = useBibliotecaCapa(livroAtual?.capa, 150);

  if (!livroAtual || aberto) return null;

  return (
    <div className="fixed bottom-[calc(76px+var(--sai-bottom,0px))] inset-x-0 z-[45] pointer-events-none">
      <div className="mx-auto max-w-lg px-3">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto shadow-2xl rounded-2xl bg-card border border-border overflow-hidden"
          >
            <div className="flex items-center p-2.5 gap-3">
              {/* Capa */}
              <button
                onClick={() => {
                  haptic.selection();
                  setAberto(true);
                }}
                className="w-12 h-16 shrink-0 rounded bg-muted overflow-hidden relative"
              >
                {capaUrl ? (
                  <img src={capaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Headphones className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {tocando && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-3">
                      <motion.div animate={{ height: ['4px', '12px', '4px'] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 bg-white rounded-t" />
                      <motion.div animate={{ height: ['8px', '4px', '8px'] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1 bg-white rounded-t" />
                      <motion.div animate={{ height: ['6px', '10px', '6px'] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1 bg-white rounded-t" />
                    </div>
                  </div>
                )}
              </button>

              {/* Textos */}
              <button
                onClick={() => {
                  haptic.selection();
                  setAberto(true);
                }}
                className="flex-1 min-w-0 text-left"
              >
                <div className="text-[10px] font-bold tracking-widest text-primary uppercase mb-0.5">
                  Resumo em Áudio
                </div>
                <div className="font-semibold text-sm truncate text-foreground leading-tight">
                  {livroAtual.titulo}
                </div>
                {livroAtual.autor && (
                  <div className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                    {livroAtual.autor}
                  </div>
                )}
              </button>

              {/* Controles */}
              <div className="flex items-center gap-1 pr-1 shrink-0">
                <button
                  onClick={() => {
                    haptic.selection();
                    togglePlay();
                  }}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {tocando ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    haptic.selection();
                    fechar();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
