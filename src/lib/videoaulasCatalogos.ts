import conceitosThumbAsset from '@/assets/thumbnails/conceitos-thumb.webp.asset.json';
import areasThumbAsset from '@/assets/thumbnails/areas-thumb.webp.asset.json';
import oabPrimeiraThumbAsset from '@/assets/thumbnails/oab-primeira-fase-thumb.webp.asset.json';
import oabSegundaThumbAsset from '@/assets/thumbnails/oab-segunda-fase-thumb.webp.asset.json';
import ambientalCapa from '@/assets/thumbnails/ambiental.jpg';
import penalCapa from '@/assets/thumbnails/penal.jpg';
import processoPenalCapa from '@/assets/thumbnails/processo-penal.jpg';
import trabalhoCapa from '@/assets/thumbnails/trabalho.jpg';
import administrativoCapa from '@/assets/thumbnails/administrativo.jpg';
import consumidorCapa from '@/assets/thumbnails/consumidor.jpg';
import civilCapa from '@/assets/thumbnails/civil.jpg';
import { srcOf } from '@/lib/assetUrl';

export type CatalogoId = 'iniciante' | 'areas' | 'oab-primeira-fase' | 'oab-segunda-fase';

export type Catalogo = {
  id: CatalogoId;
  titulo: string;
  descricao: string;
  tabela:
    | 'videoaulas_areas_direito'
    | 'videoaulas_oab_primeira_fase'
    | 'videoaulas_oab_segunda_fase'
    | 'videoaulas_iniciante';
  /** Catálogos sem coluna "area" exibem uma lista única de aulas. */
  temAreas: boolean;
  thumbCol: 'thumb' | 'thumbnail';
  /** Capa da trilha (mesma do projeto original). */
  capa: string;
};

export const CATALOGOS: Catalogo[] = [
  {
    id: 'iniciante',
    titulo: 'Para Iniciantes',
    descricao:
      'Fundamentos do Direito explicados do zero, ideal para quem está começando a estudar.',
    tabela: 'videoaulas_iniciante',
    temAreas: false,
    thumbCol: 'thumbnail',
    capa: srcOf(conceitosThumbAsset),
  },
  {
    id: 'areas',
    titulo: 'Áreas do Direito',
    descricao:
      'Aulas organizadas por área: Civil, Penal, Constitucional, Trabalhista e muito mais.',
    tabela: 'videoaulas_areas_direito',
    temAreas: true,
    thumbCol: 'thumb',
    capa: srcOf(areasThumbAsset),
  },
  {
    id: 'oab-primeira-fase',
    titulo: 'OAB 1ª Fase',
    descricao:
      'Preparação completa para a prova objetiva da OAB, com foco nos temas mais cobrados.',
    tabela: 'videoaulas_oab_primeira_fase',
    temAreas: true,
    thumbCol: 'thumbnail',
    capa: srcOf(oabPrimeiraThumbAsset),
  },
  {
    id: 'oab-segunda-fase',
    titulo: 'OAB 2ª Fase',
    descricao:
      'Treinamento para a prova prático-profissional: peças, técnicas e correções comentadas.',
    tabela: 'videoaulas_oab_segunda_fase',
    temAreas: true,
    thumbCol: 'thumbnail',
    capa: srcOf(oabSegundaThumbAsset),
  },
];

export function getCatalogo(id?: string): Catalogo | undefined {
  return CATALOGOS.find((c) => c.id === id);
}

export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getCapaDaArea(areaNome?: string | null): string | null {
  if (!areaNome) return null;
  const n = simplificarNomeArea(areaNome).toLowerCase();
  if (n.includes('ambiental')) return ambientalCapa;
  if (n.includes('processo penal')) return processoPenalCapa;
  if (n.includes('penal')) return penalCapa;
  if (n.includes('trabalho') || n.includes('trabalhista')) return trabalhoCapa;
  if (n.includes('administrativo')) return administrativoCapa;
  if (n.includes('consumidor')) return consumidorCapa;
  if (n.includes('civil') || n.includes('família')) return civilCapa;
  return null;
}

/** `mq` (320x180) basta para cards de lista e baixa bem mais rápido que `hq`. */
export function ytThumb(videoId: string, qualidade: 'mq' | 'hq' | 'sd' = 'hq'): string {
  return `https://i.ytimg.com/vi/${videoId}/${qualidade}default.jpg`;
}

export function formatDuracao(segundos?: number | null): string {
  if (!segundos || segundos < 0) return '';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** "2ª Fase Civil" -> "Civil" */
export function simplificarNomeArea(area: string): string {
  return area
    .replace(/^2ª\s*Fase\s+/i, '')
    .replace(/^Segunda\s*Fase\s+/i, '')
    .trim();
}

/** Remove ruído de canal/plataforma dos títulos vindos do YouTube. */
export function limparTitulo(titulo: string): string {
  return (
    titulo
      .replace(/\|?\s*Kultivi\b/gi, '')
      .replace(/\|?\s*curso gratuito completo\b/gi, '')
      .replace(/\|?\s*curso gratuito\b/gi, '')
      .replace(/\s+\|\s+/g, ' › ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[›\s|-]+|[›\s|-]+$/g, '')
      .trim() || titulo
  );
}
