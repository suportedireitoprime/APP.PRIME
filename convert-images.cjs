const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const filesToConvert = [
  'src/assets/biblioteca/areas/direito-constitucional.png',
  'src/assets/biblioteca/areas/direito-do-trabalho.png',
  'src/assets/biblioteca/areas/direito-empresarial.png',
  'src/assets/biblioteca/areas/direito-internacional-privado.png',
  'src/assets/biblioteca/areas/direito-internacional-publico.png',
  'src/assets/biblioteca/areas/direito-desportivo.png',
  'src/assets/biblioteca/areas/direito-financeiro.png',
  'src/assets/biblioteca/areas/direito-civil.png',
  'src/assets/biblioteca/areas/direito-concorrencial.png',
  'src/assets/biblioteca/areas/direito-penal.png',
  'public/assets/praticar-flashcards.png',
  'public/assets/praticar-simulados.png',
  'public/assets/praticar-leiseca.png',
  'public/assets/praticar-questoes.png',
  'public/images/disciplinas/filosofia.png',
  'src/assets/covers/hero-leiseca-estudante.jpg',
  'public/assets/praticar-juiz.png',
  'src/assets/biblioteca/areas/direito-administrativo.png',
  'src/assets/biblioteca/areas/direito-administrativo.jpg',
  'src/assets/lei-cover-ei.jpg',
  'public/assets/ei-idoso.png',
  'public/assets/eind-indio.png',
  'public/ministros_offline/6e6cebe5-48b2-487f-9e54-527a24d25b15.jpg'
];

async function convertAndReplace() {
  const replacements = [];

  for (const file of filesToConvert) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const dir = path.dirname(file);
    const newFile = path.join(dir, base + '.webp');
    
    // Convert the file
    if (fs.existsSync(file)) {
      try {
        await sharp(file).webp({ quality: 80 }).toFile(newFile);
        console.log(`Converted: ${file} -> ${newFile}`);
        fs.unlinkSync(file); // Delete the old file
        
        // Add to replacements (filename + old ext) -> (filename + .webp)
        replacements.push({
          oldName: path.basename(file),
          newName: path.basename(newFile)
        });
      } catch (err) {
        console.error(`Error converting ${file}:`, err);
      }
    }
  }

  // Find and replace in source files
  function walkAndReplace(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkAndReplace(fullPath);
      } else {
        const ext = path.extname(fullPath).toLowerCase();
        if (['.ts', '.tsx', '.js', '.jsx', '.css', '.html'].includes(ext)) {
          let content = fs.readFileSync(fullPath, 'utf8');
          let modified = false;
          for (const rep of replacements) {
            // Match the old filename and replace it with the new one
            // Use regex to replace all occurrences
            const regex = new RegExp(rep.oldName, 'g');
            if (regex.test(content)) {
              content = content.replace(regex, rep.newName);
              modified = true;
            }
          }
          if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated references in: ${fullPath}`);
          }
        }
      }
    }
  }

  walkAndReplace('src');
  if (fs.existsSync('index.html')) walkAndReplace('.'); // Will check root files
}

convertAndReplace();
