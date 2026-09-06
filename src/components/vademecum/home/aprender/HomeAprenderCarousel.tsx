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
    <div className="pt-2 pb-1 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <AprenderCarouselHeader />
      <AprenderCarousel3D items={items} onItemClick={handleItemClick} />
    </div>
  );
};

export default memo(HomeAprenderCarousel);
