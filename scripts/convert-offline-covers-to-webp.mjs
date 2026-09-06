import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('public/offline-covers');
const manifestPath = path.join(dir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json não encontrado em:', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
console.log(`[offline-covers] Iniciando conversão segura de ${files.length} arquivos para WebP...`);

let converted = 0;
let errors = 0;
const toDelete = [];

// Passo 1: Converter todos os arquivos lendo em Buffer para evitar lock de arquivo no Windows
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const oldPath = path.join(dir, file);
  const baseName = file.substring(0, file.lastIndexOf('.'));
  const newName = `${baseName}.webp`;
  const newPath = path.join(dir, newName);

  try {
    if (!fs.existsSync(newPath)) {
      const inputBuffer = fs.readFileSync(oldPath);
      await sharp(inputBuffer).webp({ quality: 80 }).toFile(newPath);
    }
    toDelete.push(oldPath);
    converted++;
  } catch (err) {
    console.error(`Erro ao converter ${file}:`, err.message);
    errors++;
  }

  if ((i + 1) % 150 === 0 || i === files.length - 1) {
    console.log(`[offline-covers] Progresso conversão: ${i + 1}/${files.length} (${Math.round(((i + 1) / files.length) * 100)}%)`);
  }
}

// Passo 2: Remover os arquivos legados após a liberação de streams
console.log(`[offline-covers] Removendo ${toDelete.length} arquivos legados...`);
let deleted = 0;
for (const filePath of toDelete) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  } catch (e) {
    console.warn(`Aviso ao remover ${filePath}:`, e.message);
  }
}

// Passo 3: Atualizar todas as chaves do manifest.json para .webp
let manifestUpdated = 0;
for (const [key, value] of Object.entries(manifest)) {
  if (/\.(png|jpg|jpeg)$/i.test(value)) {
    const base = value.substring(0, value.lastIndexOf('.'));
    manifest[key] = `${base}.webp`;
    manifestUpdated++;
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`[offline-covers] Sucesso total!`);
console.log(`- Arquivos convertidos para WebP: ${converted}`);
console.log(`- Arquivos legados removidos: ${deleted}`);
console.log(`- Entradas do manifest.json atualizadas para .webp: ${manifestUpdated}`);
