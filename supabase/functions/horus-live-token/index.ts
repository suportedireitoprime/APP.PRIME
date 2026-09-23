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
    };
    
    // Horus usa voz masculina sempre ("Puck" = voz grave da OpenAI / Gemini, ou "Aoede")
    const voz = "Puck"; 

    // Identifica o usuário e pega o histórico do WhatsApp
    const authHeader = req.headers.get("Authorization") ?? "";
    let historicoFormatado = "";
    let userName = "Aluno";

    if (authHeader.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } },
        );
        
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.id) {
          // Tenta buscar o nome do perfil
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, nome")
            .eq("id", userData.user.id)
            .single();
            
          if (profile) {
            userName = profile.apelido || profile.nome || profile.full_name?.split(' ')[0] || "Aluno";
          }
          
          // Busca conta WhatsApp vinculada
          const { data: wpUser } = await supabase
            .from("horus_whatsapp_users")
            .select("phone_e164")
            .eq("linked_user_id", userData.user.id)
            .single();

          if (wpUser?.phone_e164) {
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
                `${c.role === 'user' ? userName : 'Horus'}: ${c.content}`
              ).join('\n');
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar histórico do usuario", e);
      }
    }

    const instrucaoBase = `Você é o "Horus", o assistente jurídico e mentor pessoal de inteligência artificial do aplicativo Direito Prime.
Você agora está em uma ligação de voz ao vivo com o aluno ${userName}.

SUA MISSÃO NA LIGAÇÃO:
1. ATENDIMENTO NATURAL:
   - Atenda a ligação dizendo algo como "Alô, tô te escutando" ou "Alô, ${userName}, como posso ajudar hoje?", com voz masculina, acolhedora e inteligente.
   - Aja como um humano em uma ligação. Não faça discursos longos. 
   - Fale sempre em português do Brasil. Respostas curtas e conversacionais.

2. DIDÁTICA E CONHECIMENTO JURÍDICO:
   - Responda qualquer dúvida de Direito de forma super didática, sem "juridiquês" excessivo. 
   - Se perguntarem sobre OAB ou concursos, dê dicas práticas.`;

    const instrucaoComHistorico = historicoFormatado 
      ? `${instrucaoBase}

3. HISTÓRICO RECENTE NO WHATSAPP:
Você já estava conversando com ${userName} pelo WhatsApp. O aluno te ligou agora para continuar o assunto ou tirar uma nova dúvida.
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
          ultimoErro = await res.text();
        }
      } catch (e) {
        ultimoErro = (e as Error)?.message ?? String(e);
      }
    }

    if (!tokenEfemero) {
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
    return json({ error: "Falha inesperada.", detalhe }, 500);
  }
});
