import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertImage() {
  const inputPath = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\d0b1e94b-c827-4c55-bc4c-5c3abc7d8681\\.user_uploaded\\media_1789543072798.png';
  const outputPath = path.join(__dirname, 'src', 'assets', 'covers', 'hero-estudante-v3.webp');
  
  try {
    if (!fs.existsSync(inputPath)) {
      console.error('File not found:', inputPath);
      return;
    }
    
    // We want 100% quality, near lossless webp
    await sharp(inputPath)
      .webp({ quality: 100, lossless: false }) // se a source for lossy (ex. jpg/png com photo), lossless=false com 100 de quality é melhor e mais nítido
      .toFile(outputPath);
      
    console.log('Image successfully converted and saved to', outputPath);
  } catch (error) {
    console.error('Error converting image:', error);
  }
}

convertImage();
