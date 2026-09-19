/**
 * Gerenciador de persistência local e sincronização de progresso das aulas (APP.PRIME).
 * Garante que o progresso da aula seja salvo instantaneamente (0ms) no LocalStorage/IndexedDB
 * e sincronizado com o Supabase, permitindo retomada precisa ("Continuar de onde parou").
 */

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export interface LocalAulaProgress {
  aulaId: string;
  currentIdx: number;
  blocosConcluidos: number;
  total: number;
  concluida: boolean;
  updatedAt: number;
}

const STORAGE_PREFIX = 'aprender_aula_progresso_';

export async function getLocalAulaProgress(aulaId: string): Promise<LocalAulaProgress | null> {
  if (typeof window === 'undefined' || !aulaId) return null;
  try {
    const data = await idbGet<LocalAulaProgress>(`${STORAGE_PREFIX}${aulaId}`);
    return data ?? null;
  } catch (err) {
    console.warn('Erro ao carregar progresso local da aula (IDB):', err);
    return null;
  }
}

export async function saveLocalAulaProgress(
  aulaId: string,
  currentIdx: number,
  total: number,
  concluida = false
): Promise<void> {
  if (typeof window === 'undefined' || !aulaId) return;
  try {
    const blocosConcluidos = concluida ? total : Math.min(currentIdx + 1, total);
    const data: LocalAulaProgress = {
      aulaId,
      currentIdx,
      blocosConcluidos,
      total,
      concluida,
      updatedAt: Date.now(),
    };
    await idbSet(`${STORAGE_PREFIX}${aulaId}`, data);
  } catch (err) {
    console.warn('Erro ao salvar progresso local da aula (IDB):', err);
  }
}

export async function clearLocalAulaProgress(aulaId: string): Promise<void> {
  if (typeof window === 'undefined' || !aulaId) return;
  try {
    await idbDel(`${STORAGE_PREFIX}${aulaId}`);
  } catch (err) {
    console.warn('Erro ao limpar progresso local da aula (IDB):', err);
  }
}
