import { memo } from 'react';

interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  activeColor?: string;
}

const CarouselDots = ({ total, activeIndex, activeColor = 'bg-primary' }: CarouselDotsProps) => {
  if (total <= 1) return null;

  const count = Math.min(total, 8);
  const normalizedActive = ((activeIndex % count) + count) % count;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${
            i === normalizedActive ? `w-5 ${activeColor}` : 'w-1.5 bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

export default memo(CarouselDots);
