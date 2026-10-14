const fs = require('fs');

async function inspectRaw(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return;
  let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
  jsonStr = jsonStr.replace(/\\\//g, '/');
  const data = JSON.parse(jsonStr);

  console.log("Root array length:", data.length);
  data.forEach((item, idx) => {
    if (typeof item === 'string') console.log(`data[${idx}] string: ${item.slice(0, 100)}`);
    else if (Array.isArray(item)) console.log(`data[${idx}] array length: ${item.length}`);
    else console.log(`data[${idx}] type: ${typeof item}`);
  });

  // Check data[1] which often contains page token
  if (data[1]) {
    console.log("data[1]:", typeof data[1] === 'string' ? data[1] : JSON.stringify(data[1]).slice(0, 300));
  }
}

inspectRaw("1tN2wQLvjUlis3JDf13nz8HZOubxfkSW7").catch(console.error);
