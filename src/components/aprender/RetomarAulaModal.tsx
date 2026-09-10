import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export interface RetomarAulaModalProps {
  open: boolean;
  aulaTitulo: string;
  paginaSalva: number; // 1-indexed (ex: página 5)
  totalPaginas: number; // ex: 12
  pctConcluido: number; // ex: 42
  onContinuar: () => void;
  onRecomecar: () => void;
}

/**
 * Card flutuante ultra responsivo para retomada inteligente de aula.
 * Otimizado para telas mobile (Thumb Zone, touch targets >= 48px) e desktop.
 */
export function RetomarAulaModal({
  open,
  aulaTitulo,
  paginaSalva,
  totalPaginas,
  pctConcluido,
  onContinuar,
  onRecomecar,
}: RetomarAulaModalProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop com Blur Profundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => {
            // Clicar fora por padrão continua de onde parou para conveniência
            haptic.selection();
            onContinuar();
          }}
        />

        {/* Card Flutuante Responsivo */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="retomar-aula-titulo"
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 25 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          className="relative w-full max-w-[420px] rounded-3xl border border-white/15 bg-[#141417]/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden"
        >
          {/* Efeito sutil de luz ambiente no topo do card */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Badge de Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Aula em Andamento
            </span>
            <span className="text-[11px] font-bold text-neutral-400 tabular-nums">
              {pctConcluido}% concluído
            </span>
          </div>

          {/* Título da Aula */}
          <h2
            id="retomar-aula-titulo"
            className="font-sans text-lg sm:text-xl font-extrabold leading-snug text-white tracking-tight line-clamp-2 mb-2"
          >
            {aulaTitulo}
          </h2>

          <p className="text-xs sm:text-[13px] leading-relaxed text-neutral-300 font-normal mb-5">
            Você já iniciou esta aula anteriormente. Deseja retomar seus estudos de onde parou ou recomeçar?
          </p>

          {/* Caixa de Progresso da Aula */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 mb-6 space-y-2.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> Posição salva
              </span>
              <span className="text-white font-bold tabular-nums">
                Página <span className="text-primary">{paginaSalva}</span> de {totalPaginas}
              </span>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden border border-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pctConcluido, 6)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
          </div>

          {/* Ações / Botões Táteis (Área mínima de toque >= 48px) */}
          <div className="flex flex-col gap-2.5 w-full">
            {/* Botão Primário: Continuar de onde parou */}
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                onContinuar();
              }}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 py-3.5 text-sm sm:text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all min-h-[50px] cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
              <span>Continuar da Página {paginaSalva}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Botão Secundário: Começar do zero */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onRecomecar();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:text-sm font-semibold text-neutral-300 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all min-h-[46px] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
              <span>Começar do zero (Página 1)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
