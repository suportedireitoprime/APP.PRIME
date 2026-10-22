const fs = require('fs');

async function main() {
  const url = 'https://docs.google.com/spreadsheets/d/1Kp_5tFtIDVxqJInUOKX7k4VPreF4A8Pa4ZmoDeBaW9k/edit';
  const res = await fetch(url);
  const html = await res.text();
  
  // Extrai nomes de abas e gids
  const tabMatches = [...html.matchAll(/"name":"([^"]+)","gid":"?([0-9]+)"?/g)];
  const tabs = [...new Map(tabMatches.map(m => [m[2], { name: m[1], gid: m[2] }])).values()];
  console.log('Tabs in spreadsheet:', tabs);

  // Baixa cada aba como CSV
  for (const t of tabs) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/1Kp_5tFtIDVxqJInUOKX7k4VPreF4A8Pa4ZmoDeBaW9k/export?format=csv&gid=${t.gid}`;
    const csvRes = await fetch(csvUrl);
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const filename = `scripts/tab_${t.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
      fs.writeFileSync(filename, csvText, 'utf8');
      console.log(`Saved ${t.name} (${csvText.length} bytes) to ${filename}`);
    }
  }
}

main().catch(console.error);
