import { CATALOGOS, slugify, type CatalogoId } from '@/lib/videoaulasCatalogos';
import {
  getCachedCatalogo,
  getCachedProgresso,
  loadCatalogo,
  loadProgresso,
  type AulaCache,
  type ProgressoRow,
} from '@/lib/videoaulasStore';


export type AulaRow = {
  catalogo: CatalogoId;
  tabela: string;
  videoId: string;
  titulo: string;
  area: string;
  slugArea: string;
  ordem: number;
};

export type AreaResumo = {
  catalogo: CatalogoId;
  area: string;
  slug: string;
  total: number;
  concluidas: number;
  pct: number;
  capaVideoId: string;
};

export type RecenteResumo = {
  videoId: string;
  titulo: string;
  area: string;
  percentual: number;
  rota: string;
};

export type ResumoVideoaulas = {
  areas: AreaResumo[];
  porCatalogo: Record<string, { total: number; concluidas: number; pct: number }>;
  totalAulas: number;
  totalConcluidas: number;
  pctGeral: number;
  recentes: RecenteResumo[];
};

export const RESUMO_VAZIO: ResumoVideoaulas = {
  areas: [],
  porCatalogo: {},
  totalAulas: 0,
  totalConcluidas: 0,
  pctGeral: 0,
  recentes: [],
};

export function rotaAula(a: AulaRow): string {
  return `/videoaulas/${a.catalogo}/${a.slugArea || 'aulas'}/${a.videoId}`;
}

function normalizar(catalogoId: CatalogoId, titulo: string, tabela: string, temAreas: boolean, data: AulaCache[]): AulaRow[] {
  return data
    .map<AulaRow>((r, i) => {
      const area = temAreas ? String(r.area ?? '').trim() : titulo;
      return {
        catalogo: catalogoId,
        tabela,
        videoId: String(r.video_id ?? ''),
        titulo: String(r.titulo ?? ''),
        area,
        slugArea: temAreas ? slugify(area) : 'aulas',
        ordem: Number(r.ordem ?? i) || i,
      };
    })
    .filter((r) => r.videoId);
}

/** Agregação pura (sem I/O) — usada tanto no caminho síncrono quanto no assíncrono. */
function agregar(aulas: AulaRow[], progressoRows: ProgressoRow[]): ResumoVideoaulas {
  const porChave = new Map(aulas.map((a) => [`${a.tabela}|${a.videoId}`, a]));

  const prog = progressoRows;

  const concluidas = new Set(
    prog.filter((p) => p.concluida).map((p) => `${p.tabela}|${p.video_id}`),
  );

  const mapaAreas = new Map<string, AreaResumo>();
  const porCatalogo: ResumoVideoaulas['porCatalogo'] = {};

  for (const a of aulas) {
    const chaveArea = `${a.catalogo}|${a.slugArea}`;
    const feita = concluidas.has(`${a.tabela}|${a.videoId}`);
    const atual =
      mapaAreas.get(chaveArea) ??
      {
        catalogo: a.catalogo,
        area: a.area,
        slug: a.slugArea,
        total: 0,
        concluidas: 0,
        pct: 0,
        capaVideoId: a.videoId,
      };
    atual.total += 1;
    if (feita) atual.concluidas += 1;
    mapaAreas.set(chaveArea, atual);

    const cat = porCatalogo[a.catalogo] ?? { total: 0, concluidas: 0, pct: 0 };
    cat.total += 1;
    if (feita) cat.concluidas += 1;
    porCatalogo[a.catalogo] = cat;
  }

  const areas = [...mapaAreas.values()].map((a) => ({
    ...a,
    pct: a.total ? Math.round((a.concluidas / a.total) * 100) : 0,
  }));
  Object.values(porCatalogo).forEach((c) => {
    c.pct = c.total ? Math.round((c.concluidas / c.total) * 100) : 0;
  });

  const totalAulas = aulas.length;
  const totalConcluidas = concluidas.size;

  const recentes: RecenteResumo[] = prog
    .filter((p) => !p.concluida)
    .map((p) => {
      const aula = porChave.get(`${p.tabela}|${p.video_id}`);
      if (!aula) return null;
      return {
        videoId: aula.videoId,
        titulo: aula.titulo,
        area: aula.area || '',
        percentual: Math.min(100, Number(p.percentual) || 0),
        rota: rotaAula(aula),
      };
    })
    .filter(Boolean)
    .slice(0, 10) as RecenteResumo[];

  return {
    areas,
    porCatalogo,
    totalAulas,
    totalConcluidas,
    pctGeral: totalAulas ? Math.round((totalConcluidas / totalAulas) * 100) : 0,
    recentes,
  };
}

/** Versão instantânea: só o que já está em memória. Null quando não há cache. */
export function resumoVideoaulasSincrono(): ResumoVideoaulas | null {
  const aulas: AulaRow[] = [];
  let algum = false;
  for (const c of CATALOGOS) {
    const cache = getCachedCatalogo(c.id);
    if (!cache) continue;
    algum = true;
    aulas.push(...normalizar(c.id, c.titulo, c.tabela, c.temAreas, cache));
  }
  if (!algum) return null;
  return agregar(aulas, getCachedProgresso() ?? []);
}

/** Carrega catálogos + progresso do usuário e agrega por área/trilha. */
export async function carregarResumoVideoaulas(): Promise<ResumoVideoaulas> {
  const [porTabela, progressoRows] = await Promise.all([
    Promise.all(
      CATALOGOS.map(async (c) =>
        normalizar(c.id, c.titulo, c.tabela, c.temAreas, await loadCatalogo(c.id)),
      ),
    ),
    loadProgresso(),
  ]);
  return agregar(porTabela.flat(), progressoRows);
}
