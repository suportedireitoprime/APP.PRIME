/**
 * Serviço de persistência e pré-aquecimento em IndexedDB (Dexie) de Leis e Temas Favoritos e Recentes.
 *
 * Garante que:
 * 1. Ao favoritar ou abrir uma lei, seus artigos sejam persistidos em IndexedDB (Dexie).
 * 2. Ao bootar o app, todas as leis e temas favoritos/recentes já armazenados em IndexedDB
 *    sejam hidratados em memória RAM de forma imediata (sem rede).
 * 3. Qualquer lei ou tema favorito ainda ausente do cache local seja baixado em segundo
 *    plano (em idle, sem concorrer com a navegação do usuário), garantindo abertura em 0ms.
 */
import {
  getPersistedArtigosCache,
  getPersistedResumo,
  setPersistedResumo,
} from '@/services/offlineDb';
import { getFavoritos } from '@/lib/leisFavoritos';
import { getRecentes } from '@/lib/leisRecentes';
import { resumosLocal } from '@/lib/resumosLocal';
import { supabase } from '@/integrations/supabase/client';

let prewarmStarted = false;
const inFlightTables = new Set<string>();
const inFlightResumos = new Set<string>();

/**
 * Persiste os artigos de uma lei específica em segundo plano (se ainda não estiver em IndexedDB).
 */
export async function persistLeiArtigosInBackground(tabelaNome: string): Promise<void> {
  if (!tabelaNome || inFlightTables.has(tabelaNome)) return;

  try {
    // 1) Checa se já está em IndexedDB
    const existing = await getPersistedArtigosCache(tabelaNome);
    if (existing && existing.length > 0) {
      // Já está persistido! Apenas garante presença no cache em memória
      const { setCachedArtigos } = await import('@/services/legislacaoService');
      setCachedArtigos(tabelaNome, existing);
      return;
    }

    inFlightTables.add(tabelaNome);

    // 2) Busca e persiste
    const { fetchArtigosPaginado } = await import('@/services/legislacaoService');
    await fetchArtigosPaginado(tabelaNome, 0, 10000);
  } catch (err) {
    console.debug('[warmFavoritos] Falha ao persistir lei em background:', tabelaNome, err);
  } finally {
    inFlightTables.delete(tabelaNome);
  }
}

/**
 * Persiste um resumo jurídico em IndexedDB se ainda não estiver salvo.
 */
export async function persistResumoInBackground(id: string): Promise<void> {
  if (!id || inFlightResumos.has(id)) return;

  try {
    const existing = await getPersistedResumo(id);
    if (existing) return;

    inFlightResumos.add(id);
    const { data } = await (supabase as any)
      .from('resumos_juridicos')
      .select('id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      await setPersistedResumo(id, data);
    }
  } catch (err) {
    console.debug('[warmFavoritos] Falha ao persistir resumo em background:', id, err);
  } finally {
    inFlightResumos.delete(id);
  }
}

/**
 * Hidrata a memória RAM instantaneamente com tudo o que já existe em IndexedDB
 * para as leis favoritas e recentes (zero chamadas de rede).
 */
export async function hydrateFavoritosERecentesRAM(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { hasCachedArtigos, setCachedArtigos } = await import('@/services/legislacaoService');
    const favs = getFavoritos();
    const recents = getRecentes().slice(0, 10);

    const tabelas = Array.from(
      new Set(
        [...favs, ...recents]
          .map((l) => l.tabela_nome)
          .filter(Boolean)
      )
    );

    for (const tabela of tabelas) {
      if (hasCachedArtigos(tabela)) continue;
      try {
        const persisted = await getPersistedArtigosCache(tabela);
        if (persisted && persisted.length > 0) {
          setCachedArtigos(tabela, persisted);
        }
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
}

/**
 * Varredura completa em momentos ociosos (requestIdleCallback):
 * 1. Hidrata o cache de RAM a partir do IndexedDB.
 * 2. Identifica leis e temas favoritos/recentes ainda faltantes e os persiste ordenadamente.
 */
export function prewarmFavoritosERecentesIdle(): void {
  if (prewarmStarted || typeof window === 'undefined') return;
  prewarmStarted = true;

  const run = async () => {
    // 1) Hidratação de RAM sem rede
    await hydrateFavoritosERecentesRAM();

    // 2) Coleta leis favoritas e recentes (top 8)
    const favs = getFavoritos();
    const recents = getRecentes().slice(0, 8);
    const tabelas = Array.from(
      new Set([...favs, ...recents].map((l) => l.tabela_nome).filter(Boolean))
    );

    for (const tabela of tabelas) {
      try {
        const persisted = await getPersistedArtigosCache(tabela);
        if (!persisted || persisted.length === 0) {
          await persistLeiArtigosInBackground(tabela);
          // Pequena pausa entre requisições para evitar concorrência
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        /* noop */
      }
    }

    // 3) Coleta resumos jurídicos favoritos e recentes (top 8)
    const favResumos = resumosLocal.favoritos().slice(0, 10);
    const recResumos = resumosLocal.recentes().slice(0, 8);
    const resumoIds = Array.from(
      new Set([...favResumos, ...recResumos].map((r) => r.id).filter(Boolean))
    );

    for (const id of resumoIds) {
      try {
        const persisted = await getPersistedResumo(id);
        if (!persisted) {
          await persistResumoInBackground(id);
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch {
        /* noop */
      }
    }
  };

  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;

  if (ric) {
    ric(() => { void run(); }, { timeout: 3500 });
  } else {
    setTimeout(() => { void run(); }, 1500);
  }
}
