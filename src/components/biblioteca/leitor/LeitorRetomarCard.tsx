import React from 'react';
import { motion } from 'framer-motion';
import { BookmarkCheck } from 'lucide-react';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorRetomarCardProps {
  paginas: Pagina[];
  resumeOcrPage: number | null;
  onResume: (targetIdx: number) => void;
  onRestart: () => void;
  onDismiss: () => void;
  dark: boolean;
}

export const LeitorRetomarCard: React.FC<LeitorRetomarCardProps> = ({
  paginas,
  resumeOcrPage,
  onResume,
  onRestart,
  onDismiss,
  dark,
}) => {
  if (resumeOcrPage === null) return null;

  let targetIdx = 0;
  let targetPage: Pagina | undefined;
  if (resumeOcrPage < 0) {
    const legacyIdx = Math.min(-resumeOcrPage, paginas.length - 1);
    targetIdx = legacyIdx;
    targetPage = paginas[legacyIdx];
  } else {
    let bestDiff = Infinity;
    paginas.forEach((p, i) => {
      const d = Math.abs(p.ocrPage - resumeOcrPage);
      if (d < bestDiff) {
        bestDiff = d;
        targetIdx = i;
        targetPage = p;
      }
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1320] bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div
        className="fixed inset-0 z-[1321] flex items-center justify-center px-4 pointer-events-none"
        style={{
          paddingTop: 'calc(var(--sai-top))',
          paddingBottom: 'calc(var(--sai-bottom))',
        }}
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }}
          className={`relative w-full max-w-sm rounded-[28px] p-6 pointer-events-auto overflow-hidden ${
            dark ? 'bg-neutral-900/95 text-white' : 'bg-white/95 text-neutral-900'
          }`}
          style={{
            boxShadow: dark
              ? '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 30px 80px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          {/* Glow ambiente animado */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.35), transparent 70%)' }}
          />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 mb-5"
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 380, damping: 18 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  dark ? 'bg-primary/15' : 'bg-primary/10'
                }`}
              >
                <BookmarkCheck className="w-5 h-5 text-primary" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest opacity-60">Bem-vindo de volta</p>
                <p className="text-sm font-medium truncate">
                  {targetPage ? `${targetPage.chapterTitulo} · pág. ${targetPage.ocrPage}` : 'Continuar leitura'}
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onResume(targetIdx)}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg shadow-primary/30"
            >
              Continuar leitura
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={onRestart}
              className={`w-full h-11 mt-2 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                dark
                  ? 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]'
              }`}
            >
              Começar do início
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};
