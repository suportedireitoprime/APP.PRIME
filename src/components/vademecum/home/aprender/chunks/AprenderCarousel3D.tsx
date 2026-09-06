import { memo } from 'react';
import CircularGallery from '@/components/ui/CircularGallery';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  return (
    <div className="relative w-full h-[265px] -mt-6">
      <CircularGallery
        items={items}
        bend={0.3}
        textColor="#ffffff"
        font="bold 52px 'Plus Jakarta Sans', 'Barlow', sans-serif"
        scrollEase={0.15}
        borderRadius={0.05}
        autoScroll={true}
        autoScrollSpeed={0.005}
        onItemClick={onItemClick}
      />
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
