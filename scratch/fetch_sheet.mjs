import fs from 'fs';

async function fetchCSV() {
  const url = 'https://docs.google.com/spreadsheets/d/1o2wPWhSHjAWZGJ3ZF5T1EOHVfHyB1B7K/export?format=csv&gid=0'; // Assuming gid=0 is the first sheet
  const response = await fetch(url);
  const text = await response.text();
  fs.writeFileSync('scratch/direito_penal.csv', text);
  console.log('CSV downloaded:', text.substring(0, 500) + '...');
}

fetchCSV().catch(console.error);
