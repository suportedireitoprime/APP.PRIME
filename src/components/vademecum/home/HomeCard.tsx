import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface HomeCardProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  color: string;
  delay?: number;
  inlineTitle?: boolean;
  onClick: () => void;
  className?: string;
  statusBadge?: string;
  badge?: string;
  'data-track'?: string;
  'data-track-name'?: string;
  'data-track-section'?: string;
  solidColor?: boolean;
  hideChevron?: boolean;
  hideWatermark?: boolean;
  titleClassName?: string;
  iconClassName?: string;
  iconStrokeWidth?: number;
  style?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
}

/**
 * Card padrão usado em Categorias, Em Alta e Áreas.
 * Garante proporção, ícone, tipografia e espaçamento idênticos ao padrão Vacatio App.
 */
const HomeCardImpl = ({
  icon: Icon,
  label,
  sublabel,
  color,
  delay = 0,
  inlineTitle = false,
  onClick,
  className = '',
  statusBadge,
  badge,
  'data-track': dataTrack,
  'data-track-name': dataTrackName,
  'data-track-section': dataTrackSection,
  hideChevron = false,
  titleClassName,
  iconClassName,
  iconStrokeWidth,
  style,
  iconStyle,
}: HomeCardProps) => {
  const finalBadge = statusBadge || badge;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      data-track={dataTrack}
      data-track-name={dataTrackName}
      data-track-section={dataTrackSection}
      style={style}
      className={`group relative flex flex-col justify-between w-full min-h-[118px] sm:min-h-[124px] h-auto p-3.5 sm:p-4 rounded-2xl bg-card hover:bg-secondary/60 border border-border/60 hover:border-emerald-500/40 shadow-sm hover:shadow-xl hover:-translate-y-[2px] active:scale-[0.98] transition-all duration-300 text-left overflow-hidden ${className}`}
    >
      {finalBadge && (
        <div className="absolute top-2.5 right-3 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider hidden sm:block">
          {finalBadge}
        </div>
      )}

      {inlineTitle ? (
        <>
          <div className="flex items-start w-full gap-2">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Icon
                className={`w-7 h-7 sm:w-[30px] sm:h-[30px] relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${iconClassName || ''}`}
                style={{
                  color,
                  filter: 'saturate(1.25) drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                  ...iconStyle,
                }}
                strokeWidth={iconStrokeWidth ?? 1.5}
              />
              <p className={titleClassName || "font-card text-foreground font-medium text-[14px] sm:text-[15px] tracking-[-0.01em] leading-snug line-clamp-1 min-h-[22px] flex items-center"}>
                {label}
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between w-full mt-auto pt-1 gap-2">
            <div className="min-w-0 flex-1">
              {sublabel && (
                <p className="font-body text-muted-foreground text-[11px] sm:text-[11.5px] leading-tight line-clamp-1 truncate">
                  {sublabel}
                </p>
              )}
            </div>
            {!hideChevron && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between w-full">
            <Icon
              className={`w-7 h-7 relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${iconClassName || ''}`}
              style={{
                color,
                filter: 'saturate(1.2) drop-shadow(0 1px 4px rgba(0,0,0,0.4))',
                ...iconStyle,
              }}
              strokeWidth={iconStrokeWidth ?? 1.5}
            />
            {!hideChevron && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            )}
          </div>
          <div className="w-full min-w-0 mt-auto">
            <p className={titleClassName || "font-card text-foreground font-medium text-[14px] sm:text-[15px] tracking-[-0.01em] leading-snug line-clamp-1"}>
              {label}
            </p>
            {sublabel && (
              <p className="font-body text-muted-foreground text-[11px] sm:text-[11.5px] leading-tight mt-1 line-clamp-1 truncate">
                {sublabel}
              </p>
            )}
          </div>
        </>
      )}
    </motion.button>
  );
};

const HomeCard = memo(HomeCardImpl);
export default HomeCard;
