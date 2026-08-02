// Lê a pasta do Google Drive e reporta o que há de novo:
// - planilhas (cargos) ainda não cadastradas
// - questões novas em planilhas já cadastradas
// Body: { cadastrar?: boolean }  -> quando true, cria os cargos/planilhas novos no Supabase
import {
  corsHeaders, json, adminClient, exigirAdmin,
  driveListarPlanilhas, sheetsAbas, sheetsValores, slugify,
} from "../_shared/questoes-sheets.ts";

const CORES = ["#8B5CF6", "#A78BFA", "#7C3AED", "#6D28D9", "#C084FC", "#9333EA"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = exigirAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json().catch(() => ({}));
    const cadastrar = body?.cadastrar === true || body?.apenasCargos === true;

    const admin = adminClient();
    const arquivos = await driveListarPlanilhas();
    if (!arquivos.length) {
      return json({ ok: true, planilhas: [], novosCargos: [], totalNovas: 0, aviso: "Nenhuma planilha encontrada na pasta do Drive" });
    }

    const { data: planilhasDb } = await admin
      .from("questoes_planilhas")
      .select("id, spreadsheet_id, sheet_name, total_importadas, linhas_lidas, ultima_sync, cargo_id, apelido");
    const cadastradas = new Map((planilhasDb ?? []).map((p: any) => [`${p.spreadsheet_id}::${p.sheet_name}`, p]));

    const planilhas: any[] = [];
    const novosCargos: string[] = [];
    let totalNovas = 0;

    const { count: cargosExistentes } = await admin
      .from("questoes_cargos").select("id", { count: "exact", head: true });
    let ordem = cargosExistentes ?? 0;

    for (const arq of arquivos) {
      let abas: string[] = [];
      try {
        abas = await sheetsAbas(arq.id);
      } catch (e) {
        console.error("abas", arq.name, String(e));
        planilhas.push({
          spreadsheetId: arq.id, nome: arq.name, sheetName: "", cargo: arq.name,
          totalLinhas: 0, jaImportadas: 0, novas: 0, conhecida: false,
          erro: String((e as Error)?.message ?? e).slice(0, 200),
        });
        continue;
      }
      const aba = abas.find((a) => /quest/i.test(a)) ?? abas[0];
      if (!aba) continue;

      let totalLinhas = 0;
      try {
        const col = await sheetsValores(arq.id, `${aba}!A2:A100000`);
        totalLinhas = col.filter((r) => (r?.[0] ?? "").toString().trim()).length;
      } catch (e) {
        console.error("contagem", arq.name, String(e));
      }

      const nomeCargo = arq.name.replace(/\s*[-–]\s*quest[oõ]es.*$/i, "").trim() || arq.name;
      const registrada = cadastradas.get(`${arq.id}::${aba}`);
      let jaImportadas = 0;
      let linhasLidas = 0;
      let conhecida = !!registrada;

      if (registrada) {
        const { count } = await admin
          .from("questoes").select("id", { count: "exact", head: true }).eq("planilha_id", registrada.id);
        jaImportadas = count ?? 0;
        linhasLidas = registrada.linhas_lidas ?? 0;
      } else {
        novosCargos.push(nomeCargo);
        if (cadastrar) {
          const slug = slugify(nomeCargo);
          let cargoId: string | undefined;
          const { data: cargoExistente } = await admin
            .from("questoes_cargos").select("id").eq("slug", slug).maybeSingle();
          if (cargoExistente) cargoId = cargoExistente.id;
          else {
            const { data: novoCargo, error } = await admin
              .from("questoes_cargos")
              .insert({
                nome: nomeCargo, slug, spreadsheet_id: arq.id,
                cor: CORES[ordem % CORES.length], ordem,
              })
              .select("id").single();
            if (error) console.error("cargo", nomeCargo, error.message);
            else { cargoId = novoCargo.id; ordem++; }
          }
          if (cargoId) {
            const { error: errPl } = await admin.from("questoes_planilhas").insert({
              cargo_id: cargoId,
              spreadsheet_id: arq.id,
              sheet_name: aba,
              apelido: nomeCargo,
              spreadsheet_url: `https://docs.google.com/spreadsheets/d/${arq.id}/edit`,
            });
            if (errPl) console.error("planilha", nomeCargo, errPl.message);
            else conhecida = true;
          }
        }
      }

      // linhas ainda não lidas da planilha (linhas em branco/duplicadas não contam como "novas")
      const novas = Math.max(0, totalLinhas - Math.max(linhasLidas, jaImportadas));
      totalNovas += novas;
      planilhas.push({
        spreadsheetId: arq.id,
        nome: arq.name,
        sheetName: aba,
        cargo: nomeCargo,
        totalLinhas,
        jaImportadas,
        linhasLidas,
        novas,
        conhecida,
        ultimaSync: registrada?.ultima_sync ?? null,
      });
    }

    return json({ ok: true, planilhas, novosCargos, totalNovas, cadastrados: cadastrar ? novosCargos.length : 0 });
  } catch (e) {
    console.error("[questoes-sheets-descobrir]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
