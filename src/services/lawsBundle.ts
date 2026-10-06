/**
 * Loader do bundle estático (offline) de leis.
 *
 * Fluxo (Zero-Loading Inicial):
 *  1. App abre → tenta ler /laws-bundle/manifest.json (embutido no build Vite/dist)
 *  2. Verifica quais leis não constam no banco local Dexie (artigosCache).
 *  3. Popula o banco local em background com os dados do bundle.
 *  4. Da próxima vez que o usuário abrir a lei, já está na memória em 0ms.
 */

import { setPersistedArtigosCache, getPersistedArtigosCache, invalidateArtigosCache } from '@/services/offlineDb';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { sanitizeLegalArticleText } from '@/components/vademecum/artigo/artigoTextUtils';

// ── Cache em RAM para leitura síncrona (0ms) ──
// Evita ir ao IndexedDB/Dexie a cada abertura de lei (50-200ms).
const _ramCache = new Map<string, any[]>();

// Leis mais acessadas — carregadas com prioridade máxima no boot.
// Quando em RAM, abertura é literal 0ms.
const PRIORITY_LAWS = ['cf88', 'cp', 'cc', 'cpc', 'cpp', 'clt', 'ctn', 'cdc'];

/** Leitura síncrona do RAM cache. null = não carregada ainda. */
export function getCachedArtigosRAM(tabelaNome: string): any[] | null {
  return _ramCache.get(tabelaNome) ?? null;
}

/** Popula o RAM cache (chamado internamente ao carregar de IndexedDB ou bundle). */
function setRAMCache(tabelaNome: string, artigos: any[]): void {
  _ramCache.set(tabelaNome, artigos);
}

// ── Mapeamento estático e síncrono para 100% de disponibilidade offline (0ms) ──
// Permite abrir CDC, CC, CPC e todas as leis catalogadas mesmo se manifest ainda não foi baixado.
export const STATIC_TABELA_TO_SLUG: Record<string, string> = {
  // Códigos Principais
  'CDC_CODIGO_DEFESA_CONSUMIDOR': 'cdc',
  'CC_CODIGO_CIVIL': 'cc',
  'CPC_CODIGO_PROCESSO_CIVIL': 'cpc',
  'CP_CODIGO_PENAL': 'cp',
  'CPP_CODIGO_PROCESSO_PENAL': 'cpp',
  'CLT_CONSOLIDACAO_LEIS_TRABALHO': 'clt',
  'CTN_CODIGO_TRIBUTARIO_NACIONAL': 'ctn',
  'CF88_CONSTITUICAO_FEDERAL': 'cf',
  'CTB_CODIGO_TRANSITO_BRASILEIRO': 'ctb',
  'CE_CODIGO_ELEITORAL': 'ce',
  'CPM_CODIGO_PENAL_MILITAR': 'cpm',
  'CPPM_CODIGO_PROCESSO_PENAL_MILITAR': 'cppm',
  'CFLOR_CODIGO_FLORESTAL': 'cflor',
  'CCOM_CODIGO_COMERCIAL': 'ccom',
  'CBA_CODIGO_BRASILEIRO_AERONAUTICA': 'cba',
  'CAGUA_CODIGO_AGUAS': 'cagua',
  'CMIN_CODIGO_MINAS': 'cmin',
  'CTEL_CODIGO_TELECOMUNICACOES': 'ctel',
  // Estatutos
  'ECA_ESTATUTO_CRIANCA_ADOLESCENTE': 'estatuto-eca',
  'EI_ESTATUTO_IDOSO': 'ei',
  'EPD_ESTATUTO_PESSOA_DEFICIENCIA': 'estatuto-pessoa-deficiencia',
  'EIR_ESTATUTO_IGUALDADE_RACIAL': 'estatuto-igualdade-racial',
  'EC_ESTATUTO_CIDADE': 'estatuto-cidade',
  'ED_ESTATUTO_DESARMAMENTO': 'estatuto-desarmamento',
  'EOAB_ESTATUTO_OAB': 'estatuto-oab',
  'ET_ESTATUTO_TORCEDOR': 'estatuto-torcedor',
  'EJ_ESTATUTO_JUVENTUDE': 'estatuto-juventude',
  'EM_ESTATUTO_MILITARES': 'estatuto-militares',
  'EIND_ESTATUTO_INDIO': 'estatuto-indio',
  'ETERRA_ESTATUTO_TERRA': 'estatuto-terra',
  'EMIG_ESTATUTO_MIGRACAO': 'estatuto-migracao',
  'EREF_ESTATUTO_REFUGIADO': 'estatuto-refugiado',
  'EMET_ESTATUTO_METROPOLE': 'estatuto-metropole',
  'EMUS_ESTATUTO_MUSEUS': 'emus',
  'EME_ESTATUTO_MICROEMPRESA': 'eme',
  'EPC_ESTATUTO_PESSOA_CANCER': 'estatuto-cancer',
  // Leis Federais / Especiais
  'LEP_EXECUCAO_PENAL': 'lei-lep',
  'LMP_MARIA_PENHA': 'lei-maria-penha',
  'LD_LEI_DROGAS': 'lei-drogas',
  'LAA_ABUSO_AUTORIDADE': 'lei-abuso-autoridade',
  'LIT_INTERCEPTACAO_TELEFONICA': 'lei-interceptacao-telefonica',
  'LIA_IMPROBIDADE_ADMINISTRATIVA': 'lei-improbidade',
  'LMS_MANDADO_SEGURANCA': 'lei-mandado-seguranca',
  'LACP_ACAO_CIVIL_PUBLICA': 'lei-acao-civil-publica',
  'LJE_JUIZADOS_ESPECIAIS': 'lje',
  'LGPD_PROTECAO_DADOS': 'lei-lgpd',
  'MCI_MARCO_CIVIL_INTERNET': 'lei-marco-civil',
  'LI_INQUILINATO': 'lei-inquilinato',
  'LRP_REGISTROS_PUBLICOS': 'lei-registros-publicos',
  'LAT_ANTITERRORISMO': 'lei-antiterrorismo',
  'LINDB_INTRODUCAO_NORMAS': 'lei-lindb',
  'LCH_CRIMES_HEDIONDOS': 'lei-crimes-hediondos',
  'LTORT_TORTURA': 'lei-tortura',
  'LCA_CRIMES_AMBIENTAIS': 'lei-crimes-ambientais',
  'LRAC_RACISMO': 'lrac',
  'LLAV_LAVAGEM_DINHEIRO': 'lei-lavagem-dinheiro',
  'LRF_RESPONSABILIDADE_FISCAL': 'lei-lrf',
  'LAI_ACESSO_INFORMACAO': 'lei-acesso-informacao',
  'LAP_ACAO_POPULAR': 'lei-acao-popular',
  'LDB_DIRETRIZES_EDUCACAO': 'ldb',
  'LOMP_ORGANICA_MP': 'lomp',
  'LDA_DIREITOS_AUTORAIS': 'lda',
  'LCON_CONCESSOES': 'lei-concessoes',
  'LHD_HABEAS_DATA': 'lei-habeas-data',
  'LMI_MANDADO_INJUNCAO': 'lmi',
  'LPP_PARTIDOS_POLITICOS': 'lpp',
  'LELE_ELEICOES': 'lele',
  'LFL_FICHA_LIMPA': 'lei-ficha-limpa',
  'LPT_PROTECAO_TESTEMUNHAS': 'lpt',
  'LPSU_PARCELAMENTO_SOLO': 'lpsu',
  'LALP_ALIENACAO_PARENTAL': 'lalp',
  'LALIM_ALIMENTOS': 'lalim',
  'LCADE_ANTITRUSTE': 'lcade',
  'LSUS_SISTEMA_UNICO_SAUDE': 'lsus',
  'LBIO_BIOSSEGURANCA': 'lbio',
  'LCI_CRIMES_INFORMATICOS': 'lci',
  'LOTCU_ORGANICA_TCU': 'lotcu',
  'LLE_LIBERDADE_ECONOMICA': 'lle',
  'CES_CODIGO_ETICA_SERVIDOR': 'decreto-etica',
  'LMLS_MARCO_LEGAL_STARTUPS': 'lmls',
  'LRT_REFORMA_TRIBUTARIA': 'lrt',
  'LPC_PREVIDENCIA_COMPLEMENTAR': 'complementar',
  'LOAS_ASSISTENCIA_SOCIAL': 'loas',
  'LOC_ORGANIZACAO_CRIMINOSA': 'lei-organizacoes-criminosas',
  'L8112_SERVIDORES_FEDERAIS': 'lei-servidor',
  'NLL_LICITACOES': 'lei-licitacoes',
  'LF_FALENCIAS': 'lei-falencia',
  'LA_ARBITRAGEM': 'lei-arbitragem',
  'LOMAN_LEI_ORGANICA_MAGISTRATURA': 'lc-loman',
  'LPAF_PROCESSO_ADMINISTRATIVO': 'lei-processo-administrativo',
  'LCP_CONTRAVENCOES_PENAIS': 'lei-contravencoes',
  'LSA_SOCIEDADES_ACOES': 'lei-sa',
  'LPI_PROPRIEDADE_INDUSTRIAL': 'cpi',
  'LACE_ANTICORRUPCAO': 'lei-anticorrupcao',
  'LPPP_PARCERIAS_PUBLICO_PRIVADAS': 'lei-ppp',
  'LCSF_CRIMES_SISTEMA_FINANCEIRO': 'lei-crimes-financeiro',
  'LINE_INELEGIBILIDADES': 'lc-inelegibilidades',
  'LBPS_BENEFICIOS_PREVIDENCIA': 'lei-beneficios',
  'LCSS_CUSTEIO_SEGURIDADE': 'lei-custeio',
  // Alias diretos por id
  'cdc': 'cdc',
  'cc': 'cc',
  'cpc': 'cpc',
  'cp': 'cp',
  'cpp': 'cpp',
  'clt': 'clt',
  'ctn': 'ctn',
  'cf88': 'cf',
  'cf': 'cf',
};

const MANIFEST_URL = '/laws-bundle/manifest.json';

export interface ManifestLei {
  id: string;
  slug: string;
  nome: string;
  nome_curto: string | null;
  updated_at: string | null;
  count: number;
}

export interface Manifest {
  generated_at: string;
  bundle_updated_at: string | null;
  leis: ManifestLei[];
}

let _manifestPromise: Promise<Manifest | null> | null = null;
let _slugToId: Map<string, string> | null = null;
let _idToSlug: Map<string, string> | null = null;

export function loadManifest(): Promise<Manifest | null> {
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = (async () => {
    const candidateUrls = [
      MANIFEST_URL,
      'laws-bundle/manifest.json',
    ];
    if (typeof window !== 'undefined' && window.location?.origin) {
      candidateUrls.push(`${window.location.origin}/laws-bundle/manifest.json`);
    }

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const m = (await res.json()) as Manifest;
          _slugToId = new Map(m.leis.map((l) => [l.slug, l.id]));
          _idToSlug = new Map(m.leis.map((l) => [l.id, l.slug]));
          return m;
        }
      } catch {
        // Tenta próxima URL candidata
      }
    }
    return null;
  })();
  return _manifestPromise;
}

function normalizeArtigos(rows: any[]) {
  return (rows || [])
    .map((r: any) => ({
      id: r.id,
      numero: (r.numero || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º'),
      caput: sanitizeLegalArticleText((r.texto || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º')),
      titulo: undefined,
      epigrafe: r.epigrafe || undefined,
      nomen_juris: r.epigrafe || undefined,
      capitulo: undefined,
      ordem: typeof r.ordem === 'number' ? r.ordem : undefined,
    }))
    .filter((a: any) => a.caput.trim() !== '');
}

/** Carrega artigos bundlados de uma lei (via slug). Retorna null se sem bundle. */
export async function loadBundledLei(slug: string): Promise<any[] | null> {
  if (!slug) return null;
  const candidateUrls = [
    `/laws-bundle/${slug}.json`,
    `laws-bundle/${slug}.json`,
  ];
  if (typeof window !== 'undefined' && window.location?.origin) {
    candidateUrls.push(`${window.location.origin}/laws-bundle/${slug}.json`);
  }

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        const normalized = normalizeArtigos(raw);
        if (normalized && normalized.length > 0) {
          return normalized;
        }
      }
    } catch {
      // Tenta próxima URL candidata
    }
  }
  return null;
}

/**
 * Aquece a memória com todos os artigos bundlados no APK/Web.
 * Chame no boot (após loadManifest) para que qualquer `getPersistedArtigosCache`
 * subsequente retorne síncrono e sem I/O — a abertura de qualquer lei do Vade Mecum ficará instantânea.
 * Concorrência controlada (6) para não travar main thread.
 */
let _primePromise: Promise<void> | null = null;
export function primeMemoryCacheFromBundle(concurrency = 6): Promise<void> {
  if (_primePromise) return _primePromise;
  _primePromise = (async () => {
    const manifest = await loadManifest();
    if (!manifest || !manifest.leis?.length) return;

    // Precisamos resolver a qual 'tabela_nome' no APP.PRIME o 'slug' do Supabase se refere.
    // Usamos o LEIS_CATALOG e o service para indexar.
    const { LEIS_CATALOG } = await import('@/data/leisCatalog');

    const slugToTabela = new Map<string, string>();
    for (const m of manifest.leis) {
      const lei = LEIS_CATALOG.find((l) => matchesSlug(l as any, m.slug));
      if (lei) {
          slugToTabela.set(m.slug, lei.tabela_nome);
      } else {
          slugToTabela.set(m.slug, m.slug);
      }
    }

    // Invalidação de versão de cache local
    const BUNDLE_CACHE_VER = 'vade_bundle_v7';
    if (typeof localStorage !== 'undefined' && localStorage.getItem('vade_bundle_cache_ver') !== BUNDLE_CACHE_VER) {
      await invalidateArtigosCache();
      localStorage.setItem('vade_bundle_cache_ver', BUNDLE_CACHE_VER);
    }

    // ⚡ FASE 1: Carregar as 8 leis prioritárias direto na RAM (0ms de abertura)
    // Estas são as mais acessadas — carregamos primeiro e em paralelo.
    const priorityManifest = manifest.leis.filter(m => 
      PRIORITY_LAWS.some(p => matchesSlug({ tabela_nome: p, nome: p, id: p } as any, m.slug))
    );
    const restManifest = manifest.leis.filter(m => !priorityManifest.includes(m));

    // Carrega leis prioritárias primeiro — tanto IndexedDB quanto RAM
    for (const m of priorityManifest) {
      const tabela = slugToTabela.get(m.slug);
      if (!tabela) continue;
      try {
        // Tenta do IndexedDB primeiro
        const cached = await getPersistedArtigosCache(tabela);
        if (cached && cached.length > 0) {
          setRAMCache(tabela, cached);
          continue;
        }
        // Senão, carrega do bundle
        const arts = await loadBundledLei(m.slug);
        if (arts && arts.length > 0) {
          await setPersistedArtigosCache(tabela, arts);
          setRAMCache(tabela, arts);
        }
      } catch { /* segue */ }
    }
    console.info(`[lawsBundle] ⚡ ${priorityManifest.length} leis prioritárias em RAM`);

    // FASE 2: Processar restante das leis (as que ainda não estão no cache)
    const queue: typeof manifest.leis = [];
    for (const m of restManifest) {
        const t = slugToTabela.get(m.slug);
        if (!t) continue;
        const exists = await getPersistedArtigosCache(t);
        if (exists && exists.length > 0) {
          // Já está no IndexedDB — popular RAM cache também
          setRAMCache(t, exists);
        } else {
          queue.push(m);
        }
    }

    let i = 0;
    const worker = async () => {
      while (i < queue.length) {
        const item = queue[i++];
        if (!item) continue;
        const tabela = slugToTabela.get(item.slug)!;
        try {
          const arts = await loadBundledLei(item.slug);
          if (arts && arts.length > 0) {
              await setPersistedArtigosCache(tabela, arts);
              setRAMCache(tabela, arts);
          }
        } catch { /* segue */ }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()));
  })();
  return _primePromise;
}

function matchesSlug(lei: { tabela_nome: string; nome: string; id: string }, slug: string): boolean {
  const norm = (s: string) =>
    (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  const s = norm(slug);
  return [lei.tabela_nome, lei.nome, lei.id].some((v) => norm(String(v || '')) === s);
}

export function getBundleSlugForTabela(tabelaNome: string): string | null {
  if (!tabelaNome) return null;

  // 1. Resolução estática prioritária (0ms, síncrona e infalível mesmo sem manifest)
  if (STATIC_TABELA_TO_SLUG[tabelaNome]) return STATIC_TABELA_TO_SLUG[tabelaNome];
  if (STATIC_TABELA_TO_SLUG[tabelaNome.toUpperCase()]) return STATIC_TABELA_TO_SLUG[tabelaNome.toUpperCase()];
  if (STATIC_TABELA_TO_SLUG[tabelaNome.toLowerCase()]) return STATIC_TABELA_TO_SLUG[tabelaNome.toLowerCase()];

  // 2. Se manifest estiver disponível na memória, busca dinâmica
  if (_slugToId) {
    if (_slugToId.has(tabelaNome)) return tabelaNome;
    const lei = LEIS_CATALOG.find((l) => l.tabela_nome === tabelaNome);
    if (lei) {
      for (const slug of Array.from(_slugToId.keys())) {
        if (matchesSlug(lei as any, slug)) return slug;
      }
    }
  }

  // 3. Fallback no catálogo se manifest ainda não resolveu
  const lei = LEIS_CATALOG.find((l) => l.tabela_nome === tabelaNome || l.id === tabelaNome);
  if (lei) {
    if (STATIC_TABELA_TO_SLUG[lei.tabela_nome]) return STATIC_TABELA_TO_SLUG[lei.tabela_nome];
    if (STATIC_TABELA_TO_SLUG[lei.id]) return STATIC_TABELA_TO_SLUG[lei.id];
  }

  return null;
}

/** 
 * Sincroniza deltas de leis após carregamento do bundle offline.
 * Implementação full-sync reservada para o backend edge-functions delta.
 */
export async function syncLawsDelta(): Promise<void> {
    // Stub
}

