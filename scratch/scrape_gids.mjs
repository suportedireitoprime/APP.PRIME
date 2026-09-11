import fs from 'fs';

async function scrapeGids() {
  const url = 'https://docs.google.com/spreadsheets/d/1o2wPWhSHjAWZGJ3ZF5T1EOHVfHyB1B7K/htmlview';
  const response = await fetch(url);
  const text = await response.text();
  
  // The HTML view usually contains sheet names and GIDs in a format like:
  // <li id="sheet-button-123456789">...<a href="...">Sheet Name</a>
  // Or in a javascript object.
  
  fs.writeFileSync('scratch/sheet_html.html', text);
  console.log('HTML saved.');
  
  // Let's try to extract from script tags
  const match = text.match(/gid=([^&"']+)/g);
  if (match) {
    const gids = [...new Set(match.map(m => m.replace('gid=', '')))];
    console.log('Found GIDs:', gids);
  } else {
    console.log('No GIDs found directly.');
  }
}

scrapeGids().catch(console.error);
