import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { AudiobookLivro } from '@/data/audiobooksCatalogo';

const memoryBooks = new Map<string, AudiobookLivro>();
const inflightBooks = new Map<string, Promise<AudiobookLivro>>();
const IDB_PREFIX = 'audiobook_full_v1:';

/**
 * Carrega sob demanda os capítulos, timestamps (cues) e imagens de cena de um Audiobook específico.
 * Usa cache em memória -> IndexedDB (offline) -> /data/audiobooks/<id>.json (local no bundle nativo / CDN).
 */
export async function hydrateAudiobook(livro: AudiobookLivro): Promise<AudiobookLivro> {
  if (livro.capitulos && livro.capitulos.length > 0) {
    memoryBooks.set(livro.id, livro);
    return livro;
  }

  const mem = memoryBooks.get(livro.id);
  if (mem && mem.capitulos && mem.capitulos.length > 0) {
    return mem;
  }

  const existing = inflightBooks.get(livro.id);
  if (existing) return existing;

  const task = (async () => {
    try {
      const cached = await idbGet<AudiobookLivro>(`${IDB_PREFIX}${livro.id}`).catch(() => undefined);
      if (cached && Array.isArray(cached.capitulos) && cached.capitulos.length > 0) {
        const merged = { ...livro, ...cached };
        memoryBooks.set(livro.id, merged);
        return merged;
      }

      const res = await fetch(`/data/audiobooks/${encodeURIComponent(livro.id)}.json`);
      if (res.ok) {
        const full = (await res.json()) as AudiobookLivro;
        const merged = { ...livro, ...full };
        memoryBooks.set(livro.id, merged);
        void idbSet(`${IDB_PREFIX}${livro.id}`, merged).catch(() => {});
        return merged;
      }
    } catch {
      /* fallback retorna metadados sem quebrar UI */
    } finally {
      inflightBooks.delete(livro.id);
    }
    return livro;
  })();

  inflightBooks.set(livro.id, task);
  return task;
}
