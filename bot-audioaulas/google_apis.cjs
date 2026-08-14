const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const HEADER = ['Artigos', 'Status', 'Lei seca', 'Link da audioaula', 'Índice'];
const STATUS_PROCESSING = 'Processando...';
const STATUS_DONE = 'Finalizado';
const DONE_STATUSES = new Set(['ok', 'finalizado', 'concluido', 'concluído']);

class GoogleServices {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    this.drive = null;
    this.sheets = null;
    this.rootFolderId = '1lsH2FvXEzE6C6qe9Hcin_cbsMHNXv0Oa';
    this.sheetId = '12Ucm_Rbi0Fsl9CI9FOlkiA-0SEgXGeVBxO35zfWiCbE';
  }

  async init() {
    if (!this.drive) {
      const authClient = await this.auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
    }
  }

  async getSheetInfo() {
    await this.init();
    const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
    const firstSheet = spreadsheet.data.sheets[0].properties;
    return { name: firstSheet.title, id: firstSheet.sheetId };
  }

  async getOrCreateFolder(folderName, parentFolderId) {
    await this.init();
    const safeName = String(folderName).replace(/'/g, "\\'");
    const res = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (res.data.files.length > 0) return res.data.files[0].id;

    console.log(`📁 Criando pasta: ${folderName}`);
    const folder = await this.drive.files.create({
      resource: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
      fields: 'id',
    });
    return folder.data.id;
  }

  async prepareFolders(lawName) {
    await this.init();
    let category = 'Leis Diversas';
    const lowerName = lawName.toLowerCase();
    if (lowerName.includes('código') || lowerName.includes('codigo')) category = 'Códigos';
    else if (lowerName.includes('estatuto')) category = 'Estatutos';
    else if (lowerName.includes('constituição')) category = 'Constituição';

    const categoryFolderId = await this.getOrCreateFolder(category, this.rootFolderId);
    return await this.getOrCreateFolder(lawName, categoryFolderId);
  }

  async uploadAudio(filePath, lawFolderId, articleName) {
    await this.init();
    console.log(`☁️ Fazendo upload do ${articleName} para o Drive...`);

    const file = await this.drive.files.create({
      resource: { name: `${articleName}.wav`, parents: [lawFolderId] },
      media: { mimeType: 'audio/wav', body: fs.createReadStream(filePath) },
      fields: 'id, webViewLink',
    });

    await this.drive.permissions.create({
      fileId: file.data.id,
      resource: { type: 'anyone', role: 'reader' },
    });

    return file.data.webViewLink;
  }

  async syncAndGetPending(leiId, supabase, limit = 10) {
    await this.init();
    const { name: sheetName, id: sheetRealId } = await this.getSheetInfo();
    const todosArtigos = await this.fetchAllArticles(leiId, supabase);
    const rows = await this.readRows(sheetName);
    const normalizedRows = this.normalizeRows(rows, todosArtigos);

    await this.writeSchemaColumns(sheetName, sheetRealId, normalizedRows);

    console.log(`🔍 Lendo a planilha... Buscando os próximos ${limit} artigos pendentes.`);
    const pendentes = [];
    const rowsToProcess = [];

    for (let i = 1; i < normalizedRows.length; i++) {
      const row = normalizedRows[i];
      const status = String(row[1] || '').trim().toLowerCase();
      const leiSeca = row[2] || '';
      const link = String(row[3] || '').trim();
      const id = row[4] || '';
      const isDone = DONE_STATUSES.has(status) && link;

      if (!isDone && id && leiSeca) {
        pendentes.push({
          rowNumber: i,
          id,
          numero: String(row[0] || '').replace(/^Artigo\s+/i, ''),
          titulo: row[0],
          texto: leiSeca,
        });
        rowsToProcess.push(i);
        if (pendentes.length >= limit) break;
      }
    }

    if (pendentes.length === 0) return [];
    await this.markRowsAsProcessing(sheetName, sheetRealId, rowsToProcess);
    return pendentes;
  }

  async updateRowToSuccess(rowNumber, artigoStr, link) {
    await this.init();
    const { name: sheetName, id: sheetRealId } = await this.getSheetInfo();

    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${sheetName}'!B${rowNumber + 1}`, values: [[STATUS_DONE]] },
          { range: `'${sheetName}'!D${rowNumber + 1}`, values: [[link]] },
        ],
      },
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: { sheetId: sheetRealId, startRowIndex: rowNumber, endRowIndex: rowNumber + 1, startColumnIndex: 0, endColumnIndex: 5 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.6, green: 0.9, blue: 0.6 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        }],
      },
    });
  }

  async fetchAllArticles(leiId, supabase) {
    console.log('📊 Sincronizando artigos do banco com a planilha...');
    const { data, error } = await supabase
      .from('vade_mecum_artigos')
      .select('id, numero, texto')
      .eq('lei_id', leiId)
      .ilike('texto', 'Art%')
      .order('ordem', { ascending: true });

    if (error) throw new Error(`Falha ao buscar artigos no Supabase: ${error.message}`);
    if (!data || data.length === 0) throw new Error('Nenhum artigo encontrado no banco para esta lei.');
    return data;
  }

  async readRows(sheetName) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `'${sheetName}'!A:F`,
    });
    return res.data.values || [];
  }

  normalizeRows(rows, todosArtigos) {
    const hasHeader = rows.length > 0 && this.isHeader(rows[0]);
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const existingById = new Map();
    const existingByArticle = new Map();

    for (const row of dataRows) {
      const normalized = this.normalizeExistingRow(row);
      if (!normalized) continue;
      if (normalized[4]) existingById.set(String(normalized[4]), normalized);
      if (normalized[0]) existingByArticle.set(String(normalized[0]).toLowerCase(), normalized);
    }

    const normalizedRows = [HEADER];

    for (const art of todosArtigos) {
      const artigoLabel = `Artigo ${art.numero}`;
      const previous = existingById.get(String(art.id)) || existingByArticle.get(artigoLabel.toLowerCase());
      normalizedRows.push([
        artigoLabel,
        previous?.[1] || '',
        art.texto || previous?.[2] || '',
        previous?.[3] || '',
        art.id,
      ]);
    }

    return normalizedRows;
  }

  normalizeExistingRow(row) {
    if (!row || row.length === 0 || this.isHeader(row)) return null;
    const article = String(row[0] || '').trim();
    if (!article) return null;

    const oldSchema = row.length >= 6 && !this.looksLikeLawText(row[2]);
    if (oldSchema) {
      return [article, row[1] || '', row[5] || '', row[2] || '', row[4] || ''];
    }

    return [article, row[1] || '', row[2] || '', row[3] || '', row[4] || ''];
  }

  isHeader(row) {
    const first = String(row?.[0] || '').trim().toLowerCase();
    return first === 'artigos' || first === 'artigo';
  }

  looksLikeLawText(value) {
    return /^Art\.|^Parágrafo|^§|^I\s*-|^II\s*-/i.test(String(value || '').trim());
  }

  async writeSchemaColumns(sheetName, sheetRealId, rows) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `'${sheetName}'!A1:E${rows.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: sheetRealId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.24 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            updateSheetProperties: {
              properties: { sheetId: sheetRealId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: sheetRealId, dimension: 'COLUMNS', startIndex: 0, endIndex: 5 },
            },
          },
        ],
      },
    });
  }

  async markRowsAsProcessing(sheetName, sheetRealId, rowsToProcess) {
    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: rowsToProcess.map((rowIndex) => ({
          range: `'${sheetName}'!B${rowIndex + 1}`,
          values: [[STATUS_PROCESSING]],
        })),
      },
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        requests: rowsToProcess.map((rowIndex) => ({
          repeatCell: {
            range: { sheetId: sheetRealId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: 5 },
            cell: { userEnteredFormat: { backgroundColor: { red: 1.0, green: 0.64, blue: 0.0 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        })),
      },
    });
  }
}

module.exports = new GoogleServices();
