import { memo } from 'react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full pt-1 pb-4 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 px-4 sm:px-6">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="relative shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-lg border border-white/10 active:scale-[0.98] transition-transform snap-center focus:outline-none"
        >
          <img
            src={item.image}
            alt={item.fullName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none">
            <span className="text-[12px] sm:text-[13px] font-bold text-white drop-shadow-md leading-tight block line-clamp-2">
              {item.fullName || item.text}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
