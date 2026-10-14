import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

interface ItemImport {
  idDrive: string;
  titulo: string;
  tema: string;
  sequencia: number;
  descricao?: string;
  area?: string;
  tag?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const itens: ItemImport[] = body.itens || [];

    if (!Array.isArray(itens) || itens.length === 0) {
      return json({ error: "Nenhum item informado em 'itens'" }, 400);
    }

    const rows = itens.map((it) => {
      const urlAudio = `https://drive.google.com/uc?export=download&id=${it.idDrive}`;
      return {
        area: it.area || "Estatuto da Criança e do Adolescente (ECA)",
        tema: it.tema,
        sequencia: it.sequencia,
        titulo: it.titulo,
        descricao: it.descricao || `Audioaula sobre ${it.titulo} do Estatuto da Criança e do Adolescente (Lei nº 8.069/1990).`,
        url_audio: urlAudio,
        imagem_miniatura: "/assets/eca-kids.webp",
        tag: it.tag || "ECA",
      };
    });

    // Inserção em batches de 50
    let inseridos = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { data, error } = await admin
        .from("audioaulas_acervo")
        .insert(chunk)
        .select("id");

      if (error) {
        console.error("Erro inserindo chunk:", error);
        throw error;
      }
      inseridos += data?.length || 0;
    }

    return json({ ok: true, totalRecebido: itens.length, inseridos });
  } catch (err) {
    console.error("[importar-audioaulas-eca] erro:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
