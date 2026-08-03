// Cria a estrutura de pastas no Google Drive e grava os prompts de cada tipo.
import { ensureTree, upsertTextFile } from "../_shared/googleDrive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PROMPTS: Record<string, { arquivo: string; texto: string }[]> = {
  "Prompts/Apresentacoes": [
    {
      arquivo: "PROMPT-apresentacao-narrada.txt",
      texto: `PROMPT — APRESENTAÇÃO NARRADA (Direito Prime)

Crie uma apresentação narrada sobre: {TEMA}

Regras:
- 8 a 14 slides, cada um com: título curto (até 6 palavras), 3 a 5 bullets objetivos e um parágrafo de narração (60 a 90 palavras).
- Linguagem técnica-jurídica acessível, português do Brasil.
- Cite artigos de lei e súmulas quando houver base legal.
- Encerre com um slide de revisão em forma de checklist.

Formato de saída: JSON
{"titulo":"...","descricao":"...","slides":[{"titulo":"...","bullets":["..."],"narracao":"..."}]}

Depois de gerar o áudio/vídeo, salve o arquivo na pasta e cole o link na fila do admin (tipo: apresentacao).`,
    },
  ],
  "Prompts/Audioaulas": [
    {
      arquivo: "PROMPT-audioaula.txt",
      texto: `PROMPT — AUDIOAULA (Direito Prime)

Escreva o roteiro de uma audioaula sobre: {TEMA}

Regras:
- Duração alvo: 8 a 12 minutos de narração contínua (1200 a 1800 palavras).
- Abertura com gancho de 2 frases, desenvolvimento em blocos numerados e fechamento com resumo em 5 pontos.
- Sempre citar o dispositivo legal ao explicar um instituto.
- Sem marcações de cena, sem colchetes: apenas texto para ser lido em voz alta.

Formato de saída: texto corrido, com títulos de bloco em linha própria.

Depois de gerar o áudio, salve o MP3 na pasta e cole o link na fila do admin (tipo: audioaula).`,
    },
  ],
  "Prompts/Leis-Cantadas": [
    {
      arquivo: "PROMPT-lei-cantada.txt",
      texto: `PROMPT — LEI CANTADA (Direito Prime)

Transforme o texto legal abaixo em letra de música memorizável.

Texto: {ARTIGO}
Melodia/estilo: {MELODIA}

Regras:
- Refrão curto e repetível com o número do artigo.
- 2 a 4 estrofes, mantendo os termos técnicos exatos (não parafraseie prazos, penas e requisitos).
- Métrica constante; rimas simples.
- Não invente conteúdo que não esteja no dispositivo.

Formato de saída: letra pronta para cantar, com [Refrão] e [Estrofe N] marcados.

Depois de gerar o áudio, salve o MP3 na pasta e cole o link na fila do admin (tipo: lei_cantada).`,
    },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const ids = await ensureTree();
    let prompts = 0;
    for (const [pasta, arquivos] of Object.entries(PROMPTS)) {
      const parent = ids[pasta];
      if (!parent) continue;
      for (const a of arquivos) {
        await upsertTextFile(a.arquivo, parent, a.texto);
        prompts++;
      }
    }
    return json({ ok: true, pastas: ids, prompts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("drive-bootstrap:", msg);
    return json({ error: msg }, 500);
  }
});
