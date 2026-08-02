// Importa (uma única vez) os catálogos de videoaulas do banco antigo,
// lendo a API pública de leitura e gravando com service role.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGEM = "https://izspjvegxdfgkgibpyst.supabase.co/rest/v1";
const ORIGEM_KEY = "sb_publishable_nqyec1qQmLMrbPH3YFPhxw_XtJ449ZC";

type Spec = {
  tabela: string;
  /** Tabela de origem, quando o nome difere do destino. */
  origem?: string;
  /** Filtro extra na origem (query string PostgREST). */
  filtro?: string;
  cols: string;
  map: (r: Record<string, unknown>) => Record<string, unknown>;
};

/** "14:28:00" / "21:24" -> segundos */
function tempoParaSegundos(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const partes = v.split(":").map((p) => parseInt(p, 10));
  if (partes.some((p) => Number.isNaN(p))) return null;
  if (partes.length === 3) return partes[0] * 3600 + partes[1] * 60 + partes[2];
  if (partes.length === 2) return partes[0] * 60 + partes[1];
  return null;
}

/** "06/02/2020" -> ISO */
function dataParaIso(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T00:00:00Z` : null;
}

/** Extrai o id do vídeo de uma URL do YouTube. */
function videoIdDoLink(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/[?&]v=([\w-]{6,})/) || v.match(/youtu\.be\/([\w-]{6,})/);
  return m ? m[1] : null;
}

const SPECS: Spec[] = [
  {
    tabela: "videoaulas_areas_direito",
    cols: "id,video_id,playlist_id,area,titulo,descricao,sobre_aula,thumb,ordem,duracao_segundos,publicado_em",
    map: (r) => ({
      id: r.id,
      video_id: r.video_id,
      playlist_id: r.playlist_id ?? null,
      area: r.area,
      titulo: r.titulo,
      descricao: r.descricao ?? null,
      sobre_aula: r.sobre_aula ?? null,
      thumb: r.thumb ?? null,
      ordem: r.ordem ?? null,
      duracao_segundos: r.duracao_segundos ?? null,
      publicado_em: r.publicado_em ?? null,
    }),
  },
  {
    tabela: "videoaulas_iniciante",
    cols: "id,video_id,playlist_id,titulo,descricao,sobre_aula,thumbnail,ordem,duracao_segundos,publicado_em",
    map: (r) => ({
      id: r.id,
      video_id: r.video_id,
      playlist_id: r.playlist_id ?? null,
      titulo: r.titulo,
      descricao: r.descricao ?? null,
      sobre_aula: r.sobre_aula ?? null,
      thumbnail: r.thumbnail ?? null,
      ordem: r.ordem ?? null,
      duracao_segundos: r.duracao_segundos ?? null,
      publicado_em: r.publicado_em ?? null,
    }),
  },
  {
    tabela: "videoaulas_oab_primeira_fase",
    cols: "id,video_id,playlist_id,area,titulo,descricao,sobre_aula,thumbnail,ordem,duracao,publicado_em",
    map: (r) => ({
      id: r.id,
      video_id: r.video_id,
      playlist_id: r.playlist_id ?? null,
      area: r.area,
      titulo: r.titulo,
      descricao: r.descricao ?? null,
      sobre_aula: r.sobre_aula ?? null,
      thumbnail: r.thumbnail ?? null,
      ordem: r.ordem ?? null,
      duracao_segundos: typeof r.duracao === "number" ? r.duracao : null,
      publicado_em: r.publicado_em ?? null,
    }),
  },
  {
    tabela: "videoaulas_oab_segunda_fase",
    origem: "VIDEO%20AULAS-NOVO",
    filtro:
      "or=(categoria.eq.2%C2%B0%20Fase%20OAB,categoria.ilike.*Fase%20OAB*,area.ilike.*2%C2%AA%20Fase*,area.ilike.*Segunda%20Fase*)",
    cols: "id,area,titulo,link,thumb,tempo,data,sobre_aula",
    map: (r) => ({
      id: r.id,
      video_id: videoIdDoLink(r.link) ?? "",
      area: r.area,
      titulo: r.titulo,
      descricao: null,
      sobre_aula: r.sobre_aula ?? null,
      thumbnail: r.thumb ?? null,
      ordem: typeof r.id === "number" ? r.id : null,
      duracao_segundos: tempoParaSegundos(r.tempo),
      publicado_em: dataParaIso(r.data),
    }),
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const resumo: Record<string, unknown> = {};

  try {
    for (const spec of SPECS) {
      let offset = 0;
      let importados = 0;
      while (true) {
        const url = `${ORIGEM}/${spec.origem ?? spec.tabela}?select=${spec.cols}&order=id&limit=250&offset=${offset}${spec.filtro ? `&${spec.filtro}` : ""}`;
        const res = await fetch(url, {
          headers: { apikey: ORIGEM_KEY, Authorization: `Bearer ${ORIGEM_KEY}` },
        });
        if (!res.ok) {
          const t = await res.text();
          console.error(`[videoaulas-importar] origem ${res.status}: ${t.slice(0, 300)}`);
          return new Response(
            JSON.stringify({ error: "Falha ao ler o banco de origem", status: res.status, details: t.slice(0, 300) }),
            { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (!rows.length) break;

        const payload = rows.map(spec.map).filter((r) => !!r.video_id);
        const { error } = payload.length
          ? await admin.from(spec.tabela).upsert(payload, { onConflict: "id" })
          : { error: null };
        if (error) throw new Error(`${spec.tabela}: ${error.message}`);

        importados += rows.length;
        offset += rows.length;
        if (rows.length < 250) break;
      }

      const { count } = await admin
        .from(spec.tabela)
        .select("id", { count: "exact", head: true });
      resumo[spec.tabela] = { importados, total: count ?? null };
      console.log(`[videoaulas-importar] ${spec.tabela}: ${importados} lidos, total ${count}`);
    }

    return new Response(JSON.stringify({ ok: true, resumo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[videoaulas-importar]", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message ?? String(e), resumo }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
