import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeSectionHeader from '../sections/HomeSectionHeader';

interface CarouselHeaderTitleProps {
  kind?: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = (_props: CarouselHeaderTitleProps) => {
  const navigate = useNavigate();

  return (
    <HomeSectionHeader
      title="NOTÍCIAS"
      actionLabel="Ver todas"
      onAction={() => navigate('/noticias')}
      className="mb-3.5 px-1"
    />
  );
};

export default memo(CarouselHeaderTitle);
