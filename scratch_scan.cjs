const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles('src');
const allContent = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const orphanFiles = [];
allFiles.forEach(file => {
  const baseName = path.basename(file, path.extname(file));
  // ignore standard files like main, App, vite-env, etc
  if (['main', 'App', 'vite-env.d', 'AppRoutes', 'Index', 'components', 'pages'].includes(baseName)) return;
  // If the basename doesn't appear anywhere else but itself
  const regex = new RegExp(baseName, 'g');
  const matches = allContent.match(regex);
  if (!matches || matches.length <= 1) {
    // maybe it is default exported and imported with another name? Usually no.
    orphanFiles.push(file);
  }
});

console.log(orphanFiles.join('\n'));
