// Gera as ferramentas de estudo de uma videoaula (flashcards, questões,
// lei seca, resumos, pegadinhas, termos) a partir da transcrição do vídeo.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildPrompt, type AulaCtx } from "./prompts.ts";
import {
  chamarIa,
  fetchYoutubeTranscript,
  GatewayError,
  limparTextoInstitucional,
  limparTituloAula,
  parseJsonStrict,
} from "../_shared/videoaulaIa.ts";

const TIPOS = [
  "flashcards", "lacunas", "conceito",
  "pegadinhas", "mapa", "cornell",
  "feynman", "topicos", "tradicional", "fichamento", "comparativa",
  "lei", "questoes", "termos",
] as const;

const TABELAS = [
  "videoaulas_areas_direito",
  "videoaulas_iniciante",
  "videoaulas_oab_primeira_fase",
] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const tipo = String(body?.tipo ?? "");
    const videoId = body?.videoId ? String(body.videoId).slice(0, 24) : "";
    const tabela = TABELAS.includes(body?.tabela) ? String(body.tabela) : "videoaulas_areas_direito";

    if (!TIPOS.includes(tipo as any)) return json({ error: "tipo inválido" }, 400);
    if (!videoId) return json({ error: "videoId é obrigatório" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) cache compartilhado
    const { data: cached } = await admin
      .from("videoaulas_acao_cache")
      .select("payload")
      .eq("tabela", tabela)
      .eq("video_id", videoId)
      .eq("tipo", tipo)
      .maybeSingle();
    if (cached?.payload) return json({ payload: cached.payload, cached: true });

    // 2) dados da aula
    const { data: aulaDb } = await admin
      .from(tabela)
      .select("titulo, descricao, sobre_aula" + (tabela === "videoaulas_iniciante" ? "" : ", area"))
      .eq("video_id", videoId)
      .maybeSingle();

    const transcricao = await fetchYoutubeTranscript(videoId);
    console.log(
      `[videoaula-acao-ia] tipo=${tipo} video=${videoId} transcricao=${transcricao.length} chars`,
    );

    const area = String(body?.area || (aulaDb as any)?.area || "");
    const ctx: AulaCtx = {
      titulo: limparTituloAula(String(body?.titulo || aulaDb?.titulo || "Aula"), area),
      area,
      conteudo: limparTextoInstitucional(
        transcricao || String(body?.conteudo || aulaDb?.sobre_aula || aulaDb?.descricao || ""),
      ),
      descricao: limparTextoInstitucional(
        String([aulaDb?.sobre_aula, aulaDb?.descricao, body?.descricao].filter(Boolean).join("\n\n")),
      ),
      fonte: transcricao ? "transcrição" : "descrição",
    };

    if (!ctx.conteudo && !ctx.descricao && !ctx.titulo) {
      return json({ error: "Conteúdo da aula é obrigatório" }, 400);
    }

    const texto = await chamarIa({
      prompt: buildPrompt(tipo, ctx),
      json: true,
      maxTokens: 8192,
    });
    const payload = parseJsonStrict(texto);

    await admin
      .from("videoaulas_acao_cache")
      .upsert(
        { tabela, video_id: videoId, tipo, payload },
        { onConflict: "tabela,video_id,tipo" },
      );

    return json({ payload, cached: false });
  } catch (e) {
    const status = e instanceof GatewayError ? e.status : 500;
    console.error("[videoaula-acao-ia]", e);
    return json({ error: (e as Error)?.message ?? String(e) }, status);
  }
});
