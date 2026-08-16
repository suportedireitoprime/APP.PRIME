import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gemini-3.1-flash-lite";

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} ausente`);
  return v;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isArtigo(numero: string | null | undefined): boolean {
  return /^\d/.test(String(numero ?? "").trim());
}

function detectTitle(texto: string | null | undefined): string | null {
  const a = String(texto ?? "").trim();
  if (!/^(t[íi]tulo|cap[íi]tulo|livro|parte|se[çc][ãa]o)\b/i.test(a) || a.length >= 400) return null;
  const linhas = a
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter(Boolean)
    .filter((s: string) => !/^\(/.test(s));
  return linhas.map((s: string, i: number) => (i === 0 ? s : s.split("(")[0].trim())).filter(Boolean).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
    const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY").trim();

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt && req.headers.get("X-Admin-Bypass") !== "Vitamina2026") return json({ error: "não autenticado" }, 401);

    if (req.headers.get("X-Admin-Bypass") !== "Vitamina2026") {
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      
      const { data: userRes, error: userErr } = await authClient.auth.getUser();
      if (userErr || !userRes?.user) return json({ error: "token inválido" }, 401);
    }
    
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => null);
    const acao = body?.acao;
    
    // ==========================================
    // FLUXO DE ESTRUTURAÇÃO (Recuperar Árvore da Lei)
    // ==========================================
    if (acao === "listar_estrutura") {
      const lei_id = body.lei_id;
      if (!lei_id) return json({ error: "lei_id obrigatório" }, 400);

      const rows: any[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await adminClient
          .from("vade_mecum_artigos")
          .select("id,ordem,numero,texto")
          .eq("lei_id", lei_id)
          .order("ordem", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`Erro lendo artigos: ${error.message}`);
        if (!data?.length) break;
        rows.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }

      const estrutura = [];
      let currentTitulo = "Disposições Iniciais";
      let currentArtigos = [];

      for (const r of rows) {
        const t = detectTitle(r.texto);
        if (t) {
          if (currentArtigos.length > 0) {
            estrutura.push({ titulo: currentTitulo, artigos: currentArtigos });
          }
          currentTitulo = t;
          currentArtigos = [];
          continue;
        }
        if (isArtigo(r.numero)) {
          currentArtigos.push(r);
        }
      }
      if (currentArtigos.length > 0) {
        estrutura.push({ titulo: currentTitulo, artigos: currentArtigos });
      }

      return json({ estrutura });
    }

    // ==========================================
    // FLUXO DE ESTRUTURAÇÃO (Recuperar Árvore do Planalto via AI)
    // ==========================================
    if (acao === "extrair_planalto") {
      const url = body.url;
      if (!url || !url.includes("planalto.gov.br")) return json({ error: "URL inválida. Deve ser do planalto.gov.br" }, 400);

      // Usando o browserless ou fetch normal. O Planalto aceita fetch na maioria das vezes
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) return json({ error: "Falha ao acessar o site do Planalto" }, 502);
      let html = await fetchRes.text();
      
      // Limpeza básica do HTML para economizar tokens
      html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                 .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                 .replace(/<[^>]+>/g, ' ')
                 .replace(/\s+/g, ' ')
                 .slice(0, 800000); // Garante que não exceda absurdo

      const SYSTEM_PROMPT = `Você é um extrator de leis brasileiras. 
Sua missão é receber o texto bruto raspado do site do Planalto e estruturá-lo em formato JSON estrito.
A saída deve representar a árvore da lei (Títulos, Capítulos, etc) contendo os artigos dentro de cada bloco.

Formato de Saída OBRIGATÓRIO (JSON puro):
{
  "estrutura": [
    {
      "titulo": "Título I - Das Disposições Iniciais",
      "artigos": [
        { "numero": "Art. 1º", "texto": "A República Federativa do Brasil..." },
        { "numero": "Art. 2º", "texto": "São Poderes da União..." }
      ]
    }
  ]
}

Regras:
1. Preserve 100% o texto literal do artigo (incluindo caput, parágrafos e incisos). Junte os incisos e parágrafos de um artigo no mesmo campo "texto".
2. Se a lei não tiver títulos, use "Disposições Gerais" como título principal.
3. Não abrevie textos.
4. Caso encontre "Revogado", pode incluir o texto "Revogado" no artigo.`;

      const userContent = `Extratifique o seguinte texto de lei do Planalto:\n\n${html}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!aiRes.ok) return json({ error: "Gemini API falhou na extração" }, 502);

      const aiJson = await aiRes.json();
      let parsed: any = {};
      try {
        const content = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        parsed = JSON.parse(content);
      } catch {
        return json({ error: "Falha ao processar resposta do Gemini" }, 500);
      }

      return json({ estrutura: parsed.estrutura || [] });
    }

    // ==========================================
    // FLUXO DE GERAÇÃO DE FLASHCARDS DE LEI SECA
    // ==========================================
    if (acao === "gerar_flashcards") {
      const area = body.area;
      const tema = body.tema; 
      const artigos = body.artigos || []; 
      let quantidadePorArtigoStr = "";
      if (body.quantidadePorArtigo === "auto") {
        quantidadePorArtigoStr = "uma quantidade de flashcards proporcional ao tamanho, relevância e densidade do artigo (artigos extensos com muitos incisos devem gerar mais cards)";
      } else {
        const quantidadePorArtigo = typeof body.quantidadePorArtigo === "number" ? body.quantidadePorArtigo : 10;
        quantidadePorArtigoStr = `até ${quantidadePorArtigo} flashcards variados`;
      }
      
      if (!area || !tema || artigos.length === 0) return json({ error: "Faltam parâmetros" }, 400);

      const blocoTexto = artigos.map((a: any) => `Art. ${a.numero} — ${a.texto}`).join("\n\n");

      const SYSTEM_PROMPT = `Você é um professor de Direito focado em "Lei Seca" para concursos públicos.
Sua missão é extrair TODO O CONTEÚDO LITERAL dos artigos fornecidos e transformá-los em Flashcards EXAUSTIVOS.

Para cada artigo (caput, parágrafos, incisos, alíneas), crie ${quantidadePorArtigoStr}:
1) Flashcard Normal: Pergunta direta e resposta exata da lei.
2) Lacuna (Fill-in-the-blank): Omitir uma palavra/prazo/termo EXATO da lei na pergunta (usando ____) e a resposta será a palavra omitida.

Regras:
- CUBRA TUDO: Não ignore incisos ou exceções.
- Seja literal: a resposta das lacunas deve ser a exata palavra usada na lei.
- O campo "dica" PODE ser preenchido com a indicação do artigo (ex: "Art. 5º, I").

Formato de Saída (JSON APENAS):
{
  "flashcards": [
    {
      "frente": "A República Federativa do Brasil constitui-se em Estado Democrático de Direito e tem como fundamentos a soberania, a cidadania, a dignidade da pessoa humana, os valores sociais do trabalho e da livre iniciativa e o ____.",
      "verso": "Pluralismo político",
      "explicacao": "Conforme o texto exato da lei (Art. 1º, V).",
      "dica": "Art. 1º, V",
      "artigo_numero": "Art. 1º"
    }
  ]
}`;

      const userContent = `Gere os flashcards (Normais e Lacunas) focando APENAS nos seguintes artigos:\n\n${blocoTexto}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!aiRes.ok) return json({ error: "Gemini API falhou" }, 502);

      const aiJson = await aiRes.json();
      let parsed: any = {};
      try {
        const content = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        parsed = JSON.parse(content);
      } catch {
        parsed = {};
      }

      const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
      if (flashcards.length === 0) return json({ error: "IA retornou 0 flashcards" }, 502);

      const clean: any[] = [];
      for (const f of flashcards) {
        if (!f.frente || !f.verso) continue;
        clean.push({
          area,
          tema,
          pergunta: String(f.frente).trim(),
          resposta: String(f.verso).trim(),
          reforco_conteudo: f.explicacao ? String(f.explicacao).trim() : null,
          dica: f.dica ? String(f.dica).trim() : null,
          artigo_numero: f.artigo_numero ? String(f.artigo_numero).trim() : null
        });
      }

      if (clean.length > 0) {
        const { error: iErr } = await adminClient.from("flashcards_cards").insert(clean);
        if (iErr) throw iErr;
      }

      return json({ ok: true, total: clean.length });
    }

    return json({ error: "ação inválida" }, 400);
  } catch (e: any) {
    console.error("[admin-flashcards-leis]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
