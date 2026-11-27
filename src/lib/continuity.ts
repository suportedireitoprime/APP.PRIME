/**
 * Continuity service (Fase 8 do plano de UX)
 *
 * Registra a última tela relevante que a pessoa estava usando, para que ela
 * possa "continuar de onde parou" — inclusive ao trocar de aparelho.
 *
 *  • Grava imediatamente em localStorage (instantâneo, funciona offline).
 *  • Sincroniza em segundo plano (debounced) com public.user_activity_state
 *    quando há usuário autenticado, permitindo continuidade entre mobile,
 *    tablet e desktop.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentSessionUser } from '@/lib/authSessionCache';
import { get, set } from 'idb-keyval';

export type ContinuityKind =
  | 'blog'
  | 'noticia'
  | 'artigo'
  | 'radar'
  | 'biblioteca'
  | 'other'
  | 'questoes'
  | 'flashcards'
  | 'leiseca'
  | 'resumos'
  | 'audioaulas'
  | 'pilulas';

export interface ContinuityEntry {
  path: string;
  label: string;
  kind: ContinuityKind;
  device_hint?: string;
  updated_at: string;
}

const LS_KEY = 'continuity:last';
const OFFLINE_QUEUE_KEY = 'continuity:offline_queue';
const IGNORE_PATHS = ['/auth', '/onboarding', '/landing', '/reset-password'];

function deviceHint(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth || 0;
  if (w >= 1024) return 'desktop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

function readLocal(): ContinuityEntry | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContinuityEntry;
  } catch {
    return null;
  }
}

function writeLocal(entry: ContinuityEntry) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

async function pushRemote(entry: ContinuityEntry) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) return;
    const { error } = await supabase
      .from('user_activity_state')
      .upsert({
        user_id: user.id,
        path: entry.path,
        label: entry.label,
        kind: entry.kind,
        device_hint: entry.device_hint ?? deviceHint(),
        updated_at: entry.updated_at,
      });
    if (error) throw error;
  } catch {
    /* remote sync failed -> add to offline queue */
    try {
      const queue = (await get<ContinuityEntry[]>(OFFLINE_QUEUE_KEY)) || [];
      queue.push(entry);
      // Keep queue small since we only need the latest
      if (queue.length > 20) queue.shift();
      await set(OFFLINE_QUEUE_KEY, queue);
    } catch {
      /* ignore IDB errors */
    }
  }
}

let isFlushing = false;
export async function flushSyncQueue() {
  if (typeof window === 'undefined' || !navigator.onLine || isFlushing) return;
  isFlushing = true;
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      await set(OFFLINE_QUEUE_KEY, []);
      return;
    }
    const queue = (await get<ContinuityEntry[]>(OFFLINE_QUEUE_KEY)) || [];
    if (queue.length === 0) return;

    // O user_activity_state guarda apenas o último estado, então mandamos só o mais recente
    queue.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    const latest = queue[0];

    const { error } = await supabase
      .from('user_activity_state')
      .upsert({
        user_id: user.id,
        path: latest.path,
        label: latest.label,
        kind: latest.kind,
        device_hint: latest.device_hint ?? deviceHint(),
        updated_at: latest.updated_at,
      });

    if (!error) {
      await set(OFFLINE_QUEUE_KEY, []);
    }
  } catch {
    /* try again later */
  } finally {
    isFlushing = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushSyncQueue);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushSyncQueue();
    }
  });
}

export function recordActivity(input: {
  path: string;
  label: string;
  kind?: ContinuityKind;
}) {
  if (typeof window === 'undefined') return;
  if (IGNORE_PATHS.some((p) => input.path.startsWith(p))) return;
  const entry: ContinuityEntry = {
    path: input.path,
    label: input.label.trim().slice(0, 160),
    kind: input.kind ?? 'other',
    device_hint: deviceHint(),
    updated_at: new Date().toISOString(),
  };
  writeLocal(entry);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushRemote(entry), 800);
}

export function getLocalContinuity(): ContinuityEntry | null {
  return readLocal();
}

// ---------------------------------------------------------------------------
// Per-area last access — para o BottomNav mostrar o conteúdo real acessado
// ---------------------------------------------------------------------------
const AREA_LS_PREFIX = 'continuity:area:';

export interface AreaContinuityEntry {
  path: string;
  label: string;
  sublabel?: string; // ex: "Direito Penal"
  kind: ContinuityKind;
  updated_at: string;
}

export function recordAreaActivity(entry: Omit<AreaContinuityEntry, 'updated_at'>) {
  if (typeof window === 'undefined') return;
  try {
    const full: AreaContinuityEntry = { ...entry, updated_at: new Date().toISOString() };
    localStorage.setItem(`${AREA_LS_PREFIX}${entry.kind}`, JSON.stringify(full));
  } catch { /* ignore quota */ }
  // also record in global continuity so cross-device sync works
  recordActivity({ path: entry.path, label: entry.label, kind: entry.kind });
}

export function getAreaContinuity(kind: ContinuityKind): AreaContinuityEntry | null {
  try {
    const raw = localStorage.getItem(`${AREA_LS_PREFIX}${kind}`);
    if (!raw) return null;
    return JSON.parse(raw) as AreaContinuityEntry;
  } catch {
    return null;
  }
}

/** Retorna o último acesso em qualquer dos kinds fornecidos (o mais recente) */
export function getAreaContinuityAny(kinds: ContinuityKind[]): AreaContinuityEntry | null {
  const entries = kinds
    .map((k) => getAreaContinuity(k))
    .filter(Boolean) as AreaContinuityEntry[];
  if (entries.length === 0) return null;
  entries.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return entries[0];
}

/**
 * Busca o registro mais recente entre o local (este aparelho) e o remoto
 * (outros aparelhos). Retorna null se não houver ou se for do próprio device.
 */
export async function fetchLatestContinuity(opts: { onlyOtherDevice?: boolean } = {}): Promise<ContinuityEntry | null> {
  const local = readLocal();
  let remote: ContinuityEntry | null = null;
  try {
    const user = await getCurrentSessionUser();
    if (user) {
      const { data } = await supabase
        .from('user_activity_state')
        .select('path,label,kind,device_hint,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        remote = {
          path: data.path,
          label: data.label,
          kind: (data.kind as ContinuityKind) ?? 'other',
          device_hint: data.device_hint ?? undefined,
          updated_at: data.updated_at,
        };
      }
    }
  } catch {
    /* offline / not logged in */
  }
  const candidates = [local, remote].filter(Boolean) as ContinuityEntry[];
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  const latest = candidates[0];
  if (opts.onlyOtherDevice && latest.device_hint === deviceHint()) return null;
  return latest;
}
