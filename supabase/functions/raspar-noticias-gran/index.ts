import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApiSource {
  url: string;
  fonte: "gran_oab" | "gran_concursos";
  categoriaDefault: string;
  limit: number;
}

// Conjur = jurídico/OAB | Estratégia = concursos
const SOURCES: ApiSource[] = [
  { url: "https://www.conjur.com.br/feed", fonte: "gran_oab", categoriaDefault: "OAB", limit: 10 },
  { url: "https://www.estrategiaconcursos.com.br/blog/feed/", fonte: "gran_concursos", categoriaDefault: "Concursos", limit: 10 },
];

const FETCH_TIMEOUT_MS = 20_000;

function decodeEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))).trim();
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `\n\n${"#".repeat(+l)} ${t.replace(/<[^>]+>/g, "").trim()}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/<[^>]+>/g, "").trim()}`)
    .replace(/<\/(p|div|section|article|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<img[^>]*>/gi, "").replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractFirstImage(html: string): string | null {
  return (
    html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i)?.[1]?.trim() ??
    null
  );
}

async function makeId(fonte: string, link: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(link));
  const hex = Array.from(new Uint8Array(buf)).slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${fonte}_${hex}`;
}

async function scrapeSource(
  source: ApiSource,
  admin: ReturnType<typeof createClient>,
): Promise<{ fetched: number; upserted: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DireitoPrimeBot/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return { fetched: 0, upserted: 0, error: `HTTP ${res.status}` };

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const rows: Array<Record<string, unknown>> = [];

    for (const itemXml of items.slice(0, source.limit)) {
      const titulo = extractTag(itemXml, "title").replace(/<[^>]+>/g, "").trim();
      const link = extractTag(itemXml, "link").trim();
      if (!titulo || !link) continue;

      const pubDateRaw = extractTag(itemXml, "pubDate");
      const descriptionRaw = extractTag(itemXml, "description");
      const contentRaw = extractTag(itemXml, "content:encoded") || descriptionRaw;
      const categoria = extractTag(itemXml, "category").replace(/<[^>]+>/g, "").trim() || source.categoriaDefault;
      const imagemUrl = extractFirstImage(descriptionRaw) || extractFirstImage(contentRaw) || extractFirstImage(itemXml);

      const resumo = descriptionRaw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 320);
      const conteudoMd = htmlToMarkdown(contentRaw) || resumo;
      const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
      const dataPublicacao = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      rows.push({
        id: await makeId(source.fonte, link),
        titulo, resumo: resumo || titulo, conteudo_md: conteudoMd,
        imagem_url: imagemUrl ?? null, categoria, link,
        data_publicacao: dataPublicacao, fonte: source.fonte, updated_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) return { fetched: items.length, upserted: 0 };

    // Deduplicate by link
    const links = rows.map(r => String(r.link));
    const { data: existing } = await admin.from("noticias_juridicas").select("id, link").in("link", links);
    const existingByLink = new Map((existing ?? []).map((e: { id: string; link: string }) => [e.link, e.id]));
    const finalRows = rows.map(r => ({ ...r, id: existingByLink.get(String(r.link)) ?? r.id }));

    const { error: upsertErr } = await admin.from("noticias_juridicas").upsert(finalRows, { onConflict: "id" });
    if (upsertErr) return { fetched: items.length, upserted: 0, error: upsertErr.message };
    return { fetched: items.length, upserted: finalRows.length };
  } catch (err) {
    clearTimeout(timer);
    return { fetched: 0, upserted: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    // Fetch both sources IN PARALLEL to stay within Edge Function timeout
    const results = await Promise.all(SOURCES.map(s => scrapeSource(s, admin)));
    const summary = Object.fromEntries(SOURCES.map((s, i) => [s.fonte, results[i]]));

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
