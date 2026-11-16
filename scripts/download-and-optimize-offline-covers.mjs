import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const bundleDir = path.join(rootDir, 'public', 'offline-bundle');
const coversDir = path.join(rootDir, 'public', 'offline-covers');
const manifestPath = path.join(coversDir, 'manifest.json');

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

let manifest = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    manifest = {};
  }
}

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 16);
}

// Coleta todas as URLs únicas
const files = fs.readdirSync(bundleDir).filter((f) => f.startsWith('biblioteca-'));
const urlSet = new Set();

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(bundleDir, f), 'utf8'));
    for (const item of data) {
      const c = item.imagem || item.capa_livro;
      if (c && typeof c === 'string' && /^https?:\/\//i.test(c)) {
        urlSet.add(c.trim());
      }
      const ch = item.capa_horizontal;
      if (ch && typeof ch === 'string' && /^https?:\/\//i.test(ch)) {
        urlSet.add(ch.trim());
      }
    }
  } catch {}
}

const allUrls = Array.from(urlSet);
console.log(`[Offline Covers] Encontradas ${allUrls.length} capas únicas para processar.`);

// Processamento concorrente em lotes
const CONCURRENCY = 15;
let processed = 0;
let downloaded = 0;
let skipped = 0;
let failed = 0;

async function processUrl(url) {
  const fileHash = hashUrl(url);
  const fileName = `cover_${fileHash}.webp`;
  const filePath = path.join(coversDir, fileName);

  manifest[url] = fileName;

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
    skipped++;
    processed++;
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Converte e otimiza para WebP via Sharp
    await sharp(buffer)
      .resize({ width: 450, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(filePath);

    downloaded++;
  } catch (e) {
    failed++;
    delete manifest[url];
  } finally {
    processed++;
    if (processed % 50 === 0 || processed === allUrls.length) {
      console.log(
        `[Offline Covers] Progresso: ${processed}/${allUrls.length} (Baixadas: ${downloaded}, Em cache: ${skipped}, Falhas: ${failed})`
      );
      // Salva progresso incremental do manifest
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  }
}

async function run() {
  console.log('🚀 Iniciando download e otimização das capas em WebP...');
  for (let i = 0; i < allUrls.length; i += CONCURRENCY) {
    const batch = allUrls.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((url) => processUrl(url)));
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const totalCovers = Object.keys(manifest).length;
  console.log(`✨ Concluído com sucesso! ${totalCovers} capas registradas no manifest.json.`);
}

run();
