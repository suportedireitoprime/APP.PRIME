import type { NavigateFunction } from 'react-router-dom';
import type { PillGalleryItem } from '../data/galleryItems';
import { getMateriaMeta } from '../data/pilulasMateriasConfig';

/**
 * Mapeia o item ou texto para a rota da matéria em Pílulas.
 */
export function navigateToCodigoByItem(item: PillGalleryItem, navigate: NavigateFunction): boolean {
  if (item.id) {
    const metaById = getMateriaMeta(item.id);
    if (metaById) {
      if (metaById.slug === 'direito-penal') {
        navigate('/pilulas/penal');
        return true;
      }
      navigate(`/pilulas/materia/${metaById.slug}`);
      return true;
    }
  }

  // Tenta pelo nome / texto
  const metaByText = getMateriaMeta(item.text) || getMateriaMeta(item.fullName.split('•')[0].trim());
  if (metaByText) {
    if (metaByText.slug === 'direito-penal') {
      navigate('/pilulas/penal');
      return true;
    }
    navigate(`/pilulas/materia/${metaByText.slug}`);
    return true;
  }

  return false;
}
