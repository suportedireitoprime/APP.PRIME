const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'migrations');

if (!fs.existsSync(dir)) {
  console.log('Migrations dir not found');
  process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
let totalReplacements = 0;
let modifiedFiles = 0;

// Look for auth.uid() or auth.jwt() etc that are NOT preceded by "select " (case insensitive, any whitespace)
const regex = /(?<!select\s+)(auth\.(uid|jwt|role|email)\(\))/gi;

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;
  
  const newContent = content.replace(regex, (match, p1) => {
    fileReplacements++;
    return `(select ${p1.toLowerCase()})`;
  });
  
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    totalReplacements += fileReplacements;
    modifiedFiles++;
    console.log(`Modified ${file}: ${fileReplacements} replacements`);
  }
}

console.log(`Done! Total replacements: ${totalReplacements} in ${modifiedFiles} files.`);
