import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_CATS, FAST_PILLS_ITEMS, shuffle } from '@/components/vademecum/home/sections/homeSectionsData';
import { AprenderItem } from './aprenderCarouselTypes';

export function useAprenderItems() {
  const navigate = useNavigate();

  const items = useMemo<AprenderItem[]>(() => {
    const images = FAST_PILLS_ITEMS.map((item) => item.image);
    const cpImage = images[0];

    // Seleciona 8 áreas para compor a galeria circular fluida com metade da alocação de texturas WebGL
    const randomAreas = shuffle(AREA_CATS).slice(0, 8);

    return randomAreas.map((area, index) => {
      const image = index < images.length ? images[index] : cpImage;
      return {
        id: area.id,
        image,
        text: area.label,
        fullName: 'Direito ' + area.label,
        progress: Math.min(0.85, 0.2 + (index * 0.08)),
        showPlayButton: true,
        position: 'inside-bottom',
      };
    });
  }, []);

  const handleItemClick = useCallback(
    (item: { id: string }) => {
      import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
      navigate(`/aprender/area/${item.id.replace('area-', '')}`);
    },
    [navigate]
  );

  return { items, handleItemClick };
}
