import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';

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
  <motion.button
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
    onClick={onClick}
    data-track={dataTrack}
    data-track-name={dataTrackName}
    data-track-section={dataTrackSection}
    className={`group relative flex h-[118px] min-h-[118px] w-full min-w-0 flex-col items-start justify-between overflow-hidden p-4 rounded-2xl border border-border/60 shadow-sm active:scale-[0.97] transition text-left ${solidColor ? '' : 'bg-card'} ${className}`}
    style={solidColor ? { backgroundColor: color } : undefined}
  >
    <div className="absolute top-2.5 right-2.5">
      {badge ? (
        <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${solidColor ? 'border-white/20 bg-black/20 text-white/90' : 'border-border bg-muted text-muted-foreground'}`}>
          {badge}
        </span>
      ) : (
        <ChevronRight className={`w-4 h-4 ${solidColor ? 'text-white/70' : 'text-muted-foreground'}`} />
      )}
    </div>
    <div className="relative overflow-hidden rounded-xl">
      <Icon
        className={`relative ${iconClassName || 'w-8 h-8'}`}
        style={{
          color: solidColor ? '#FFFFFF' : color,
          filter: solidColor ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 10px rgba(0,0,0,0.55))',
        }}
        strokeWidth={solidColor ? 1.6 : 1.15}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
    </div>
    {solidColor && (
      <div className="absolute -right-3 -bottom-3 w-[84px] h-[84px] pointer-events-none">
        {/* Base (sempre visível) */}
        <Icon className="w-full h-full text-white/30" strokeWidth={1.5} />
        {/* Brilho animado */}
        <Icon className="absolute inset-0 w-full h-full text-white/70 svg-shine" strokeWidth={1.5} />
      </div>
    )}
    <div className="w-full mt-3 relative z-10">
      <p className={`line-clamp-2 font-display text-[17px] font-bold leading-tight tracking-tight ${solidColor ? 'text-white' : 'text-foreground'}`}>
        {label}
      </p>
      {!solidColor && (
        <p className="font-body text-[11.5px] leading-snug mt-0.5 line-clamp-1 text-muted-foreground">
          {sublabel}
        </p>
      )}
    </div>
  </motion.button>
);

// Memoize: parent re-renders (tab switches, voice input state, sheets opening)
// were causing the entire card grid to re-render even though card props are stable.
const HomeCard = memo(HomeCardImpl);
export default HomeCard;
