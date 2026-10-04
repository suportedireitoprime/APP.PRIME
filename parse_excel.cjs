const xlsx = require('xlsx');
const wb = xlsx.readFile('simulados_oab.xlsx');
console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
    const data = xlsx.utils.sheet_to_json(wb.Sheets[name]);
    console.log(`\n=== Sheet: ${name} ===`);
    console.log(data.slice(0, 1));
}
