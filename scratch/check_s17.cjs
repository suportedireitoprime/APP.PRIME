const fs = require('fs');
const path = require('path');
const sheetsDir = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\sheets';
const content = fs.readFileSync(path.join(sheetsDir, '01_663617843_01._Crimes_Contra_a_Famlia.csv'), 'utf8');

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal);
      if (currentRow.length > 1 || currentRow[0] !== '') rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}

const rows = parseCSV(content);
const headers = rows[0];
const s17Idx = headers.findIndex(h => h.includes('Slide_17'));
console.log('Slide 17 header:', headers[s17Idx]);
console.log('--- ROW 1 SLIDE 17 CONTENT ---');
console.log(rows[1][s17Idx]);
