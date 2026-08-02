// Lei Seca: monta a árvore Título -> Lições (sem gerar exercícios ainda).
// Body: { trilha_slug: string, parte_slug?: string, force?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function articleNum(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = String(raw).replace(/\./g, "").match(/(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function passFilter(num: number | null, filtro: any): boolean {
  if (!filtro) return true;
  if (num == null) return false;
  if (filtro.art_min != null && num < filtro.art_min) return false;
  if (filtro.art_max != null && num > filtro.art_max) return false;
  return true;
}

function detectTitle(row: any): string | null {
  const a = String(row.texto ?? "").trim();
  if (!/^(t[íi]tulo|cap[íi]tulo|livro|parte|se[çc][ãa]o)\b/i.test(a) || a.length >= 400) return null;
  const linhas = a
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter(Boolean)
    .filter((s: string) => !/^\(/.test(s));
  return linhas.map((s: string, i: number) => (i === 0 ? s : s.split("(")[0].trim())).filter(Boolean).join("\n");
}

function isArtigo(row: any): boolean {
  return /^\d/.test(String(row.numero ?? "").trim());
}

async function carregarLinhasLei(sb: any, leiId: string): Promise<any[]> {
  const rows: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from("vade_mecum_artigos")
      .select("id,ordem,numero,texto")
      .eq("lei_id", leiId)
      .order("ordem", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Erro lendo artigos: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

// Agrupa artigos curtos em mesma lição; longos viram lição própria.
function agruparLicoes(rows: any[]): Array<{ titulo_pai: string | null; artigos: string[]; tamanho: number }> {
  const out: Array<{ titulo_pai: string | null; artigos: string[]; tamanho: number }> = [];
  let currentTitulo: string | null = null;
  let bucket: { titulo_pai: string | null; artigos: string[]; tamanho: number } | null = null;
  const MAX = 900;

  const flush = () => {
    if (bucket && bucket.artigos.length) out.push(bucket);
    bucket = null;
  };

  for (const r of rows) {
    const t = detectTitle(r);
    if (t) {
      flush();
      currentTitulo = t;
      continue;
    }
    if (!isArtigo(r)) continue;
    const num = String(r.numero).trim();
    const texto = String(r.texto ?? "");
    const tam = texto.length;

    if (tam >= MAX) {
      flush();
      out.push({ titulo_pai: currentTitulo, artigos: [num], tamanho: tam });
      continue;
    }
    if (!bucket) bucket = { titulo_pai: currentTitulo, artigos: [], tamanho: 0 };
    if (bucket.tamanho + tam > MAX || bucket.artigos.length >= 4) {
      flush();
      bucket = { titulo_pai: currentTitulo, artigos: [], tamanho: 0 };
    }
    bucket.artigos.push(num);
    bucket.tamanho += tam;
  }
  flush();
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { trilha_slug, parte_slug, force = false } = await req.json();
    if (!trilha_slug) {
      return new Response(JSON.stringify({ error: "trilha_slug obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: trilha, error: errT } = await sb
      .from("lei_seca_trilhas")
      .select("*")
      .eq("slug", trilha_slug)
      .single();
    if (errT || !trilha) throw new Error(`Trilha não encontrada: ${trilha_slug}`);

    const { data: lei } = await sb
      .from("vade_mecum_leis")
      .select("id")
      .eq("slug", trilha.lei_slug)
      .maybeSingle();
    if (!lei?.id) throw new Error(`Lei não encontrada no Vade Mecum: ${trilha.lei_slug}`);

    const partes = (trilha.partes as any[]) || [];
    const partesAlvo = parte_slug ? partes.filter((p) => p.slug === parte_slug) : partes;
    const rows = await carregarLinhasLei(sb, lei.id);

    let totalCriadas = 0;
    let totalPreservadas = 0;

    for (const parte of partesAlvo) {
      if (!force) {
        const { count } = await sb
          .from("lei_seca_licoes")
          .select("id", { count: "exact", head: true })
          .eq("trilha_slug", trilha_slug)
          .eq("parte", parte.slug);
        if ((count ?? 0) > 0) continue;
      }

      const filtrados = rows.filter((r) => {
        if (detectTitle(r)) return true;
        return passFilter(articleNum(r.numero), parte.filtro);
      });
      const grupos = agruparLicoes(filtrados);

      const keyOf = (arts: string[]) => arts.join("|");
      const prontasMap = new Map<string, any>();
      if (force) {
        const { data: existentes } = await sb
          .from("lei_seca_licoes")
          .select("id, artigos, status, exercicios, gerado_em, versao_prompt")
          .eq("trilha_slug", trilha_slug)
          .eq("parte", parte.slug);
        for (const e of existentes ?? []) {
          if (e.status === "pronto") prontasMap.set(keyOf((e.artigos as string[]) ?? []), e);
        }
        await sb.from("lei_seca_licoes").delete().eq("trilha_slug", trilha_slug).eq("parte", parte.slug);
      }

      let preservadasParte = 0;
      const inserts = grupos.map((g, i) => {
        const ja = prontasMap.get(keyOf(g.artigos));
        if (ja) preservadasParte++;
        return {
          ...(ja ? { id: ja.id } : {}),
          trilha_slug,
          parte: parte.slug,
          titulo_pai: g.titulo_pai,
          titulo:
            g.artigos.length === 1
              ? `Art. ${g.artigos[0]}`
              : `Arts. ${g.artigos[0]}–${g.artigos[g.artigos.length - 1]}`,
          ordem: i + 1,
          artigos: g.artigos,
          status: ja ? "pronto" : "pendente",
          exercicios: ja?.exercicios ?? null,
          gerado_em: ja?.gerado_em ?? null,
          versao_prompt: ja?.versao_prompt ?? null,
        };
      });

      if (inserts.length) {
        const { error: errI } = await sb.from("lei_seca_licoes").insert(inserts);
        if (errI) throw new Error(`Erro inserindo lições (${parte.slug}): ${errI.message}`);
        totalCriadas += inserts.length - preservadasParte;
        totalPreservadas += preservadasParte;
      }
    }

    return new Response(JSON.stringify({ ok: true, criadas: totalCriadas, preservadas: totalPreservadas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[lei-seca-estruturar]", e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
