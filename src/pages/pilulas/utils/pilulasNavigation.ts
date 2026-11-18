import type { NavigateFunction } from 'react-router-dom';
import type { PillGalleryItem } from '../data/galleryItems';

/**
 * Mapeia o texto abreviado de um código para a rota correspondente.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
const SLUG_ROUTE_MAP: Record<string, string> = {
  'Direito Penal': '/pilulas/penal',
  'Penal': '/pilulas/penal',
  'CP': '/pilulas/penal',
  'Direito Constitucional': '/pilulas/cf',
  'Constituição Federal': '/pilulas/cf',
  'Constituição': '/pilulas/cf',
  'CF88': '/pilulas/cf',
  'CF': '/pilulas/cf',
  'Direito Civil': '/pilulas/cc',
  'Código Civil': '/pilulas/cc',
  'CC': '/pilulas/cc',
  'Direito Processual Penal': '/pilulas/cpp',
  'Processo Penal': '/pilulas/cpp',
  'Código de Processo Penal': '/pilulas/cpp',
  'CPP': '/pilulas/cpp',
  'Direito do Trabalho': '/pilulas/clt',
  'Consolidação das Leis do Trabalho': '/pilulas/clt',
  'Trabalho': '/pilulas/clt',
  'CLT': '/pilulas/clt',
};

const ID_ROUTE_MAP: Record<string, string> = {
  penal: '/pilulas/penal',
  cf88: '/pilulas/cf',
  cf: '/pilulas/cf',
  cc: '/pilulas/cc',
  cpp: '/pilulas/cpp',
  clt: '/pilulas/clt',
};

/**
 * Navega para a rota de um código a partir do item clicado.
 * @returns true se a navegação ocorreu, false se o slug não foi encontrado.
 */
export function navigateToCodigoByItem(item: PillGalleryItem, navigate: NavigateFunction): boolean {
  if (item.id && ID_ROUTE_MAP[item.id]) {
    navigate(ID_ROUTE_MAP[item.id]);
    return true;
  }
  const route = SLUG_ROUTE_MAP[item.text] || SLUG_ROUTE_MAP[item.fullName];
  if (route) {
    navigate(route);
    return true;
  }
  return false;
}


