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

function formatarTitulo(raw: string): string {
  let t = raw.replace(/\.mp3$/i, "").trim();
  // Remove número de ordem no início ex: "1. ", "01 - "
  t = t.replace(/^[0-9]+[. \t\-–—]+/i, "").trim();
  // Remove prefixo EAOAB ou EOAB
  t = t.replace(/^(?:EAOAB|EOAB|OAB)\s*[-–—:]\s*/i, "").trim();
  t = t.replace(/^(?:EAOAB|EOAB|OAB)\s*[-–—:]\s*/i, "").trim();

  // Se inicia com Art.
  const m = t.match(/^art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?(?:\s*[-–—:]\s*(.*))?$/i);
  if (m) {
    const num = m[1].replace(/\s+/g, "").trim();
    const resto = (m[2] || "").trim();
    if (resto) {
      return `Art. ${num}: ${resto.charAt(0).toUpperCase() + resto.slice(1)}`;
    }
    return `Art. ${num}`;
  }
  return t;
}

interface ItemImport {
  idDrive: string;
  title: string;
  parentTitle: string;
  sequencia: number;
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

    const resultados = [];

    for (const it of itens) {
      const tituloLimpo = formatarTitulo(it.title);
      const seqStr = String(it.sequencia).padStart(3, "0");
      const storagePath = `audioaulas/oab/eoab_seq_${seqStr}.mp3`;

      let publicUrl = "";

      // 1. Download do Google Drive e Upload no Supabase Storage
      try {
        const dlUrl = `https://drive.usercontent.google.com/download?id=${it.idDrive}&export=download&authuser=0`;
        const resDl = await fetch(dlUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (!resDl.ok) {
          console.warn(`[importar-oab] Falha download item ${it.sequencia}: HTTP ${resDl.status}`);
          // Fallback para URL de stream direto caso o drive bloqueie
          publicUrl = `https://drive.google.com/uc?export=download&id=${it.idDrive}`;
        } else {
          const arrayBuf = await resDl.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);

          const { error: upErr } = await admin.storage
            .from("audios")
            .upload(storagePath, bytes, {
              contentType: "audio/mpeg",
              upsert: true,
            });

          if (upErr) {
            console.error(`[importar-oab] Falha upload item ${it.sequencia}:`, upErr);
            publicUrl = `https://drive.google.com/uc?export=download&id=${it.idDrive}`;
          } else {
            const { data: pubData } = admin.storage.from("audios").getPublicUrl(storagePath);
            publicUrl = pubData.publicUrl;
          }
        }
      } catch (dlErr) {
        console.warn(`[importar-oab] Exceção download/upload item ${it.sequencia}:`, dlErr);
        publicUrl = `https://drive.google.com/uc?export=download&id=${it.idDrive}`;
      }

      // 2. Upsert na tabela audioaulas_acervo
      // Checar se já existe registro com mesmo sequencia e area
      const { data: existing } = await admin
        .from("audioaulas_acervo")
        .select("id")
        .eq("area", "Estatuto da OAB")
        .eq("sequencia", it.sequencia)
        .limit(1);

      const payload = {
        area: "Estatuto da OAB",
        tema: it.parentTitle,
        sequencia: it.sequencia,
        titulo: tituloLimpo,
        descricao: "Lei nº 8.906/1994",
        url_audio: publicUrl,
        imagem_miniatura: "/assets/eoab-woman-fixed.webp",
        tag: "OAB",
      };

      if (existing && existing.length > 0) {
        await admin
          .from("audioaulas_acervo")
          .update(payload)
          .eq("id", existing[0].id);
        resultados.push({ sequencia: it.sequencia, titulo: tituloLimpo, status: "atualizado", url: publicUrl });
      } else {
        const { data: insData, error: insErr } = await admin
          .from("audioaulas_acervo")
          .insert(payload)
          .select("id")
          .single();

        if (insErr) {
          console.error(`[importar-oab] Erro ao inserir ${it.sequencia}:`, insErr);
          resultados.push({ sequencia: it.sequencia, titulo: tituloLimpo, status: "erro_insert", error: insErr.message });
        } else {
          resultados.push({ id: insData?.id, sequencia: it.sequencia, titulo: tituloLimpo, status: "inserido", url: publicUrl });
        }
      }
    }

    return json({
      ok: true,
      totalProcessado: itens.length,
      resultados,
    });
  } catch (err) {
    console.error("[importar-audioaulas-oab] erro fatal:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
