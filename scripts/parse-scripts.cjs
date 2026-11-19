const fs = require('fs');

const html = fs.readFileSync('scripts/pilulas_drive.html', 'utf8');

// Look for data structures inside script tags
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

// Let's search for drive file/folder ID pattern: 28 to 44 alphanumeric characters + dashes/underscores
// Typically paired with name or mimeType
const matches = [];

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  
  // Look for occurrences of "application/vnd.google-apps" or ".mp3" or ".pdf"
  if (s.includes('application/vnd.google-apps') || s.includes('.mp3') || s.includes('Direito') || s.includes('Pílulas')) {
    console.log(`Analyzing script ${i}...`);
    
    // Look for JSON or arrays
    // Match ["ID", ... "NAME" ...]
    const itemRegex = /\["([a-zA-Z0-9_-]{25,45})",\["([^"]+)"/g;
    let m;
    let count = 0;
    while ((m = itemRegex.exec(s)) !== null) {
      matches.push({ id: m[1], name: m[2], script: i });
      count++;
    }
    console.log(`  Found ${count} with pattern 1`);

    // Another pattern: ["ID","NAME",...] or [["ID",..."NAME"]
    const itemRegex2 = /"([a-zA-Z0-9_-]{28,40})","([^"]+)"/g;
    let count2 = 0;
    while ((m = itemRegex2.exec(s)) !== null) {
      if (!m[2].includes('http') && !m[2].includes('/') && m[2].length > 3) {
        matches.push({ id: m[1], name: m[2], script: i });
        count2++;
      }
    }
    console.log(`  Found ${count2} with pattern 2`);
  }
}

console.log('Total matches found:', matches.length);
const unique = new Map();
for (const m of matches) {
  if (!unique.has(m.id)) {
    unique.set(m.id, m);
  }
}

console.log('Unique items:', unique.size);
for (const [id, item] of unique) {
  console.log(`- ${item.name} (${id})`);
}
