import { memo } from 'react';
import {
  AprenderCarouselHeader,
  AprenderCarousel3D,
  useAprenderItems,
  HomeAprenderCarouselProps,
} from './chunks';

const HomeAprenderCarousel = ({ hideBlog }: HomeAprenderCarouselProps) => {
  const { items, handleItemClick } = useAprenderItems();

  if (hideBlog) return null;

  return (
    <div className="pt-2 pb-1 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 overflow-hidden">
      <AprenderCarouselHeader />
      <AprenderCarousel3D items={items} onItemClick={handleItemClick} />
    </div>
  );
};

export default memo(HomeAprenderCarousel);
