import type { NavigateFunction } from 'react-router-dom';
import type { PillGalleryItem } from '../data/galleryItems';

/**
 * Mapeia o texto abreviado de um código para a rota correspondente.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
const SLUG_ROUTE_MAP: Record<string, string> = {
  'CP': '/pilulas/cp',
  'CF88': '/pilulas/cf',
  'CC': '/pilulas/cc',
  'CPP': '/pilulas/cpp',
  'CLT': '/pilulas/clt',
};

/**
 * Navega para a rota de um código a partir do item clicado.
 * @returns true se a navegação ocorreu, false se o slug não foi encontrado.
 */
export function navigateToCodigoByItem(item: PillGalleryItem, navigate: NavigateFunction): boolean {
  const route = SLUG_ROUTE_MAP[item.text];
  if (route) {
    navigate(route);
    return true;
  }
  return false;
}

/**
 * Navega para a página de biografias dos Ministros do STF.
 */
export function navigateToMinistros(navigate: NavigateFunction): void {
  navigate('/ferramentas/stf/biografias');
}
