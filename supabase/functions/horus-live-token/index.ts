import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const MODELO_LIVE = "gemini-3.1-flash-live-preview";

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
      modo?: string;
      contexto?: string;
      userName?: string;
    };
    
    // Horus usa voz masculina amigável e conversacional
    const voz = "Puck"; 

    // Identifica o usuário e pega o histórico do WhatsApp
    const authHeader = req.headers.get("Authorization") ?? "";
    let historicoFormatado = "";
    let userName = reqBody.userName?.trim() || "";

    if (authHeader.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } },
        );
        
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.id) {
          // Tenta buscar o nome do perfil se ainda não veio no body
          if (!userName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", userData.user.id)
              .maybeSingle();
              
            if (profile?.display_name?.trim()) {
              userName = profile.display_name.trim();
            }
          }

          // Busca conta WhatsApp vinculada
          const { data: wpUser } = await supabase
            .from("horus_whatsapp_users")
            .select("phone_e164, nome_preferido, apelido, apelido_ativo")
            .eq("user_id", userData.user.id)
            .maybeSingle();

          if (wpUser) {
            if (!userName) {
              if (wpUser.apelido_ativo && wpUser.apelido?.trim()) {
                userName = wpUser.apelido.trim();
              } else if (wpUser.nome_preferido?.trim()) {
                userName = wpUser.nome_preferido.trim();
              }
            }

            if (wpUser.phone_e164) {
              // Busca histórico
              const { data: convs } = await supabase
                .from("horus_conversations")
                .select("role, content")
                .eq("phone_e164", wpUser.phone_e164)
                .order("created_at", { ascending: false })
                .limit(15);
                
              if (convs && convs.length > 0) {
                // Reverte para ordem cronológica
                convs.reverse();
                historicoFormatado = convs.map(c => 
                  `${c.role === 'user' ? (userName || 'Aluno') : 'Horus'}: ${c.content}`
                ).join('\n');
              }
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar histórico do usuario", e);
      }
    }

    if (!userName || userName.toLowerCase().includes("direito prime")) {
      userName = "Wesley";
    }

    const primeiroNome = userName.split(" ")[0];

    const instrucaoBase = `Você é o "Horus", o assistente jurídico e mentor pessoal de inteligência artificial do aplicativo Direito Prime.
Você agora está em uma ligação de voz ao vivo com o aluno ${primeiroNome}.

DIRETRIZES CRÍTICAS DE VOZ, SOTAQUE E IDIOMA (OBRIGATÓRIO):
- IDIOMA: Fale ESTRITAMENTE em Português do Brasil (pt-BR).
- SOTAQUE: Brasileiro neutro / paulistano (São Paulo, Brasil). Tom masculino acolhedor, amigável, dinâmico e focado.
- PROIBIÇÃO ABSOLUTA: NUNCA fale com sotaque de Portugal, entonação europeia ou termos lusitanos (como "estou a ouvir", "estou a falar", "fato", "ecrã", "telemóvel").
- COLOQUIALISMO NATURAL BRASILEIRO: Use expressões naturais do dia a dia no Brasil: "Alô, ${primeiroNome}! Tô te escutando", "E aí, tudo bem?", "Bora ver isso", "Pode mandar sua dúvida!".

SUA MISSÃO NA LIGAÇÃO:
1. ATENDIMENTO NATURAL EM UMA LIGAÇÃO:
   - Atenda a ligação dizendo com entusiasmo e simpatia: "Alô, ${primeiroNome}, tô te escutando! E aí, vamos tirar aquela dúvida jurídica hoje? O que manda?".
   - Seja conciso. Fale como um ser humano conversando ao telefone. Respostas curtas de 2 a 4 frases, conversacionais e diretas, dando espaço para o aluno falar.

2. DIDÁTICA E CONHECIMENTO JURÍDICO:
   - Responda qualquer dúvida de Direito de forma super didática, com analogias simples do dia a dia e sem "juridiquês" excessivo. 
   - Se perguntarem sobre OAB ou concursos, dê dicas práticas e cite os macetes da banca FGV.`;

    const instrucaoComHistorico = historicoFormatado 
      ? `${instrucaoBase}

3. HISTÓRICO RECENTE NO WHATSAPP:
Você já estava conversando com ${primeiroNome} pelo WhatsApp. O aluno te ligou agora para continuar o assunto ou tirar uma nova dúvida.
Aqui está o contexto das últimas mensagens de vocês no WhatsApp:
--- HISTÓRICO ---
${historicoFormatado}
--- FIM DO HISTÓRICO ---
Use esse contexto se ele fizer alguma referência ao que vocês estavam falando.`
      : instrucaoBase;


    const chaves = [
      Deno.env.get("GEMINI_API_KEY_ME_EXPLIQUE"),
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_RESERVA"),
    ].filter((k): k is string => !!k);

    if (chaves.length === 0) {
      return json({ error: "GEMINI_API_KEY não configurada." }, 500);
    }

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
      systemInstruction: { parts: [{ text: instrucaoComHistorico }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      tools: [{ googleSearch: {} }],
    };

    let tokenEfemero: string | null = null;
    let ultimoErro = "";

    for (const chave of chaves) {
      try {
        const agora = Date.now();
        const expira = new Date(agora + 30 * 60 * 1000).toISOString();
        const novasessao = new Date(agora + 2 * 60 * 1000).toISOString();

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
          tokenEfemero = body.token ?? body.name ?? null;
          if (tokenEfemero) break;
        } else {
          const errText = await res.text();
          ultimoErro = `HTTP ${res.status}: ${errText}`;
          console.warn("[horus-live-token] Chave falhou ao gerar token:", ultimoErro);
        }
      } catch (e: any) {
        ultimoErro = e?.message ?? String(e);
        console.warn("[horus-live-token] Exceção com chave:", ultimoErro);
      }
    }

    if (!tokenEfemero) {
      console.warn("[horus-live-token] Nenhuma chave gerou token efêmero. Usando chave padrão client-side.");
      return json({
        token: chaves[0],
        modelo: MODELO_LIVE,
        setup,
        ephemeral: false,
      });
    }

    return json({
      token: tokenEfemero,
      modelo: MODELO_LIVE,
      setup,
      ephemeral: true,
    });
  } catch (err: any) {
    console.error("[horus-live-token] Erro inesperado:", err);
    return json({ error: err?.message || "Erro interno ao gerar token da chamada." }, 500);
  }
});
