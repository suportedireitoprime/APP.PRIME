import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Newspaper } from 'lucide-react';
import { newsImg } from '@/lib/cdnImg';
import type { NoticiaFonte } from '@/services/noticiasService';
import { FeedItem, formatTime, formatTempoRelativo } from './carouselTypes';

const FONTE_CONFIG: Record<NoticiaFonte, { label: string; tagClass: string; sourceName: string }> = {
  migalhas: {
    label: 'Jurídica',
    tagClass: 'bg-emerald-600/90 border-emerald-400/50 text-white',
    sourceName: 'Migalhas',
  },
  gran_oab: {
    label: 'OAB',
    tagClass: 'bg-rose-600/90 border-rose-400/50 text-white',
    sourceName: 'Gran OAB',
  },
  gran_concursos: {
    label: 'Concursos',
    tagClass: 'bg-blue-600/90 border-blue-400/50 text-white',
    sourceName: 'Gran Concursos',
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
  const noticia = item.data;
  const fonteCfg = FONTE_CONFIG[noticia.fonte] ?? FONTE_CONFIG.migalhas;
  const img = noticia.imagem_url ? newsImg(noticia.imagem_url, 640) : '';
  const meta = `${formatTime(noticia.data_publicacao)} · ${fonteCfg.sourceName}`;

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
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between p-3.5 transition-all duration-300 transform-gpu will-change-transform ${
          variant === 'hero' ? 'min-h-[180px]' : 'min-h-[158px] sm:min-h-[164px]'
        } ${
          isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-85 scale-[0.98]'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white/15">
          <Newspaper className="w-8 h-8" />
        </div>

        {img && (
          <img
            src={img}
            alt={noticia.titulo}
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
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide backdrop-blur-md border shadow-sm ${fonteCfg.tagClass}`}>
            <span>{fonteCfg.label}</span>
            <span className="opacity-70">·</span>
            <span className="font-medium opacity-90">{formatTempoRelativo(noticia.data_publicacao)}</span>
          </span>

          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
          </div>
        </div>

        <div className="relative z-10 pt-4">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="leading-tight">{meta}</span>
          </div>
          <p className="font-display text-white text-[13.5px] sm:text-[14.5px] font-semibold leading-snug drop-shadow-sm">
            {noticia.titulo}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default memo(CarouselMediaCard);
