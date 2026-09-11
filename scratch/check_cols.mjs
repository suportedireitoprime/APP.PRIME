async function checkCols() {
  const url = `https://docs.google.com/spreadsheets/d/1o2wPWhSHjAWZGJ3ZF5T1EOHVfHyB1B7K/export?format=csv&gid=1890035872`;
  const response = await fetch(url);
  const text = await response.text();
  
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  console.log("Columns:", headers);
}

checkCols().catch(console.error);
