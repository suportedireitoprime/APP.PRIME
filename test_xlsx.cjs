const XLSX = require('./xlsx.js');

const workbook = XLSX.readFile('civil.xlsx');
console.log("Sheet names:");
console.log(workbook.SheetNames);

const firstSheetName = workbook.SheetNames[1];
const worksheet = workbook.Sheets[firstSheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("First sheet name:", firstSheetName);
console.log("Rows in first sheet:", data.length);
console.log("Row 0 (Header):", data[0]);
console.log("Row 1 (Data):", data[1].slice(0, 5)); // print first 5 cols of row 1
