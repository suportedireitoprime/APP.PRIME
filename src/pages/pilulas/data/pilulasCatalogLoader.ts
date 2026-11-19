import { getMateriaMeta } from './pilulasMateriasConfig';

export interface TopicoItem {
  id: string;
  baseSlug: string;
  titulo: string;
  audioUrl: string | null;
  srtUrl: string | null;
  pdfUrl: string | null;
  roteiroUrl: string | null;
  driveMp3Id: string | null;
  driveSrtId: string | null;
  drivePdfId: string | null;
  driveTxtId: string | null;
}

export interface ModuloItem {
  id: string;
  folderIndex: number;
  titulo: string;
  folderName: string;
  slug: string;
  totalTopicos: number;
  topicos: TopicoItem[];
}

const CATALOG_LOADERS: Record<string, () => Promise<{ default: ModuloItem[] }>> = {
  'direito-administrativo': () => import('@/data/pilulas/direito-administrativo.json') as Promise<{ default: ModuloItem[] }>,
  'direito-ambiental': () => import('@/data/pilulas/direito-ambiental.json') as Promise<{ default: ModuloItem[] }>,
  'direito-civil': () => import('@/data/pilulas/direito-civil.json') as Promise<{ default: ModuloItem[] }>,
  'direito-constitucional': () => import('@/data/pilulas/direito-constitucional.json') as Promise<{ default: ModuloItem[] }>,
  'direito-desportivo': () => import('@/data/pilulas/direito-desportivo.json') as Promise<{ default: ModuloItem[] }>,
  'direito-do-trabalho': () => import('@/data/pilulas/direito-do-trabalho.json') as Promise<{ default: ModuloItem[] }>,
  'direito-empresarial': () => import('@/data/pilulas/direito-empresarial.json') as Promise<{ default: ModuloItem[] }>,
  'direito-financeiro': () => import('@/data/pilulas/direito-financeiro.json') as Promise<{ default: ModuloItem[] }>,
  'direito-internacional-privado': () => import('@/data/pilulas/direito-internacional-privado.json') as Promise<{ default: ModuloItem[] }>,
  'direito-penal': () => import('@/data/pilulas/direito-penal.json') as Promise<{ default: ModuloItem[] }>,
  'direito-previdenciario': () => import('@/data/pilulas/direito-previdenciario.json') as Promise<{ default: ModuloItem[] }>,
  'direito-processual-civil': () => import('@/data/pilulas/direito-processual-civil.json') as Promise<{ default: ModuloItem[] }>,
  'direito-processual-do-trabalho': () => import('@/data/pilulas/direito-processual-do-trabalho.json') as Promise<{ default: ModuloItem[] }>,
  'direito-processual-penal': () => import('@/data/pilulas/direito-processual-penal.json') as Promise<{ default: ModuloItem[] }>,
  'direito-tributario': () => import('@/data/pilulas/direito-tributario.json') as Promise<{ default: ModuloItem[] }>,
  'direito-urbanistico': () => import('@/data/pilulas/direito-urbanistico.json') as Promise<{ default: ModuloItem[] }>,
  'direitos-humanos': () => import('@/data/pilulas/direitos-humanos.json') as Promise<{ default: ModuloItem[] }>,
  'formacao-complementar': () => import('@/data/pilulas/formacao-complementar.json') as Promise<{ default: ModuloItem[] }>,
  'lei-penal-especial': () => import('@/data/pilulas/lei-penal-especial.json') as Promise<{ default: ModuloItem[] }>,
  'politicas-publicas': () => import('@/data/pilulas/politicas-publicas.json') as Promise<{ default: ModuloItem[] }>,
  'portugues-juridico': () => import('@/data/pilulas/portugues-juridico.json') as Promise<{ default: ModuloItem[] }>,
  'sumulas': () => import('@/data/pilulas/sumulas.json') as Promise<{ default: ModuloItem[] }>,
  'teoria-e-filosofia-do-direito': () => import('@/data/pilulas/teoria-e-filosofia-do-direito.json') as Promise<{ default: ModuloItem[] }>,
};

const catalogMemoryCache = new Map<string, ModuloItem[]>();

export async function loadPilulasCatalog(slugOrAlias: string): Promise<ModuloItem[]> {
  const meta = getMateriaMeta(slugOrAlias);
  const canonicalSlug = meta ? meta.slug : slugOrAlias.toLowerCase();

  if (catalogMemoryCache.has(canonicalSlug)) {
    return catalogMemoryCache.get(canonicalSlug)!;
  }

  const loader = CATALOG_LOADERS[canonicalSlug];
  if (!loader) {
    console.warn(`[loadPilulasCatalog] Catálogo não encontrado para '${slugOrAlias}', usando fallback de direito-penal.`);
    const fallback = await CATALOG_LOADERS['direito-penal']();
    return fallback.default;
  }

  const mod = await loader();
  const rawData: any = (mod as any).default || mod;
  const data: ModuloItem[] = Array.isArray(rawData) ? rawData : (rawData?.default || []);
  catalogMemoryCache.set(canonicalSlug, data);
  return data;
}
