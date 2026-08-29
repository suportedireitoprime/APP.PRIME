import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
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
    if (!body) return json({ error: "Body não fornecido" }, 400);

    const { area, tema, tempoDiario, duracao, formato } = body;

    if (!area || !tema) {
      return json({ error: "Área e Tema são obrigatórios" }, 400);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessão inválida. Entre novamente." }, 401);
    }

    const sistema = `Você é um mentor especialista em planejamento de estudos para concursos públicos e exame da OAB.
Sua missão é criar um cronograma de estudos detalhado e eficiente em formato Markdown.`;

    let instrucaoFormato = "";
    if (formato === "integrado") {
      instrucaoFormato = `O usuário utiliza o aplicativo "Direito Prime", que possui todo o vade mecum, constituição, súmulas, jurisprudências e videoaulas curtas. Indique no plano para ele consultar as Leis, Súmulas e realizar anotações direto no aplicativo. Seja específico em quais leis ou súmulas ele deve buscar no aplicativo para este tema.`;
    } else {
      instrucaoFormato = `Crie o plano em um formato de cronograma diário ou semanal direto ao ponto.`;
    }

    const prompt = `Crie um Plano de Estudos personalizado com os seguintes parâmetros:
- Área do Direito: ${area}
- Tema/Assunto: ${tema}
- Tempo Disponível por dia: ${tempoDiario}
- Duração do Plano: ${duracao}

${instrucaoFormato}

Estrutura esperada (tudo em Markdown bem formatado):
# Plano de Estudos: ${tema}
(breve introdução motivacional)

## Metas e Estratégia
(explicação de como distribuir as horas)

## Cronograma (dividido por ciclo ou dias)
(detalhamento do que estudar em cada momento)

## Dicas Finais
(dicas de revisão ou exercícios)

IMPORTANTE: Responda APENAS com o Markdown do plano, sem formatações extras fora do texto.`;

    const markdown = await chamarIa({
      system: sistema,
      prompt: prompt,
      json: false,
      maxTokens: 4096,
      temperature: 0.7,
    });

    return json({ markdown });
  } catch (e) {
    const status = e instanceof GatewayError ? e.status : 500;
    console.error("[plano-estudos-gerar]", e);
    return json({ error: (e as Error)?.message ?? String(e) }, status);
  }
});
