import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAST_PILLS_ITEMS } from '@/components/vademecum/home/sections/homeSectionsData';
import { AprenderItem } from './aprenderCarouselTypes';
import { getAreaCover } from '@/lib/areasDireitoCovers';

const APRENDER_AREAS = [
  { id: 'direito-administrativo', label: 'Administrativo', fullName: 'Direito Administrativo' },
  { id: 'direito-civil', label: 'Civil', fullName: 'Direito Civil' },
  { id: 'direito-penal', label: 'Penal', fullName: 'Direito Penal' },
  { id: 'direito-constitucional', label: 'Constitucional', fullName: 'Direito Constitucional' },
  { id: 'direito-processual-civil', label: 'Processual Civil', fullName: 'Direito Processual Civil' },
  { id: 'direito-processual-penal', label: 'Processual Penal', fullName: 'Direito Processual Penal' },
  { id: 'direito-tributario', label: 'Tributário', fullName: 'Direito Tributário' },
  { id: 'direito-do-trabalho', label: 'Trabalho', fullName: 'Direito do Trabalho' },
  { id: 'direito-empresarial', label: 'Empresarial', fullName: 'Direito Empresarial' },
  { id: 'direito-ambiental', label: 'Ambiental', fullName: 'Direito Ambiental' },
  { id: 'direitos-humanos', label: 'Direitos Humanos', fullName: 'Direitos Humanos' },
  { id: 'direito-internacional-publico', label: 'Int. Público', fullName: 'Direito Internacional Público' },
  { id: 'direito-previdenciario', label: 'Previdenciário', fullName: 'Direito Previdenciário' },
  { id: 'direito-desportivo', label: 'Desportivo', fullName: 'Direito Desportivo' },
  { id: 'direito-processual-do-trabalho', label: 'Proc. do Trabalho', fullName: 'Direito Processual do Trabalho' },
  { id: 'direito-financeiro', label: 'Financeiro', fullName: 'Direito Financeiro' },
  { id: 'direito-concorrencial', label: 'Concorrencial', fullName: 'Direito Concorrencial' },
  { id: 'direito-urbanistico', label: 'Urbanístico', fullName: 'Direito Urbanístico' },
  { id: 'direito-internacional-privado', label: 'Int. Privado', fullName: 'Direito Internacional Privado' },
  { id: 'lei-penal-especial', label: 'Lei Penal Especial', fullName: 'Lei Penal Especial' },
  { id: 'formacao-complementar', label: 'Formação Complementar', fullName: 'Formação Complementar' },
  { id: 'pesquisa-cientifica', label: 'Pesquisa Científica', fullName: 'Pesquisa Científica' },
  { id: 'politicas-publicas', label: 'Políticas Públicas', fullName: 'Políticas Públicas' },
  { id: 'portugues', label: 'Português', fullName: 'Português' },
  { id: 'pratica-profissional', label: 'Prática Profissional', fullName: 'Prática Profissional' },
  { id: 'revisao-oab', label: 'Revisão OAB', fullName: 'Revisão OAB' },
  { id: 'teoria-e-filosofia-do-direito', label: 'Teoria e Filosofia', fullName: 'Teoria e Filosofia do Direito' },
];

export function useAprenderItems() {
  const navigate = useNavigate();

  const items = useMemo<AprenderItem[]>(() => {
    // Filtra apenas as áreas que possuem uma capa própria carregada
    const availableAreas = APRENDER_AREAS.filter(area => {
      const coverObj = getAreaCover(area.fullName) || getAreaCover(area.label);
      return !!coverObj;
    });
    
    // Ordena as matérias em ordem alfabética
    const sortedAreas = availableAreas.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    
    const cpImage = FAST_PILLS_ITEMS[0].image;

    return sortedAreas.map((area, index) => {
      const coverObj = getAreaCover(area.fullName) || getAreaCover(area.label);
      const image = coverObj?.cover || cpImage;
      
      return {
        id: area.id,
        image,
        text: area.label,
        fullName: area.fullName,
        progress: Math.min(0.85, 0.2 + (index * 0.08)),
        showPlayButton: true,
        position: 'inside-bottom',
      };
    });
  }, []);

  const handleItemClick = useCallback(
    (item: { id: string }) => {
      import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
      navigate(`/aprender/area/${item.id}`);
    },
    [navigate]
  );

  return { items, handleItemClick };
}
