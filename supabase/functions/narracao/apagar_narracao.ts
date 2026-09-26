// Handler para exclusão definitiva de narração no Supabase (DB + Storage)
// Executado com service_role para contornar limitações de RLS do frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { tabela_nome, artigo_numero } = body;

    if (!tabela_nome || artigo_numero === undefined || artigo_numero === null) {
      return new Response(JSON.stringify({ error: "tabela_nome e artigo_numero são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const numLimpo = String(artigo_numero).replace(/^[Aa]rt\.?\s*|^[Aa]rtigo\s*/i, "").trim();
    const digitos = numLimpo.replace(/\D/g, "");

    // Variantes de número
    const variantesSet = new Set<string>([
      String(artigo_numero).trim(),
      numLimpo,
      `Art. ${numLimpo}`,
      `Artigo ${numLimpo}`,
    ]);
    if (digitos) {
      variantesSet.add(digitos);
      variantesSet.add(`${digitos}º`);
      variantesSet.add(`${digitos}°`);
      variantesSet.add(`${digitos}o`);
      variantesSet.add(`Art. ${digitos}`);
      variantesSet.add(`Art. ${digitos}º`);
      variantesSet.add(`Artigo ${digitos}`);
      variantesSet.add(`Artigo ${digitos}º`);
    }
    const variantes = Array.from(variantesSet);

    // Aliases da tabela
    const lowerTab = tabela_nome.toLowerCase();
    const aliasesSet = new Set<string>([
      tabela_nome,
      lowerTab,
      tabela_nome.toUpperCase(),
      tabela_nome.replace(/^[a-z0-9]+_/i, ""),
    ]);
    if (lowerTab.includes("penal") && !lowerTab.includes("processo")) {
      aliasesSet.add("CP_CODIGO_PENAL");
      aliasesSet.add("codigo_penal");
      aliasesSet.add("cp");
    } else if (lowerTab.includes("civil") && !lowerTab.includes("processo")) {
      aliasesSet.add("CC_CODIGO_CIVIL");
      aliasesSet.add("codigo_civil");
      aliasesSet.add("cc");
    }
    const aliases = Array.from(aliasesSet);

    // 1. Busca os registros para identificar os arquivos no Storage
    const { data: rows } = await supabase
      .from("narracoes_artigos")
      .select("audio_url, word_timings")
      .in("tabela_nome", aliases)
      .in("artigo_numero", variantes);

    const storagePaths: string[] = [];
    (rows || []).forEach((r: any) => {
      if (r.audio_url && typeof r.audio_url === "string" && r.audio_url.includes("/audios/")) {
        const m = r.audio_url.match(/\/audios\/([^?]+)/);
        if (m?.[1]) storagePaths.push(decodeURIComponent(m[1]));
      }
      if (r.word_timings && typeof r.word_timings === "object") {
        const partes = (r.word_timings as any).partes;
        if (Array.isArray(partes)) {
          for (const p of partes) {
            if (p.audioUrl && p.audioUrl.includes("/audios/")) {
              const m = p.audioUrl.match(/\/audios\/([^?]+)/);
              if (m?.[1]) storagePaths.push(decodeURIComponent(m[1]));
            }
          }
        }
      }
    });

    // Padrões convencionais de arquivos para garantir remoção completa de versões antigas
    const safeNums = Array.from(new Set([numLimpo.replace(/[^a-zA-Z0-9]/g, "_"), digitos])).filter(Boolean);
    for (const t of aliases) {
      for (const s of safeNums) {
        storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_completo.wav`);
        storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_1.wav`);
        storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_2.wav`);
        storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_3.wav`);
        storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_caput.wav`);
        storagePaths.push(`narracoes/${t}/${s}.wav`);
        storagePaths.push(`narracoes/${t}/${s}.mp3`);
        storagePaths.push(`narracoes/${t}/${s}o.wav`);
        storagePaths.push(`narracoes/${t}/${s}o.mp3`);
        storagePaths.push(`narracoes/${t}/v5-hierarquia-epigrafe/${s}.wav`);
      }
    }

    const pathsUnicos = Array.from(new Set(storagePaths.filter(Boolean)));
    if (pathsUnicos.length > 0) {
      try {
        await supabase.storage.from("audios").remove(pathsUnicos);
      } catch (errStorage) {
        console.warn("[apagar_narracao] Aviso ao remover do storage:", errStorage);
      }
    }

    // 2. Remove da tabela narracoes_artigos
    const { error: delError, count } = await supabase
      .from("narracoes_artigos")
      .delete({ count: "exact" })
      .in("tabela_nome", aliases)
      .in("artigo_numero", variantes);

    if (delError) {
      throw new Error(`Erro ao deletar de narracoes_artigos: ${delError.message}`);
    }

    // 3. Atualiza tabela vade_mecum_artigos limpando narracao_url se existir
    try {
      const { data: leis } = await supabase
        .from("vade_mecum_leis")
        .select("id")
        .in("slug", aliases)
        .limit(2);

      if (leis && leis.length > 0) {
        const leiIds = leis.map((l: any) => l.id);
        await supabase
          .from("vade_mecum_artigos")
          .update({ narracao_url: null })
          .in("lei_id", leiIds)
          .in("numero", variantes);
      }
    } catch (vmErr) {
      console.warn("[apagar_narracao] Aviso ao limpar narracao_url em vade_mecum_artigos:", vmErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Narração do artigo ${artigo_numero} excluída com sucesso`,
        deleted_records: count,
        storage_files_cleaned: pathsUnicos.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[apagar_narracao] Erro geral:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao apagar narração" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};
