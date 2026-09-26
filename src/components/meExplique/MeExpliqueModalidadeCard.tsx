import React, { memo } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  icon: LucideIcon;
  label: React.ReactNode;
  sublabel: string;
  color: string;
  badge?: string;
  onClick: () => void;
}

const MeExpliqueModalidadeCard: React.FC<Props> = ({
  icon: Icon,
  label,
  sublabel,
  color,
  badge,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className="group relative flex h-auto min-h-[140px] w-full min-w-0 flex-col items-start justify-center gap-3 overflow-hidden p-4 rounded-2xl shadow-sm hover:shadow-md transition-all focus-visible:outline-none text-left active:scale-[0.97] border border-border/80 bg-zinc-900/80 hover:bg-zinc-800/80 cursor-pointer select-none"
    >
      {/* Seta ou Badge à Direita (Ajustado para o topo direito) */}
      <div className="absolute top-4 right-3 z-10">
        {badge ? (
          <span className="rounded-full border border-border/60 bg-black/40 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
        )}
      </div>

      {/* Ícone no topo */}
      <div className="relative shrink-0 flex items-center justify-center p-1 rounded-full bg-black/20">
        <Icon
          className="w-7 h-7 xs:w-8 xs:h-8 relative transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
          style={{ color }}
          strokeWidth={1.75}
        />
      </div>

      {/* Textos abaixo */}
      <div className="w-full flex flex-col mt-1 pr-4">
        <p className="font-sans text-[14px] xs:text-[15px] sm:text-[16px] font-semibold leading-tight tracking-tight text-foreground break-words min-h-[2.5rem]">
          {label}
        </p>
        {sublabel && (
          <p className="font-body text-[11px] xs:text-[11.5px] leading-snug mt-1 text-muted-foreground break-words">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
};

export default memo(MeExpliqueModalidadeCard);
