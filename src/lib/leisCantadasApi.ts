import { supabase } from "@/integrations/supabase/client";
import { LEIS_SUPABASE_URL, leisAuthHeaders } from "@/lib/legislacaoBackend";

// ── LEIS CANTADAS (músicas dos artigos) ─────────────────────────────────────

export type LeiCantada = {
  id: string;
  slug: string;
  tabela_codigo: string;
  artigo_id: number;
  numero_artigo: string | null;
  lei_nome: string | null;
  titulo: string | null;
  audio_url: string;
  storage_path: string | null;
  letra: string | null;
  letra_sync: number[] | null;
  letra_emojis: string[] | null;
  created_at: string;
  /** Texto (markdown) do resumo, quando a faixa vier da tabela resumos_cantados. */
  resumo_texto?: string | null;
};

export type LeiCantadaStat = { musica_id: string; plays: number; likes: number };

/** Registra uma reprodução (play) de uma música. */
export async function registrarPlay(musicaId: string): Promise<void> {
  await supabase.rpc("registrar_play" as never, { p_musica_id: musicaId } as never);
}

/** Alterna a curtida do usuário; retorna o novo estado (true = curtido). */
export async function alternarCurtida(musicaId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("alternar_curtida" as never, {
    p_musica_id: musicaId,
  } as never);
  if (error) throw error;
  return Boolean(data);
}

/** Estatísticas (plays/likes) de todas as músicas. */
export async function fetchLeisCantadasStats(): Promise<Map<string, LeiCantadaStat>> {
  const map = new Map<string, LeiCantadaStat>();
  const { data, error } = await supabase.from("leis_cantadas_stats").select("*");
  if (!error) {
    (data ?? []).forEach((r: any) =>
      map.set(r.lei_cantada_id, {
        musica_id: r.lei_cantada_id,
        plays: r.plays ?? 0,
        likes: r.likes ?? 0,
      })
    );
  }
  return map;
}

/** IDs das músicas curtidas pelo usuário logado. */
export async function fetchMinhasCurtidas(): Promise<Set<string>> {
  const set = new Set<string>();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return set;
  const { data, error } = await supabase
    .from("leis_cantadas_reacoes")
    .select("lei_cantada_id")
    .eq("created_by", uid)
    .eq("tipo", "like");
  if (!error) (data ?? []).forEach((r: any) => set.add(r.lei_cantada_id));
  return set;
}

/** Todas as músicas cadastradas (página estilo Spotify). */
export async function fetchTodasLeisCantadas(): Promise<LeiCantada[]> {
  const { data, error } = await supabase
    .from("leis_cantadas")
    .select("*")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return [];
  return (data ?? []).map(normalizarFaixa);
}

function normalizarFaixa(r: any): LeiCantada {
  const toNumArr = (v: unknown): number[] | null =>
    Array.isArray(v) ? (v as number[]).map(Number).filter((n) => isFinite(n)) : null;
  const toStrArr = (v: unknown): string[] | null =>
    Array.isArray(v) ? (v as unknown[]).map(String) : null;
  return {
    id: String(r.id),
    slug: r.slug ?? "lei",
    tabela_codigo: r.tabela_codigo ?? "",
    artigo_id: Number(r.artigo_id ?? 0),
    numero_artigo: r.numero_artigo ?? null,
    lei_nome: r.lei_nome ?? null,
    titulo: r.titulo ?? null,
    audio_url: r.audio_url ?? "",
    storage_path: r.storage_path ?? null,
    letra: r.letra ?? null,
    letra_sync: toNumArr(r.letra_sync),
    letra_emojis: toStrArr(r.letra_emojis),
    created_at: r.created_at ?? new Date().toISOString(),
  };
}

// ── RESUMOS CANTADOS (temas cantados por área) ──────────────────────────────

export type ResumoCantado = {
  id: string;
  area: string;
  materia: string | null;
  tema: string;
  audio_url: string;
  duracao_seg: number | null;
  letra: string | null;
  letra_sync: number[] | null;
  letra_emojis: string[] | null;
  resumo_texto: string | null;
  created_at: string;
};

/** Resumos cantados de uma área (ex.: "Direito Penal"). */
export async function fetchResumosCantadosPorArea(area: string): Promise<ResumoCantado[]> {
  const { data, error } = await supabase
    .from("resumos_cantados")
    .select("*")
    .eq("area", area)
    .not("audio_url", "is", null)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    area: r.area,
    materia: r.materia ?? null,
    tema: r.tema ?? r.titulo ?? "",
    audio_url: r.audio_url ?? "",
    duracao_seg: r.duracao_seg ?? null,
    letra: r.letra ?? null,
    letra_sync: Array.isArray(r.letra_sync) ? (r.letra_sync as number[]) : null,
    letra_emojis: Array.isArray(r.letra_emojis) ? (r.letra_emojis as string[]) : null,
    resumo_texto: r.resumo_texto ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
  }));
}

/** Todos os resumos cantados disponíveis (qualquer área). */
export async function fetchTodosResumosCantados(): Promise<ResumoCantado[]> {
  const { data, error } = await supabase
    .from("resumos_cantados")
    .select("*")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    area: r.area,
    materia: r.materia ?? null,
    tema: r.tema ?? "",
    audio_url: r.audio_url ?? "",
    duracao_seg: r.duracao_seg ?? null,
    letra: r.letra ?? null,
    letra_sync: Array.isArray(r.letra_sync) ? (r.letra_sync as number[]) : null,
    letra_emojis: Array.isArray(r.letra_emojis) ? (r.letra_emojis as string[]) : null,
    resumo_texto: r.resumo_texto ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
  }));
}

/** Adapta um ResumoCantado para o formato LeiCantada consumido pelo player. */
export function resumoParaFaixa(r: ResumoCantado): LeiCantada {
  return {
    id: r.id,
    slug: "resumo",
    tabela_codigo: "resumos_cantados",
    artigo_id: 0,
    numero_artigo: null,
    lei_nome: r.materia || r.area,
    titulo: r.tema,
    audio_url: r.audio_url,
    storage_path: null,
    letra: r.letra,
    letra_sync: r.letra_sync,
    letra_emojis: r.letra_emojis,
    resumo_texto: r.resumo_texto,
    created_at: r.created_at,
  };
}

// ── TEXTO DO ARTIGO (backend de legislação) ─────────────────────────────────

/** Busca o texto bruto do artigo vinculado à faixa. */
export async function fetchArtigoDetalhe(
  tabelaCodigo: string,
  artigoId: number
): Promise<{ numero: string | null; texto: string } | null> {
  if (!tabelaCodigo || !artigoId) return null;
  try {
    const res = await fetch(
      `${LEIS_SUPABASE_URL}/rest/v1/${encodeURIComponent(tabelaCodigo)}?id=eq.${encodeURIComponent(
        String(artigoId)
      )}&select=id,numero,rotulo,texto&limit=1`,
      { headers: leisAuthHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    return { numero: row.rotulo ?? row.numero ?? null, texto: String(row.texto ?? "") };
  } catch {
    return null;
  }
}