import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_CATS, FAST_PILLS_ITEMS, shuffle } from '@/components/vademecum/home/sections/homeSectionsData';
import { AprenderItem } from './aprenderCarouselTypes';
import { getAreaCover } from '@/lib/areasDireitoCovers';

export function useAprenderItems() {
  const navigate = useNavigate();

  const items = useMemo<AprenderItem[]>(() => {
    // Filtra apenas as áreas que possuem uma capa própria carregada
    const availableAreas = AREA_CATS.filter(area => {
      const coverObj = getAreaCover('Direito ' + area.label) || getAreaCover(area.label);
      return !!coverObj;
    });
    
    // Ordena as matérias em ordem alfabética
    const sortedAreas = availableAreas.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    
    const cpImage = FAST_PILLS_ITEMS[0].image;

    return sortedAreas.map((area, index) => {
      const coverObj = getAreaCover('Direito ' + area.label) || getAreaCover(area.label);
      const image = coverObj?.cover || cpImage;
      
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
