import { BookOpen, Landmark, Briefcase } from 'lucide-react';
import capaPenal from '@/assets/direito-penal.webp.asset.json';
import capaCivil from '@/assets/direito-civil.webp.asset.json';
import capaConstituicao from '@/assets/direito-constituicao.webp.asset.json';
import capaClt from '@/assets/direito-clt.webp.asset.json';
import { srcOf } from '@/lib/assetUrl';

export const CAPA_PENAL = srcOf(capaPenal);

export const AREAS_EM_BREVE = [
  { nome: 'Direito Civil', Icon: BookOpen, capa: srcOf(capaCivil) },
  { nome: 'Constituição', Icon: Landmark, capa: srcOf(capaConstituicao) },
  { nome: 'CLT', Icon: Briefcase, capa: srcOf(capaClt) },
];

export function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function numArtigo(n: string | null | undefined): number {
  const m = String(n ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

const FAV_KEY = 'lc_favoritos';
export function lerFavoritos(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
export function salvarFavoritos(s: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

const PLAYLIST_KEY = 'lc_playlist';
export function lerPlaylist(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
export function salvarPlaylist(s: Set<string>) {
  try {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

export function normalizar(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function fmtN(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k';
  return String(n);
}
