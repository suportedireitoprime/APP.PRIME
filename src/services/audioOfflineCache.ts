import { createStore, get, set, del, entries } from 'idb-keyval';
import { supabase } from '@/integrations/supabase/client';

const audioStore = createStore('prime_vademecum_audio_cache_v1', 'narracoes');

export interface CachedAudioEntry {
  key: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  wordTimings?: Array<{ word: string; start: number; end: number }> | null;
  mimeType: string;
}

// Cota máxima de cache local: 60 MB (aprox. 80-120 áudios de artigos completos)
const MAX_AUDIO_CACHE_BYTES = 60 * 1024 * 1024;

export function buildAudioCacheKey(tabelaNome: string, artigoNumero: string | number): string {
  return `${String(tabelaNome).toLowerCase().trim()}::${String(artigoNumero).toLowerCase().trim()}`;
}

/**
 * Busca áudio no cache persistente IndexedDB.
 * Se encontrado, renova o timestamp LRU e retorna blobUrl para reprodução com 0ms de latência.
 */
export async function getCachedAudio(
  key: string
): Promise<{ blobUrl: string; wordTimings?: Array<{ word: string; start: number; end: number }> | null } | null> {
  try {
    const entry = await get<CachedAudioEntry>(key, audioStore);
    if (!entry || !entry.blob) return null;

    // Atualiza timestamp LRU em background sem bloquear
    entry.lastAccessed = Date.now();
    void set(key, entry, audioStore).catch(() => {});

    const blobUrl = URL.createObjectURL(entry.blob);
    return {
      blobUrl,
      wordTimings: entry.wordTimings,
    };
  } catch (err) {
    console.warn('[audioOfflineCache] Falha ao ler áudio do IndexedDB:', err);
    return null;
  }
}

/**
 * Salva um áudio no cache persistente IndexedDB com controle estrito de cota LRU.
 */
export async function saveCachedAudio(
  key: string,
  blob: Blob,
  wordTimings?: Array<{ word: string; start: number; end: number }> | null
): Promise<void> {
  try {
    const size = blob.size;
    if (size > MAX_AUDIO_CACHE_BYTES) {
      console.warn('[audioOfflineCache] Áudio individual excede cota total:', size);
      return;
    }

    // Limpeza LRU se ultrapassar a cota
    await enforceLruQuota(size);

    const entry: CachedAudioEntry = {
      key,
      blob,
      size,
      lastAccessed: Date.now(),
      wordTimings: wordTimings || null,
      mimeType: blob.type || 'audio/wav',
    };

    await set(key, entry, audioStore);
  } catch (err) {
    console.warn('[audioOfflineCache] Falha ao salvar áudio no IndexedDB:', err);
  }
}

/**
 * Remove os itens menos recentemente utilizados (LRU) até liberar espaço suficiente.
 */
async function enforceLruQuota(incomingBytes: number): Promise<void> {
  try {
    const allEntries = await entries<string, CachedAudioEntry>(audioStore);
    let totalSize = allEntries.reduce((acc, [, item]) => acc + (item?.size || 0), 0);

    if (totalSize + incomingBytes <= MAX_AUDIO_CACHE_BYTES) {
      return;
    }

    // Ordena do mais antigo para o mais recente (LRU)
    const sorted = allEntries
      .filter(([, item]) => item && typeof item.lastAccessed === 'number')
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    for (const [key, item] of sorted) {
      if (totalSize + incomingBytes <= MAX_AUDIO_CACHE_BYTES) break;
      await del(key, audioStore);
      totalSize -= item.size || 0;
    }
  } catch (err) {
    console.warn('[audioOfflineCache] Falha na purga LRU de áudios:', err);
  }
}

/**
 * Item 15: Pré-carregamento especulativo do áudio do próximo artigo durante a reprodução.
 */
export async function prefetchNextArticleAudio(
  tabelaNome: string,
  proximoArtigoNumero: string | number
): Promise<void> {
  if (!tabelaNome || !proximoArtigoNumero) return;
  const key = buildAudioCacheKey(tabelaNome, proximoArtigoNumero);

  try {
    // Se já estiver no cache, não faz nada
    const existing = await get<CachedAudioEntry>(key, audioStore);
    if (existing) return;

    // Busca metadados no Supabase
    const { data: rows } = await supabase
      .from('narracoes_artigos')
      .select('audio_url, word_timings')
      .eq('tabela_nome', tabelaNome)
      .eq('artigo_numero', String(proximoArtigoNumero))
      .limit(1);

    const row = rows?.[0];
    if (!row?.audio_url) return;

    const resp = await fetch(row.audio_url);
    if (!resp.ok) return;
    const blob = await resp.blob();

    await saveCachedAudio(key, blob, row.word_timings as any);
  } catch {
    // Silencioso: prefetch não pode interromper fluxo
  }
}
