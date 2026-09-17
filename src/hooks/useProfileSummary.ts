// Fonte de verdade dos stats do "Meu Espaço" (interações totais, segundos em tela,
// avatar, bio, capa). Persiste no cache do React Query (PersistQueryClientProvider
// já configurado no App), então na 2ª+ abertura o valor aparece no primeiro paint.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';

export interface ProfileSummary {
  displayName: string;
  nomeCompleto?: string | null;
  isPremium: boolean;
  avatarUrl: string;
  bio: string;
  capaId: string;
  interacoesTotal: number;
  segundosEmTela: number;
  email: string;
  perfilContexto?: string | null;
  perfilTipos?: string[] | null;
}

const KEY = (uid: string | null | undefined) => ['profile-summary', uid ?? 'anon'] as const;
const LS_KEY = (uid: string) => `direitoprime:profile-summary:${uid}`;

function readCache(uid: string): ProfileSummary | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY(uid));
    return raw ? (JSON.parse(raw) as ProfileSummary) : undefined;
  } catch { return undefined; }
}

function writeCache(uid: string, value: ProfileSummary) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(LS_KEY(uid), JSON.stringify(value)); } catch { /* ignore */ }
}

interface ProfileRow {
  display_name?: string | null;
  nome_completo?: string | null;
  nome_preferido?: string | null;
  avatar_url?: string | null;
  is_premium?: boolean | null;
  bio?: string | null;
  capa_id?: string | null;
  interacoes_total?: number | null;
  segundos_em_tela?: number | null;
  perfil_contexto?: string | null;
  perfil_tipos?: string[] | null;
}

export function resolveUserDisplayName(
  profile?: { nome_preferido?: string | null; nome_completo?: string | null; display_name?: string | null } | null,
  userMetadata?: Record<string, unknown> | null,
  fallbackEmail?: string | null
): string {
  const metaName = String(
    userMetadata?.full_name ||
    userMetadata?.name ||
    userMetadata?.display_name ||
    userMetadata?.nome_completo ||
    userMetadata?.nomeCompleto ||
    ''
  ).trim();
  const emailPart = fallbackEmail ? fallbackEmail.split('@')[0] : '';

  return (
    profile?.nome_preferido?.trim() ||
    profile?.nome_completo?.trim() ||
    profile?.display_name?.trim() ||
    metaName ||
    emailPart ||
    'Usuário'
  );
}

async function fetchProfileSummary(
  userId: string,
  fallbackEmail: string,
  fallbackAvatar: string,
  userMetadata?: Record<string, unknown> | null
): Promise<ProfileSummary> {
  const metaName = String(
    userMetadata?.full_name ||
    userMetadata?.name ||
    userMetadata?.display_name ||
    userMetadata?.nome_completo ||
    userMetadata?.nomeCompleto ||
    ''
  ).trim();
  const emailFallback = fallbackEmail.split('@')[0] || 'Usuário';

  // Offline: usa o último snapshot salvo (ou um shape mínimo com o e-mail/meta).
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = readCache(userId);
    if (cached) return cached;
    return {
      displayName: metaName || emailFallback,
      nomeCompleto: metaName || null,
      isPremium: isAdminEmail(fallbackEmail),
      avatarUrl: fallbackAvatar || '',
      bio: '',
      capaId: 'capa1',
      interacoesTotal: 0,
      segundosEmTela: 0,
      email: fallbackEmail,
      perfilContexto: null,
      perfilTipos: null,
    };
  }
  const { data } = await supabase
    .from('profiles')
    .select('display_name,nome_completo,nome_preferido,avatar_url,is_premium,bio,capa_id,interacoes_total,segundos_em_tela,perfil_contexto,perfil_tipos')
    .eq('id', userId)
    .maybeSingle();
  const p: ProfileRow = (data as unknown as ProfileRow) ?? {};

  const resolvedDisplayName =
    p.nome_preferido?.trim() ||
    p.nome_completo?.trim() ||
    p.display_name?.trim() ||
    metaName ||
    emailFallback;

  const resolvedNomeCompleto =
    p.nome_completo?.trim() ||
    p.display_name?.trim() ||
    metaName ||
    null;

  const summary: ProfileSummary = {
    displayName: resolvedDisplayName,
    nomeCompleto: resolvedNomeCompleto,
    isPremium: !!p.is_premium || isAdminEmail(fallbackEmail),
    avatarUrl: p.avatar_url || fallbackAvatar || '',
    bio: p.bio ?? '',
    capaId: p.capa_id ?? 'capa1',
    interacoesTotal: Number(p.interacoes_total ?? 0),
    segundosEmTela: Number(p.segundos_em_tela ?? 0),
    email: fallbackEmail,
    perfilContexto: p.perfil_contexto ?? null,
    perfilTipos: Array.isArray(p.perfil_tipos) ? p.perfil_tipos : null,
  };
  writeCache(userId, summary);
  return summary;
}

export function useProfileSummary() {
  const { user } = useAuth();
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const fallbackAvatar =
    (typeof meta?.avatar_url === 'string' ? meta.avatar_url : '') ||
    (typeof meta?.picture === 'string' ? meta.picture : '') ||
    '';
  const fallbackEmail = user?.email ?? '';

  return useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id,
    queryFn: () => fetchProfileSummary(user!.id, fallbackEmail, fallbackAvatar, meta),
    initialData: user?.id ? readCache(user.id) : undefined,
    staleTime: 30_000,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7d — persistido
    // SWR: retorna cache imediatamente; revalida só se stale.
    placeholderData: (prev) => prev,
  });
}

/** Prefetch usado no boot / hover para deixar o cache quente. */
export function usePrefetchProfileSummary() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => {
    if (!user?.id) return;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fallbackAvatar =
      (typeof meta?.avatar_url === 'string' ? meta.avatar_url : '') ||
      (typeof meta?.picture === 'string' ? meta.picture : '') ||
      '';
    qc.prefetchQuery({
      queryKey: KEY(user.id),
      queryFn: () => fetchProfileSummary(user.id, user.email ?? '', fallbackAvatar, meta),
      staleTime: 30_000,
    });
  };
}

export function refreshProfileSummary(qc: ReturnType<typeof useQueryClient>, userId: string | null | undefined) {
  if (!userId) return;
  qc.invalidateQueries({ queryKey: KEY(userId) });
}
