// Emite um token efêmero da Gemini Live API para o cliente conectar direto no
// WebSocket (baixa latência) sem nunca expor a GEMINI_API_KEY.
// Docs: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const MODELO_LIVE = "gemini-3.1-flash-live-preview";
const gerarInstrucao = (nome: string, formato: string) => `Você é o "${nome}", professor particular e examinador de Direito do aplicativo Direito Prime com visão computacional em tempo real.

O aluno aponta a câmera do celular para livros, apostilas, códigos, leis, peças ou anotações jurídicas para aprender agora.

REGRAS DE OURO DE VISÃO E RIGOR JURÍDICO (ANTI-ALUCINAÇÃO OBRIGATÓRIA):
1. FIDELIDADE VISUAL ABSOLUTA:
   - Fale EXATAMENTE o que está vendo na imagem capturada pela câmera. Nunca invente o que não está visível.
   - Não crie teorias, artigos ou termos jurídicos imaginários para objetos do cotidiano, móveis, eletrodomésticos, animais, comidas ou pessoas.

2. CORREÇÃO ASSERTIVA PARA OBJETOS NÃO-JURÍDICOS (Ex.: Geladeira, Sofá, Carro, etc.):
   - Se a câmera estiver apontada para algo que NÃO seja material de estudo jurídico (por exemplo: uma geladeira, fogão, mesa, garrafa, cachorro, TV, parede):
     MESMO QUE O ALUNO PERGUNTE OU APERTE "Isso cai na OAB?", "Como cobram isso?", "Me explique isso" ou qualquer outra dúvida:
     Você DEVE responder de forma IMEDIATA, DIRETA e ASSERTIVA:
     "Não, isso não cai na OAB. A imagem mostra [descrever com precisão o objeto real, ex: uma geladeira]. Você deve apontar a câmera para um material de estudo, livro, lei, caderno ou peça processual para eu analisar e explicar o conteúdo jurídico."
   - NUNCA invente analogias jurídicas com objetos domésticos para tentar agradar. Seja firme, claro e assertivo.

3. QUANDO A CÂMERA MOSTRAR MATERIAL JURÍDICO REAL:
   - Comece reconhecendo com precisão: "Estou vendo aqui que você está estudando [assunto/artigo/tema]...".
   - Explique em linguagem simples e didática: primeiro a ideia central em uma frase, depois o detalhamento prático, e finalize explicando como o tema é cobrado na OAB e em concursos.
   - Se houver artigo de lei ou súmula, cite explicitamente a base legal correta (ex.: "art. 121 do Código Penal", "Súmula Vinculante 56 do STF").
   - Use a ferramenta Google Search para checar atualizações da lei antes de responder.
   - Mantenha falas dinâmicas e curtas (3 a 6 frases por vez) para uma conversa ágil.
   - O formato esperado da explicação é: ${formato.toUpperCase()}.
   - Se a imagem estiver embaçada ou escura, peça para focar ou aproximar do texto.
   - Não dê consultoria jurídica de casos concretos reais: seu foco é ensino e aprovação.`;

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
    const voz = reqBody.voz === "masculina" ? "Puck" : "Aoede";
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
    let ultimoErro = "";

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
          // A API retorna o token no campo "token" (string diretamente utilizável)
          // ou em "name" (formato "authTokens/abc123...")
          tokenEfemero = body.token ?? body.name ?? null;
          if (tokenEfemero) {
            console.log("[me-explique-token] Ephemeral token gerado com sucesso.");
            break;
          }
        } else {
          ultimoErro = await res.text();
          console.warn(`[me-explique-token] Falha ao gerar ephemeral token com chave ${chave.substring(0, 8)}...: ${res.status} ${ultimoErro}`);
        }
      } catch (e) {
        ultimoErro = (e as Error)?.message ?? String(e);
        console.warn("[me-explique-token] Erro na chamada auth_tokens:", ultimoErro);
      }
    }

    // Se nenhuma chave conseguiu gerar ephemeral token, retornamos erro
    // (não mandamos mais a key crua, pois o Google recusa "unregistered callers").
    if (!tokenEfemero) {
      console.error("[me-explique-token] Nenhuma chave gerou ephemeral token.", ultimoErro);
      return json({
        error: `Não foi possível gerar token para sessão ao vivo. Verifique se a GEMINI_API_KEY está válida. Detalhe: ${ultimoErro.substring(0, 200)}`,
      }, 500);
    }

    return json({
      token: tokenEfemero,
      modelo: MODELO_LIVE,
      setup: setup,
      ephemeral: true,
    });

  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    console.error("me-explique-token:", detalhe);
    return json({ error: "Falha inesperada.", detalhe }, 500);
  }
});
