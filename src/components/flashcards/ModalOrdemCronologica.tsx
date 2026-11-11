import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, ArrowRight, X, Sparkles, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

interface ModalOrdemCronologicaProps {
  isOpen: boolean;
  onClose: () => void;
  temaBloqueadoTitulo: string;
  temaAnteriorTitulo?: string;
  onConcluirAnterior?: () => void;
  onContinuarAssimMesmo: () => void;
}

export const ModalOrdemCronologica: React.FC<ModalOrdemCronologicaProps> = ({
  isOpen,
  onClose,
  temaBloqueadoTitulo,
  temaAnteriorTitulo = 'Tema Anterior',
  onConcluirAnterior,
  onContinuarAssimMesmo,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto select-none">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            try { haptic.light(); } catch {}
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Bottom Sheet animado de baixo para cima */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg rounded-t-[32px] border-t border-[#d97706]/50 bg-[#140d08] text-[#fef3c7] shadow-[0_-12px_40px_rgba(0,0,0,0.9)] overflow-hidden pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 px-5 sm:px-6"
          style={{
            background: 'linear-gradient(180deg, #1f130b 0%, #120b06 60%, #090503 100%)',
          }}
        >
          {/* Alça superior (Drag handle) */}
          <div className="w-12 h-1.5 rounded-full bg-[#78350f]/60 mx-auto mb-4" />

          {/* Botão Fechar no Canto Superior */}
          <button
            type="button"
            onClick={() => {
              try { haptic.light(); } catch {}
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-[#78350f]/40 text-[#fef3c7]/60 hover:text-white hover:bg-black/70 active:scale-95 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cabeçalho Visual: Ícone Monumental com Halo de Luz */}
          <div className="flex flex-col items-center text-center pt-1 pb-3">
            <div className="relative mb-3 flex items-center justify-center">
              {/* Brilho radial dourado */}
              <div 
                className="absolute w-24 h-24 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
                  filter: 'blur(12px)',
                }}
              />
              <div 
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(50, 32, 18, 0.95) 0%, rgba(20, 14, 10, 0.95) 100%)',
                  borderColor: 'rgba(217, 119, 6, 0.65)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.35), inset 0 2px 4px rgba(254, 240, 138, 0.25)',
                }}
              >
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-[#fde047] drop-shadow-[0_2px_6px_rgba(245,158,11,0.7)]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#b45309]/30 bg-black/40 mb-2">
              <Compass className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[11px] font-serif font-black uppercase tracking-wider text-[#fbbf24]">
                Ordem Cronológica
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-serif font-black text-[#fef3c7] leading-snug px-4">
              Aprenda no Ritmo Ideal
            </h2>

            <p className="text-xs sm:text-[13px] text-[#fef3c7]/75 font-sans leading-relaxed max-w-sm mt-1 px-2">
              Recomendamos concluir o tema anterior primeiro para garantir a melhor experiência de aprendizagem e fixação na ordem cronológica de estudos.
            </p>
          </div>

          {/* Card Indicador do Próximo Passo Recomendado */}
          <div 
            className="my-3 p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(35, 22, 13, 0.9) 0%, rgba(24, 15, 9, 0.9) 100%)',
              borderColor: 'rgba(217, 119, 6, 0.45)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f59e0b]/20 border border-[#f59e0b]/50 text-[#fde047] shrink-0">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-serif uppercase tracking-wider text-[#f59e0b] block font-bold">
                  Recomendado Agora
                </span>
                <span className="text-xs sm:text-[13px] font-serif font-black text-[#fef3c7] leading-snug break-words block">
                  {temaAnteriorTitulo}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-4 flex flex-col gap-2.5">
            {/* Botão Primário: Concluir Tema Anterior */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onClose();
                if (onConcluirAnterior) {
                  onConcluirAnterior();
                }
              }}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl font-serif font-black text-sm tracking-wide text-[#451a03] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
              }}
            >
              <span>Concluir tema anterior</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Botão Secundário: Continuar Assim Mesmo */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onClose();
                onContinuarAssimMesmo();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-sans font-semibold text-xs text-[#fef3c7]/75 hover:text-[#fef3c7] hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              Continuar assim mesmo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

