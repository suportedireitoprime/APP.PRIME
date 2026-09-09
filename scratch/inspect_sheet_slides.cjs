const fs = require('fs');
const path = require('path');

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

const file = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\sheets\\35_453664107_35._Crimes_Praticados_por_Part.csv';
const content = fs.readFileSync(file, 'utf8');
const rows = parseCSV(content);

console.log('Headers count:', rows[0].length);
rows[0].forEach((h, i) => console.log(`Col ${i}: ${h}`));

const aula1 = rows[1];
console.log('\n--- AULA 1 INFO ---');
console.log('Aula col 0:', aula1[0]);
console.log('Aula col 1 (Titulo):', aula1[1]);

// Let's inspect slides from col 18 to end (which are usually slides 16-22)
for (let c = 18; c < aula1.length; c++) {
  console.log(`\n================== [Col ${c}] ${rows[0][c]} ==================`);
  console.log(aula1[c]);
}
