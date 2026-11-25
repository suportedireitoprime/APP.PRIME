import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowUpRight,
  Newspaper,
  BookOpen,
  Headphones,
  FileText,
  Pill,
} from 'lucide-react';
import { FeedItem, FeedKind } from './carouselTypes';

const KIND_STYLE: Record<
  FeedKind,
  { icon: typeof Newspaper; iconColor: string; cardBg?: string; borderClass?: string }
> = {
  noticia: { icon: Newspaper, iconColor: 'text-emerald-400' },
  blog: { icon: FileText, iconColor: 'text-amber-400' },
  livro: {
    icon: BookOpen,
    iconColor: 'text-violet-200',
    cardBg: 'linear-gradient(135deg, #5B21B6 0%, #3B0764 100%)',
    borderClass: 'border-violet-400/30',
  },
  audiobook: {
    icon: Headphones,
    iconColor: 'text-rose-200',
    cardBg: 'linear-gradient(135deg, #9F1239 0%, #4C0519 100%)',
    borderClass: 'border-rose-400/30',
  },
  pilula: {
    icon: Pill,
    iconColor: 'text-teal-200',
    cardBg: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
    borderClass: 'border-teal-400/30',
  },
};

interface CarouselMediaCardProps {
  item: FeedItem;
  isActive: boolean;
  index: number;
  onOpen: (item: FeedItem) => void;
  variant?: 'default' | 'hero';
}

const CarouselMediaCard = ({ item, isActive, index, onOpen, variant = 'default' }: CarouselMediaCardProps) => {
  const style = KIND_STYLE[item.kind];
  const BadgeIcon = style.icon;
  const isFullCover = item.kind === 'noticia' || item.kind === 'blog';

  return (
    <motion.button
      key={item.id}
      type="button"
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      className={`snap-center shrink-0 flex items-stretch active:scale-[0.99] text-left cursor-pointer ${
        variant === 'hero' ? 'w-[320px] max-w-[85vw]' : 'w-[86%] sm:w-[68%] md:w-[46%] lg:w-[31%]'
      }`}
    >
      {isFullCover ? (
        <div
          className={`relative w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between p-3.5 transition-all duration-300 transform-gpu will-change-transform ${
            variant === 'hero' ? 'min-h-[180px]' : 'min-h-[158px] sm:min-h-[164px]'
          } ${
            isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-85 scale-[0.98]'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white/15">
            <BadgeIcon className="w-8 h-8" />
          </div>

          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              width={640}
              height={360}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-cover brightness-95 contrast-[1.03]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold tracking-wide text-white bg-black/65 backdrop-blur-md border border-white/15">
              <BadgeIcon className={`w-3 h-3 shrink-0 ${style.iconColor}`} strokeWidth={2.2} />
              <span>{item.badge}</span>
            </span>

            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
            </div>
          </div>

          <div className="relative z-10 pt-4">
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="leading-tight">{item.meta}</span>
            </div>
            <p className="font-display text-white text-[13.5px] sm:text-[14.5px] font-semibold leading-snug drop-shadow-sm">
              {item.title}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{ background: style.cardBg }}
          className={`relative w-full overflow-hidden rounded-2xl border ${style.borderClass || 'border-white/15'} flex items-stretch p-3 gap-3 transition-all duration-300 transform-gpu will-change-transform ${
            variant === 'hero' ? 'min-h-[180px]' : 'min-h-[158px] sm:min-h-[164px]'
          } ${
            isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-85 scale-[0.98]'
          }`}
        >
          {/* Marca d'água sutil estilo Clássicos */}
          <svg
            aria-hidden
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -right-4 -bottom-6 w-[120px] h-[120px] text-white/[0.08]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
            <path d="M35 95 Q55 135 75 95 Z" />
            <path d="M125 95 Q145 135 165 95 Z" />
          </svg>

          {/* Capa lateral à esquerda */}
          <div className="relative w-[86px] sm:w-[96px] self-stretch rounded-xl overflow-hidden bg-black/30 border border-white/15 shrink-0 shadow-md">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <BadgeIcon className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Conteúdo à direita sem abreviação */}
          <div className="relative flex-1 min-w-0 flex flex-col justify-between py-0.5 z-10">
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider text-white bg-black/35 border border-white/15">
                <BadgeIcon className={`w-2.5 h-2.5 shrink-0 ${style.iconColor}`} strokeWidth={2.2} />
                <span>{item.badge}</span>
              </span>

              <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-1 text-[10.5px] sm:text-[11px] text-white/85">
                <Clock className="w-3 h-3 shrink-0 opacity-80" />
                <span className="leading-tight">{item.meta}</span>
              </div>

              <p className="font-display text-white text-[13px] sm:text-[14px] font-semibold leading-snug drop-shadow-sm">
                {item.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.button>
  );
};

export default memo(CarouselMediaCard);
