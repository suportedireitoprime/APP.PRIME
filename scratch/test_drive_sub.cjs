const fs = require('fs');

async function test() {
  const folderId = "1tN2wQLvjUlis3JDf13nz8HZOubxfkSW7";
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (match) {
    let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
    jsonStr = jsonStr.replace(/\\\//g, '/');
    const data = JSON.parse(jsonStr);
    console.log("data[0] length:", Array.isArray(data[0]) ? data[0].length : typeof data[0]);
    if (Array.isArray(data[0])) {
      const titles = data[0].map(item => Array.isArray(item) ? item[2] : null).filter(Boolean);
      console.log("Titles found in data[0]:", titles.length);
      console.log("Last 5 titles:", titles.slice(-5));
    }
    for (let i = 0; i < data.length; i++) {
      console.log(`data[${i}]:`, JSON.stringify(data[i]));
    }
  }
}

test().catch(console.error);
