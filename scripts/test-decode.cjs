const fs = require('fs');

async function inspect() {
  const res = await fetch('https://drive.google.com/drive/folders/1hlVR1MKbefB4zW1kv8_3YV8sTBqARx52', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return console.log('No match for DRIVE_ivd');

  const raw = match[1];
  let decoded = raw.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Fix double-escaped quotes like \\\\\"
  decoded = decoded.replace(/\\\\+"/g, '\\"');

  try {
    const data = JSON.parse(decoded);
    console.log('Parsed successfully!');
    const items = [];
    function extract(arr) {
      if (!Array.isArray(arr)) return;
      if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
        items.push({ id: arr[0], name: arr[2], mime: arr[3] });
      }
      for (const el of arr) if (Array.isArray(el)) extract(el);
    }
    extract(data);
    console.log(`Found ${items.length} items in Lavagem:`, items);
  } catch (err) {
    console.log('Error:', err.message);
    const m = err.message.match(/position (\d+)/);
    if (m) {
      const p = parseInt(m[1]);
      console.log('Around error:', JSON.stringify(decoded.substring(p - 50, p + 50)));
    }
  }
}

inspect();
