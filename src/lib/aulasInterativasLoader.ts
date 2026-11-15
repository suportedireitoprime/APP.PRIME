import type { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';

// Chunks dinâmicos por disciplina para code splitting sob demanda
const DISCIPLINA_LOADERS: Record<string, () => Promise<{ default: AulaItem[] }>> = {
  administrativo: () => import('@/data/aulas-disciplinas/administrativo.json'),
  ambiental: () => import('@/data/aulas-disciplinas/ambiental.json'),
  civil: () => import('@/data/aulas-disciplinas/civil.json'),
  constitucional: () => import('@/data/aulas-disciplinas/constitucional.json'),
  desportivo: () => import('@/data/aulas-disciplinas/desportivo.json'),
  'direitos-humanos': () => import('@/data/aulas-disciplinas/direitos-humanos.json'),
  empresarial: () => import('@/data/aulas-disciplinas/empresarial.json'),
  filosofia: () => import('@/data/aulas-disciplinas/filosofia.json'),
  financeiro: () => import('@/data/aulas-disciplinas/financeiro.json'),
  'formacao-complementar': () => import('@/data/aulas-disciplinas/formacao-complementar.json'),
  'internacional-privado': () => import('@/data/aulas-disciplinas/internacional-privado.json'),
  'lei-penal-especial': () => import('@/data/aulas-disciplinas/lei-penal-especial.json'),
  penal: () => import('@/data/aulas-disciplinas/penal.json'),
  'politicas-publicas': () => import('@/data/aulas-disciplinas/politicas-publicas.json'),
  portugues: () => import('@/data/aulas-disciplinas/portugues.json'),
  previdenciario: () => import('@/data/aulas-disciplinas/previdenciario.json'),
  'processual-civil': () => import('@/data/aulas-disciplinas/processual-civil.json'),
  'processual-penal': () => import('@/data/aulas-disciplinas/processual-penal.json'),
  'processual-trabalho': () => import('@/data/aulas-disciplinas/processual-trabalho.json'),
  trabalho: () => import('@/data/aulas-disciplinas/trabalho.json'),
  tributario: () => import('@/data/aulas-disciplinas/tributario.json'),
  urbanistico: () => import('@/data/aulas-disciplinas/urbanistico.json'),
};

// Cache em memória da sessão
const cacheMemoriaAulas = new Map<string, AulaItem[]>();
const promisesInFlight = new Map<string, Promise<AulaItem[]>>();

/**
 * Normaliza o ID da disciplina para corresponder à chave do loader
 */
export function normalizarDisciplinaId(id?: string | null): string {
  if (!id) return 'penal';
  const limpo = id.toLowerCase().trim().replace(/^direito-/, '');
  if (limpo === 'processo-penal') return 'processual-penal';
  if (limpo === 'processo-civil') return 'processual-civil';
  if (limpo === 'processo-trabalho' || limpo === 'processo-do-trabalho') return 'processual-trabalho';
  if (limpo === 'do-trabalho') return 'trabalho';
  if (limpo === 'teoria-e-filosofia-do-direito') return 'filosofia';
  return limpo;
}

/**
 * Carrega aulas de uma disciplina sob demanda com latência 0ms se já estiver em cache
 */
export async function carregarAulasPorDisciplina(disciplinaId: string): Promise<AulaItem[]> {
  const chave = normalizarDisciplinaId(disciplinaId);

  // 1. Snapshot instantâneo da memória
  if (cacheMemoriaAulas.has(chave)) {
    return cacheMemoriaAulas.get(chave)!;
  }

  // 2. Deduplicação de requisições em voo
  if (promisesInFlight.has(chave)) {
    return promisesInFlight.get(chave)!;
  }

  const loader = DISCIPLINA_LOADERS[chave];
  if (!loader) {
    console.warn(`[AulasLoader] Nenhuma disciplina encontrada para a chave: "${chave}"`);
    return [];
  }

  const promessa = (async () => {
    try {
      const modulo = await loader();
      const aulas = modulo.default || [];
      cacheMemoriaAulas.set(chave, aulas);
      return aulas;
    } catch (err) {
      console.error(`[AulasLoader] Falha ao carregar aulas da disciplina "${chave}":`, err);
      return [];
    } finally {
      promisesInFlight.delete(chave);
    }
  })();

  promisesInFlight.set(chave, promessa);
  return promessa;
}

/**
 * Obtém síncronamente aulas já carregadas na sessão (para render sem waterfall)
 */
export function obterAulasCarregadasSync(disciplinaId: string): AulaItem[] | null {
  const chave = normalizarDisciplinaId(disciplinaId);
  return cacheMemoriaAulas.get(chave) || null;
}

/**
 * Pré-carrega disciplinas prioritárias em segundo plano quando a CPU estiver ociosa
 */
export function prefetchDisciplinasPrioritarias(disciplinas: string[] = ['penal', 'constitucional', 'civil']) {
  if (typeof window === 'undefined') return;
  const executar = () => {
    for (const d of disciplinas) {
      void carregarAulasPorDisciplina(d);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(executar, { timeout: 2000 });
  } else {
    setTimeout(executar, 800);
  }
}
