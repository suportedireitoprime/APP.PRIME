import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { geminiFetch } from "../_shared/geminiFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { artigo_id } = await req.json();

    if (!artigo_id) {
      return new Response(JSON.stringify({ error: "artigo_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Verifica se já está no cache
    const { data: cache } = await supabaseAdmin
      .from("forca_artigos_cache")
      .select("phases")
      .eq("artigo_id", artigo_id)
      .maybeSingle();

    if (cache) {
      return new Response(JSON.stringify({ phases: cache.phases, cached: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Busca o texto do artigo no vade_mecum
    const { data: artigo, error: artigoErr } = await supabaseAdmin
      .from("vade_mecum_artigos")
      .select(`
        nome,
        conteudo,
        vade_mecum_leis ( nome_curto, ementa )
      `)
      .eq("id", artigo_id)
      .single();

    if (artigoErr || !artigo) {
      return new Response(JSON.stringify({ error: "Artigo não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leiNome = Array.isArray(artigo.vade_mecum_leis) ? artigo.vade_mecum_leis[0]?.nome_curto : (artigo.vade_mecum_leis as any)?.nome_curto;
    const conteudoTexto = artigo.conteudo.replace(/<[^>]*>?/gm, ''); // tira HTML basico

    // 3. Pede para a IA gerar as fases
    const systemInstruction = `Você é um especialista em direito criando um Jogo da Forca jurídico.
Para o artigo recebido, gere EXATAMENTE 5 palavras (ou expressões muito curtas, máx 2 palavras) essenciais para a compreensão jurídica do texto, junto com dicas sucintas.
Regras:
1. Retorne APENAS um JSON válido no formato: { "phases": [ { "word": "PALAVRA", "hint": "Dica curta" } ] }
2. As palavras devem estar SEM ACENTOS, SEM CEDILHA e em MAIÚSCULAS (ex: HABEAS CORPUS, ACAO PENAL).
3. Seja didático.`;

    const userPrompt = `Lei: ${leiNome || "Desconhecida"}
Artigo: ${artigo.nome}
Texto: ${conteudoTexto}`;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiBody = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const resp = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Erro Gemini:", txt);
      return new Response(JSON.stringify({ error: "Falha ao gerar palavras" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await resp.json();
    let textOut = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (textOut.startsWith("```json")) {
      textOut = textOut.replace(/^```json\n/, "").replace(/\n```$/, "");
    }
    
    let generated;
    try {
      generated = JSON.parse(textOut);
    } catch (e) {
      console.error("Falha no parse do JSON:", textOut);
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phases = generated.phases;
    if (!Array.isArray(phases) || phases.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma fase gerada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Salva no cache
    await supabaseAdmin
      .from("forca_artigos_cache")
      .insert({
        artigo_id,
        phases,
      });

    return new Response(JSON.stringify({ phases, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
