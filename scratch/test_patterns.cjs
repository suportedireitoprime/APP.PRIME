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

const sheetsDir = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\sheets';
const files = fs.readdirSync(sheetsDir);

console.log(`Checking ${files.length} sheets...`);

// Sample sheets to inspect: sheet 1, sheet 5, sheet 10, sheet 20, sheet 35, sheet 44
const sampleFiles = [files[0], files[4], files[9], files[19], files[34], files[files.length - 1]];

sampleFiles.forEach(file => {
  const content = fs.readFileSync(path.join(sheetsDir, file), 'utf8');
  const rows = parseCSV(content);
  const headers = rows[0];
  const r = rows[1]; // Aula 1 of that sheet
  if (!r) return;

  console.log(`\n==================== SHEET: ${file} (Aula: ${r[1]}) ====================`);
  // Look for Slide 17 (lacuna), 18 (flashcard 1), 19 (flashcard 2), 20 (OAB), 21 (Cebraspe)
  const colLacuna = headers.findIndex(h => /lacuna|exercicio/i.test(h));
  const colFlash1 = headers.findIndex(h => /flashcard.*conceito|flashcard.*1/i.test(h));
  const colFlash2 = headers.findIndex(h => /flashcard.*regra|flashcard.*2/i.test(h));
  const colOAB = headers.findIndex(h => /oab|multipla/i.test(h));
  const colCebraspe = headers.findIndex(h => /certo.*errado|cebraspe/i.test(h));

  console.log(`Columns found -> Lacuna: ${colLacuna}, Flash1: ${colFlash1}, Flash2: ${colFlash2}, OAB: ${colOAB}, Cebraspe: ${colCebraspe}`);

  if (colLacuna >= 0 && r[colLacuna]) {
    console.log(`\n[LACUNA SAMPLE]:\n${r[colLacuna].slice(0, 180)}...`);
  }
  if (colFlash1 >= 0 && r[colFlash1]) {
    console.log(`\n[FLASHCARD 1 SAMPLE]:\n${r[colFlash1].slice(0, 220)}...`);
  }
  if (colOAB >= 0 && r[colOAB]) {
    console.log(`\n[OAB SAMPLE]:\n${r[colOAB].slice(0, 250)}...`);
  }
  if (colCebraspe >= 0 && r[colCebraspe]) {
    console.log(`\n[CEBRASPE SAMPLE]:\n${r[colCebraspe].slice(0, 220)}...`);
  }
});
