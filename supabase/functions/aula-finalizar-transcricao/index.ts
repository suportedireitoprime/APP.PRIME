// Modo Aula — monta a transcrição final da aula a partir dos segmentos já transcritos.
// POST { aulaId } → { texto, segmentos, duracaoSeg }
//
// Cada segmento de áudio tem duração conhecida, então o offset de tempo é exato no
// início de cada bloco. Dentro do bloco, as falas recebem tempo proporcional ao
// tamanho do texto — suficiente para tocar no parágrafo e o áudio pular para o
// trecho certo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Segmento { ini: number; fim: number; fala: string }

/** Divide um texto em falas de ~450 caracteres respeitando o fim das frases. */
function dividirEmFalas(texto: string): string[] {
  const frases = texto.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*\s*/g) ?? [texto];
  const falas: string[] = [];
  let atual = "";
  for (const frase of frases) {
    if ((atual + frase).length > 450 && atual.length > 0) {
      falas.push(atual.trim());
      atual = "";
    }
    atual += frase;
  }
  if (atual.trim()) falas.push(atual.trim());
  return falas.filter((f) => f.length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "não autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const aulaId = String(body?.aulaId ?? "");
    if (!aulaId) return json({ error: "aulaId é obrigatório" }, 400);

    const { data: aula } = await admin
      .from("aulas")
      .select("id, user_id")
      .eq("id", aulaId)
      .maybeSingle();
    if (!aula) return json({ error: "aula não encontrada" }, 404);
    if (aula.user_id !== user.id) return json({ error: "sem permissão" }, 403);

    const { data: midias, error: midiasErr } = await admin
      .from("aula_midias")
      .select("id, ordem, duracao_seg, texto")
      .eq("aula_id", aulaId)
      .eq("tipo", "audio")
      .order("ordem", { ascending: true });
    if (midiasErr) return json({ error: midiasErr.message }, 400);
    if (!midias || midias.length === 0) return json({ error: "aula sem áudio" }, 400);

    const segmentos: Segmento[] = [];
    const partes: string[] = [];
    let offset = 0;

    for (const midia of midias) {
      const dur = Math.max(0, Number(midia.duracao_seg ?? 0));
      const texto = String(midia.texto ?? "").trim();
      if (texto) {
        partes.push(texto);
        const falas = dividirEmFalas(texto);
        const total = falas.reduce((acc, f) => acc + f.length, 0) || 1;
        let acumulado = 0;
        for (const fala of falas) {
          const ini = offset + (dur * acumulado) / total;
          acumulado += fala.length;
          const fim = offset + (dur * acumulado) / total;
          segmentos.push({ ini: Math.round(ini), fim: Math.round(fim), fala });
        }
      }
      offset += dur;
    }

    const textoFinal = partes.join("\n\n");

    const { error: upErr } = await admin
      .from("aula_transcricoes")
      .upsert(
        {
          aula_id: aulaId,
          user_id: user.id,
          texto: textoFinal,
          segmentos,
          idioma: "pt",
        },
        { onConflict: "aula_id" },
      );
    if (upErr) return json({ error: upErr.message }, 400);

    await admin
      .from("aulas")
      .update({
        status: textoFinal ? "transcrita" : "erro",
        duracao_seg: Math.round(offset),
        erro: textoFinal ? null : "nenhum trecho transcrito",
        updated_at: new Date().toISOString(),
      })
      .eq("id", aulaId);

    return json({ texto: textoFinal, segmentos, duracaoSeg: Math.round(offset) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("aula-finalizar-transcricao:", msg);
    return json({ error: msg }, 500);
  }
});
