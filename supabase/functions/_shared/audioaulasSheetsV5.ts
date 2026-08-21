// Helpers de integração com a planilha Google Sheets das Audioaulas.
// Uma aba por área do Direito + uma aba "Prompts".

const GATEWAY = "https://sheets.googleapis.com/v4";

export const CAB_AREA = [
  "Ordem",
  "Tema",
  "Nº Aula",
  "Título da Audioaula",
  "Link do Áudio",
  "Status",
  "ID",
];
export const CAB_PROMPTS = ["ID", "Área", "Tema", "Nº Aula", "Prompt", "Conteúdo"];
export const ABA_PROMPTS = "Prompts";

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} ausente`);
  return v;
}

export function sheetId(): string {
  return env("AUDIOAULAS_SHEET_ID").trim();
}

async function gw(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      "X-Goog-Api-Key": env("GOOGLE_SHEETS_API_KEY"),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Sheets [${res.status}]: ${body.slice(0, 400)}`);
  }
  return res.json();
}

/** Nome de aba seguro (Sheets não aceita : \ / ? * [ ]). */
export function nomeAba(area: string): string {
  const limpo = (area || "Geral").replace(/[:\\/?*\[\]]/g, "-").trim().slice(0, 90);
  return limpo || "Geral";
}

function a1(aba: string, range: string) {
  return `'${aba.replace(/'/g, "''")}'!${range}`;
}

export async function listarAbas(): Promise<string[]> {
  const data = await gw(`/spreadsheets/${sheetId()}?fields=sheets.properties.title`);
  return (data.sheets ?? []).map((s: any) => s.properties.title as string);
}

export async function garantirAba(titulo: string, cabecalho: string[]) {
  const abas = await listarAbas();
  if (!abas.includes(titulo)) {
    await gw(`/spreadsheets/${sheetId()}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titulo } } }] }),
    });
  }
  const atual = await lerValores(titulo, "A1:T1");
  const primeira = atual[0] ?? [];
  if (primeira.join("|") !== cabecalho.join("|")) {
    await escreverRange(titulo, `A1`, [cabecalho]);
  }
  return primeira;
}

/** Remove valores residuais de colunas que não pertencem mais ao layout atual. */
export async function limparColunasAntigas(aba: string, primeiraColuna: string) {
  await gw(`/spreadsheets/${sheetId()}/values/${encodeURIComponent(a1(aba, `${primeiraColuna}:Z`)).replace(/%21/g, "!")}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Reinicia os dados da aba Prompts sem remover o cabeçalho definitivo. */
export async function limparDadosPrompts() {
  await gw(`/spreadsheets/${sheetId()}/values/${encodeURIComponent(a1(ABA_PROMPTS, "A2:F")).replace(/%21/g, "!")}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Apaga as linhas de dados de uma aba de área, mantendo o cabeçalho. */
export async function limparDadosArea(aba: string) {
  await gw(`/spreadsheets/${sheetId()}/values/${encodeURIComponent(a1(aba, "A2:Z")).replace(/%21/g, "!")}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function lerValores(aba: string, range: string): Promise<string[][]> {
  try {
    const data = await gw(
      `/spreadsheets/${sheetId()}/values/${encodeURIComponent(a1(aba, range)).replace(/%21/g, "!")}`,
    );
    return (data.values ?? []) as string[][];
  } catch (e) {
    // aba recém-criada/limpa: intervalo maior que a grade
    if (String((e as Error).message).includes("exceeds grid limits")) return [];
    throw e;
  }
}

/** Garante que a aba tenha ao menos `linhas` x `colunas` de grade. */
export async function garantirGrade(aba: string, linhas: number, colunas: number) {
  const data = await gw(`/spreadsheets/${sheetId()}?fields=sheets.properties`);
  const props = (data.sheets ?? [])
    .map((s: any) => s.properties)
    .find((p: any) => p.title === aba);
  if (!props) return;
  const rowCount = props.gridProperties?.rowCount ?? 0;
  const columnCount = props.gridProperties?.columnCount ?? 0;
  if (rowCount >= linhas && columnCount >= colunas) return;
  await gw(`/spreadsheets/${sheetId()}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: props.sheetId,
            gridProperties: {
              rowCount: Math.max(rowCount, linhas),
              columnCount: Math.max(columnCount, colunas),
            },
          },
          fields: "gridProperties.rowCount,gridProperties.columnCount",
        },
      }],
    }),
  });
}

export async function escreverRange(aba: string, inicio: string, values: any[][]) {
  const range = a1(aba, inicio);
  await gw(
    `/spreadsheets/${sheetId()}/values/${encodeURIComponent(range).replace(/%21/g, "!")}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values }) },
  );
}

export async function escreverLotes(updates: { aba: string; inicio: string; values: any[][] }[]) {
  if (!updates.length) return;
  await gw(`/spreadsheets/${sheetId()}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: updates.map((u) => ({ range: a1(u.aba, u.inicio), values: u.values })),
    }),
  });
}

export interface AulaSheet {
  id: string;
  ordem: number;
  tema: string;
  numero: number;
  titulo: string;
  prompt: string;
  conteudo: string;
  audio_url: string | null;
  publicado: boolean;
}

/**
 * Faz upsert das aulas de um curso na aba da área e na aba Prompts.
 * Preserva o "Link do Áudio" já digitado manualmente na planilha.
 */
export async function sincronizarCurso(area: string, aulas: AulaSheet[]) {
  const aba = nomeAba(area);
  const cabecalhoAreaAnterior = await garantirAba(aba, CAB_AREA);
  await garantirAba(ABA_PROMPTS, CAB_PROMPTS);
  await garantirGrade(aba, aulas.length + 200, CAB_AREA.length);
  await garantirGrade(ABA_PROMPTS, aulas.length + 200, CAB_PROMPTS.length);

  // No layout antigo, Resumo ocupava E e deslocava Link/Status/ID para F/G/H.
  // Usamos os índices do cabeçalho anterior para reaproveitar links sem tratar o resumo como URL.
  const indiceIdAnterior = cabecalhoAreaAnterior.indexOf("ID");
  const indiceLinkAnterior = cabecalhoAreaAnterior.indexOf("Link do Áudio");
  const indiceIdArea = indiceIdAnterior >= 0 ? indiceIdAnterior : 6;
  const indiceLinkArea = indiceLinkAnterior >= 0 ? indiceLinkAnterior : 4;

  const [linhasArea, linhasPrompts] = await Promise.all([
    lerValores(aba, `A2:Z${aulas.length + 200}`),
    lerValores(ABA_PROMPTS, `A2:F${aulas.length + 200}`),
  ]);

  const idxArea = new Map<string, number>();
  linhasArea.forEach((l, i) => { if (l[indiceIdArea]) idxArea.set(String(l[indiceIdArea]).trim(), i + 2); });
  const idxPrompt = new Map<string, number>();
  linhasPrompts.forEach((l, i) => { if (l[0]) idxPrompt.set(String(l[0]).trim(), i + 2); });

  const updates: { aba: string; inicio: string; values: any[][] }[] = [];
  const novasArea: any[][] = [];
  const novosPrompts: any[][] = [];

  for (const a of aulas) {
    const linhaExistente = idxArea.get(a.id);
    const linkPlanilha = linhaExistente
      ? String(linhasArea[linhaExistente - 2]?.[indiceLinkArea] ?? "").trim()
      : "";
    const link = linkPlanilha || a.audio_url || "";
    const status = link ? (a.publicado ? "Publicada" : "Com áudio") : "Sem áudio";
    const row = [a.ordem, a.tema, a.numero, a.titulo, link, status, a.id];
    if (linhaExistente) updates.push({ aba, inicio: `A${linhaExistente}`, values: [row] });
    else novasArea.push(row);

    const pRow = [a.id, area, a.tema, a.numero, a.prompt, (a.conteudo || "").slice(0, 45000)];
    const pLinha = idxPrompt.get(a.id);
    if (pLinha) updates.push({ aba: ABA_PROMPTS, inicio: `A${pLinha}`, values: [pRow] });
    else novosPrompts.push(pRow);
  }

  if (novasArea.length) {
    await garantirGrade(aba, linhasArea.length + 1 + novasArea.length, CAB_AREA.length);
    updates.push({ aba, inicio: `A${linhasArea.length + 2}`, values: novasArea });
  }
  if (novosPrompts.length) {
    await garantirGrade(ABA_PROMPTS, linhasPrompts.length + 1 + novosPrompts.length, CAB_PROMPTS.length);
    updates.push({ aba: ABA_PROMPTS, inicio: `A${linhasPrompts.length + 2}`, values: novosPrompts });
  }

  await escreverLotes(updates);
  // Garante que Título/Resumo e quaisquer resíduos do layout antigo não reapareçam.
  await Promise.all([
    limparColunasAntigas(aba, "H"),
    limparColunasAntigas(ABA_PROMPTS, "G"),
  ]);
  return { atualizadas: updates.length, novas: novasArea.length };
}

/** Lê todas as abas de área e devolve os pares ID -> link do áudio preenchidos. */
export async function lerLinks(): Promise<Map<string, string>> {
  const abas = (await listarAbas()).filter((t) => t !== ABA_PROMPTS);
  const mapa = new Map<string, string>();
  for (const aba of abas) {
    let linhas: string[][] = [];
    try { linhas = await lerValores(aba, "A2:G10000"); } catch { continue; }
    for (const l of linhas) {
      const id = String(l[6] ?? "").trim();
      const link = String(l[4] ?? "").trim();
      if (id && link) mapa.set(id, link);
    }
  }
  return mapa;
}
