// Runner de Poderes do Horus — detecta intenção por keywords e executa APIs públicas ou banco direto.
// Retorna um bloco de texto enriquecido que é injetado no systemPrompt.
import { createClient } from "npm:@supabase/supabase-js@2";

type PoderRow = { slug: string; ativo: boolean };

function has(text: string, ...kws: string[]) {
  const t = text.toLowerCase();
  return kws.some((k) => t.includes(k));
}

export type PoderesResult = { block: string; tools: string[]; latencyMs: number };

// Helper rápido de fetch com timeout rígido
async function safeFetchJson(url: string, timeoutMs = 1200, headers: Record<string, string> = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HorusBot/2.0 (Estudos Juridicos)", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, data: null, latency: Date.now() - t0, status: res.status };
    const data = await res.json().catch(() => null);
    return { ok: true, data, latency: Date.now() - t0 };
  } catch (e) {
    return { ok: false, data: null, latency: Date.now() - t0, error: String(e) };
  }
}

export async function runPoderes(
  admin: any,
  userPhone: string,
  userMessage: string,
): Promise<PoderesResult> {
  const t0 = Date.now();
  const phoneDigits = String(userPhone).replace(/\D/g, "");

  // 1) Carrega poderes ativos
  const { data: poderes } = await admin
    .from("horus_poderes")
    .select("slug, ativo")
    .eq("ativo", true);
  const active = new Set<string>((poderes || []).map((p: PoderRow) => p.slug));
  if (active.size === 0) return { block: "", tools: [], latencyMs: Date.now() - t0 };

  const blocks: string[] = [];
  const logs: Array<{ slug: string; ok: boolean; latency: number; error?: string }> = [];

  // 2) MEMÓRIA DO USUÁRIO (Mem0 / nativa horus_memoria)
  const isSmallTalk = /^(oi|olá|ola|bom dia|boa tarde|boa noite|valeu|obrigado|ok|beleza|sim|não|nao)\b/i.test(userMessage.trim());
  if (active.has("mem0") && !isSmallTalk && userMessage.trim().length > 6) {
    const tMem = Date.now();
    try {
      const { data: mems, error: memErr } = await admin
        .from("horus_memoria")
        .select("texto, kind, created_at")
        .or(`user_phone.eq.${userPhone},user_phone.eq.${phoneDigits}`)
        .order("created_at", { ascending: false })
        .limit(3);

      const latency = Date.now() - tMem;
      if (!memErr && mems && mems.length > 0) {
        logs.push({ slug: "mem0", ok: true, latency });
        blocks.push(
          "[MEMÓRIAS E PREFERÊNCIAS ANTERIORES DO USUÁRIO]\n" +
            mems.map((m: any) => `• ${m.texto}`).join("\n"),
        );
      } else {
        logs.push({ slug: "mem0", ok: true, latency });
      }
    } catch (e) {
      logs.push({ slug: "mem0", ok: false, latency: Date.now() - tMem, error: String(e) });
    }
  }

  // 3) BCB — Selic, IPCA, Câmbio em tempo real
  if (active.has("bcb")) {
    if (has(userMessage, "selic", "taxa básica", "juros básico")) {
      const r = await safeFetchJson("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json");
      logs.push({ slug: "bcb", ok: r.ok, latency: r.latency });
      if (r.ok && Array.isArray(r.data) && r.data[0]) {
        blocks.push(`[BANCO CENTRAL DO BRASIL - TAXA SELIC ATUAL]\nValor: ${r.data[0].valor}% a.a. (Data de apuração: ${r.data[0].data})`);
      }
    }
    if (has(userMessage, "ipca", "inflação", "inflacao")) {
      const r = await safeFetchJson("https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json");
      logs.push({ slug: "bcb", ok: r.ok, latency: r.latency });
      if (r.ok && Array.isArray(r.data) && r.data[0]) {
        blocks.push(`[BANCO CENTRAL DO BRASIL - IPCA (INFLAÇÃO) MENSAL]\nTaxa do mês: ${r.data[0].valor}% (Mês de referência: ${r.data[0].data})`);
      }
    }
    if (has(userMessage, "dólar", "dolar", "euro", "câmbio", "cambio", "cotação", "cotacao")) {
      const r = await safeFetchJson("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL");
      logs.push({ slug: "bcb", ok: r.ok, latency: r.latency });
      if (r.ok && r.data) {
        const usd = r.data.USDBRL ? `Dólar Comercial: R$ ${Number(r.data.USDBRL.bid).toFixed(2)}` : "";
        const eur = r.data.EURBRL ? `Euro Comercial: R$ ${Number(r.data.EURBRL.bid).toFixed(2)}` : "";
        blocks.push(`[COTAÇÃO DE MOEDAS EM TEMPO REAL]\n${[usd, eur].filter(Boolean).join(" | ")}`);
      }
    }
  }

  // 4) BrasilAPI — Feriados Nacionais, CEP, CNPJ
  if (active.has("brasilapi")) {
    if (has(userMessage, "feriado", "feriados", "prazo processual", "dias úteis", "dias uteis")) {
      const year = new Date().getFullYear();
      const r = await safeFetchJson(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      logs.push({ slug: "brasilapi", ok: r.ok, latency: r.latency });
      if (r.ok && Array.isArray(r.data)) {
        const feriadosSummary = r.data.map((f: any) => `${f.date}: ${f.name}`).join("\n");
        blocks.push(`[FERIADOS NACIONAIS BRASIL ${year} (BRASILAPI)]\n${feriadosSummary}`);
      }
    }
    const cepMatch = userMessage.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) {
      const cleanCep = cepMatch[0].replace(/\D/g, "");
      const r = await safeFetchJson(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      logs.push({ slug: "brasilapi", ok: r.ok, latency: r.latency });
      if (r.ok && r.data) {
        blocks.push(`[CONSULTA CEP ${cepMatch[0]} (BRASILAPI)]\nLogradouro: ${r.data.street || "N/A"}\nBairro: ${r.data.neighborhood || "N/A"}\nCidade: ${r.data.city}/${r.data.state}`);
      }
    }
    const cnpjMatch = userMessage.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
    if (cnpjMatch) {
      const cleanCnpj = cnpjMatch[0].replace(/\D/g, "");
      const r = await safeFetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      logs.push({ slug: "brasilapi", ok: r.ok, latency: r.latency });
      if (r.ok && r.data) {
        blocks.push(`[CONSULTA CNPJ ${cnpjMatch[0]} (BRASILAPI)]\nRazão Social: ${r.data.razao_social}\nNome Fantasia: ${r.data.nome_fantasia || "Não informado"}\nSituação: ${r.data.descricao_situacao_cadastral}`);
      }
    }
  }

  // 5) Wikipedia — Dúvida enciclopédica/conceitual
  if (active.has("wikipedia") && /^(quem (é|foi)|o que (é|significa|foram)|defina|conceito de|explique .{0,3}o que)/i.test(userMessage.trim())) {
    const q = userMessage.replace(/^(quem (é|foi)|o que (é|significa|foram)|defina|conceito de|explique .{0,3}o que)\s+/i, "").replace(/[?!.]+$/, "").trim();
    if (q.length > 2) {
      const r = await safeFetchJson(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`, 1500);
      logs.push({ slug: "wikipedia", ok: r.ok, latency: r.latency });
      if (r.ok && r.data?.extract) {
        blocks.push(`[ENCICLOPÉDIA WIKIPEDIA — ${r.data.title}]\n${r.data.extract}\nFonte: ${r.data.content_urls?.desktop?.page || ""}`);
      }
    }
  }

  // 6) Nager.Date — Feriados de outros anos
  if (active.has("nager")) {
    const m = userMessage.match(/feriados?.{0,20}(20\d{2})/i);
    if (m) {
      const yr = m[1];
      const r = await safeFetchJson(`https://date.nager.at/api/v3/PublicHolidays/${yr}/BR`);
      logs.push({ slug: "nager", ok: r.ok, latency: r.latency });
      if (r.ok && Array.isArray(r.data)) {
        const sum = r.data.slice(0, 15).map((f: any) => `${f.date}: ${f.localName || f.name}`).join("\n");
        blocks.push(`[FERIADOS NACIONAIS ${yr} (NAGER)]\n${sum}`);
      }
    }
  }

  // Log assíncrono das chamadas para métricas do painel
  if (logs.length) {
    admin
      .from("horus_poderes_calls")
      .insert(
        logs.map((l) => ({
          poder_slug: l.slug,
          user_phone: userPhone,
          latency_ms: l.latency,
          ok: l.ok,
          error: l.error ?? null,
        })),
      )
      .then(() => {}, (e: any) => console.warn("poderes log fail", String(e)));
  }

  const toolsUsed = Array.from(new Set(logs.filter((l) => l.ok).map((l) => l.slug)));
  const latencyMs = Date.now() - t0;
  if (!blocks.length) return { block: "", tools: toolsUsed, latencyMs };
  return {
    block: "\n\n[CONHECIMENTO EM TEMPO REAL — use como fonte primária, cite quando relevante]\n" + blocks.join("\n\n"),
    tools: toolsUsed,
    latencyMs,
  };
}

// Salva memória factual após responder (fire-and-forget)
export async function saveMemoryAsync(userPhone: string, userMessage: string, assistantReply: string) {
  try {
    const isFact = /(estudo|estou estudando|trabalho|sou|moro|minha|meu|prefiro|gosto|não gosto|meu nome|oab|concurso)/i.test(userMessage);
    if (!isFact) return;
    const texto = userMessage.length > 240 ? userMessage.slice(0, 240) : userMessage;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("horus_memoria").insert({
      user_phone: userPhone.replace(/^\+/, ""),
      texto,
      kind: "fact",
    });
  } catch (e) {
    console.warn("horus mem save fail", String(e));
  }
}
