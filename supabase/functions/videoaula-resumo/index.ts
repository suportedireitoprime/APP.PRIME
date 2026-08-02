// Gera o "Sobre esta aula" (resumo didático em markdown) de uma videoaula
// e guarda no cache compartilhado.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  chamarIa,
  fetchYoutubeTranscript,
  GatewayError,
  limparTextoInstitucional,
  limparTituloAula,
  parseJsonStrict,
} from "../_shared/videoaulaIa.ts";

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
    const videoId = body?.videoId ? String(body.videoId).slice(0, 24) : "";
    const tabela = TABELAS.includes(body?.tabela) ? String(body.tabela) : "videoaulas_areas_direito";
    if (!videoId) return json({ error: "videoId é obrigatório" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await admin
      .from("videoaulas_resumo_cache")
      .select("area, tema, markdown")
      .eq("tabela", tabela)
      .eq("video_id", videoId)
      .maybeSingle();
    if (cached?.markdown) {
      return json({ area: cached.area, tema: cached.tema, resumo: cached.markdown, cached: true });
    }

    const { data: aula } = await admin
      .from(tabela)
      .select("titulo, descricao, sobre_aula" + (tabela === "videoaulas_iniciante" ? "" : ", area"))
      .eq("video_id", videoId)
      .maybeSingle();

    const areaBruta = String(body?.area || (aula as any)?.area || "");
    const tituloBruto = String(body?.titulo || aula?.titulo || "Videoaula");
    const transcricao = await fetchYoutubeTranscript(videoId);
    const base = limparTextoInstitucional(
      transcricao || String(aula?.sobre_aula || aula?.descricao || ""),
    );
    const tema = limparTituloAula(tituloBruto, areaBruta);

    console.log(`[videoaula-resumo] ${videoId} transcricao=${transcricao.length} chars`);

    const prompt = `Você é uma professora de Direito brasileira apresentando o conteúdo de uma videoaula para quem estuda para concursos e OAB.

Aula: ${tema}
${areaBruta ? `Área: ${areaBruta}` : ""}

Base material da aula (${transcricao ? "transcrição" : "descrição"}):
"""
${base || "(sem transcrição disponível — use o tema e a área para montar um panorama jurídico do assunto)"}
"""

Escreva um panorama didático em markdown com esta estrutura:
## Do que trata a aula
## Pontos-chave
(lista com 4-7 itens objetivos)
## Base legal
(dispositivos e súmulas pertinentes)
## Como cai na prova
(2-4 itens)

Regras: nunca mencione plataforma, canal, professor, curso gratuito ou links. Só Direito. Máximo de 400 palavras.

Responda APENAS JSON estrito (sem \`\`\`):
{"area":"área jurídica","tema":"tema limpo da aula","markdown":"o panorama em markdown"}`;

    const texto = await chamarIa({ prompt, json: true, maxTokens: 4096, temperature: 0.6 });
    const parsed = parseJsonStrict(texto);
    const resumo = String(parsed?.markdown || "");
    const areaFinal = String(parsed?.area || areaBruta || "");
    const temaFinal = String(parsed?.tema || tema);

    if (resumo) {
      await admin.from("videoaulas_resumo_cache").upsert(
        { tabela, video_id: videoId, area: areaFinal, tema: temaFinal, markdown: resumo },
        { onConflict: "tabela,video_id" },
      );
    }

    return json({ area: areaFinal, tema: temaFinal, resumo, cached: false });
  } catch (e) {
    const status = e instanceof GatewayError ? e.status : 500;
    console.error("[videoaula-resumo]", e);
    return json({ error: (e as Error)?.message ?? String(e) }, status);
  }
});
