import React, { memo } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  icon: LucideIcon;
  label: string;
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
      className="group relative flex h-auto min-h-[105px] w-full min-w-0 flex-row items-center justify-between overflow-hidden p-3.5 pr-8 rounded-2xl shadow-sm hover:shadow-md transition-all focus-visible:outline-none text-left active:scale-[0.97] border border-border/80 bg-zinc-900/80 hover:bg-zinc-800/80 cursor-pointer select-none"
    >
      {/* Seta ou Badge à Direita */}
      <div className="absolute top-1/2 -translate-y-1/2 right-2.5 z-10">
        {badge ? (
          <span className="rounded-full border border-border/60 bg-black/40 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="flex items-center gap-2.5 w-full min-w-0 z-10">
        <div className="relative shrink-0 flex items-center justify-center p-1">
          <Icon
            className="w-7 h-7 xs:w-8 xs:h-8 relative transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
            style={{ color }}
            strokeWidth={1.75}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
          <p className="font-display text-[14px] xs:text-[15px] sm:text-[16px] font-bold leading-tight tracking-tight text-foreground break-words">
            {label}
          </p>
          {sublabel && (
            <p className="font-body text-[11px] xs:text-[11.5px] leading-snug mt-1 text-muted-foreground break-words">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {/* Marca d'água com o ícone grande decorativo no fundo */}
      <div className="absolute -right-3 -bottom-3 w-[84px] h-[84px] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95">
        <div className="absolute inset-0 opacity-[0.12]">
          <Icon className="w-full h-full" style={{ color }} strokeWidth={1.5} />
        </div>
        <div className="absolute inset-0 opacity-[0.25] svg-shine">
          <Icon className="w-full h-full" style={{ color }} strokeWidth={1.5} />
        </div>
      </div>
    </button>
  );
};

export default memo(MeExpliqueModalidadeCard);
