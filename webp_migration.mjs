import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get all files in a dir
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function main() {
  console.log('Ensuring sharp is installed...');
  try {
    await import('sharp');
  } catch (e) {
    console.log('Installing sharp temporarily...');
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }
  const sharp = (await import('sharp')).default;

  const extsToConvert = ['.png', '.jpg', '.jpeg'];
  const dirsToSearch = ['public', 'src'];
  
  // Find all images
  let allImages = [];
  for (const dir of dirsToSearch) {
    allImages = allImages.concat(getAllFiles(path.join(__dirname, dir)));
  }
  
  // Filter valid images to convert
  const validImages = allImages.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file).toLowerCase();
    if (!extsToConvert.includes(ext)) return false;
    
    // EXCLUSIONS
    if (name.includes('favicon')) return false;
    if (name.includes('apple-touch-icon')) return false;
    if (name.includes('icon-')) return false; // icon-192, icon-512, etc
    if (name.includes('og-image') || name.includes('seo-image')) return false; // Open Graph compatibility
    
    return true;
  });

  console.log(`Found ${validImages.length} images to convert.`);

  // Find all source code files to perform replacements
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json'];
  let allSourceFiles = [];
  allSourceFiles = allSourceFiles.concat(getAllFiles(path.join(__dirname, 'src')));
  allSourceFiles = allSourceFiles.concat(getAllFiles(path.join(__dirname, 'public'))); 
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    allSourceFiles.push(path.join(__dirname, 'index.html'));
  }
  
  const validSourceFiles = allSourceFiles.filter(file => sourceExts.includes(path.extname(file).toLowerCase()));
  
  let totalSaved = 0;
  let replacedCount = 0;

  for (const imgPath of validImages) {
    const dir = path.dirname(imgPath);
    const ext = path.extname(imgPath);
    const basename = path.basename(imgPath, ext);
    const webpPath = path.join(dir, basename + '.webp');
    
    // Check if webp already exists (to prevent overwriting if we ran this twice)
    if (fs.existsSync(webpPath)) {
      console.log(`Skipping ${basename}${ext} - WebP already exists.`);
      continue;
    }

    try {
      // Convert
      const origSize = fs.statSync(imgPath).size;
      await sharp(imgPath).webp({ quality: 80 }).toFile(webpPath);
      const newSize = fs.statSync(webpPath).size;
      
      const saved = origSize - newSize;
      totalSaved += saved;
      
      const origFileName = basename + ext;
      const newFileName = basename + '.webp';
      
      // Update references in all source files
      for (const srcFile of validSourceFiles) {
        let content = fs.readFileSync(srcFile, 'utf8');
        if (content.includes(origFileName)) {
          const regex = new RegExp(origFileName.replace(/\./g, '\\.'), 'g');
          content = content.replace(regex, newFileName);
          fs.writeFileSync(srcFile, content, 'utf8');
          replacedCount++;
        }
      }

      // Delete original image
      fs.unlinkSync(imgPath);
      console.log(`Converted ${origFileName} -> saved ${(saved / 1024).toFixed(2)} KB`);

    } catch (err) {
      console.error(`Error processing ${imgPath}:`, err.message);
    }
  }

  console.log(`Conversion complete! Total space saved: ${(totalSaved / (1024 * 1024)).toFixed(2)} MB.`);
  console.log(`Updated references in source files.`);
}

main();
