import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { chamarIa, GatewayError } from "../_shared/videoaulaIa.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const { transcript, question } = body || {};

    if (!transcript || !question) {
      return json({ error: "Faltando transcrição ou pergunta" }, 400);
    }

    const prompt = `Você é o "Hórus", um assistente jurídico de estudo de ponta.
O usuário estava assistindo ou gravando uma aula, cujo resumo/transcrição é o seguinte:

<transcricao>
${transcript}
</transcricao>

O usuário perguntou o seguinte sobre essa aula:
"${question}"

Sua tarefa: 
1. Responda à pergunta do usuário de forma clara, didática e focada APENAS no que foi discutido na aula (com base na transcrição acima).
2. Se a resposta não estiver na transcrição, você pode complementar com seu conhecimento jurídico geral, mas INFORME que o professor não detalhou isso no áudio.
3. Seja amigável e direto. Use linguagem de quem estuda Direito (estudante para estudante, ou tutor para aluno).

Responda:`;

    const resposta = await chamarIa({ prompt, maxTokens: 1024, temperature: 0.5 });

    return json({ answer: resposta.trim() });
  } catch (e) {
    const status = e instanceof GatewayError ? e.status : 500;
    console.error("[chat-aula]", e);
    return json({ error: (e as Error)?.message ?? String(e) }, status);
  }
});
