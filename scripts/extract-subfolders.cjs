const fs = require('fs');

const html = fs.readFileSync('scripts/pilulas_drive.html', 'utf8');

// Match aria-label="... Shared folder" and ssk='...:([ID])-0-16'
const folderRegex = /aria-label="([^"]+?)(?:\s+Shared)?\s+folder"[^>]*ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'/g;

let m;
const folders = [];
while ((m = folderRegex.exec(html)) !== null) {
  folders.push({ name: m[1].trim(), id: m[2] });
}

// Also try reverse order: ssk then aria-label
const folderRegex2 = /ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'[^>]*aria-label="([^"]+?)(?:\s+Shared)?\s+folder"/g;
while ((m = folderRegex2.exec(html)) !== null) {
  if (!folders.some(f => f.id === m[1])) {
    folders.push({ name: m[2].trim(), id: m[1] });
  }
}

console.log(`Found ${folders.length} subfolders in Pílulas:`);
for (const f of folders) {
  console.log(`- ${f.name}: https://drive.google.com/drive/folders/${f.id}`);
}
