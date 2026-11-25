import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Cabeçalho minimalista padronizado para todas as seções da Home.
 */
const HomeSectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  className = 'px-1',
}: HomeSectionHeaderProps) => {
  return (
    <div className={`relative z-10 flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 uppercase tracking-[0.05em]">
          <span className="w-1 h-4 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
          <span className="truncate">{title}</span>
        </h3>
        {subtitle && (
          <p className="font-sans text-white/50 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onAction();
          }}
          className="group shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-[11.5px] sm:text-[12px] font-semibold text-white/80 hover:text-white transition-colors shadow-sm cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default memo(HomeSectionHeader);
