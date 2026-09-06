import { Check, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

interface StepRowProps {
  step: number;
  label: string;
  hint: string;
  onClick: () => void;
  locked?: boolean;
  active?: boolean;
  done?: boolean;
  badge?: number;
  lockedMessage?: string;
}

export function StepRow({
  step,
  label,
  hint,
  onClick,
  locked,
  active,
  done,
  badge,
  lockedMessage,
}: StepRowProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (locked) {
          haptic.error();
          toast(lockedMessage || 'Complete a etapa anterior primeiro.', {
            description: 'Essa opção está bloqueada no momento.',
          });
          return;
        }
        onClick();
      }}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all',
        active
          ? 'border-[#E11D48]/60 bg-[#E11D48]/8 shadow-lg shadow-[#E11D48]/10'
          : done
          ? 'border-emerald-500/30 bg-zinc-900/90 shadow-sm'
          : 'border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-[0.98]',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black tabular-nums transition-all',
          done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
            : active
            ? 'bg-hero-panel text-white shadow-md shadow-[#E11D48]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
            : 'bg-zinc-800 text-zinc-300',
        )}
      >
        {done ? <Check className="h-5 w-5 drop-shadow-md" strokeWidth={3} /> : step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15.5px] font-bold transition-colors text-zinc-100">{label}</span>
          {active && (
            <span className="rounded-full bg-[#E11D48]/20 border border-[#E11D48]/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#E11D48]">
              Aberto
            </span>
          )}
        </span>
        <span className={cn('mt-0.5 block truncate text-[13px]', done ? 'text-zinc-300' : 'text-zinc-400')}>
          {hint}
        </span>
      </span>
      {locked ? (
        <Lock className="h-5 w-5 shrink-0 text-zinc-400" />
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          {!!badge && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-hero-panel px-2 text-[12px] font-black text-white shadow-sm shadow-[#E11D48]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
              {badge}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </span>
      )}
    </button>
  );
}
