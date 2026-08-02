// Importa (ou atualiza) as questões de uma planilha do Google Sheets.
// Body: { spreadsheetId, sheetName, nome?, cargoId?, planilhaId?, offset?, limite? }
import {
  corsHeaders, json, adminClient, exigirAdmin,
  sheetsValores, mapearCabecalho, slugify, sha256Hex,
} from "../_shared/questoes-sheets.ts";

const CORES = ["#8B5CF6", "#A78BFA", "#7C3AED", "#6D28D9", "#C084FC", "#9333EA"];
const LOTE = 2000; // linhas por chamada

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = exigirAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json().catch(() => ({}));
    const spreadsheetId = String(body.spreadsheetId ?? "").trim();
    const sheetName = String(body.sheetName ?? "").trim();
    const nome = String(body.nome ?? sheetName ?? "Cargo").trim();
    const offset = Number(body.offset ?? 0);
    const limite = Math.min(Number(body.limite ?? LOTE), LOTE);

    if (!spreadsheetId || !sheetName) return json({ error: "spreadsheetId e sheetName são obrigatórios" }, 400);

    const admin = adminClient();

    // ---- cargo ----
    const nomeCargo = nome.replace(/\s*[-–]\s*quest[oõ]es.*$/i, "").trim() || nome;
    const slug = slugify(nomeCargo);
    let cargoId = body.cargoId as string | undefined;
    if (!cargoId) {
      const { data: existente } = await admin
        .from("questoes_cargos").select("id").eq("slug", slug).maybeSingle();
      if (existente) cargoId = existente.id;
      else {
        const { count } = await admin.from("questoes_cargos").select("id", { count: "exact", head: true });
        const { data: novo, error } = await admin
          .from("questoes_cargos")
          .insert({
            nome: nomeCargo,
            slug,
            spreadsheet_id: spreadsheetId,
            cor: CORES[(count ?? 0) % CORES.length],
            ordem: count ?? 0,
          })
          .select("id").single();
        if (error) throw error;
        cargoId = novo.id;
      }
    }

    // ---- planilha ----
    let planilhaId = body.planilhaId as string | undefined;
    if (!planilhaId) {
      const { data: pl } = await admin
        .from("questoes_planilhas").select("id")
        .eq("spreadsheet_id", spreadsheetId).eq("sheet_name", sheetName).maybeSingle();
      if (pl) planilhaId = pl.id;
      else {
        const { data: novaPl, error } = await admin
          .from("questoes_planilhas")
          .insert({
            cargo_id: cargoId,
            spreadsheet_id: spreadsheetId,
            sheet_name: sheetName,
            apelido: nomeCargo,
            spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          })
          .select("id").single();
        if (error) throw error;
        planilhaId = novaPl.id;
      }
    }

    // ---- cabeçalho ----
    const headerRows = await sheetsValores(spreadsheetId, `${sheetName}!A1:AZ1`);
    const header = headerRows[0] ?? [];
    const map = mapearCabecalho(header);
    if (map.enunciado === undefined) {
      return json({ error: "Coluna 'Enunciado' não encontrada na planilha", cabecalho: header }, 400);
    }
    await admin.from("questoes_planilhas").update({ mapeamento: map }).eq("id", planilhaId);

    // ---- linhas ----
    const inicio = 2 + offset;
    const fim = inicio + limite - 1;
    const linhas = await sheetsValores(spreadsheetId, `${sheetName}!A${inicio}:AZ${fim}`);

    const cel = (r: string[], k: string) => {
      const i = map[k];
      if (i === undefined) return null;
      const v = (r[i] ?? "").toString().trim();
      return v || null;
    };

    const rows: any[] = [];
    let ignoradas = 0;
    for (const r of linhas) {
      const enunciado = cel(r, "enunciado");
      if (!enunciado) { ignoradas++; continue; }
      const idExterno = cel(r, "id_externo");
      const hash = await sha256Hex(`${spreadsheetId}|${sheetName}|${idExterno ?? enunciado.slice(0, 300)}`);
      const anoRaw = cel(r, "ano");
      const ano = anoRaw && /^\d{4}$/.test(anoRaw) ? Number(anoRaw) : null;
      const disciplina = cel(r, "disciplina");
      rows.push({
        hash_dedup: hash,
        id_externo: idExterno,
        cargo_id: cargoId,
        cargo: cel(r, "cargo") ?? nomeCargo,
        planilha_id: planilhaId,
        origem: "sheets",
        nivel: "padrao",
        disciplina,
        area: disciplina,
        assunto: cel(r, "assunto"),
        tema: cel(r, "assunto"),
        tema_central: cel(r, "tema_central"),
        ano,
        banca: cel(r, "banca"),
        orgao: cel(r, "orgao"),
        prova: cel(r, "prova"),
        numero_questao: cel(r, "numero_questao"),
        texto_associado: cel(r, "texto_associado"),
        imagem_url: cel(r, "imagem_url"),
        url_questao: cel(r, "url_questao"),
        data_extracao: cel(r, "data_extracao"),
        enunciado,
        alt_a: cel(r, "alt_a"),
        alt_b: cel(r, "alt_b"),
        alt_c: cel(r, "alt_c"),
        alt_d: cel(r, "alt_d"),
        alt_e: cel(r, "alt_e"),
        gabarito_oficial: cel(r, "gabarito_oficial"),
        gabarito_comentado: cel(r, "gabarito_comentado"),
        comentario_curtido: cel(r, "comentario_curtido"),
      });
    }

    // dedup dentro do próprio lote
    const vistos = new Set<string>();
    const unicas = rows.filter((r) => (vistos.has(r.hash_dedup) ? false : (vistos.add(r.hash_dedup), true)));

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
      .from("questoes").select("id", { count: "exact", head: true }).eq("planilha_id", planilhaId);
    const { count: totalCargo } = await admin
      .from("questoes").select("id", { count: "exact", head: true }).eq("cargo_id", cargoId);

    const { data: plAtual } = await admin
      .from("questoes_planilhas").select("linhas_lidas").eq("id", planilhaId).maybeSingle();
    const lidasAntes = offset === 0 ? 0 : (plAtual?.linhas_lidas ?? 0);
    const linhasLidas = Math.max(lidasAntes, offset + linhas.length);

    await admin.from("questoes_planilhas")
      .update({ ultima_sync: new Date().toISOString(), total_importadas: total ?? 0, linhas_lidas: linhasLidas })
      .eq("id", planilhaId);
    await admin.from("questoes_cargos")
      .update({ total_questoes: totalCargo ?? 0 }).eq("id", cargoId);

    await admin.from("questoes_sync_log").insert({
      planilha_id: planilhaId,
      origem: "manual",
      ok: erros === 0,
      processadas: linhas.length,
      inseridas,
      ignoradas,
      erros,
      total_atual: total ?? 0,
      mensagem: `${nomeCargo} • linhas ${inicio}-${fim}`,
    });

    const acabou = linhas.length < limite;
    return json({
      ok: true, cargoId, planilhaId,
      processadas: linhas.length, inseridas, ignoradas, erros,
      total: total ?? 0,
      proximoOffset: acabou ? null : offset + limite,
      concluido: acabou,
    });
  } catch (e) {
    console.error("[questoes-sheets-importar]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
