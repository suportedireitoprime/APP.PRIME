// Prefetch utilitário para a Lei Seca — mesmo padrão do Vade Mecum.
// Ao tocar/passar o mouse num card, já dispara em paralelo:
//   1) trilha (cache "lei-seca-trilha"/slug)
//   2) lições da primeira parte (cache "lei-seca-licoes"/slug/parte)
//   3) chunk do bundle da página de destino
// Idempotente. Persiste em sessionStorage para warm start no próximo navigate.

import type { QueryClient } from "@tanstack/react-query";
import { getTrilha, listarLicoes, type LeiSecaTrilha, type LeiSecaLicao } from "@/lib/leiSeca";

export const LEI_SECA_CACHE_VERSION = "v1";
const SS_PREFIX = `ls:${LEI_SECA_CACHE_VERSION}:`;
const inflight = new Set<string>();

export const trilhaKey = (slug: string) => ["lei-seca-trilha", slug] as const;
export const licoesKey = (slug: string, parte: string) =>
  ["lei-seca-licoes", slug, parte] as const;

function ssGet<T>(k: string): T | null {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function ssSet(k: string, data: unknown) {
  try {
    sessionStorage.setItem(SS_PREFIX + k, JSON.stringify(data));
  } catch {}
}

/** Hidrata o cache do React Query com o que estiver no sessionStorage. Chamar na montagem. */
export function hydrateLeiSecaFromSession(qc: QueryClient, slug: string, parte?: string) {
  const trilha = ssGet<LeiSecaTrilha>(`trilha:${slug}`);
  if (trilha && !qc.getQueryData(trilhaKey(slug))) {
    qc.setQueryData(trilhaKey(slug), trilha);
  }
  const p = parte ?? trilha?.partes?.[0]?.slug;
  if (p) {
    const licoes = ssGet<LeiSecaLicao[]>(`licoes:${slug}:${p}`);
    if (licoes && !qc.getQueryData(licoesKey(slug, p))) {
      qc.setQueryData(licoesKey(slug, p), licoes);
    }
  }
}

/** Precarrega trilha + lições da primeira parte + bundle. Idempotente. */
export function prefetchTrilha(qc: QueryClient, slug: string) {
  if (!slug || inflight.has(slug)) return;
  inflight.add(slug);

  // Bundle da página de destino — Vite faz code-split por dynamic import.
  // Chamar cedo deixa o JS pronto antes do clique soltar.
  void import("@/pages/LeiSeca/LeiSecaParte").catch(() => {});

  const cachedTrilha = qc.getQueryData<LeiSecaTrilha>(trilhaKey(slug));

  const trilhaPromise = cachedTrilha
    ? Promise.resolve(cachedTrilha)
    : qc
        .fetchQuery({
          queryKey: trilhaKey(slug),
          queryFn: () => getTrilha(slug),
          staleTime: 10 * 60_000,
        })
        .then((t) => {
          if (t) ssSet(`trilha:${slug}`, t);
          return t as LeiSecaTrilha | null;
        });

  trilhaPromise
    .then((trilha) => {
      const parte = trilha?.partes?.[0]?.slug;
      if (!parte) return;
      const k = licoesKey(slug, parte);
      if (qc.getQueryData(k)) return;
      return qc
        .fetchQuery({
          queryKey: k,
          queryFn: () => listarLicoes(slug, parte),
          staleTime: 10 * 60_000,
        })
        .then((licoes) => ssSet(`licoes:${slug}:${parte}`, licoes));
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(slug);
    });
}

/** Precarrega uma parte específica (ex.: ao passar pelo botão "Especial"). */
export function prefetchParte(qc: QueryClient, slug: string, parte: string) {
  if (!slug || !parte) return;
  const k = licoesKey(slug, parte);
  if (qc.getQueryData(k)) return;
  qc.fetchQuery({
    queryKey: k,
    queryFn: () => listarLicoes(slug, parte),
    staleTime: 10 * 60_000,
  })
    .then((licoes) => ssSet(`licoes:${slug}:${parte}`, licoes))
    .catch(() => {});
}

/** Handlers prontos para colar num <button>/<Link>. */
export function prefetchHandlers(qc: QueryClient, slug: string) {
  const run = () => prefetchTrilha(qc, slug);
  return { onPointerDown: run, onMouseEnter: run, onTouchStart: run, onFocus: run };
}
