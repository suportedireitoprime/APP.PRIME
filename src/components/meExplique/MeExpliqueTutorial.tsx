import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const MeExpliqueTutorial = memo(function MeExpliqueTutorial({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-30 mx-auto mt-4 w-[90%] max-w-md rounded-3xl border border-purple-500/40 bg-zinc-950/90 p-5 text-white shadow-2xl backdrop-blur-md space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-black leading-snug">Como funciona o "Me Explique"?</h3>
              <p className="text-xs text-white/70">Sua câmera com IA e voz ao vivo</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-white/90"><strong>Aponte a câmera</strong> para seu Vade Mecum, livro, caderno ou tela de estudo.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-white/90"><strong>Fale por voz</strong>. Se você falar durante a explicação, o professor para na hora para te ouvir.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
              <p className="text-white/90"><strong>Resumo em PDF</strong>. Toda a sessão gera um resumo estruturado pronto para baixar.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-600/30 active:scale-95 transition-all"
          >
            ENTENDI, CONTINUAR
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
