// Gera uma AULA RICA a partir de uma sugestão de sumário (aprender_sumario_sugerido).
// - Usa APENAS o conteúdo do livro (biblioteca_leitura_nativa) como base.
// - Produz blocos ricos: leitura (markdown), citacao, artigo_lei, tabela,
//   mapa_mental, linha_tempo, destaque, pergunta, flashcard, conexao.


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = new Set(["wn7corporation@gmail.com", "suporte.vacatio@gmail.com", "wn7juridico@gmail.com"]);
// v8 — leitura nativa usa SOMENTE a GEMINI_API_KEY direta, via Gemini native API.
// (redeploy forçado: build antiga ainda usava Lovable AI Gateway)
const geminiKey = () => (Deno.env.get("GEMINI_API_KEY") ?? "").trim();
const MODEL = "gemini-3.1-flash-lite";
const MODELS = ["gemini-3.1-flash-lite", "gemini-3.1-flash-lite"];
const PROVIDER = "gemini-direto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Aceita JSON puro, JSON dentro de ```fences``` e JSON TRUNCADO (resposta cortada
 * por limite de tokens): nesse caso corta no último bloco completo do array
 * "blocos" e fecha as chaves, preservando o que já foi gerado.
 */
function salvageJson(raw: unknown): any {
  let text = String(raw ?? "").trim();
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  if (start > 0) text = text.slice(start);
  try { return JSON.parse(text); } catch { /* segue para o resgate */ }

  // Resgate de truncamento: mantém apenas objetos completos dentro de "blocos".
  const key = text.indexOf('"blocos"');
  if (key === -1) return null;
  const arrStart = text.indexOf("[", key);
  if (arrStart === -1) return null;
  let depth = 0, inStr = false, esc = false, lastComplete = -1;
  for (let i = arrStart + 1; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) lastComplete = i; }
  }
  if (lastComplete === -1) return null;
  const head = text.slice(0, arrStart + 1);
  const items = text.slice(arrStart + 1, lastComplete + 1);
  try { return JSON.parse(`${head}${items}]}`); } catch { return null; }
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} ausente`);
  return value;
}

/**
 * Corrige markdown desbalanceado gerado por IA (asteriscos extras, espaços
 * dentro dos marcadores etc.) antes de salvar no banco.
 */
function normalizarMarkdown(md: string): string {
  if (!md) return "";
  let text = md;
  text = text.replace(/(^|[\s([{"'—–-])\*\*\s+([^*\n]+?)\s+\*\*(?![\w])/g, "$1**$2**");
  text = text.replace(/(^|[\s([{"'—–-])\*\s+([^*\n]+?)\s+\*(?![\w*])/g, "$1*$2*");
  text = text.replace(/\*{3,}([^*\n]+?)\*{2,}/g, "**$1**");
  text = text.replace(/(^|[^\w*])\*\*([^*\n]+?)\*(?!\*)/g, "$1**$2**");
  text = text.replace(/(^|[^\w*])\*([^*\n]+?)\*\*(?!\*)/g, "$1*$2*");
  text = text.replace(/^(\*\s+)\*\*([^:\n]+?):\*\*/gm, "$1**$2:**");
  return text;
}

const SYSTEM_PROMPT = `Você é um PROFESSOR DE DIREITO carismático criando uma AULA para um app de estudo mobile.
Você não escreve um texto acadêmico: você CONVERSA com o aluno, como se estivesse ao lado dele explicando no quadro.

Você recebe:
- Título e resumo da aula
- O TRECHO DO CAPÍTULO correspondente no LIVRO base (fonte única de verdade)

VOZ E TOM (obrigatório):
- Fale em 2ª pessoa: "repare que…", "na prática, o que acontece é…", "vou te mostrar por quê".
- Traduza o juridiquês. Nada de parágrafo seco e enciclopédico.
- Use analogias do cotidiano (fila do banco, condomínio, grupo de WhatsApp) para destravar conceitos.
- Use micro-histórias com personagem ("Joana, delegada de plantão…") — mas NUNCA invente lei,
  jurisprudência, autor, número de artigo ou dado que não esteja no livro.

A AULA TEM 3 ATOS (obrigatório). Todo bloco declara a que ato pertence no campo "ato":
- "fundamentos"   → o que é, por que existe, vocabulário mínimo
- "aprofundamento"→ distinções, exceções, aplicação prática, comparações
- "fixacao"       → consolidação, dinâmicas, síntese
Os blocos devem vir NA ORDEM dos atos (todos de fundamentos, depois aprofundamento, depois fixação).

RITMO (obrigatório):
- NUNCA mais de 2 blocos "leitura" seguidos. Sempre intercale com um visual (tabela, mapa, fluxograma,
  linha do tempo, destaque) ou uma dinâmica (ordenacao, conexao, cena_animada).
- Ao terminar cada ato, insira um bloco "checkpoint".
- O último bloco da aula é sempre "recapitulacao".

Devolva UM JSON com esta estrutura EXATA:
{
  "titulo": "string até 100 chars",
  "objetivo": "1 frase",
  "duracao_est_min": inteiro entre 15 e 50,
  "previa": {
    "porque_importa": "1 parágrafo curto, humano, dizendo por que vale a pena estudar isso",
    "topicos": [ "3 a 5 tópicos curtos do que será abordado" ],
    "ao_final": [ "3 frases curtas: o que o aluno saberá fazer ao final" ]
  },
  "glossario": [ { "termo":"...", "definicao":"até 20 palavras, com as palavras do livro" } ],
  "blocos": [ ...entre 18 e 26 blocos ordenados, cada um com "ato"... ]
}

TIPOS DE BLOCO PERMITIDOS (varie, intercale teoria com dinâmica):

1) "leitura" — EXPLICAÇÃO DIDÁTICA E APROFUNDADA. O aluno aprende a teoria completa com fluidez.
   { "tipo":"leitura", "ato":"fundamentos", "payload": {
       "titulo":"opcional",
       "conteudo":"markdown da explicação COMPLETA — 3 a 5 parágrafos bem explicados, cobrindo com clareza os conceitos jurídicos, fundamentos e doutrina contidos no livro",
       "em_portugues_claro":"explicação direta e didática do conceito em linguagem do dia a dia",
       "exemplo":"caso concreto explicativo e detalhado com personagens e contexto realista (3-5 frases)",
       "pegadinha":"explicação detalhada de onde os alunos erram em provas (OAB/concursos) e pegadinhas com justificativa jurídica"
   } }
   Os campos em_portugues_claro, exemplo e pegadinha são OBRIGATÓRIOS sempre que o conceito for técnico.
   REGRAS DE FORMATAÇÃO DO MARKDOWN:
   - Negrito: EXATAMENTE dois asteriscos: **palavra**. Nunca três.
   - Itálico: EXATAMENTE um asterisco: *palavra*.
   - Listas: linha começando com "* " e depois "* **Termo**: explicação".
   - Sem espaços entre os asteriscos e o texto: **palavra**, nunca ** palavra **.

2) "citacao" — citação REAL do LIVRO.
   { "tipo":"citacao", "ato":"...", "payload": { "texto":"...", "autor":"Nome (Obra, ano)" } }

3) "artigo_lei" — transcrição de artigo mencionado no livro.
   { "tipo":"artigo_lei", "ato":"...", "payload": { "lei":"CF/88", "numero":"5º, LIV", "texto":"..." } }

4) "tabela" — comparativa. MÁXIMO 3 COLUNAS e 5 linhas (é lido em tela de celular).
   Cada célula com no máximo 10 palavras. Títulos de coluna de 1-2 palavras.
   { "tipo":"tabela", "ato":"...", "payload": { "titulo":"opcional", "colunas":["A","B","C"], "linhas":[["...","...","..."]] } }

5) "mapa_mental" — hierárquico. MÁX. 5 ramos, cada ramo com até 4 itens {termo, definicao}.
   { "tipo":"mapa_mental", "ato":"...", "payload": {
       "raiz":"Tema central (2-4 palavras)",
       "definicao_raiz":"1 frase",
       "ramos":[ { "titulo":"...", "definicao":"...", "itens":[ { "termo":"...", "definicao":"..." } ] } ]
   } }

6) "mapa_conceitual" — nós ligados por RELAÇÕES rotuladas. MÁX. 8 nós.
   { "tipo":"mapa_conceitual", "ato":"...", "payload": {
       "titulo":"opcional",
       "nos":[ { "id":"a", "rotulo":"Ato administrativo", "definicao":"opcional 1 linha" } ],
       "arestas":[ { "de":"a", "para":"b", "relacao":"pressupõe" } ]
   } }

7) "fluxograma" — etapas sequenciais (máx. 7). Tipos "inicio"|"processo"|"decisao"|"fim".
   { "tipo":"fluxograma", "ato":"...", "payload": { "titulo":"opcional",
       "etapas":[ { "n":1, "titulo":"...", "descricao":"...", "tipo":"inicio" } ] } }

8) "linha_tempo" — eventos ordenados (evolução histórica/legislativa). Máx. 6.
   { "tipo":"linha_tempo", "ato":"...", "payload": { "titulo":"opcional",
       "eventos":[ { "marco":"1988", "titulo":"CF/88", "descricao":"..." } ] } }

9) "destaque" — box de atenção curto (até 45 palavras). Use MUITO.
   { "tipo":"destaque", "ato":"...", "payload": { "tom":"info|alerta|dica", "titulo":"opcional", "texto":"..." } }

10) "ordenacao" — o aluno coloca itens NA ORDEM CORRETA (fases, hierarquia, passos). 4-5 itens.
    { "tipo":"ordenacao", "ato":"...", "payload": {
        "titulo":"Ex.: Ordem das fases do processo administrativo",
        "instrucao":"Coloque na ordem correta",
        "itens":[ { "id":"1","texto":"Instauração" } ],
        "ordem_correta":["1","2","3","4"],
        "explicacao":"Por que essa é a ordem"
    } }

11) "cena_animada" — MINI VÍDEO educativo: narrativa curta com personagem em situação prática.
    ENTRE 4 E 6 CENAS. Cada cena: título curto, narração de 1-2 frases, visual esquemático e duracao_ms (3000-6000).
    { "tipo":"cena_animada", "ato":"...", "payload": {
        "titulo":"O caso do Joãozinho",
        "personagens":[ { "id":"joao", "nome":"Joãozinho", "papel":"servidor público" } ],
        "cenas":[
          { "n":1, "titulo":"O ato irregular", "narracao":"Joãozinho recebe uma ordem…",
            "visual":{ "tipo":"dialogo", "elementos":[ { "ator":"chefe", "fala":"Faça isso agora." } ] },
            "duracao_ms":4500 }
        ],
        "moral":"Regra prática de ouro em 1 frase"
    } }

12) "conexao" — jogo de associação. MÁX. 4 pares. Termo até 3 palavras. Definição até 10 palavras,
    autoexplicativa e que só sirva para aquele termo. Cada par traz "explicacao" (por que casa).
    { "tipo":"conexao", "ato":"fixacao", "payload": { "instrucao":"Toque no termo e depois na definição correspondente.",
      "pares":[ {"termo":"...","definicao":"...","explicacao":"..."} ] } }

13) "checkpoint" — PARADA DE CONSOLIDAÇÃO ao final de cada ato. Serve para o aluno respirar e conferir.
    { "tipo":"checkpoint", "ato":"fundamentos", "payload": {
        "titulo":"Até aqui você já sabe",
        "aprendeu":[ "3 frases curtas do que ficou claro no ato" ],
        "pergunta_reflexiva":"1 pergunta aberta para o aluno responder mentalmente",
        "proximo":"1 frase adiantando o que vem no próximo ato"
    } }

14) "recapitulacao" — ÚLTIMO bloco da aula.
    { "tipo":"recapitulacao", "ato":"fixacao", "payload": {
        "titulo":"O que fica",
        "pontos":[ "5 frases-chave, cada uma autossuficiente, boas para revisar depois" ],
        "regra_de_ouro":"1 frase que resume a aula inteira"
    } }

COMPOSIÇÃO OBRIGATÓRIA DA AULA (18-26 blocos):
- Ato 1 (fundamentos): abre com "leitura" de contexto; MÍN. 3 leituras; 1 visual; fecha com "checkpoint".
- Ato 2 (aprofundamento): MÍN. 3 leituras; OBRIGATÓRIO 1 "tabela", 1 "mapa_mental" e 1 "fluxograma"
  (ou "linha_tempo" quando o capítulo for histórico); fecha com "checkpoint".
- Ato 3 (fixacao): OBRIGATÓRIO 1 "cena_animada", 1 "ordenacao", 1 "conexao", 1 "mapa_conceitual";
  fecha com "checkpoint" e depois "recapitulacao".
- Pelo menos 3 blocos "destaque" espalhados.
- "citacao" e "artigo_lei" sempre que o livro trouxer.
- NÃO gere blocos "flashcard" nem "pergunta" — serão criados em etapa separada.

PT-BR jurídico, didático, elegante e ENVOLVENTE. Responda APENAS com o JSON, sem texto fora.`;

/** Palavras de um texto (aproximação suficiente para os limites de layout). */
function palavras(s: string): string[] {
  return String(s ?? "").trim().split(/\s+/).filter(Boolean);
}

function cortarPalavras(s: string, max: number): string {
  const w = palavras(s);
  return w.length <= max ? String(s ?? "").trim() : `${w.slice(0, max).join(" ")}…`;
}

/**
 * Recorta do markdown do livro o trecho do capítulo desta aula.
 * Procura o título do capítulo (ou o capitulo_ref) entre os cabeçalhos markdown
 * e devolve tudo até o próximo cabeçalho de mesmo nível. Se não achar, devolve
 * uma janela proporcional à ordem do capítulo em vez do começo do livro.
 */
function recortarCapitulo(
  md: string,
  opts: { titulo?: string | null; capituloRef?: string | null; ordem?: number | null; totalCaps?: number | null },
): { trecho: string; modo: string } {
  const texto = String(md ?? "");
  if (!texto.trim()) return { trecho: "", modo: "vazio" };

  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const linhas = texto.split("\n");
  const heads: { i: number; nivel: number; texto: string }[] = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(/^(#{1,4})\s+(.+)$/);
    if (m) heads.push({ i, nivel: m[1].length, texto: m[2].trim() });
  }

  const alvos = [opts.capituloRef, opts.titulo].map((s) => norm(String(s ?? ""))).filter((s) => s.length >= 4);
  if (heads.length && alvos.length) {
    for (const alvo of alvos) {
      const idx = heads.findIndex((h) => {
        const hn = norm(h.texto);
        return hn.includes(alvo) || alvo.includes(hn);
      });
      if (idx >= 0) {
        const inicio = heads[idx];
        const fim = heads.slice(idx + 1).find((h) => h.nivel <= inicio.nivel);
        const trecho = linhas.slice(inicio.i, fim ? fim.i : linhas.length).join("\n").slice(0, 90000);
        if (palavras(trecho).length > 120) return { trecho, modo: "capitulo" };
      }
    }
  }

  // Fallback: janela proporcional à posição do capítulo dentro do livro.
  const total = Math.max(1, Number(opts.totalCaps) || 0);
  const ordem = Math.max(0, Number(opts.ordem) || 0);
  if (total > 1 && texto.length > 60000) {
    const fatia = Math.ceil(texto.length / total);
    const ini = Math.max(0, ordem * fatia - 2000);
    return { trecho: texto.slice(ini, ini + Math.max(fatia + 4000, 40000)), modo: "janela" };
  }
  return { trecho: texto.slice(0, 60000), modo: "inicio" };
}

const ATOS = new Set(["fundamentos", "aprofundamento", "fixacao"]);

function normalizarAto(v: unknown): string {
  const s = String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return ATOS.has(s) ? s : "";
}

/** Quebra parágrafos muito longos em blocos menores quando extremamente extensos. */
function quebrarParagrafos(md: string, maxPalavras = 180): string {
  return String(md ?? "")
    .split(/\n{2,}/)
    .map((par) => {
      if (par.trimStart().startsWith("#") || /^\s*[*\->|]/.test(par)) return par;
      const w = palavras(par);
      if (w.length <= maxPalavras) return par;
      const frases = par.split(/(?<=[.!?])\s+/);
      const out: string[] = [];
      let buf: string[] = [];
      let count = 0;
      for (const f of frases) {
        buf.push(f);
        count += palavras(f).length;
        if (count >= Math.floor(maxPalavras * 0.7)) {
          out.push(buf.join(" "));
          buf = [];
          count = 0;
        }
      }
      if (buf.length) out.push(buf.join(" "));
      return out.join("\n\n");
    })
    .join("\n\n");
}

/**
 * Garante que nenhum bloco estoure o layout mobile, independentemente do que a IA
 * devolveu. Também normaliza o markdown e o campo "ato".
 */
function sanitizarBlocos(blocos: any[]): any[] {
  let atoCorrente = "fundamentos";
  const out: any[] = [];
  for (const b of blocos) {
    if (!b || typeof b !== "object") continue;
    const tipo = String(b.tipo ?? "leitura").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const p = (b.payload && typeof b.payload === "object") ? b.payload : {};
    const ato = normalizarAto(b.ato ?? p.ato) || atoCorrente;
    atoCorrente = ato;

    if (tipo === "leitura") {
      p.conteudo = quebrarParagrafos(normalizarMarkdown(String(p.conteudo ?? "")));
      for (const k of ["em_portugues_claro", "exemplo", "pegadinha"]) {
        if (p[k]) p[k] = normalizarMarkdown(String(p[k]));
      }
    }

    if (tipo === "tabela") {
      const colunas = (Array.isArray(p.colunas) ? p.colunas : []).map((c: any) => cortarPalavras(String(c ?? ""), 5));
      const manter = Math.min(3, colunas.length || 3);
      const cortadas = colunas.slice(manter);
      p.colunas = colunas.slice(0, manter);
      const linhas = (Array.isArray(p.linhas) ? p.linhas : []).slice(0, 6);
      const notas: string[] = [];
      p.linhas = linhas.map((row: any) => {
        const cells = (Array.isArray(row) ? row : [row]).map((c: any) => String(c ?? ""));
        cortadas.forEach((c: string, i: number) => {
          const extra = cells[manter + i];
          if (extra) notas.push(`**${c}** — ${extra}`);
        });
        return cells.slice(0, manter).map((c) => cortarPalavras(c, 30));
      });
      if (notas.length) p.observacoes = notas.slice(0, 6);
    }

    if (tipo === "mapa_mental") {
      p.ramos = (Array.isArray(p.ramos) ? p.ramos : []).slice(0, 5).map((r: any) => ({
        ...r,
        itens: (Array.isArray(r?.itens) ? r.itens : []).slice(0, 4),
      }));
    }

    if (tipo === "mapa_conceitual") {
      const nos = (Array.isArray(p.nos) ? p.nos : []).slice(0, 8);
      const ids = new Set(nos.map((n: any) => String(n?.id ?? "")));
      p.nos = nos;
      p.arestas = (Array.isArray(p.arestas) ? p.arestas : [])
        .filter((a: any) => ids.has(String(a?.de ?? "")) && ids.has(String(a?.para ?? "")));
    }

    if (tipo === "cena_animada") {
      p.cenas = (Array.isArray(p.cenas) ? p.cenas : []).slice(0, 6).map((c: any, i: number) => ({ ...c, n: i + 1 }));
    }

    if (tipo === "fluxograma") p.etapas = (Array.isArray(p.etapas) ? p.etapas : []).slice(0, 7);
    if (tipo === "linha_tempo") p.eventos = (Array.isArray(p.eventos) ? p.eventos : []).slice(0, 6);
    if (tipo === "conexao") p.pares = (Array.isArray(p.pares) ? p.pares : []).slice(0, 4);
    if (tipo === "ordenacao") {
      const itens = (Array.isArray(p.itens) ? p.itens : []).slice(0, 5);
      const ids = new Set(itens.map((it: any) => String(it?.id ?? "")));
      p.itens = itens;
      p.ordem_correta = (Array.isArray(p.ordem_correta) ? p.ordem_correta : [])
        .map((x: any) => String(x)).filter((x: string) => ids.has(x));
    }
    if (tipo === "destaque" && p.texto) p.texto = cortarPalavras(String(p.texto), 150);
    if (tipo === "checkpoint") p.aprendeu = (Array.isArray(p.aprendeu) ? p.aprendeu : []).slice(0, 4);
    if (tipo === "recapitulacao") p.pontos = (Array.isArray(p.pontos) ? p.pontos : []).slice(0, 6);

    p.ato = ato;
    out.push({ ...b, tipo, payload: p });
  }

  // Impede 3+ leituras seguidas: intercala destaques já existentes mais adiante.
  for (let i = 2; i < out.length; i++) {
    if (out[i].tipo === "leitura" && out[i - 1].tipo === "leitura" && out[i - 2].tipo === "leitura") {
      const j = out.findIndex((b, k) => k > i && ["destaque", "tabela", "mapa_mental", "linha_tempo"].includes(b.tipo));
      if (j > -1) {
        const [mov] = out.splice(j, 1);
        out.splice(i, 0, mov);
      }
    }
  }
  return out;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
    const currentGeminiKey = geminiKey();
    if (!currentGeminiKey) return json({ error: "GEMINI_API_KEY ausente. Salve sua chave do Gemini nos secrets do projeto." }, 500);
    console.log(`[gerar-aula-do-livro] provedor=${PROVIDER} modelo=${MODEL}`);



    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "não autenticado" }, 401);
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userRes, error: userErr } = await authClient.auth.getUser();
    if (userErr) return json({ error: "token inválido" }, 401);
    const email = userRes?.user?.email?.toLowerCase();
    const solicitanteId = userRes?.user?.id ?? null;
    // Geração sob demanda: qualquer usuário autenticado pode gerar a aula.
    if (!email) return json({ error: "não autenticado" }, 401);


    const body = await req.json().catch(() => null);
    const sumario_id = typeof body?.sumario_id === "string" ? body.sumario_id : "";
    const requestedAreaId = typeof body?.area_id === "string" ? body.area_id : "";
    if (!UUID_RE.test(sumario_id)) return json({ error: "sumario_id obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sug, error: sErr } = await admin
      .from("aprender_sumario_sugerido")
      .select("id, livro_id, area_id, ordem, titulo_melhorado, resumo_capitulo, capitulo_ref")
      .eq("id", sumario_id)
      .maybeSingle();
    if (sErr || !sug) return json({ error: "sugestão não encontrada" }, 404);

    const { data: livro } = await admin
      .from("biblioteca_leitura_nativa")
      .select("livro_id, livro_tabela, conteudo_md_refinado, conteudo_md")
      .eq("id", sug.livro_id)
      .maybeSingle();
    const mdCompleto = String(livro?.conteudo_md_refinado || livro?.conteudo_md || "");

    // Quantos capítulos esse livro tem no sumário (para o fallback de janela)
    const { count: totalCaps } = await admin
      .from("aprender_sumario_sugerido")
      .select("id", { count: "exact", head: true })
      .eq("livro_id", sug.livro_id);

    // Aulas vizinhas — dão continuidade narrativa ("na aula passada você viu…")
    const { data: vizinhos } = await admin
      .from("aprender_sumario_sugerido")
      .select("ordem, titulo_melhorado")
      .eq("livro_id", sug.livro_id)
      .in("ordem", [Number(sug.ordem) - 1, Number(sug.ordem) + 1]);
    const anterior = (vizinhos ?? []).find((v: any) => Number(v.ordem) === Number(sug.ordem) - 1);
    const proxima = (vizinhos ?? []).find((v: any) => Number(v.ordem) === Number(sug.ordem) + 1);

    const { trecho: conteudoLivro, modo: modoRecorte } = recortarCapitulo(mdCompleto, {
      titulo: sug.titulo_melhorado,
      capituloRef: sug.capitulo_ref,
      ordem: sug.ordem,
      totalCaps: totalCaps ?? null,
    });
    console.log(`[gerar-aula-do-livro] recorte=${modoRecorte}; chars=${conteudoLivro.length}; livro_chars=${mdCompleto.length}`);

    const userContent = [
      `TÍTULO DA AULA: ${sug.titulo_melhorado}`,
      sug.resumo_capitulo ? `RESUMO: ${sug.resumo_capitulo}` : "",
      anterior ? `AULA ANTERIOR (só para amarrar a continuidade): ${anterior.titulo_melhorado}` : "",
      proxima ? `PRÓXIMA AULA (não adiante o conteúdo dela): ${proxima.titulo_melhorado}` : "",
      "",
      "TRECHO DO CAPÍTULO NO LIVRO BASE (única fonte permitida):",
      conteudoLivro,
    ].filter(Boolean).join("\n");



    let parsed: any = {};
    let lastDetail = "";
    let lastFinish = "";
    let hardStatus = 0;
    for (let attempt = 0; attempt < MODELS.length * 2; attempt++) {
      const model = MODELS[attempt % MODELS.length];
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(currentGeminiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            maxOutputTokens: 32000,
          },
        }),

      });
      if (aiRes.status === 402 || aiRes.status === 401 || aiRes.status === 403) {
        const detail = await aiRes.text().catch(() => "");
        const msg = aiRes.status === 402
          ? "Sua conta/projeto Google Gemini recusou por cobrança/crédito (HTTP 402). Não foi usado Lovable AI."
          : `Sua chave do Gemini foi recusada (HTTP ${aiRes.status}). Verifique a GEMINI_API_KEY e se a API Generative Language está habilitada. Não foi usado Lovable AI.`;
        console.error(`[gerar-aula-do-livro] gemini ${aiRes.status}: ${detail}`);
        return json({ error: msg, status: aiRes.status, detail, provider: PROVIDER, model }, aiRes.status);
      }



      if (!aiRes.ok) {
        lastDetail = await aiRes.text().catch(() => "");
        hardStatus = aiRes.status;
        console.error(`[gerar-aula-do-livro] gemini ${aiRes.status}; model=${model}; attempt=${attempt + 1}`);
        if (aiRes.status === 429) await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      const aiJson = await aiRes.json().catch(() => null);
      const candidate0 = aiJson?.candidates?.[0];
      lastFinish = String(candidate0?.finishReason ?? "");
      const content = candidate0?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";
      const candidate = salvageJson(content);
      if (Array.isArray(candidate?.blocos) && candidate.blocos.length >= 4) {
        parsed = candidate;
        break;
      }
      lastDetail = `finish_reason=${lastFinish}; content_len=${content.length}`;
      console.warn(`[gerar-aula-do-livro] resposta inválida; model=${model}; attempt=${attempt + 1}; ${lastDetail}`);
    }

    const blocosBrutos: any[] = Array.isArray(parsed.blocos) ? parsed.blocos : [];
    if (blocosBrutos.length < 4) {
      return json({
        error: hardStatus
          ? `IA indisponível (HTTP ${hardStatus}). ${String(lastDetail).slice(0, 300)}`
          : `IA retornou conteúdo insuficiente. ${lastDetail}`,
        detail: lastDetail,
        finish_reason: lastFinish,
        status: hardStatus || undefined,
        provider: PROVIDER,
        model: MODEL,
      }, 502);
    }


    const titulo = String(parsed.titulo || sug.titulo_melhorado).slice(0, 200);
    const objetivo = parsed.objetivo ? String(parsed.objetivo).slice(0, 500) : null;
    const duracao = Math.max(5, Math.min(45, Number(parsed.duracao_est_min) || 15));
    // Normaliza markdown e aplica os limites de layout mobile em todos os blocos.
    const blocos: any[] = sanitizarBlocos(blocosBrutos);

    const strList = (v: unknown, max: number) =>
      (Array.isArray(v) ? v : []).map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, max);
    const p = parsed.previa && typeof parsed.previa === "object" ? parsed.previa : {};
    const topicos = strList(p.topicos, 5);
    const aoFinal = strList(p.ao_final, 4);
    const glossario = (Array.isArray(parsed.glossario) ? parsed.glossario : [])
      .map((g: any) => ({
        termo: String(g?.termo ?? "").trim(),
        definicao: cortarPalavras(String(g?.definicao ?? ""), 25),
      }))
      .filter((g: any) => g.termo && g.definicao)
      .slice(0, 12);
    const previa = topicos.length || aoFinal.length || p.porque_importa || glossario.length
      ? {
          porque_importa: String(p.porque_importa ?? "").slice(0, 600) || null,
          topicos,
          ao_final: aoFinal,
          glossario,
        }
      : null;



    const { areaId, livroTema } = await resolveArea(admin, requestedAreaId, sug, livro);
    if (!UUID_RE.test(areaId)) return json({ error: "area_id inválido" }, 500);

    const moduloSlug = `livro-${sug.livro_id.slice(0, 8)}`;
    async function ensureModulo(): Promise<string> {
      const temaNome = String(livroTema || sug.titulo_melhorado || "").trim();
      if (temaNome) {
        const { data: matchTitulo } = await admin
          .from("aprender_modulos")
          .select("id")
          .eq("area_id", areaId)
          .ilike("titulo", temaNome)
          .limit(1)
          .maybeSingle();
        if (matchTitulo?.id) return matchTitulo.id;
      }

      const { data: existing, error: existingErr } = await admin
        .from("aprender_modulos")
        .select("id")
        .eq("area_id", areaId)
        .eq("slug", moduloSlug)
        .maybeSingle();
      if (existingErr) throw new Error(`falha ao buscar módulo: ${existingErr.message}`);
      if (existing?.id) return existing.id;
      const { data: created, error } = await admin
        .from("aprender_modulos")
        .insert({ area_id: areaId, slug: moduloSlug, titulo: temaNome, ordem: 0 })
        .select("id").maybeSingle();
      if (error) {
        const { data: retry, error: retryErr } = await admin
          .from("aprender_modulos")
          .select("id")
          .eq("area_id", areaId)
          .eq("slug", moduloSlug)
          .maybeSingle();
        if (retryErr) throw new Error(`falha ao reler módulo: ${retryErr.message}`);
        if (retry?.id) return retry.id;
        throw new Error(`falha ao criar módulo: ${error.message}`);
      }
      if (!created?.id) throw new Error("módulo criado sem id retornado");
      return created.id;
    }
    const moduloId = await ensureModulo();
    if (!UUID_RE.test(moduloId)) return json({ error: "modulo_id inválido" }, 500);

    const aulaSlug = `livro-${sug.livro_id.slice(0, 8)}-${sug.ordem}-${sumario_id.slice(0, 6)}`;

    // Aulas geradas por livro não vêm de `resumos_juridicos`, então NÃO use
    // resumo_origem_id como âncora: ele tem FK para outra tabela. A identidade
    // estável aqui é módulo + slug, e o vínculo volta para o sumário por
    // aprender_sumario_sugerido.aula_id.
    const { data: existingAula } = await admin
      .from("aprender_aulas")
      .select("id")
      .eq("modulo_id", moduloId)
      .eq("slug", aulaSlug)
      .maybeSingle();

    let aulaId: string;
    const aulaData = {
      modulo_id: moduloId,
      slug: aulaSlug,
      titulo,
      objetivo,
      duracao_est_min: duracao,
      previa,

      ordem: sug.ordem,
      status: "published" as const,
      resumo_origem_id: null,
      livro_origem_id: sug.livro_id,
      capitulo_ref: sug.capitulo_ref,
      fontes_web: [],
      modelo_ia: MODEL,
      gerada_em: new Date().toISOString(),
    };
    if (!aulaData.modulo_id || !UUID_RE.test(aulaData.modulo_id)) {
      return json({ error: "modulo_id não resolvido antes de salvar aula" }, 500);
    }
    if (existingAula?.id) {
      aulaId = existingAula.id;
      const { error: updateErr } = await admin.from("aprender_aulas").update(aulaData).eq("id", aulaId);
      if (updateErr) throw updateErr;
      const { error: deleteErr } = await admin.from("aprender_blocos").delete().eq("aula_id", aulaId);
      if (deleteErr) throw deleteErr;
    } else {
      const { data: created, error } = await admin
        .from("aprender_aulas")
        .insert(aulaData)
        .select("id").single();
      if (error) throw error;
      aulaId = created.id;
    }

    const VALID = new Set([
      "leitura", "pergunta", "flashcard", "conexao",
      "citacao", "artigo_lei", "tabela", "mapa_mental", "mapa_conceitual",
      "infografico", "linha_tempo", "destaque", "fluxograma",
      "ordenacao", "cena_animada", "checkpoint", "recapitulacao",
    ]);

    const rows = blocos
      .filter((b: any) => b && typeof b === "object")
      .map((b: any, i: number) => {
        const raw = String(b.tipo ?? "leitura").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        const tipo = VALID.has(raw) ? raw : "leitura";
        return {
          aula_id: aulaId,
          ordem: i,
          tipo,
          payload: b.payload ?? {},
          resposta_correta: b.resposta_correta ?? null,
          markdown: b.payload?.conteudo && tipo === "leitura" ? String(b.payload.conteudo) : null,
        };
      });
    if (rows.length > 0) {
      const { error: bErr } = await admin.from("aprender_blocos").insert(rows);
      if (bErr) throw bErr;
    }

    await admin.from("aprender_sumario_sugerido")
      .update({
        aprovado: true,
        aula_id: aulaId,
        area_id: areaId,
        gerado_por: ADMIN_EMAILS.has(email) ? null : solicitanteId,
        gerado_em: new Date().toISOString(),
      })

      .eq("id", sumario_id);

    return json({ ok: true, aula_id: aulaId, titulo, blocos: rows.length });
  } catch (e: any) {
    console.error("[gerar-aula-do-livro]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolveArea(admin: any, requestedAreaId: string, sug: any, livro: any): Promise<{ areaId: string; livroTema: string | null }> {
  if (UUID_RE.test(requestedAreaId)) return { areaId: requestedAreaId, livroTema: await getLivroTema(admin, livro) };
  if (UUID_RE.test(String(sug.area_id || ""))) return { areaId: sug.area_id, livroTema: await getLivroTema(admin, livro) };

  const livroTema = await getLivroTema(admin, livro);
  const areaNome = await getLivroArea(admin, livro);
  if (!areaNome) throw new Error("não foi possível identificar a matéria do livro; gere pelo painel da matéria correta");

  const { data: area, error } = await admin
    .from("aprender_areas")
    .select("id")
    .ilike("nome", areaNome)
    .maybeSingle();
  if (error) throw new Error(`falha ao buscar matéria: ${error.message}`);
  if (!area?.id) throw new Error(`matéria '${areaNome}' não cadastrada no Aprender`);
  return { areaId: area.id, livroTema };
}

async function getLivroTema(admin: any, livro: any): Promise<string | null> {
  const row = await getBibliotecaRow(admin, livro);
  return typeof row?.tema === "string" && row.tema.trim() ? row.tema.trim() : null;
}

async function getLivroArea(admin: any, livro: any): Promise<string | null> {
  const row = await getBibliotecaRow(admin, livro);
  return typeof row?.area === "string" && row.area.trim() ? row.area.trim() : null;
}

async function getBibliotecaRow(admin: any, livro: any): Promise<{ tema?: string; area?: string } | null> {
  if (!["biblioteca_estudos", "areas"].includes(livro?.livro_tabela) || !livro?.livro_id) return null;
  const bibliotecaId = Number(livro.livro_id);
  if (!Number.isFinite(bibliotecaId)) return null;
  const { data } = await admin
    .from("biblioteca_estudos")
    .select("tema, area")
    .eq("id", bibliotecaId)
    .maybeSingle();
  return data ?? null;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
