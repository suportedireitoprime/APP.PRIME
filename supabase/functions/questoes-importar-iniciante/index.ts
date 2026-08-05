// Importa as questões de nível INICIANTE do projeto antigo (DIREITO PRIME ANTIGO).
// Tabela de origem: QUESTOES_GERADAS (~61 mil questões geradas por IA).
// Body: { offset?, limite? }
import { corsHeaders, json, adminClient, exigirAdmin, sha256Hex } from "../_shared/questoes-sheets.ts";

const ORIGEM_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const ORIGEM_KEY = "sb_publishable_nqyec1qQmLMrbPH3YFPhxw_XtJ449ZC";
const LOTE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = exigirAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json().catch(() => ({}));
    const offset = Number(body.offset ?? 0);
    const limite = Math.min(Number(body.limite ?? LOTE), LOTE);

    const admin = adminClient();

    const r = await fetch(
      `${ORIGEM_URL}/rest/v1/QUESTOES_GERADAS?select=*&order=id.asc&offset=${offset}&limit=${limite}`,
      { headers: { apikey: ORIGEM_KEY, Authorization: `Bearer ${ORIGEM_KEY}`, Prefer: "count=exact" } },
    );
    const txt = await r.text();
    if (!r.ok) return json({ error: `Origem [${r.status}]: ${txt.slice(0, 300)}` }, 502);
    const origem = JSON.parse(txt) as any[];
    const totalOrigem = Number(r.headers.get("content-range")?.split("/")?.[1] ?? 0);

    const rows: any[] = [];
    let ignoradas = 0;
    for (const q of origem) {
      const enunciado = (q.enunciado ?? "").toString().trim();
      if (!enunciado) { ignoradas++; continue; }
      rows.push({
        hash_dedup: await sha256Hex(`iniciante|${q.id ?? enunciado.slice(0, 300)}`),
        id_externo: q.id != null ? String(q.id) : null,
        origem: "iniciante",
        nivel: "iniciante",
        cargo: "Iniciante",
        area: q.area ?? null,
        disciplina: q.area ?? null,
        tema: q.tema ?? null,
        subtema: q.subtema ?? null,
        assunto: q.tema ?? null,
        enunciado,
        alt_a: q.alternativa_a ?? null,
        alt_b: q.alternativa_b ?? null,
        alt_c: q.alternativa_c ?? null,
        alt_d: q.alternativa_d ?? null,
        gabarito_oficial: (q.resposta_correta ?? "").toString().trim().toUpperCase() || null,
        gabarito_comentado: q.comentario ?? null,
      });
    }

    const vistos = new Set<string>();
    const unicas = rows.filter((x) => (vistos.has(x.hash_dedup) ? false : (vistos.add(x.hash_dedup), true)));

    let inseridas = 0;
    let erros = 0;
    for (let i = 0; i < unicas.length; i += 500) {
      const chunk = unicas.slice(i, i + 500);
      const { error, count } = await admin
        .from("questoes")
        .upsert(chunk, { onConflict: "hash_dedup", ignoreDuplicates: true, count: "exact" });
      if (error) { erros += chunk.length; console.error("upsert", error.message); }
      else inseridas += count ?? 0;
    }

    const { count: total } = await admin
      .from("questoes").select("id", { count: "exact", head: true }).eq("nivel", "iniciante");

    await admin.from("questoes_sync_log").insert({
      origem: "iniciante",
      ok: erros === 0,
      processadas: origem.length,
      inseridas, ignoradas, erros,
      total_atual: total ?? 0,
      mensagem: `Iniciante • offset ${offset}`,
    });

    const acabou = origem.length < limite;
    return json({
      ok: true, processadas: origem.length, inseridas, ignoradas, erros,
      total: total ?? 0, totalOrigem,
      proximoOffset: acabou ? null : offset + limite,
      concluido: acabou,
    });
  } catch (e) {
    console.error("[questoes-importar-iniciante]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
