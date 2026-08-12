const { google } = require('googleapis');
const path = require('path');

async function test() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'bot-audioaulas', 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const sheetId = '12Ucm_Rbi0Fsl9CI9FOlkiA-0SEgXGeVBxO35zfWiCbE';

  // 1. Append rows
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const firstSheetName = spreadsheet.data.sheets[0].properties.title;
  const sheetRealId = spreadsheet.data.sheets[0].properties.sheetId;

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${firstSheetName}'!A:D`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [
        ["Artigo 1", "Processando...", "", ""],
        ["Artigo 2", "Processando...", "", ""]
      ]
    }
  });

  const range = appendRes.data.updates.updatedRange;
  console.log("Appended range:", range);

  const match = range.match(/!A(\d+):[A-Z](\d+)/);
  if (match) {
    const startRow = parseInt(match[1], 10) - 1; // 0-indexed
    const endRow = parseInt(match[2], 10);

    // Color yellow
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetRealId,
                startRowIndex: startRow,
                endRowIndex: endRow,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 0 }
                }
              },
              fields: 'userEnteredFormat.backgroundColor'
            }
          }
        ]
      }
    });
    console.log("Painted yellow!");
    
    // Simulate updating row 1 (the first one appended) to green
    const rowToUpdate = startRow;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `'${firstSheetName}'!B${rowToUpdate + 1}:D${rowToUpdate + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ["http://link", "OK", "Data"]
        ]
      }
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetRealId,
                startRowIndex: rowToUpdate,
                endRowIndex: rowToUpdate + 1,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0, green: 1, blue: 0 } // Green
                }
              },
              fields: 'userEnteredFormat.backgroundColor'
            }
          }
        ]
      }
    });
    console.log("Updated to green!");
  }
}

test().catch(console.error);
