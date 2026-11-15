const https = require('https');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const R2_PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

// Load existing keys
let existingKeys = new Set();
if (fs.existsSync('r2_aulas_interativas.json')) {
  try {
    const list = JSON.parse(fs.readFileSync('r2_aulas_interativas.json', 'utf-8'));
    existingKeys = new Set(list);
  } catch {}
}

const MATERIA_CONFIG = {
  'Direito Administrativo': { slug: 'direito-administrativo', disciplinaId: 'administrativo' },
  'Direito Ambiental': { slug: 'direito-ambiental', disciplinaId: 'ambiental' },
  'Direito Civil': { slug: 'direito-civil', disciplinaId: 'civil' },
  'Direito Constitucional': { slug: 'direito-constitucional', disciplinaId: 'constitucional' },
  'Direito Desportivo': { slug: 'direito-desportivo', disciplinaId: 'desportivo' },
  'Direito do Trabalho': { slug: 'direito-do-trabalho', disciplinaId: 'trabalho' },
  'Direito Empresarial': { slug: 'direito-empresarial', disciplinaId: 'empresarial' },
  'Direito Financeiro': { slug: 'direito-financeiro', disciplinaId: 'financeiro' },
  'Direito Internacional Privado': { slug: 'direito-internacional-privado', disciplinaId: 'internacional-privado' },
  'Direito Penal': { slug: 'direito-penal', disciplinaId: 'penal' },
  'Direito Previdenciário': { slug: 'direito-previdenciario', disciplinaId: 'previdenciario' },
  'Direito Processual Civil': { slug: 'direito-processual-civil', disciplinaId: 'processual-civil' },
  'Direito Processual do Trabalho': { slug: 'direito-processual-do-trabalho', disciplinaId: 'processual-trabalho' },
  'Direito Processual Penal': { slug: 'direito-processual-penal', disciplinaId: 'processual-penal' },
  'Direito Tributário': { slug: 'direito-tributario', disciplinaId: 'tributario' },
  'Direito Urbanístico': { slug: 'direito-urbanistico', disciplinaId: 'urbanistico' },
  'Direitos Humanos': { slug: 'direitos-humanos', disciplinaId: 'direitos-humanos' },
  'Formação Complementar': { slug: 'formacao-complementar', disciplinaId: 'formacao-complementar' },
  'Lei Penal Especial': { slug: 'lei-penal-especial', disciplinaId: 'lei-penal-especial' },
  'Políticas Públicas': { slug: 'politicas-publicas', disciplinaId: 'politicas-publicas' },
  'Português': { slug: 'portugues', disciplinaId: 'portugues' },
  'Teoria e Filosofia do Direito': { slug: 'teoria-e-filosofia-do-direito', disciplinaId: 'filosofia' }
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function fetchFolder(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const regex = /<div class="flip-entry" id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
        let m;
        const items = [];
        while ((m = regex.exec(d)) !== null) {
          items.push({
            id: m[1],
            url: m[2],
            name: m[3].trim(),
            isFolder: m[2].includes('/folders/')
          });
        }
        resolve(items);
      });
    }).on('error', reject);
  });
}

function downloadDriveFile(id, retries = 3) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', (err) => {
          if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
          reject(err);
        });
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
      reject(err);
    });
  });
}

function getContentType(filename) {
  if (filename.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filename.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.mp3')) return 'audio/mpeg';
  return 'application/octet-stream';
}

async function uploadToR2IfMissing(key, fileId, contentType) {
  if (existingKeys.has(key)) return;
  try {
    const buf = await downloadDriveFile(fileId);
    if (buf && buf.length > 0) {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType || getContentType(key)
      }));
      existingKeys.add(key);
      process.stdout.write('.');
    }
  } catch (e) {
    console.error(`\nError uploading ${key}:`, e.message);
  }
}

async function processAula(materiaSlug, moduloSlug, aulaFolder, disciplinaId, materiaId, modIdx, aulaIdx) {
  const aulaSlug = slugify(aulaFolder.name);
  const aulaBasePath = `aulas-interativas/${materiaSlug}/${moduloSlug}/${aulaSlug}`;
  const aulaItems = await fetchFolder(aulaFolder.id);

  let aulaJsonContent = null;
  let aulaHtmlContent = null;
  let audioFiles = [];
  let imgFiles = [];

  // Identify files
  const htmlFile = aulaItems.find(i => i.name === 'aula.html');
  const jsonFile = aulaItems.find(i => i.name === 'aula.json');
  const capaFile = aulaItems.find(i => i.name.startsWith('capa-') || i.name === 'capa.webp');
  const audioFolder = aulaItems.find(i => i.name === 'audio' && i.isFolder);
  const imgFolder = aulaItems.find(i => i.name === 'imagens' && i.isFolder);

  // 1. Upload capa
  if (capaFile) {
    await uploadToR2IfMissing(`${aulaBasePath}/capa-3x4.webp`, capaFile.id, 'image/webp');
  }

  // 2. Upload html & json
  if (htmlFile) {
    if (!existingKeys.has(`${aulaBasePath}/aula.html`)) {
      try {
        const buf = await downloadDriveFile(htmlFile.id);
        aulaHtmlContent = buf.toString('utf-8');
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${aulaBasePath}/aula.html`,
          Body: buf,
          ContentType: 'text/html; charset=utf-8'
        }));
        existingKeys.add(`${aulaBasePath}/aula.html`);
        process.stdout.write('H');
      } catch (e) {}
    }
  }

  if (jsonFile) {
    try {
      const buf = await downloadDriveFile(jsonFile.id);
      aulaJsonContent = JSON.parse(buf.toString('utf-8'));
      if (!existingKeys.has(`${aulaBasePath}/aula.json`)) {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${aulaBasePath}/aula.json`,
          Body: buf,
          ContentType: 'application/json; charset=utf-8'
        }));
        existingKeys.add(`${aulaBasePath}/aula.json`);
        process.stdout.write('J');
      }
    } catch (e) {}
  }

  // 3. Audio folder files
  if (audioFolder) {
    audioFiles = await fetchFolder(audioFolder.id);
    // Parallel uploads in batches of 6
    for (let i = 0; i < audioFiles.length; i += 6) {
      const batch = audioFiles.slice(i, i + 6);
      await Promise.all(batch.map(async (a) => {
        const k1 = `${aulaBasePath}/assets/audio/${a.name}`;
        const k2 = `${aulaBasePath}/audio/${a.name}`;
        await uploadToR2IfMissing(k1, a.id, 'audio/mpeg');
        if (!existingKeys.has(k2)) {
          // alias
          existingKeys.add(k2);
        }
      }));
    }
  }

  // 4. Imagens folder files
  if (imgFolder) {
    imgFiles = await fetchFolder(imgFolder.id);
    for (let i = 0; i < imgFiles.length; i += 6) {
      const batch = imgFiles.slice(i, i + 6);
      await Promise.all(batch.map(async (im) => {
        const k1 = `${aulaBasePath}/assets/img/${im.name}`;
        const k2 = `${aulaBasePath}/imagens/${im.name}`;
        await uploadToR2IfMissing(k1, im.id, 'image/webp');
        if (!existingKeys.has(k2)) {
          existingKeys.add(k2);
        }
      }));
    }
  }

  // Determine metadata
  let titulo = aulaFolder.name.replace(/^Aula\s+\d+\s*[-–:]\s*/i, '').trim();
  let descricao = `Aula completa e interativa sobre ${titulo}, com áudios em alta fidelidade, imagens e fixação ativa.`;
  let etapas = 30;

  if (aulaJsonContent) {
    if (aulaJsonContent.titulo) titulo = aulaJsonContent.titulo;
    if (aulaJsonContent.descricao) descricao = aulaJsonContent.descricao;
    if (Array.isArray(aulaJsonContent.etapas)) etapas = aulaJsonContent.etapas.length;
    else if (Array.isArray(aulaJsonContent.slides)) etapas = aulaJsonContent.slides.length;
  }

  const aulaId = `${disciplinaId}-${String(modIdx).padStart(2, '0')}-${String(aulaIdx).padStart(2, '0')}`;
  const numeroAula = `AULA ${String(aulaIdx).padStart(2, '0')}`;

  return {
    id: aulaId,
    disciplinaId,
    materiaId,
    numeroAula,
    titulo,
    descricao,
    topicosQtd: 4,
    slug: aulaId,
    etapas: etapas || (audioFiles.length > 0 ? audioFiles.length : 25),
    audioQtd: audioFiles.length || etapas || 25,
    imagensQtd: imgFiles.length || etapas || 25,
    urlHtmlR2: `${R2_PUBLIC_BASE}/${aulaBasePath}/aula.html`,
    urlJsonR2: `${R2_PUBLIC_BASE}/${aulaBasePath}/aula.json`,
    capaUrl: `${R2_PUBLIC_BASE}/${aulaBasePath}/capa-3x4.webp`,
    status: 'pronto'
  };
}

async function processMateria(materiaObj) {
  const conf = MATERIA_CONFIG[materiaObj.name];
  if (!conf) {
    console.warn(`No config for ${materiaObj.name}`);
    return;
  }

  console.log(`\n======================================================`);
  console.log(`STARTING MATÉRIA: ${materiaObj.name} (${conf.disciplinaId})`);
  console.log(`Modules count: ${materiaObj.modules.length}`);
  console.log(`======================================================`);

  const materiasCatalog = [];
  const aulasCatalog = [];

  for (let mIdx = 0; mIdx < materiaObj.modules.length; mIdx++) {
    const mod = materiaObj.modules[mIdx];
    const modNum = mIdx + 1;
    const modSlug = slugify(mod.name);
    const materiaId = `${conf.disciplinaId}-mat-${String(modNum).padStart(2, '0')}`;

    console.log(`\n[${conf.disciplinaId}] Mod ${modNum}/${materiaObj.modules.length}: ${mod.name}`);
    const aulas = await fetchFolder(mod.id);
    console.log(`  Found ${aulas.length} aulas inside module.`);

    const modAulas = [];
    for (let aIdx = 0; aIdx < aulas.length; aIdx++) {
      const aulaFolder = aulas[aIdx];
      const aulaNum = aIdx + 1;
      process.stdout.write(`    (${aulaNum}/${aulas.length}) ${aulaFolder.name} `);
      const aulaData = await processAula(conf.slug, modSlug, aulaFolder, conf.disciplinaId, materiaId, modNum, aulaNum);
      modAulas.push(aulaData);
      aulasCatalog.push(aulaData);
      console.log(` -> OK (${aulaData.etapas} etapas)`);
    }

    const modTitle = mod.name.replace(/^\d+[\.\s-]+/i, '').trim();
    const firstCapa = modAulas.length > 0 ? modAulas[0].capaUrl : `${R2_PUBLIC_BASE}/aulas-interativas/capas/${conf.slug}/capa.webp`;

    materiasCatalog.push({
      id: materiaId,
      disciplinaId: conf.disciplinaId,
      numeroMateria: mod.name.toUpperCase(),
      titulo: modTitle,
      subtitulo: `Módulo ${String(modNum).padStart(2, '0')} · ${aulas.length} aulas`,
      descricao: `Estudo aprofundado com narrativa interativa, casos reais, fixação ativa e questões práticas sobre ${modTitle}.`,
      capaUrl: firstCapa
    });

    // Checkpoint
    fs.writeFileSync(`checkpoint_${conf.disciplinaId}.json`, JSON.stringify({ materias: materiasCatalog, aulas: aulasCatalog }, null, 2));
  }

  console.log(`\nCompleted ${materiaObj.name}: ${materiasCatalog.length} materias, ${aulasCatalog.length} aulas.`);
}

async function main() {
  const targetMateria = process.argv[2];
  const summary = JSON.parse(fs.readFileSync('gdrive_materias_summary.json', 'utf-8'));

  if (targetMateria) {
    const mat = summary.find(s => s.name.toLowerCase().includes(targetMateria.toLowerCase()));
    if (!mat) {
      console.error(`Materia "${targetMateria}" not found!`);
      return;
    }
    await processMateria(mat);
  } else {
    // Process all missing materias in order
    const priority = [
      'Direito Ambiental',
      'Direito Civil',
      'Direito Tributário',
      'Direito Processual Civil',
      'Direito Processual Penal',
      'Direito Previdenciário',
      'Direito Empresarial',
      'Direito Financeiro',
      'Direito Processual do Trabalho',
      'Lei Penal Especial',
      'Direitos Humanos',
      'Direito Urbanístico',
      'Teoria e Filosofia do Direito',
      'Políticas Públicas',
      'Português',
      'Formação Complementar',
      'Direito Desportivo',
      'Direito Internacional Privado'
    ];

    for (const name of priority) {
      const mat = summary.find(s => s.name === name);
      if (mat) {
        await processMateria(mat);
      }
    }
  }
}

main().catch(console.error);

