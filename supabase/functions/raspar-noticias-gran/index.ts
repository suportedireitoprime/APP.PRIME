import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  guid?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
  enclosure?: { link?: string } | Array<{ link?: string }>;
  categories?: string[];
}

interface Rss2JsonResponse {
  status?: string;
  items?: Rss2JsonItem[];
  message?: string;
}

interface ApiSource {
  rssUrl: string;
  fonte: "gran_oab" | "gran_concursos";
  categoriaDefault: string;
  limit: number;
}

const SOURCES: ApiSource[] = [
  {
    rssUrl: "https://oab.grancursosonline.com.br/blog/feed/",
    fonte: "gran_oab",
    categoriaDefault: "OAB",
    limit: 10,
  },
  {
    rssUrl: "https://blog.grancursosonline.com.br/feed/",
    fonte: "gran_concursos",
    categoriaDefault: "Concursos",
    limit: 10,
  },
];

const FETCH_TIMEOUT_MS = 20_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `\n\n${"#".repeat(+l)} ${stripHtml(t)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${stripHtml(t)}`)
    .replace(/<\/(p|div|section|article|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*>/gi, "").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractFirstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]?.trim();
  if (!m || m.includes("s.w.org/images/core/emoji")) return null;
  return m;
}

async function makeId(link: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(link));
  const bytes = new Uint8Array(buf).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function scrapeSource(
  source: ApiSource,
  admin: ReturnType<typeof createClient>,
): Promise<{ fetched: number; upserted: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.rssUrl)}`;
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timer);

    if (!res.ok) return { fetched: 0, upserted: 0, error: `HTTP ${res.status}` };

    const data = (await res.json()) as Rss2JsonResponse;
    if (data.status !== "ok" || !Array.isArray(data.items)) {
      return { fetched: 0, upserted: 0, error: data.message || "rss2json error" };
    }

    const rows: Array<Record<string, unknown>> = [];

    for (const item of data.items.slice(0, source.limit)) {
      const titulo = stripHtml(item.title ?? "").trim();
      const link = (item.link ?? item.guid ?? "").trim();
      if (!titulo || !link) continue;

      const enclosureLink = Array.isArray(item.enclosure)
        ? item.enclosure[0]?.link
        : item.enclosure?.link;

      const imagemUrl =
        (item.thumbnail?.trim() || null) ??
        (enclosureLink?.trim() || null) ??
        extractFirstImage(item.content ?? "") ??
        extractFirstImage(item.description ?? "");

      const resumo = stripHtml(item.description ?? "").slice(0, 320) || titulo;
      const conteudoMd = htmlToMarkdown(item.content ?? item.description ?? "") || resumo;
      const categoria = item.categories?.[0]?.trim() || source.categoriaDefault;

      // rss2json pubDate comes as "YYYY-MM-DD HH:mm:ss" (UTC)
      const pubRaw = item.pubDate ? item.pubDate.replace(" ", "T") + "Z" : "";
      const parsedDate = pubRaw ? new Date(pubRaw) : new Date();
      const dataPublicacao = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      rows.push({
        id: await makeId(link),
        titulo,
        resumo,
        conteudo_md: conteudoMd,
        imagem_url: imagemUrl ?? null,
        categoria,
        link,
        data_publicacao: dataPublicacao,
        fonte: source.fonte,
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) return { fetched: data.items.length, upserted: 0 };

    const links = rows.map((r) => String(r.link));
    const { data: existing } = await admin.from("noticias_juridicas").select("id, link").in("link", links);
    const existingByLink = new Map((existing ?? []).map((e: { id: string; link: string }) => [e.link, e.id]));
    const finalRows = rows.map((r) => ({ ...r, id: existingByLink.get(String(r.link)) ?? r.id }));

    const { error: upsertErr } = await admin.from("noticias_juridicas").upsert(finalRows, { onConflict: "id" });
    if (upsertErr) return { fetched: data.items.length, upserted: 0, error: upsertErr.message };
    return { fetched: data.items.length, upserted: finalRows.length };
  } catch (err) {
    clearTimeout(timer);
    return { fetched: 0, upserted: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const results = await Promise.all(SOURCES.map((s) => scrapeSource(s, admin)));
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
