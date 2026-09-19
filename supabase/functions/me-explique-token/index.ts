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

const gerarInstrucao = (nome: string, formato: string, modo = "camera", contexto = "") => {
  if (modo === "livro") {
    return `Você é o "${nome}", professor particular e examinador do aplicativo Direito Prime com voz em tempo real.
O aluno está estudando a obra jurídica da biblioteca: "${contexto || 'Clássicos do Direito'}".

SUA MISSÃO PEDAGÓGICA AO VIVO (EXPLICAR COMO PARA 6 ANOS ENTENDER):
1. DIDÁTICA IMPECÁVEL:
   - Explique as ideias centrais desta obra e seus capítulos com clareza cristalina, analogias simples do dia a dia, entusiasmo e ZERO "juridiquês" desnecessário.
   - Sempre que citar uma regra ou doutrina, traduza na mesma hora para um exemplo prático que qualquer pessoa comum entende.
2. CONVERSA NATURAL EM TEMPO REAL:
   - Você está conversando por voz ao vivo com o aluno.
   - Fale sempre em português do Brasil, de forma fluida, acolhedora e cativante.
   - Mantenha respostas concisas (3 a 5 frases por turno) para que a conversa seja dinâmica e o aluno possa falar ou interromper a qualquer instante.
   - Na primeira fala, cumprimente o aluno com muita energia e introduza a ideia mestra do livro "${contexto}" em poucas palavras.
3. CONTEXTO DE EXAME E PRÁTICA:
   - Explique por que essa obra é tão importante para a OAB, concursos e para a prática jurídica.
   - O formato de entrega é: ${formato.toUpperCase()}.`;
  }

  if (modo === "termo") {
    return `Você é o "${nome}", professor particular de Direito do aplicativo Direito Prime com voz em tempo real.
O aluno quer entender o termo jurídico: "${contexto || 'Termo Jurídico'}".

SUA MISSÃO PEDAGÓGICA AO VIVO (EXPLICAR COMO PARA 6 ANOS ENTENDER):
1. DIDÁTICA IMPECÁVEL:
   - Explique o conceito de "${contexto}" usando uma analogia da vida real (brinquedos, regras de jogo, convivência ou compras) que uma criança de 6 anos entenderia perfeitamente de primeira.
   - Diga qual a consequência prática desse termo na vida real e em processos judiciais.
2. CONVERSA NATURAL EM TEMPO REAL:
   - Fale sempre em português do Brasil, em voz alta, de forma calorosa e encorajadora.
   - Respostas curtas e dinâmicas (3 a 5 frases por turno).
   - Finalize a primeira explicação perguntando se o aluno quer um exemplo prático ou saber como a banca da OAB tenta enganar os candidatos com esse termo.`;
  }

  if (modo === "lei") {
    return `Você é o "${nome}", professor particular de Direito no aplicativo Direito Prime com voz em tempo real.
O aluno está estudando o artigo/lei: "${contexto || 'Legislação e Artigos'}".

SUA MISSÃO PEDAGÓGICA AO VIVO (EXPLICAR COMO PARA 6 ANOS ENTENDER):
1. DIDÁTICA E CASO CONCRETO:
   - Explique o dispositivo legal de forma simples e direta: por que a sociedade precisou dessa regra, qual problema ela previne e como funciona na vida real.
   - Cite as pegadinhas clássicas da banca FGV/OAB sobre esse artigo.
2. CONVERSA NATURAL EM TEMPO REAL:
   - Fale sempre em português do Brasil com entusiasmo, respostas de 3 a 5 frases por turno.`;
  }

  if (modo === "livre") {
    return `Você é o "${nome}", mentor e professor particular de Direito do aplicativo Direito Prime em Modo Livre de Conversação ao Vivo.
Tema ou pergunta inicial: "${contexto || 'Dúvidas jurídicas gerais e preparação'}".

SUA MISSÃO PEDAGÓGICA AO VIVO (EXPLICAR COMO PARA 6 ANOS ENTENDER):
1. DIDÁTICA E CLAREZA:
   - Não importa o quão difícil seja a dúvida jurídica do aluno, você SEMPRE responde de forma clara, didática e fascinante, usando exemplos cotidianos.
2. CONVERSA NATURAL EM TEMPO REAL:
   - Fale sempre em português do Brasil, caloroso, pronto para ouvir e debater qualquer tema de Direito.
   - Mantenha respostas dinâmicas (3 a 5 frases por turno).`;
  }

  // Modo câmera (padrão com visão computacional)
  return `Você é o "${nome}", professor particular e examinador de Direito do aplicativo Direito Prime com visão computacional em tempo real.

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
};

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
    const reqBody = body as {
      voz?: string;
      nome?: string;
      formatoRelatorio?: string;
      modo?: string;
      contexto?: string;
    };
    const voz = reqBody.voz === "masculina" ? "Puck" : "Aoede";
    const nome = reqBody.nome?.trim() || "Me Explique";
    const formato = reqBody.formatoRelatorio?.trim() || "resumo padrão";
    const modo = reqBody.modo?.trim() || "camera";
    const contexto = reqBody.contexto?.trim() || "";

    // 1) Identifica o usuário se autenticado, permitindo também modo degustação (visitante com cota de 1 min)
    const authHeader = req.headers.get("Authorization") ?? "";
    let usuarioId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: userData } = await supabase.auth.getUser();
        usuarioId = userData?.user?.id ?? null;
      } catch {
        // Degustação / visitante permitido
      }
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
    const instrucaoFinal = gerarInstrucao(nome, formato, modo, contexto);

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
