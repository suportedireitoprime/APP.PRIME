// Cron horário: publica no máximo 2 itens por dia de cada tipo (fuso America/Sao_Paulo).
import { createClient } from "npm:@supabase/supabase-js@2";
import { fileIdFromLink, fileMeta, makePublic } from "../_shared/googleDrive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TIPOS = ["apresentacao", "audioaula", "lei_cantada"] as const;
type Tipo = typeof TIPOS[number];
const LIMITE_DIA = 2;

/** Início do dia em America/Sao_Paulo, em ISO UTC. */
function inicioDoDiaBR(): string {
  const agora = new Date();
  const br = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const diffMs = agora.getTime() - br.getTime();
  const meiaNoite = new Date(br.getFullYear(), br.getMonth(), br.getDate(), 0, 0, 0, 0);
  return new Date(meiaNoite.getTime() + diffMs).toISOString();
}

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "item";
}

/** Publica um item da fila na tabela final. Devolve a URL pública do arquivo. */
async function publicar(item: any): Promise<string> {
  const fileId = item.drive_file_id || fileIdFromLink(String(item.link_origem ?? ""));
  if (!fileId) throw new Error("link do Drive inválido");
  const meta = await fileMeta(fileId);
  const url = await makePublic(fileId);
  const dados = (item.meta ?? {}) as Record<string, any>;

  if (item.tipo === "audioaula") {
    if (!dados.item_id) throw new Error("informe meta.item_id (aula de destino)");
    const { error } = await admin
      .from("audioaulas_itens")
      .update({ audio_url: url, publicado: true })
      .eq("id", dados.item_id);
    if (error) throw error;
  } else if (item.tipo === "apresentacao") {
    if (!dados.apresentacao_id) throw new Error("informe meta.apresentacao_id");
    const { error } = await admin
      .from("apresentacoes_narradas")
      .update({ publicada: true, status: "pronta" })
      .eq("id", dados.apresentacao_id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("leis_cantadas").insert({
      slug: `${slugify(item.titulo ?? meta?.name ?? "lei-cantada")}-${fileId.slice(0, 6).toLowerCase()}`,
      titulo: item.titulo ?? meta?.name ?? null,
      audio_url: url,
      tabela_codigo: dados.tabela_codigo ?? "geral",
      lei_nome: dados.lei_nome ?? null,
      numero_artigo: dados.numero_artigo ?? null,
      letra: dados.letra ?? null,
      duracao_seg: dados.duracao_seg ?? null,
      artigo_id: dados.artigo_id ?? null,
    });
    if (error) throw error;
  }

  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const desde = inicioDoDiaBR();
    const agoraIso = new Date().toISOString();
    const resultado: Record<string, { publicados_hoje: number; agora: number; erros: string[] }> = {};

    const tiposAlvo: Tipo[] = TIPOS.includes(body?.tipo) ? [body.tipo] : [...TIPOS];

    for (const tipo of tiposAlvo) {
      const { count } = await admin
        .from("conteudo_fila")
        .select("id", { count: "exact", head: true })
        .eq("tipo", tipo)
        .eq("status", "publicado")
        .gte("publicado_em", desde);

      const jaHoje = count ?? 0;
      const vagas = Math.max(0, LIMITE_DIA - jaHoje);
      resultado[tipo] = { publicados_hoje: jaHoje, agora: 0, erros: [] };
      if (vagas === 0) continue;

      const { data: pendentes } = await admin
        .from("conteudo_fila")
        .select("*")
        .eq("tipo", tipo)
        .eq("status", "na_fila")
        .or(`previsto_para.is.null,previsto_para.lte.${agoraIso}`)
        .order("criado_em", { ascending: true })
        .limit(vagas);

      for (const item of pendentes ?? []) {
        try {
          const url = await publicar(item);
          await admin
            .from("conteudo_fila")
            .update({
              status: "publicado",
              publicado_em: new Date().toISOString(),
              arquivo_url: url,
              drive_file_id: item.drive_file_id ?? fileIdFromLink(String(item.link_origem ?? "")),
              erro: null,
              atualizado_em: new Date().toISOString(),
            })
            .eq("id", item.id);
          resultado[tipo].agora++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          resultado[tipo].erros.push(`${item.titulo ?? item.id}: ${msg}`);
          await admin
            .from("conteudo_fila")
            .update({ status: "erro", erro: msg, atualizado_em: new Date().toISOString() })
            .eq("id", item.id);
        }
      }
    }

    await admin.from("conteudo_fila_log").insert({ resultado });
    return json({ ok: true, resultado });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("conteudo-fila-runner:", msg);
    return json({ error: msg }, 500);
  }
});
