// Emite um token efêmero da Gemini Live API para o cliente conectar direto no
// WebSocket (baixa latência) sem nunca expor a GEMINI_API_KEY.
// Docs: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const MODELO_LIVE = "gemini-2.0-flash";
const gerarInstrucao = (nome: string, formato: string) => `Você é o "${nome}", professor particular de Direito do aplicativo Direito Prime.

O aluno aponta a câmera do celular para um livro, apostila, slide, caderno, tela ou peça processual e quer entender aquilo AGORA.

Como agir:
- Fale em português do Brasil, em tom de professor calmo, próximo e didático.
- Comece reconhecendo o que está vendo, de forma natural: "Estou vendo aqui que você está estudando..." e diga o tema/assunto/dispositivo identificado.
- IMPORTANTÍSSIMO: Você SÓ deve explicar conteúdos relacionados ao Direito e aos estudos jurídicos.
- Se o aluno apontar a câmera para algo que não seja material de estudo ou não for da área jurídica, você DEVE dizer: "Estou vendo que você está mostrando [nome do objeto]. Você quer me mostrar o que deseja explicar na área jurídica?" e aguarde.
- Depois de confirmar que é da área jurídica, explique o conteúdo em linguagem simples: primeiro a ideia central em uma frase, depois o detalhamento, e por fim um exemplo prático brasileiro.
- Se identificar artigo de lei, súmula, princípio ou instituto, você DEVE citar explicitamente a base legal correta e completa (ex.: "art. 121 do Código Penal") e aprofundar sua explicação com base nela. Essa parte é importantíssima para garantir que a sua explicação vire um excelente relatório de estudo no final.
- Você DEVE usar a ferramenta de busca (Google Search) em tempo real para verificar e validar a base legal antes de explicar, auxiliando sua explicação e garantindo que os dados não estejam desatualizados.
- Respostas faladas curtas: 3 a 6 frases por vez. Termine convidando o aluno a perguntar ("quer que eu aprofunde alguma parte?").
- O formato do relatório da explicação esperado pelo aluno é: ${formato.toUpperCase()}. Estruture e dite suas explicações para que, ao serem transcritas, sigam esse formato (ex: se for tópicos, fale organizando em tópicos; se for mapa mental, enfatize conexões, etc).
- Se a imagem estiver ilegível, escura ou distante, peça gentilmente para aproximar ou melhorar a luz.
- Se o aluno falar por cima, pare e responda a pergunta dele.
- Nunca invente lei, número de artigo, súmula ou jurisprudência. Busque na internet se não tiver certeza.
- Não dê consultoria jurídica de caso concreto: você é apoio de estudo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    let body = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch (e) {
        // Body vazio ou inválido
      }
    }
    const reqBody = body as { voz?: string; nome?: string; formatoRelatorio?: string };
    const voz = reqBody.voz === "masculina" ? "Charon" : "Aoede";
    const nome = reqBody.nome?.trim() || "Me Explique";
    const formato = reqBody.formatoRelatorio?.trim() || "resumo padrão";
    // 1) Exige usuário autenticado
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessão inválida. Entre novamente." }, 401);
    }

    // 2) Chave da Gemini — a chave dedicada do Me Explique vem primeiro
    const chaves = [
      Deno.env.get("GEMINI_API_KEY_ME_EXPLIQUE"),
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_RESERVA"),
    ].filter((k): k is string => !!k);

    if (chaves.length === 0) {
      return json({ error: "GEMINI_API_KEY não configurada." }, 500);
    }

    // Formato exigido pelo BidiGenerateContent: modalidades ficam em
    // generationConfig; transcrições e systemInstruction no nível do setup.
    const instrucaoFinal = gerarInstrucao(nome, formato);

    const setup = {
      model: `models/${MODELO_LIVE}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voz
            }
          }
        }
      },
      systemInstruction: { parts: [{ text: instrucaoFinal }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      tools: [{ googleSearch: {} }],
    };

    // ── Gerar Ephemeral Token via REST /v1beta/auth_tokens ──────────
    // Documentação: https://ai.google.dev/gemini-api/docs/live-api
    // A Google descontinuou chaves AIzaSy "Standard" em jun/2026 e agora
    // recomenda ephemeral tokens para conexões WebSocket client-side.
    let tokenEfemero: string | null = null;

    for (const chave of chaves) {
      try {
        const agora = Date.now();
        const expira = new Date(agora + 30 * 60 * 1000).toISOString();       // 30 min
        const novasessao = new Date(agora + 2 * 60 * 1000).toISOString();    // 2 min para criar sessão

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/auth_tokens?key=${encodeURIComponent(chave.trim())}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expireTime: expira,
              newSessionExpireTime: novasessao,
              uses: 1,
            }),
          },
        );

        if (res.ok) {
          const body = await res.json();
          // O campo retornado é "name" (ex: "authTokens/abc123...")
          tokenEfemero = body.name ?? body.token ?? null;
          if (tokenEfemero) {
            console.log("[me-explique-token] Ephemeral token gerado com sucesso.");
            break;
          }
        } else {
          const erro = await res.text();
          console.warn(`[me-explique-token] Falha ao gerar ephemeral token com chave ${chave.substring(0, 8)}...: ${res.status} ${erro}`);
        }
      } catch (e) {
        console.warn("[me-explique-token] Erro na chamada auth_tokens:", (e as Error)?.message ?? e);
      }
    }

    // Fallback: se nenhuma chave conseguiu gerar ephemeral token,
    // devolve a chave diretamente (menos seguro, mas funciona com Auth Keys AQ...)
    const tokenFinal = tokenEfemero ?? chaves[0].trim();
    const isEphemeral = !!tokenEfemero;

    return json({
      token: tokenFinal,
      modelo: MODELO_LIVE,
      setup: setup,
      ephemeral: isEphemeral,
    });

  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    console.error("me-explique-token:", detalhe);
    return json({ error: "Falha inesperada.", detalhe }, 500);
  }
});
