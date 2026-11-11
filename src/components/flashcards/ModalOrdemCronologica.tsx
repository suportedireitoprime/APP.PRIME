import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, ArrowRight, X, Compass } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaVisualTheme, getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';

export interface ModalOrdemCronologicaProps {
  isOpen: boolean;
  onClose: () => void;
  temaBloqueadoTitulo: string;
  temaAnteriorTitulo?: string;
  onConcluirAnterior?: () => void;
  onContinuarAssimMesmo: () => void;
  theme?: DisciplinaVisualTheme;
}

export function sanitizeTituloLimpo(titulo: string): string {
  if (!titulo) return '';
  return titulo
    .replace(/^\d+[\.\-\s_:]+/, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\s+([a-zA-ZÀ-ÿ]+)/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Administrativo\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Ambiental\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Penal\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Civil\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Constitucional\b/gi, '')
    .replace(/^Direito\s+[a-zA-ZÀ-ÿ]+\s*[-–:]\s*/i, '')
    .replace(/\s+Direito\s+[a-zA-ZÀ-ÿ]+\b/gi, '')
    .trim();
}

export const ModalOrdemCronologica: React.FC<ModalOrdemCronologicaProps> = ({
  isOpen,
  onClose,
  temaBloqueadoTitulo,
  temaAnteriorTitulo = 'Tema Anterior',
  onConcluirAnterior,
  onContinuarAssimMesmo,
  theme,
}) => {
  if (!isOpen) return null;

  const activeTheme = theme || getDisciplinaVisualTheme('administrativo');
  const tituloAnteriorLimpo = sanitizeTituloLimpo(temaAnteriorTitulo);
  const tituloBloqueadoLimpo = sanitizeTituloLimpo(temaBloqueadoTitulo);

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

        {/* Bottom Sheet animado de baixo para cima com tema dinâmico da área */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg rounded-t-[32px] border-t shadow-[0_-12px_40px_rgba(0,0,0,0.95)] overflow-hidden pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 px-5 sm:px-6"
          style={{
            background: activeTheme.modalBg || `linear-gradient(180deg, ${activeTheme.bgDark} 0%, #0a0705 100%)`,
            borderColor: activeTheme.border,
            color: activeTheme.textLight,
          }}
        >
          {/* Alça superior (Drag handle) */}
          <div 
            className="w-12 h-1.5 rounded-full mx-auto mb-4 opacity-75"
            style={{ backgroundColor: activeTheme.borderSubtle }}
          />

          {/* Botão Fechar no Canto Superior */}
          <button
            type="button"
            onClick={() => {
              try { haptic.light(); } catch {}
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/50 border hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
            style={{
              borderColor: activeTheme.borderSubtle,
              color: activeTheme.accent,
            }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cabeçalho Visual: Ícone Monumental com Halo de Luz Temático */}
          <div className="flex flex-col items-center text-center pt-1 pb-3">
            <div className="relative mb-3 flex items-center justify-center">
              {/* Brilho radial na cor da disciplina */}
              <div 
                className="absolute w-24 h-24 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${activeTheme.glow} 0%, transparent 70%)`,
                  filter: 'blur(14px)',
                }}
              />
              <div 
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center shadow-xl"
                style={{
                  background: activeTheme.bgCard,
                  borderColor: activeTheme.border,
                  boxShadow: `0 0 20px ${activeTheme.glowSoft}, inset 0 2px 4px rgba(255, 255, 255, 0.25)`,
                }}
              >
                <Lock 
                  className="w-7 h-7 sm:w-8 sm:h-8" 
                  style={{
                    color: activeTheme.accent,
                    filter: `drop-shadow(0 2px 6px ${activeTheme.primary})`,
                  }}
                />
              </div>
            </div>

            <div 
              className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-black/40 mb-2"
              style={{
                borderColor: activeTheme.borderSubtle,
              }}
            >
              <Compass 
                className="w-3.5 h-3.5" 
                style={{ color: activeTheme.accent }}
              />
              <span 
                className="text-[11px] font-serif font-black uppercase tracking-wider"
                style={{ color: activeTheme.accent }}
              >
                Ordem Cronológica
              </span>
            </div>

            <h2 
              className="text-lg sm:text-xl font-serif font-black leading-snug px-4"
              style={{ color: activeTheme.textLight }}
            >
              Aprenda no Ritmo Ideal
            </h2>

            <p 
              className="text-xs sm:text-[13px] font-sans leading-relaxed max-w-sm mt-1 px-2"
              style={{ color: `${activeTheme.textLight}cc` }}
            >
              Recomendamos concluir o tema anterior primeiro para garantir a melhor experiência de aprendizagem e fixação na ordem cronológica de estudos.
            </p>
          </div>

          {/* Card Indicador do Próximo Passo Recomendado */}
          <div 
            className="my-3 p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md"
            style={{
              background: activeTheme.bgCard,
              borderColor: activeTheme.borderSubtle,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0"
                style={{
                  background: activeTheme.glowSoft,
                  borderColor: activeTheme.border,
                  color: activeTheme.accent,
                }}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span 
                  className="text-[10px] font-serif uppercase tracking-wider block font-bold"
                  style={{ color: activeTheme.accent }}
                >
                  Recomendado Agora
                </span>
                <span 
                  className="text-xs sm:text-[13px] font-serif font-black leading-snug break-words block"
                  style={{ color: activeTheme.textLight }}
                >
                  {tituloAnteriorLimpo}
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
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl font-serif font-black text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg"
              style={{
                background: activeTheme.roadGradient,
                color: activeTheme.textActive,
                boxShadow: `0 4px 20px ${activeTheme.glowSoft}, inset 0 1px 2px rgba(255, 255, 255, 0.6)`,
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
              className="w-full py-2.5 px-4 rounded-xl font-sans font-semibold text-xs hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer text-center"
              style={{
                color: `${activeTheme.textLight}b3`,
              }}
            >
              Continuar assim mesmo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
