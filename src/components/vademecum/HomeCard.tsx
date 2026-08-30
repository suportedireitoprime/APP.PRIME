import { memo } from 'react';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface HomeCardProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  color: string;
  delay?: number;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  badge?: string;
  'data-track'?: string;
  'data-track-name'?: string;
  'data-track-section'?: string;
  solidColor?: boolean;
}

/**
 * Card padrão usado em Categorias, Em Alta e Áreas.
 * Garante proporção, ícone, tipografia e espaçamento idênticos.
 */
const HomeCardImpl = ({ icon: Icon, label, sublabel, color, delay = 0, onClick, className = '', iconClassName = '', badge, 'data-track': dataTrack, 'data-track-name': dataTrackName, 'data-track-section': dataTrackSection, solidColor = false }: HomeCardProps) => (
  <button
    onClick={() => {
      haptic.selection();
      onClick();
    }}
    data-track={dataTrack}
    data-track-name={dataTrackName}
    data-track-section={dataTrackSection}
    className={`group relative flex h-[118px] min-h-[118px] w-full min-w-0 flex-col items-start justify-between overflow-hidden p-4 rounded-2xl border shadow-sm transition-all focus-visible:outline-none text-left active:scale-[0.97] ${
      solidColor 
        ? 'bg-[#1A1D21] border-border/40 hover:bg-[#23272B]' 
        : 'bg-[#1e2329]/80 border-white/5'
    } ${className}`}
  >
    <div className="absolute top-2.5 right-2.5">
      {badge ? (
        <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${solidColor ? 'border-border/60 bg-black/40 text-muted-foreground' : 'border-border bg-muted text-muted-foreground'}`}>
          {badge}
        </span>
      ) : (
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${solidColor ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
      )}
    </div>
    <div className="relative overflow-hidden rounded-xl">
      <Icon
        className={`relative transition-transform duration-300 group-hover:scale-110 group-active:scale-95 group-active:-translate-y-1 ${iconClassName || 'w-8 h-8'}`}
        style={{ color: color }}
        strokeWidth={solidColor ? 1.6 : 1.25}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
    </div>
    {solidColor && (
      <div className="absolute -right-3 -bottom-3 w-[84px] h-[84px] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95">
        {/* Base (sempre visível) */}
        <div className="absolute inset-0 opacity-[0.15]">
          <Icon className="w-full h-full" style={{ color }} strokeWidth={1.5} />
        </div>
        {/* Brilho animado */}
        <div className="absolute inset-0 opacity-[0.4] svg-shine">
          <Icon className="w-full h-full" style={{ color }} strokeWidth={1.5} />
        </div>
      </div>
    )}
    <div className="w-full mt-3 relative z-10">
      <p className={`line-clamp-2 font-display text-[17px] font-bold leading-tight tracking-tight ${solidColor ? 'text-foreground' : 'text-foreground'}`}>
        {label}
      </p>
      {!solidColor && (
        <p className="font-body text-[11.5px] leading-snug mt-0.5 line-clamp-1 text-muted-foreground">
          {sublabel}
        </p>
      )}
    </div>
  </button>
);

// Memoize: parent re-renders (tab switches, voice input state, sheets opening)
// were causing the entire card grid to re-render even though card props are stable.
const HomeCard = memo(HomeCardImpl);
export default HomeCard;
