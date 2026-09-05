import { Noticia } from '@/services/noticiasService';
import { BlogPost } from '@/data/blogPosts';

export const AUTOPLAY_MS = 10000;
export const MAX_NEWS = 8;
export const MAX_OBRAS = 6;
export const MAX_LIVROS = 12;

export type Livro = any;

export type FeedItem =
  | { kind: 'noticia'; id: string; data: Noticia }
  | { kind: 'blog'; id: string; data: BlogPost }
  | { kind: 'livro'; id: string; data: Livro };

export function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (sameDay) return `Hoje · ${hh}:${mm}`;
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${day} ${months[d.getMonth()]} · ${hh}:${mm}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
