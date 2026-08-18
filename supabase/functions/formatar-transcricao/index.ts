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
    const text = String(body?.text || "");

    if (!text || text.length < 10) {
      return json({ error: "Texto muito curto ou ausente" }, 400);
    }

    const prompt = `Você é um excelente revisor jurídico e assistente de redação.
Abaixo está a transcrição bruta de uma fala (ditado por voz) de uma aula ou anotação jurídica.
Esta transcrição foi gerada por um motor de reconhecimento de fala em tempo real, portanto, não tem pontuação, não tem parágrafos e pode conter pequenos erros de reconhecimento.

Sua tarefa:
1. Adicionar pontuação correta (vírgulas, pontos, interrogações).
2. Formatar em parágrafos para facilitar a leitura.
3. Corrigir eventuais erros de digitação óbvios e ajustar palavras jurídicas que o motor possa ter entendido errado.
4. MANTER O SENTIDO e as palavras originais sempre que possível. Não reescreva como um resumo, apenas formate e pontue a transcrição para virar um texto limpo e culto.

Texto bruto:
"""
${text}
"""

Responda APENAS com o texto formatado final. Sem introdução ou conclusão.`;

    const textoFormatado = await chamarIa({ prompt, maxTokens: 4096, temperature: 0.3 });

    return json({ text: textoFormatado.trim() });
  } catch (e) {
    const status = e instanceof GatewayError ? e.status : 500;
    console.error("[formatar-transcricao]", e);
    return json({ error: (e as Error)?.message ?? String(e) }, status);
  }
});
