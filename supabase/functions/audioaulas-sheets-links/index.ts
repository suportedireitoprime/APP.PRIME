// Lê os links de áudio preenchidos na planilha e grava no Supabase.
// Opcionalmente re-hospeda o arquivo no bucket "audioaulas".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { lerLinks } from "../_shared/audioaulasSheetsV5.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} ausente`);
  return v;
}

/** Converte link de compartilhamento do Drive em link direto de download. */
function normalizarLink(url: string): string {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*id=)([\w-]{10,})/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const mapa = await lerLinks();
    if (!mapa.size) return json({ ok: true, importados: 0 });

    const ids = Array.from(mapa.keys());
    const { data: itens, error } = await admin
      .from("audioaulas_itens")
      .select("id, audio_url, publicado")
      .in("id", ids);
    if (error) throw error;

    let importados = 0;
    const erros: string[] = [];

    for (const item of itens ?? []) {
      const bruto = mapa.get(item.id)!;
      const url = normalizarLink(bruto);

      if (item.audio_url === url && item.publicado) continue;
      const { error: uErr } = await admin
        .from("audioaulas_itens")
        .update({ audio_url: url, publicado: true })
        .eq("id", item.id);
      if (uErr) { erros.push(`${item.id}: ${uErr.message}`); continue; }
      importados++;
    }

    // publica automaticamente os cursos que já têm aula com áudio
    if (importados) {
      const { data: cursos } = await admin
        .from("audioaulas_itens")
        .select("curso_id")
        .in("id", ids)
        .not("audio_url", "is", null);
      const unicos = Array.from(new Set((cursos ?? []).map((c: any) => c.curso_id)));
      if (unicos.length) {
        await admin.from("audioaulas_cursos").update({ publicado: true }).in("id", unicos);
      }
    }

    return json({ ok: true, importados, encontrados: mapa.size, erros });
  } catch (e: any) {
    console.error("[audioaulas-sheets-links]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
