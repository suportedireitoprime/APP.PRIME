import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Film, Newspaper } from 'lucide-react';
import { newsImg, cdnImg } from '@/lib/cdnImg';
import { TEMA_COLORS, type BlogPost } from '@/data/blogPosts';
import { Noticia } from '@/services/noticiasService';
import { FeedItem, formatTime } from './carouselTypes';

interface CarouselMediaCardProps {
  item: FeedItem;
  isActive: boolean;
  index: number;
  onOpen: (item: FeedItem) => void;
}

const CarouselMediaCard = ({ item, isActive, index, onOpen }: CarouselMediaCardProps) => {
  const isB = item.kind === 'blog';
  const c = isB ? TEMA_COLORS[(item.data as BlogPost).tema] : null;
  const rawImg = isB
    ? (item.data as BlogPost).imagem_url ?? ''
    : (item.data as Noticia).imagem_url ?? '';
  const img = isB ? cdnImg(rawImg, 640) : newsImg(rawImg, 640);
  const title = isB ? (item.data as BlogPost).titulo : (item.data as Noticia).titulo;
  const meta = isB
    ? `${(item.data as BlogPost).tempo_leitura_min} min · ${(item.data as BlogPost).tema}`
    : `${formatTime((item.data as Noticia).data_publicacao)} · Migalhas`;

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
        className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 transform-gpu will-change-transform ${
          isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-85 scale-[0.98]'
        }`}
        style={isB && c ? { background: c.bg } : undefined}
      >
        {/* Fallback Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white/20">
          {isB ? <Film className="w-8 h-8" /> : <Newspaper className="w-8 h-8" />}
        </div>

        {img && (
          <img
            src={img}
            alt=""
            width={640}
            height={360}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className={`absolute inset-0 w-full h-full object-cover ${
              isB ? 'object-top' : 'brightness-105 contrast-[1.02]'
            }`}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/45 via-60% to-transparent pointer-events-none" />

        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
          <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
        </div>

        {isB && c && (
          <span
            className="absolute top-2.5 left-2.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: c.chip, color: c.chipText }}
          >
            Blog · {(item.data as BlogPost).tema}
          </span>
        )}

        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 mb-1 text-[11.5px] text-white/90">
            <Clock className="w-3 h-3" />
            <span className="truncate">{meta}</span>
          </div>
          <p className="font-display text-white text-[15px] font-normal leading-snug line-clamp-2 drop-shadow-sm">
            {title}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default memo(CarouselMediaCard);
