// Escreve/atualiza as audioaulas de um curso (ou de todos) na planilha Google Sheets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ABA_PROMPTS,
  limparDadosPrompts,
  listarAbas,
  limparDadosArea,
  sincronizarCurso,
  type AulaSheet,
} from "../_shared/audioaulasSheetsV5.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const body = await req.json().catch(() => ({}));
    const cursoId = body?.curso_id ? String(body.curso_id) : null;

    // Modo limpeza: apaga as linhas de dados de todas as abas (mantém cabeçalhos).
    if (body?.limpar === true) {
      const abas = await listarAbas();
      for (const aba of abas) {
        if (aba === ABA_PROMPTS) await limparDadosPrompts();
        else await limparDadosArea(aba);
      }
      return json({ ok: true, limpas: abas.length, abas });
    }



    let q = admin.from("audioaulas_cursos").select("id, area, titulo");
    if (cursoId) q = q.eq("id", cursoId);
    const { data: cursos, error } = await q;
    if (error) throw error;
    if (!cursos?.length) return json({ ok: true, cursos: 0 });

    // A aba Prompts é uma projeção do banco: recriá-la evita linhas e colunas
    // residuais de versões antigas e garante o envio do conteúdo OCR atual.
    await limparDadosPrompts();

    let total = 0;
    for (const curso of cursos) {
      const { data: itens } = await admin
        .from("audioaulas_itens")
        .select("id, numero, ordem, titulo, prompt, conteudo, audio_url, publicado")
        .eq("curso_id", curso.id)
        .order("ordem", { ascending: true });
      if (!itens?.length) continue;

      const aulas: AulaSheet[] = itens.map((i: any) => ({
        id: i.id,
        ordem: i.ordem ?? i.numero,
        tema: curso.titulo,
        numero: i.numero,
        titulo: i.titulo,
        prompt: i.prompt ?? "",
        conteudo: i.conteudo ?? "",
        audio_url: i.audio_url ?? null,
        publicado: Boolean(i.publicado),
      }));

      await sincronizarCurso(curso.area || "Geral", aulas);
      total += aulas.length;
    }

    return json({ ok: true, cursos: cursos.length, aulas: total, v: "layout-v5" });
  } catch (e: any) {
    console.error("[audioaulas-sheets-sync]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
