import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Library } from 'lucide-react';
import { cdnImg } from '@/lib/cdnImg';
import { FeedItem } from './carouselTypes';

interface CarouselLivroCardProps {
  item: FeedItem;
  isActive: boolean;
  index: number;
  onOpen: (item: FeedItem) => void;
}

const CarouselLivroCard = ({ item, isActive, index, onOpen }: CarouselLivroCardProps) => {
  const l = item.data;
  const meta = l.autor ? `${l.autor} · ${l.area ?? 'Clássicos'}` : (l.area ?? 'Clássico do Direito');

  return (
    <motion.button
      key={item.id}
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      className="snap-center shrink-0 w-[85%] md:w-[46%] lg:w-[31%] active:scale-[0.99] text-left"
    >
      <div
        className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 flex transform-gpu will-change-transform ${
          isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-85 scale-[0.98]'
        }`}
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--brand-burgundy-mid)) 60%, hsl(var(--brand-burgundy-deep)) 100%)',
        }}
      >
        {/* SVGs jurídicos decorativos ao fundo */}
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -right-4 -bottom-6 w-[130px] h-[130px] text-white/10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
          <path d="M35 95 Q55 135 75 95 Z" />
          <path d="M125 95 Q145 135 165 95 Z" />
        </svg>
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="pointer-events-none absolute top-2 right-14 w-[54px] h-[54px] text-white/10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M18 78 L58 38" />
          <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
          <path d="M10 88 H50" />
        </svg>

        {/* Capa com destaque */}
        <div className="relative h-full w-[104px] shrink-0 flex items-center justify-center px-2.5 z-[1]">
          <div className="absolute inset-0 flex items-center justify-center">
            <Library className="w-8 h-8 text-white/30" />
          </div>
          {l.imagem && (
            <img
              src={cdnImg(l.imagem, 240)}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="relative h-[118px] w-auto max-w-full object-contain rounded-md z-[2]"
              style={{
                boxShadow:
                  '0 14px 26px -8px rgba(0,0,0,0.75), 0 6px 12px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
              }}
            />
          )}
        </div>

        {/* Texto à direita */}
        <div className="relative flex-1 min-w-0 flex flex-col justify-end px-3.5 pb-3 pt-3 z-[1]">
          <span className="self-start flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white mb-1.5 bg-black/35 backdrop-blur-sm">
            <Library className="w-2.5 h-2.5" />
            Clássico
          </span>
          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{meta}</span>
          </div>
          <p className="font-display text-white text-[14px] font-semibold leading-snug line-clamp-2 drop-shadow-sm">
            {l.livro ?? 'Clássico'}
          </p>
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
            <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2.2} />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default memo(CarouselLivroCard);
