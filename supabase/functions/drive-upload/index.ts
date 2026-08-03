// Recebe um PDF gerado no app e grava na pasta correspondente do Google Drive.
import { createClient } from "npm:@supabase/supabase-js@2";
import { ensureTree, makePublic, uploadFile } from "../_shared/googleDrive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const CATEGORIAS: Record<string, string> = {
  resumo: "PDFs/Resumos",
  mapa_mental: "PDFs/Mapas-Mentais",
  infografico: "PDFs/Infograficos",
  fluxograma: "PDFs/Fluxogramas",
  diagrama: "PDFs/Outros",
  outro: "PDFs/Outros",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slug(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70) || "documento";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => null);
    const categoria = String(body?.categoria ?? "outro");
    const titulo = String(body?.titulo ?? "").trim();
    const base64 = String(body?.base64 ?? "");
    const mime = String(body?.mime ?? "application/pdf");

    if (!CATEGORIAS[categoria]) return json({ error: "categoria inválida" }, 400);
    if (!titulo || titulo.length > 200) return json({ error: "titulo inválido" }, 400);
    if (!base64 || base64.length > 30_000_000) return json({ error: "arquivo inválido" }, 400);

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const ids = await ensureTree();
    const parent = ids[CATEGORIAS[categoria]];
    const dia = new Date().toISOString().slice(0, 10);
    const ext = mime.includes("png") ? "png" : "pdf";
    const nome = `${dia}_${categoria}_${slug(titulo)}.${ext}`;

    const fileId = await uploadFile({ name: nome, parentId: parent, mime, data: bin });
    const link = await makePublic(fileId);

    await admin.from("pdfs_gerados").insert({
      categoria,
      titulo,
      nome_arquivo: nome,
      drive_file_id: fileId,
      drive_link: link,
      tamanho_bytes: bin.length,
      user_id: userId,
    });

    return json({ ok: true, file_id: fileId, link, nome });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("drive-upload:", msg);
    return json({ error: msg }, 500);
  }
});
