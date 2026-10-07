const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function setup() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const folderId = '1lsH2FvXEzE6C6qe9Hcin_cbsMHNXv0Oa';

    console.log('📝 Criando planilha dentro da pasta...');
    const sheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'Audioaulas - Leis Secas (Robô)',
        },
      },
      fields: 'spreadsheetId, spreadsheetUrl',
    });

    const sheetId = sheet.data.spreadsheetId;
    console.log('✅ Planilha criada:', sheet.data.spreadsheetUrl);

    console.log('🔄 Movendo planilha para a pasta correta...');
    // A API create() cria na raiz do drive da Service Account. 
    // Precisamos mover para a pasta compartilhada.
    await drive.files.update({
      fileId: sheetId,
      addParents: folderId,
      fields: 'id, parents',
    });
    
    console.log('📋 Configurando colunas da planilha...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'A1:E1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Artigos', 'Status', 'Lei seca', 'Link da audioaula', 'Índice']],
      },
    });

    console.log('✅ Tudo pronto!');
    
    // Salva IDs localmente para o robô usar
    fs.writeFileSync(path.join(__dirname, 'drive_config.json'), JSON.stringify({
      folderId: folderId,
      sheetId: sheetId,
      sheetUrl: sheet.data.spreadsheetUrl
    }, null, 2));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

setup();
