const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

const ignorePatterns = [
  /favicon/i,
  /icon-\d+/i,
  /apple-touch/i,
  /og-image/i,
  /ministros_offline/i
];

async function run() {
  const allFiles = [...(await getFiles('src')), ...(await getFiles('public'))];
  
  const targetFiles = allFiles.filter(f => {
    const isImage = /\.(png|jpe?g)$/i.test(f);
    if (!isImage) return false;
    
    // Check ignore patterns
    for (const pattern of ignorePatterns) {
      if (pattern.test(f.replace(/\\/g, '/'))) return false;
    }
    return true;
  });

  console.log(`Found ${targetFiles.length} images to convert.`);

  let totalOldSize = 0;
  let totalNewSize = 0;
  const replacements = [];

  for (const file of targetFiles) {
    const ext = path.extname(file);
    const oldSize = (await stat(file)).size;
    totalOldSize += oldSize;

    const newFile = file.slice(0, -ext.length) + '.webp';
    await sharp(file)
      .webp({ quality: 80, effort: 6 })
      .toFile(newFile);
    
    const newSize = (await stat(newFile)).size;
    totalNewSize += newSize;
    
    await unlink(file);

    const oldName = path.basename(file);
    const newName = path.basename(newFile);
    replacements.push({ oldName, newName });
    console.log(`Converted ${oldName} (${(oldSize/1024).toFixed(2)} KB) -> ${(newSize/1024).toFixed(2)} KB`);
  }

  // Search and replace in codebase
  const codeFiles = await getFiles('src');
  codeFiles.push(path.resolve('index.html'));
  
  for (const file of codeFiles) {
    if (/\.(tsx?|jsx?|css|html)$/i.test(file)) {
      let content = await readFile(file, 'utf8');
      let changed = false;
      for (const rep of replacements) {
        if (content.includes(rep.oldName)) {
          // Replace using string replacement (not perfect for all cases, but works for explicit imports/src)
          // We can use a regex to ensure we match the exact string
          const regex = new RegExp(rep.oldName.replace(/\./g, '\\.'), 'g');
          content = content.replace(regex, rep.newName);
          changed = true;
        }
      }
      if (changed) {
        await writeFile(file, content, 'utf8');
      }
    }
  }

  const saved = totalOldSize - totalNewSize;
  console.log(`\nDONE! Saved ${(saved / 1024 / 1024).toFixed(2)} MB in total.`);
}

run().catch(console.error);
