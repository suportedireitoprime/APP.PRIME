import { cn } from '@/lib/utils';
import type { CountsState } from './visaoGeralTypes';

interface VisaoGeralFunilBarProps {
  counts: CountsState;
}

export function VisaoGeralFunilBar({ counts }: VisaoGeralFunilBarProps) {
  return (
    <>
      {/* Régua Visual do Funil de Conversão */}
      <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-secondary/20 border border-border/40 backdrop-blur-sm text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-muted-foreground overflow-x-auto scrollbar-none py-0.5">
          <span className="font-semibold text-zinc-400 shrink-0">Funil:</span>

          <span className="text-foreground font-semibold flex items-center gap-1 shrink-0">
            <span className="text-zinc-500">1.</span> {counts.paywall} telas
          </span>

          <span className="text-zinc-600 shrink-0">➔</span>

          <span className="text-foreground font-semibold flex items-center gap-1 shrink-0">
            <span className="text-zinc-500">2.</span> {counts.viu_planos} checkout
            <span
              className={cn(
                'px-1 py-0.5 rounded text-[8.5px] font-bold tabular-nums',
                counts.paywall > 0 && counts.viu_planos > 0
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-zinc-600',
              )}
            >
              {counts.paywall > 0 ? `${((counts.viu_planos / counts.paywall) * 100).toFixed(1)}%` : '0%'}
            </span>
          </span>

          <span className="text-zinc-600 shrink-0">➔</span>

          <span className="text-foreground font-semibold flex items-center gap-1 shrink-0">
            <span className="text-zinc-500">3.</span> {counts.trial} assinou
            <span
              className={cn(
                'px-1 py-0.5 rounded text-[8.5px] font-bold tabular-nums',
                counts.viu_planos > 0 && counts.trial > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-600',
              )}
            >
              {counts.viu_planos > 0 ? `${((counts.trial / counts.viu_planos) * 100).toFixed(1)}%` : '0%'}
            </span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0 pl-2 border-l border-border/40 text-[10.5px]">
          <span className="text-zinc-500">Conversão Geral:</span>
          <span
            className={cn(
              'font-extrabold tabular-nums',
              counts.paywall > 0 && counts.trial > 0 ? 'text-emerald-400' : 'text-zinc-500',
            )}
          >
            {counts.paywall > 0 ? `${((counts.trial / counts.paywall) * 100).toFixed(1)}%` : '0.0%'}
          </span>
        </div>
      </div>

      {/* Detalhamento Analítico de Checkouts da Visão Geral */}
      <div className="flex items-center justify-between px-2.5 py-1.5 mb-3 rounded-xl bg-secondary/15 border border-border/35 text-[10px] sm:text-[11px] flex-wrap gap-y-1">
        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="font-semibold text-zinc-300">Status dos Checkouts:</span>
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 font-semibold flex-wrap">
          <span className="text-emerald-400 flex items-center gap-1">
            <span>{counts.checkoutPago}</span>{' '}
            <span className="font-normal text-zinc-400 text-[9.5px]">
              concluído{counts.checkoutPago === 1 ? '' : 's'}
            </span>
          </span>
          <span className="text-zinc-600">·</span>
          {counts.checkoutRecusado > 0 ? (
            <span className="text-rose-400 font-bold bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">
              {counts.checkoutRecusado} RECUSADO{counts.checkoutRecusado === 1 ? '' : 'S'}
            </span>
          ) : (
            <span className="text-zinc-400 text-[9.5px] font-normal">0 recusados</span>
          )}
          <span className="text-zinc-600">·</span>
          <span className="text-amber-400/90 text-[9.5px] font-normal">
            <strong className="font-semibold text-amber-400">{counts.checkoutEtapa2}</strong> parou etapa 2
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-[9.5px] font-normal">
            <strong className="font-semibold text-zinc-300">{counts.checkoutDesistiu}</strong> desistência inicial
          </span>
        </div>
      </div>
    </>
  );
}
