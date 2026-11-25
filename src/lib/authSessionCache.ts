import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

let cachedUser: User | null | undefined = undefined;
let inflightSession: Promise<User | null> | null = null;
let listenerAttached = false;

function ensureAuthListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ?? null;
  });
}

/**
 * Lê o usuário autenticado a partir da sessão local em memória/storage (`getSession()`),
 * evitando requisições HTTP repetidas ao endpoint `/auth/v1/user` (`getUser()`).
 */
export async function getCurrentSessionUser(): Promise<User | null> {
  ensureAuthListener();
  if (cachedUser !== undefined) return cachedUser;
  if (inflightSession) return inflightSession;

  inflightSession = supabase.auth
    .getSession()
    .then(({ data }) => {
      cachedUser = data?.session?.user ?? null;
      return cachedUser;
    })
    .catch(() => null)
    .finally(() => {
      inflightSession = null;
    });

  return inflightSession;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentSessionUser();
  return user?.id ?? null;
}
