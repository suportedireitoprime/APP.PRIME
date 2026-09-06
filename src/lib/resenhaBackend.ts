// Backend da Resenha Diária (Radar 360 / Outras Normas).
//
// IMPORTANTE: a tabela `resenha_diaria` que está de fato populada — com
// `texto_completo` integral extraído do Planalto e `explicacao` gerada por IA —
// vive no backend de legislação (`dnjrgpldcwcpoywamorr`), junto com as edge
// functions `popular-texto-resenha` / `scrape-resenha-diaria`.
//
// O projeto próprio do app possui uma cópia da tabela, porém sem texto integral
// e sem as functions deployadas — era daí que vinha o bug de "abri a lei e não
// veio o texto integral". Todas as leituras/escritas da resenha devem passar por
// aqui.
import { LEIS_SUPABASE_URL, leisAuthHeaders } from '@/lib/legislacaoBackend';

export const RESENHA_SELECT =
  'id,tipo_ato,numero_ato,ementa,url,data_publicacao,data_dou,texto_completo,explicacao,created_at';

export const RESENHA_LIST_SELECT =
  'id,tipo_ato,numero_ato,ementa,url,data_publicacao,data_dou,created_at';

/** SELECT genérico em `resenha_diaria` via PostgREST (backend de legislação). */
export async function resenhaSelect<T = any>(
  query: Record<string, string>,
): Promise<T[]> {
  const qs = new URLSearchParams(query).toString();
  try {
    const res = await fetch(`${LEIS_SUPABASE_URL}/rest/v1/resenha_diaria?${qs}`, {
      headers: leisAuthHeaders(),
    });
    if (!res.ok) {
      console.error('[resenha] select falhou', res.status, await res.text());
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.error('[resenha] select erro', e);
    return [];
  }
}

/** Busca uma linha por id. */
export async function resenhaById<T = any>(
  id: string,
  select = RESENHA_SELECT,
): Promise<T | null> {
  const rows = await resenhaSelect<T>({ select, id: `eq.${id}`, limit: '1' });
  return rows[0] ?? null;
}

/** Invoca uma edge function do backend de legislação. */
export async function invokeResenhaFn<T = any>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T | null> {
  const res = await fetch(`${LEIS_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { ...leisAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[resenha] ${name} falhou [${res.status}]: ${text}`);
    throw new Error(`${name} falhou (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Garante o texto integral de um ato: se ainda não houver texto (ou for muito
 * curto), dispara a extração no Planalto e relê a linha.
 */
export async function garantirTextoIntegral(
  id: string,
): Promise<{ texto_completo: string | null; explicacao: string | null } | null> {
  try {
    await invokeResenhaFn('popular-texto-resenha', { id, force: true });
  } catch (e) {
    console.warn('[resenha] popular-texto-resenha falhou, relendo do banco:', e);
  }
  const row = await resenhaById<{ texto_completo: string | null; explicacao: string | null }>(
    id,
    'texto_completo,explicacao',
  );
  return row;
}
