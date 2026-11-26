import { supabase } from '@/integrations/supabase/client';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import type { ArtigoLei } from '@/data/mockData';
import { obterAliasesTabela, obterVariantesArtigoNumero } from '@/utils/narracaoLookup';
import { calcularScoreArtigo } from '@/services/narracaoLeisService';
import { fetchArtigosLei } from '@/services/legislacaoService';
import { safeStorageUrl } from '@/lib/cdnImg';
import { registrarPlay } from '@/services/audioStatsService';

export interface ArtigoNarradoItem {
  tabelaNome: string;
  leiId: string;
  leiNome: string;
  leiSigla: string;
  leiTipo: string;
  artigoNumero: string;
  audioUrl: string;
  duracaoSegundos: number;
  scoreProva: number;
  createdAt?: string;
}

export interface LeiComNarracao {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  tipo: string;
  tabelaNome: string;
  iconColor: string;
  totalNarracoes: number;
  duracaoTotalSegundos: number;
  artigos: ArtigoNarradoItem[];
}

export interface RankingAudioleiItem extends ArtigoNarradoItem {
  acessos: number;
  rank: number;
}

export interface UltimoAudiolei {
  tabelaNome: string;
  leiId: string;
  leiNome: string;
  leiSigla: string;
  artigoNumero: string;
  audioUrl: string;
}

// Lookup index building once from LEIS_CATALOG + aliases
const aliasToCatalogMap = new Map<string, LeiCatalogItem>();
for (const item of LEIS_CATALOG) {
  for (const alias of obterAliasesTabela(item.tabela_nome)) {
    aliasToCatalogMap.set(alias.toLowerCase(), item);
  }
  aliasToCatalogMap.set(item.id.toLowerCase(), item);
  aliasToCatalogMap.set(item.sigla.toLowerCase(), item);
}

function resolverLeiCatalogo(tabelaNome: string): LeiCatalogItem | undefined {
  const clean = tabelaNome.trim().toLowerCase();
  if (aliasToCatalogMap.has(clean)) return aliasToCatalogMap.get(clean);
  const aliases = obterAliasesTabela(tabelaNome);
  for (const a of aliases) {
    const found = aliasToCatalogMap.get(a.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

export function extrairNumeroOrdenavel(artigoNumero: string): number {
  const clean = String(artigoNumero || '').replace(/^[Aa]rt\.?\s*|^[Aa]rtigo\s*/i, '').trim();
  const match = clean.match(/^(\d+)/);
  if (!match) return 999999;
  const base = parseInt(match[1], 10);
  const letraMatch = clean.match(/-([A-Za-z])/);
  const letraOffset = letraMatch ? (letraMatch[1].toUpperCase().charCodeAt(0) - 64) * 0.01 : 0;
  return base + letraOffset;
}

function extrairDuracao(wordTimings: unknown): number {
  if (!wordTimings || typeof wordTimings !== 'object') return 0;
  const wt = wordTimings as Record<string, unknown>;
  if (typeof wt.duracao_segundos === 'number' && wt.duracao_segundos > 0) {
    return wt.duracao_segundos;
  }
  if (Array.isArray(wt.partes)) {
    const soma = wt.partes.reduce((acc: number, p: unknown) => {
      const part = p as { duracaoSegundos?: number };
      return acc + (Number(part?.duracaoSegundos) || 0);
    }, 0);
    if (soma > 0) return Math.round(soma);
  }
  return 0;
}

export function formatarDuracao(segundos: number): string {
  if (!segundos || !Number.isFinite(segundos) || segundos <= 0) return '--:--';
  const mins = Math.floor(segundos / 60);
  const secs = Math.floor(segundos % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let catalogMemoryCache: {
  leis: LeiComNarracao[];
  todosArtigos: ArtigoNarradoItem[];
} | null = null;

type NarracaoRow = {
  tabela_nome: string;
  artigo_numero: string;
  audio_url: string;
  word_timings?: unknown;
  created_at?: string;
};

async function fetchTodasNarracoesPaginadas(): Promise<NarracaoRow[]> {
  const PAGE_SIZE = 1000;
  const { count, error: countError } = await supabase
    .from('narracoes_artigos')
    .select('id', { count: 'exact', head: true });

  if (countError || !count || count <= 0) {
    // Fallback sequencial se count não estiver disponível
    const allRows: NarracaoRow[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('narracoes_artigos')
        .select('tabela_nome, artigo_numero, audio_url, word_timings, created_at')
        .range(offset, offset + PAGE_SIZE - 1);
      if (error || !data || data.length === 0) break;
      allRows.push(...(data as NarracaoRow[]));
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return allRows;
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const pageIndices = Array.from({ length: totalPages }, (_, i) => i);

  // Busca em lotes paralelos de até 5 páginas para carregar tudo rápido sem saturar
  const allRows: NarracaoRow[] = [];
  for (let i = 0; i < pageIndices.length; i += 5) {
    const batch = pageIndices.slice(i, i + 5);
    const results = await Promise.all(
      batch.map((pageIdx) => {
        const from = pageIdx * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        return supabase
          .from('narracoes_artigos')
          .select('tabela_nome, artigo_numero, audio_url, word_timings, created_at')
          .range(from, to);
      })
    );
    for (const res of results) {
      if (Array.isArray(res.data)) {
        allRows.push(...(res.data as NarracaoRow[]));
      }
    }
  }

  return allRows;
}

export async function carregarCatalogoAudioleis(forceRefresh = false): Promise<{
  leis: LeiComNarracao[];
  todosArtigos: ArtigoNarradoItem[];
}> {
  if (catalogMemoryCache && !forceRefresh) {
    return catalogMemoryCache;
  }

  const data = await fetchTodasNarracoesPaginadas();

  if (!data || data.length === 0) {
    return { leis: [], todosArtigos: [] };
  }

  const leisMap = new Map<string, LeiComNarracao>();
  const seenArticleKeys = new Set<string>();
  const todosArtigos: ArtigoNarradoItem[] = [];

  for (const row of data) {
    if (!row.tabela_nome || !row.artigo_numero || !row.audio_url) continue;

    const resolvedCatalog = resolverLeiCatalogo(row.tabela_nome);
    const tabelaCanonica = resolvedCatalog?.tabela_nome || row.tabela_nome.trim();
    const leiId = resolvedCatalog?.id || tabelaCanonica.toLowerCase();
    const leiNome = resolvedCatalog?.nome || tabelaCanonica.replace(/_/g, ' ');
    const leiSigla = resolvedCatalog?.sigla || leiNome.slice(0, 8).toUpperCase();
    const leiTipo = resolvedCatalog?.tipo || 'lei-ordinaria';
    const iconColor = resolvedCatalog?.iconColor || '#a855f7';

    const artNumClean = String(row.artigo_numero).trim();
    const dedupKey = `${tabelaCanonica}::${artNumClean.replace(/\D/g, '') || artNumClean}`;
    if (seenArticleKeys.has(dedupKey)) continue;
    seenArticleKeys.add(dedupKey);

    const audioUrl = safeStorageUrl(row.audio_url) || row.audio_url;
    const duracao = extrairDuracao(row.word_timings);
    const scoreProva = calcularScoreArtigo({ numero: artNumClean }, tabelaCanonica).score;

    const artigoItem: ArtigoNarradoItem = {
      tabelaNome: tabelaCanonica,
      leiId,
      leiNome,
      leiSigla,
      leiTipo,
      artigoNumero: artNumClean,
      audioUrl,
      duracaoSegundos: duracao,
      scoreProva,
      createdAt: row.created_at,
    };

    todosArtigos.push(artigoItem);

    let leiEntry = leisMap.get(tabelaCanonica);
    if (!leiEntry) {
      leiEntry = {
        id: leiId,
        nome: leiNome,
        sigla: leiSigla,
        descricao: resolvedCatalog?.descricao || '',
        tipo: leiTipo,
        tabelaNome: tabelaCanonica,
        iconColor,
        totalNarracoes: 0,
        duracaoTotalSegundos: 0,
        artigos: [],
      };
      leisMap.set(tabelaCanonica, leiEntry);
    }

    leiEntry.artigos.push(artigoItem);
    leiEntry.totalNarracoes += 1;
    leiEntry.duracaoTotalSegundos += duracao;
  }

  const leis = Array.from(leisMap.values())
    .map((lei) => ({
      ...lei,
      artigos: lei.artigos.sort(
        (a, b) => extrairNumeroOrdenavel(a.artigoNumero) - extrairNumeroOrdenavel(b.artigoNumero)
      ),
    }))
    .sort((a, b) => b.totalNarracoes - a.totalNarracoes);

  const result = { leis, todosArtigos };
  catalogMemoryCache = result;
  return result;
}

export async function carregarRankingMaisAcessados(
  todosArtigos: ArtigoNarradoItem[],
  limite = 5
): Promise<RankingAudioleiItem[]> {
  if (todosArtigos.length === 0) return [];

  const lookup = new Map<string, ArtigoNarradoItem>();
  for (const art of todosArtigos) {
    const dig = art.artigoNumero.replace(/\D/g, '') || art.artigoNumero;
    lookup.set(`${art.tabelaNome}::${dig}`, art);
  }

  const counts = new Map<string, number>();

  try {
    const { data } = await supabase
      .from('app_events')
      .select('metadata')
      .eq('event_name', 'audiolei_play')
      .order('created_at', { ascending: false })
      .limit(500);

    if (Array.isArray(data)) {
      for (const row of data) {
        const meta = row?.metadata as { tabelaNome?: string; artigoNumero?: string } | null;
        if (!meta?.tabelaNome || !meta?.artigoNumero) continue;
        const resolved = resolverLeiCatalogo(meta.tabelaNome)?.tabela_nome || meta.tabelaNome;
        const dig = String(meta.artigoNumero).replace(/\D/g, '') || String(meta.artigoNumero);
        const key = `${resolved}::${dig}`;
        if (lookup.has(key)) {
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
    }
  } catch {
    // Fallback silencioso para ranking por relevância em provas
  }

  const ranked = [...todosArtigos]
    .map((art) => {
      const dig = art.artigoNumero.replace(/\D/g, '') || art.artigoNumero;
      const key = `${art.tabelaNome}::${dig}`;
      const acessos = counts.get(key) || 0;
      return { art, acessos };
    })
    .sort((a, b) => {
      if (b.acessos !== a.acessos) return b.acessos - a.acessos;
      return b.art.scoreProva - a.art.scoreProva;
    })
    .slice(0, limite)
    .map((item, idx) => ({
      ...item.art,
      acessos: item.acessos,
      rank: idx + 1,
    }));

  return ranked;
}

export async function buscarArtigoTexto(
  tabelaNome: string,
  artigoNumero: string
): Promise<ArtigoLei | null> {
  try {
    const artigos = await fetchArtigosLei('', tabelaNome);
    if (!artigos || artigos.length === 0) return null;

    const variantes = new Set(
      obterVariantesArtigoNumero(artigoNumero).map((v) => v.toLowerCase().trim())
    );
    const digitoAlvo = artigoNumero.replace(/\D/g, '');

    const exato = artigos.find((a) => {
      const num = String(a.numero || '').toLowerCase().trim();
      return variantes.has(num);
    });
    if (exato) return exato;

    if (digitoAlvo) {
      return (
        artigos.find((a) => String(a.numero || '').replace(/\D/g, '') === digitoAlvo) || null
      );
    }
    return null;
  } catch (err) {
    console.warn('[audioleisService] Erro ao buscar texto do artigo:', err);
    return null;
  }
}

export async function registrarAcessoAudiolei(artigo: ArtigoNarradoItem): Promise<void> {
  registrarPlay(
    `${artigo.tabelaNome}_${artigo.artigoNumero}`,
    `Art. ${artigo.artigoNumero}`,
    artigo.leiNome,
    'lei',
    artigo.artigoNumero
  );

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await supabase.from('app_events').insert({
      user_id: userId,
      event_name: 'audiolei_play',
      metadata: {
        tabelaNome: artigo.tabelaNome,
        leiId: artigo.leiId,
        leiNome: artigo.leiNome,
        leiSigla: artigo.leiSigla,
        artigoNumero: artigo.artigoNumero,
        audioUrl: artigo.audioUrl,
      },
    });
  } catch {
    // Telemetria não-bloqueante
  }
}

export async function carregarUltimoAudiolei(): Promise<UltimoAudiolei | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return null;

    const { data } = await supabase
      .from('app_events')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event_name', 'audiolei_play')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const meta = data?.metadata as Partial<UltimoAudiolei> | undefined;
    if (!meta?.tabelaNome || !meta?.artigoNumero || !meta?.audioUrl) return null;
    return {
      tabelaNome: meta.tabelaNome,
      leiId: meta.leiId || meta.tabelaNome.toLowerCase(),
      leiNome: meta.leiNome || meta.tabelaNome,
      leiSigla: meta.leiSigla || 'LEI',
      artigoNumero: meta.artigoNumero,
      audioUrl: meta.audioUrl,
    };
  } catch {
    return null;
  }
}
