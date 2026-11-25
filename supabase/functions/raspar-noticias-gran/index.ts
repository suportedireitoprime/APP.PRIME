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

// Usando fontes RSS abertas que não bloqueiam Supabase:
// - Conjur.com.br: maior portal jurídico do Brasil, cobre temas de OAB, STF, STJ, etc.
// - Estratégia Concursos: maior portal de concursos públicos do Brasil
const SOURCES: ApiSource[] = [
  {
    url: "https://www.conjur.com.br/feed",
    fonte: "gran_oab",
    categoriaDefault: "OAB",
    limit: 15,
  },
  {
    url: "https://www.estrategiaconcursos.com.br/blog/feed/",
    fonte: "gran_concursos",
    categoriaDefault: "Concursos",
    limit: 15,
  },
];

function decodeEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function extractTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? decodeEntities(match[1]) : "";
}

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, txt) => `\n\n${"#".repeat(Number(lvl))} ${txt.replace(/<[^>]+>/g, "").trim()}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, txt) => `\n- ${txt.replace(/<[^>]+>/g, "").trim()}`)
    .replace(/<\/(p|div|section|article|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFirstImage(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1].trim();
  const mediaMatch = html.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) return mediaMatch[1].trim();
  const thumbMatch = html.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch?.[1]) return thumbMatch[1].trim();
  const enclosureMatch = html.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i);
  if (enclosureMatch?.[1]) return enclosureMatch[1].trim();
  return null;
}

async function makeId(fonte: string, link: string): Promise<string> {
  const data = new TextEncoder().encode(link);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hashBuf))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${fonte}_${hex}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary: Record<string, { fetched: number; upserted: number; error?: string }> = {};

  try {
    for (const source of SOURCES) {
      try {
        const res = await fetch(source.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DireitoPrimeBot/1.0; +https://direitoprime.com.br)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });

        if (!res.ok) {
          summary[source.fonte] = { fetched: 0, upserted: 0, error: `HTTP ${res.status}` };
          continue;
        }

        const xml = await res.text();
        const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
        const rows: Array<Record<string, unknown>> = [];

        for (const itemXml of items.slice(0, source.limit)) {
          const titulo = extractTag(itemXml, "title").replace(/<[^>]+>/g, "").trim();
          const link = extractTag(itemXml, "link").trim();
          const pubDateRaw = extractTag(itemXml, "pubDate");
          const descriptionRaw = extractTag(itemXml, "description");
          const contentRaw = extractTag(itemXml, "content:encoded") || descriptionRaw;
          const categoria = extractTag(itemXml, "category").replace(/<[^>]+>/g, "").trim() || source.categoriaDefault;

          if (!titulo || !link) continue;

          const imagemUrl = extractFirstImage(descriptionRaw) || extractFirstImage(contentRaw) || extractFirstImage(itemXml);

          const resumo = descriptionRaw
            .replace(/<img[^>]*>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 320);

          const conteudoMd = htmlToMarkdown(contentRaw) || resumo;
          const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
          const dataPublicacao = isNaN(parsedDate.getTime())
            ? new Date().toISOString()
            : parsedDate.toISOString();

          rows.push({
            id: await makeId(source.fonte, link),
            titulo,
            resumo: resumo || titulo,
            conteudo_md: conteudoMd,
            imagem_url: imagemUrl ?? null,
            categoria,
            link,
            data_publicacao: dataPublicacao,
            fonte: source.fonte,
            updated_at: new Date().toISOString(),
          });
        }

        if (rows.length > 0) {
          const links = rows.map((r) => String(r.link));
          const { data: existing } = await admin
            .from("noticias_juridicas")
            .select("id, link")
            .in("link", links);

          const existingByLink = new Map<string, string>(
            (existing ?? []).map((e: { id: string; link: string }) => [e.link, e.id]),
          );

          const finalRows = rows.map((r) => ({
            ...r,
            id: existingByLink.get(String(r.link)) ?? r.id,
          }));

          const { error: upsertErr } = await admin
            .from("noticias_juridicas")
            .upsert(finalRows, { onConflict: "id" });

          if (upsertErr) {
            summary[source.fonte] = { fetched: items.length, upserted: 0, error: upsertErr.message };
          } else {
            summary[source.fonte] = { fetched: items.length, upserted: finalRows.length };
          }
        } else {
          summary[source.fonte] = { fetched: items.length, upserted: 0 };
        }
      } catch (err) {
        summary[source.fonte] = {
          fetched: 0,
          upserted: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

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
