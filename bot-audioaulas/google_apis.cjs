const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleServices {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });
    this.drive = null;
    this.sheets = null;
    
    // Pasta raiz compartilhada
    this.rootFolderId = '1lsH2FvXEzE6C6qe9Hcin_cbsMHNXv0Oa'; 
    // Planilha oficial informada pelo usuário
    this.sheetId = '12Ucm_Rbi0Fsl9CI9FOlkiA-0SEgXGeVBxO35zfWiCbE';
  }

  async init() {
    if (!this.drive) {
      const authClient = await this.auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
    }
  }

  async getOrCreateFolder(folderName, parentFolderId) {
    await this.init();
    
    // Procura a pasta
    const res = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Se não existir, cria
    console.log(`📁 Criando pasta: ${folderName}`);
    const folder = await this.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });
    return folder.data.id;
  }

  async prepareFolders(lawName) {
    await this.init();
    let category = "Leis Diversas";
    const lowerName = lawName.toLowerCase();
    if (lowerName.includes('código') || lowerName.includes('codigo')) category = "Códigos";
    else if (lowerName.includes('estatuto')) category = "Estatutos";
    else if (lowerName.includes('constituição')) category = "Constituição";

    const categoryFolderId = await this.getOrCreateFolder(category, this.rootFolderId);
    return await this.getOrCreateFolder(lawName, categoryFolderId);
  }

  async uploadAudio(filePath, lawFolderId, articleName) {
    await this.init();
    
    console.log(`☁️ Fazendo upload do ${articleName} para o Drive...`);
    const fileMetadata = {
      name: `${articleName}.wav`,
      parents: [lawFolderId]
    };
    const media = {
      mimeType: 'audio/wav',
      body: fs.createReadStream(filePath)
    };

    const file = await this.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    await this.drive.permissions.create({
      fileId: file.data.id,
      resource: { type: 'anyone', role: 'reader' }
    });

    return file.data.webViewLink;
  }

  async syncAndGetPending(leiId, supabase, limit = 10) {
    await this.init();
    
    // 1. Ler a planilha atual
    const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
    const firstSheetName = spreadsheet.data.sheets[0].properties.title;
    const sheetRealId = spreadsheet.data.sheets[0].properties.sheetId;

    let res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `'${firstSheetName}'!A:F`
    });
    
    let rows = res.data.values || [];
    
    // 2. Se a planilha estiver vazia, pré-popular com TODOS os artigos
    if (rows.length <= 1) {
      console.log('📊 Planilha vazia! Buscando TODOS os artigos da lei no banco de dados para pré-popular...');
      const { data: todosArtigos } = await supabase
        .from('vade_mecum_artigos')
        .select('id, numero, texto')
        .eq('lei_id', leiId)
        .ilike('texto', 'Art%')
        .order('ordem', { ascending: true });

      if (!todosArtigos || todosArtigos.length === 0) {
        console.log('Nenhum artigo encontrado no banco para esta lei.');
        return [];
      }

      if (rows.length === 0) {
         rows = [["Artigo", "Status", "Link", "Data/Hora", "Supabase_ID", "Texto_Lei"]];
      }
      
      const valuesToInsert = [];
      const formattingRequests = [];
      let currentRowIndex = rows.length === 0 ? 1 : rows.length;

      for (let i = 0; i < todosArtigos.length; i++) {
        const art = todosArtigos[i];
        valuesToInsert.push([`Artigo ${art.numero}`, "Pendente", "", "", art.id, art.texto]);
        
        // Cores intercaladas de 10 em 10
        const batch = Math.floor(i / 10);
        const isLightYellow = batch % 2 !== 0;
        const color = isLightYellow ? 
          { red: 1.0, green: 0.95, blue: 0.6 } : // Amarelo claro
          { red: 1.0, green: 1.0, blue: 0.0 };   // Amarelo forte

        formattingRequests.push({
          repeatCell: {
            range: { sheetId: sheetRealId, startRowIndex: currentRowIndex + i, endRowIndex: currentRowIndex + i + 1, startColumnIndex: 0, endColumnIndex: 6 },
            cell: { userEnteredFormat: { backgroundColor: color } },
            fields: 'userEnteredFormat.backgroundColor'
          }
        });
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `'${firstSheetName}'!A1:F${currentRowIndex + todosArtigos.length}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: rows.length === 0 ? [rows[0], ...valuesToInsert] : valuesToInsert }
      });

      if (formattingRequests.length > 0) {
         for (let k = 0; k < formattingRequests.length; k += 500) {
            await this.sheets.spreadsheets.batchUpdate({
              spreadsheetId: this.sheetId,
              resource: { requests: formattingRequests.slice(k, k + 500) }
            });
         }
      }

      console.log('✅ Planilha pré-populada com sucesso com cores intercaladas!');
      
      // Recarregar os dados
      res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: `'${firstSheetName}'!A:F`
      });
      rows = res.data.values || [];
    }

    // 3. Procurar as primeiras N linhas que estão "Pendentes" ou com Link vazio
    console.log(`🔍 Lendo a planilha... Buscando os próximos ${limit} artigos pendentes.`);
    const pendentes = [];
    const rowsToProcess = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = row[1] || "";
      const link = row[2] || "";
      const id = row[4] || "";
      const texto = row[5] || "";

      if (status !== "OK" && !link && id) {
        pendentes.push({
          rowNumber: i, // 0-based
          id: id,
          numero: row[0].replace('Artigo ', ''),
          titulo: row[0],
          texto: texto
        });
        rowsToProcess.push(i);
        if (pendentes.length >= limit) break;
      }
    }

    if (pendentes.length === 0) return [];

    // 5. Marcar como "Processando..." (Laranja) na planilha
    const dataUpdate = rowsToProcess.map(rowIndex => ({
      range: `'${firstSheetName}'!B${rowIndex + 1}`,
      values: [["Processando..."]]
    }));

    const formattingRequests = rowsToProcess.map(rowIndex => ({
      repeatCell: {
        range: { sheetId: sheetRealId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: 6 },
        cell: { userEnteredFormat: { backgroundColor: { red: 1.0, green: 0.64, blue: 0.0 } } }, // Laranja
        fields: 'userEnteredFormat.backgroundColor'
      }
    }));

    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: { valueInputOption: 'USER_ENTERED', data: dataUpdate }
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: { requests: formattingRequests }
    });

    return pendentes;
  }

  async updateRowToSuccess(rowNumber, artigoStr, link) {
    await this.init();
    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
    const firstSheetName = spreadsheet.data.sheets[0].properties.title;
    const sheetRealId = spreadsheet.data.sheets[0].properties.sheetId;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `'${firstSheetName}'!A${rowNumber + 1}:D${rowNumber + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[artigoStr, "OK", link, dataHora]] }
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: { sheetId: sheetRealId, startRowIndex: rowNumber, endRowIndex: rowNumber + 1, startColumnIndex: 0, endColumnIndex: 6 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.6, green: 0.9, blue: 0.6 } } }, // Verde Suave
            fields: 'userEnteredFormat.backgroundColor'
          }
        }]
      }
    });
  }
}

module.exports = new GoogleServices();
