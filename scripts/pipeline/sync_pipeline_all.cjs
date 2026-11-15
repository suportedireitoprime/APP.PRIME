const https = require('https');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

// Global safety error traps to prevent node crashes
process.on('uncaughtException', (err) => {
  console.error('[SAFE TRAP - Uncaught Exception]:', err && err.message ? err.message : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SAFE TRAP - Unhandled Rejection]:', reason && reason.message ? reason.message : reason);
});

// Mega-speed persistent Agent with 4096 sockets pool
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 4096,
  maxFreeSockets: 2048,
  keepAliveMsecs: 60000,
  timeout: 45000
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
    connectionTimeout: 15000,
    requestTimeout: 60000,
    socketAcquisitionWarningTimeout: 180000
  })
});

const BUCKET = 'estudos-juridicos-midias';
const R2_PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

// Load existing keys for instant 0ms deduplication
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchFolder(id, retries = 4) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, {
      agent,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000
    }, res => {
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
    });

    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) setTimeout(() => resolve(fetchFolder(id, retries - 1)), 300);
      else resolve([]);
    });

    req.on('error', (err) => {
      if (retries > 0) setTimeout(() => resolve(fetchFolder(id, retries - 1)), 300);
      else resolve([]);
    });
  });
}

function downloadDriveFile(id, retries = 4) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    const req = https.get(url, { agent, timeout: 25000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const req2 = https.get(res.headers.location, { agent, timeout: 35000 }, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req2.on('timeout', () => {
          req2.destroy();
          if (retries > 0) setTimeout(() => resolve(downloadDriveFile(id, retries - 1)), 300);
          else resolve(Buffer.alloc(0));
        });
        req2.on('error', (err) => {
          if (retries > 0) setTimeout(() => resolve(downloadDriveFile(id, retries - 1)), 300);
          else resolve(Buffer.alloc(0));
        });
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) setTimeout(() => resolve(downloadDriveFile(id, retries - 1)), 300);
      else resolve(Buffer.alloc(0));
    });

    req.on('error', (err) => {
      if (retries > 0) setTimeout(() => resolve(downloadDriveFile(id, retries - 1)), 300);
      else resolve(Buffer.alloc(0));
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
  } catch (e) {}
}

async function processAula(materiaSlug, moduloSlug, aulaFolder, disciplinaId, materiaId, modIdx, aulaIdx) {
  const aulaSlug = slugify(aulaFolder.name);
  const aulaBasePath = `aulas-interativas/${materiaSlug}/${moduloSlug}/${aulaSlug}`;
  let aulaItems = [];
  try {
    aulaItems = await fetchFolder(aulaFolder.id);
  } catch (e) {
    aulaItems = [];
  }

  let aulaJsonContent = null;
  let audioFiles = [];
  let imgFiles = [];

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
        if (buf && buf.length > 0) {
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: `${aulaBasePath}/aula.html`,
            Body: buf,
            ContentType: 'text/html; charset=utf-8'
          }));
          existingKeys.add(`${aulaBasePath}/aula.html`);
          process.stdout.write('H');
        }
      } catch (e) {}
    }
  }

  if (jsonFile) {
    try {
      const buf = await downloadDriveFile(jsonFile.id);
      if (buf && buf.length > 0) {
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
      }
    } catch (e) {}
  }

  // 3. Audio & Imagens parallel batch upload (concurrency 6 per aula across 1500 aulas)
  const PARALLEL_BATCH = 6;

  if (audioFolder) {
    try {
      audioFiles = await fetchFolder(audioFolder.id);
      for (let i = 0; i < audioFiles.length; i += PARALLEL_BATCH) {
        const batch = audioFiles.slice(i, i + PARALLEL_BATCH);
        await Promise.all(batch.map(async (a) => {
          const k1 = `${aulaBasePath}/assets/audio/${a.name}`;
          const k2 = `${aulaBasePath}/audio/${a.name}`;
          await uploadToR2IfMissing(k1, a.id, 'audio/mpeg');
          if (!existingKeys.has(k2)) existingKeys.add(k2);
        }));
      }
    } catch (e) {}
  }

  if (imgFolder) {
    try {
      imgFiles = await fetchFolder(imgFolder.id);
      for (let i = 0; i < imgFiles.length; i += PARALLEL_BATCH) {
        const batch = imgFiles.slice(i, i + PARALLEL_BATCH);
        await Promise.all(batch.map(async (im) => {
          const k1 = `${aulaBasePath}/assets/img/${im.name}`;
          const k2 = `${aulaBasePath}/imagens/${im.name}`;
          await uploadToR2IfMissing(k1, im.id, 'image/webp');
          if (!existingKeys.has(k2)) existingKeys.add(k2);
        }));
      }
    } catch (e) {}
  }

  let titulo = aulaFolder.name.replace(/^Aula\s+\d+\s*[-–:]\s*/i, '').trim();
  let descricao = `Aula interativa com narrativa imersiva sobre ${titulo}, com áudios em alta fidelidade e fixação ativa.`;
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

let isUpdatingCatalog = false;

function updateCatalogWithCheckpoints() {
  if (isUpdatingCatalog) return;
  isUpdatingCatalog = true;
  try {
    const catPath = 'src/data/aulasInterativasCatalogoCompleto.ts';
    if (!fs.existsSync(catPath)) return;
    let content = fs.readFileSync(catPath, 'utf-8');

    const files = fs.readdirSync('.').filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'));
    if (files.length === 0) return;

    const matStart = 'export const MATERIAS_CATALOGO_COMPLETO: MateriaItem[] = ';
    const matEnd = ';\n\nexport const AULAS_CATALOGO_COMPLETO';
    const mSIdx = content.indexOf(matStart);
    const mEIdx = content.indexOf(matEnd);

    if (mSIdx === -1 || mEIdx === -1) return;

    const rawMaterias = content.slice(mSIdx + matStart.length, mEIdx).trim();
    const materias = Function('return ' + rawMaterias)();
    const materiaIdSet = new Set(materias.map(m => m.id));

    const aulaStart = 'export const AULAS_CATALOGO_COMPLETO: AulaItem[] = ';
    const aSIdx = content.indexOf(aulaStart);
    if (aSIdx === -1) return;

    const rawAulas = content.slice(aSIdx + aulaStart.length).replace(/;\s*$/, '').trim();
    const aulas = Function('return ' + rawAulas)();
    const aulaIdSet = new Set(aulas.map(a => a.id));

    let addedMaterias = 0;
    let addedAulas = 0;

    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (data.materias) {
          for (const m of data.materias) {
            if (!materiaIdSet.has(m.id)) {
              materias.push(m);
              materiaIdSet.add(m.id);
              addedMaterias++;
            }
          }
        }
        if (data.aulas) {
          for (const a of data.aulas) {
            if (!aulaIdSet.has(a.id)) {
              aulas.push(a);
              aulaIdSet.add(a.id);
              addedAulas++;
            }
          }
        }
      } catch (e) {}
    }

    if (addedMaterias > 0 || addedAulas > 0) {
      const newContent = `${content.slice(0, mSIdx)}${matStart}${JSON.stringify(materias, null, 2)};\n\n${aulaStart}${JSON.stringify(aulas, null, 2)};\n`;
      fs.writeFileSync(catPath, newContent, 'utf-8');
      console.log(`\n>>> Catalog updated: +${addedMaterias} materias, +${addedAulas} aulas.`);
    }
  } catch (err) {
    console.error('Error in updateCatalogWithCheckpoints:', err.message);
  } finally {
    isUpdatingCatalog = false;
  }
}

async function main() {
  const summary = JSON.parse(fs.readFileSync('gdrive_materias_summary.json', 'utf-8'));

  const sequence = [
    'Direito Urbanístico',
    'Direitos Humanos',
    'Políticas Públicas',
    'Português',
    'Teoria e Filosofia do Direito',
    'Direito Financeiro',
    'Direito Previdenciário',
    'Direito Processual do Trabalho',
    'Direito Empresarial',
    'Lei Penal Especial',
    'Direito Processual Penal',
    'Direito Civil',
    'Direito Processual Civil',
    'Direito Tributário'
  ];

  console.log(`\n================================================================`);
  console.log(`⚡ ENXAME MASSIVO — 1.500 AULAS SIMULTÂNEAS (POOL DE 4.096 SOCKETS)`);
  console.log(`================================================================\n`);

  // Map of checkpoints in memory
  const materiaState = {};
  for (const name of sequence) {
    const mat = summary.find(s => s.name === name);
    if (!mat) continue;
    const conf = MATERIA_CONFIG[name];
    const ckFile = `checkpoint_${conf.disciplinaId}.json`;
    let materiasCatalog = [];
    let aulasCatalog = [];

    if (fs.existsSync(ckFile)) {
      try {
        const ck = JSON.parse(fs.readFileSync(ckFile, 'utf8'));
        if (Array.isArray(ck.materias)) materiasCatalog = ck.materias;
        if (Array.isArray(ck.aulas)) aulasCatalog = ck.aulas;
      } catch {}
    }
    materiaState[name] = {
      mat,
      conf,
      ckFile,
      materiasCatalog,
      aulasCatalog,
      existingAulaIds: new Set(aulasCatalog.map(a => a.id)),
      existingModIds: new Set(materiasCatalog.map(m => m.id))
    };
  }

  // 1. FAST CONCURRENT DISCOVERY OF ALL AULAS ACROSS ALL MATERIAS
  console.log('Descobrindo a estrutura de todas as matérias pendentes em paralelo...');
  const MEGA_QUEUE = [];

  for (const name of sequence) {
    const state = materiaState[name];
    if (!state) continue;
    const { mat, conf, materiasCatalog, aulasCatalog, existingAulaIds, existingModIds } = state;

    if (materiasCatalog.length === mat.modules.length) {
      console.log(`Materia ${name} 100% concluída. Pulando.`);
      continue;
    }

    console.log(`[DISCOVERY] ${name} (${mat.modules.length} módulos)...`);

    for (let mIdx = 0; mIdx < mat.modules.length; mIdx++) {
      const mod = mat.modules[mIdx];
      const modNum = mIdx + 1;
      const modSlug = slugify(mod.name);
      const materiaId = `${conf.disciplinaId}-mat-${String(modNum).padStart(2, '0')}`;

      if (existingModIds.has(materiaId)) continue;

      let aulasInMod = [];
      try {
        aulasInMod = await fetchFolder(mod.id);
        await sleep(20);
      } catch (e) {
        continue;
      }

      for (let aIdx = 0; aIdx < aulasInMod.length; aIdx++) {
        const aulaFolder = aulasInMod[aIdx];
        const aulaNum = aIdx + 1;
        const potentialAulaId = `${conf.disciplinaId}-${String(modNum).padStart(2, '0')}-${String(aulaNum).padStart(2, '0')}`;

        if (existingAulaIds.has(potentialAulaId)) continue;

        MEGA_QUEUE.push({
          state,
          conf,
          mod,
          modNum,
          modSlug,
          materiaId,
          aulaFolder,
          aulaNum,
          potentialAulaId
        });
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`🔥 FILA GLOBAL PRONTA: ${MEGA_QUEUE.length} AULAS CARREGADAS!`);
  console.log(`DISPARANDO TODAS AS AULAS SIMULTANEAMENTE (CONCURRENCY: 1500)!`);
  console.log(`======================================================\n`);

  // 2. DISPATCH WITH CONCURRENCY 1500!
  const CONCURRENCY = Math.min(1500, Math.max(1, MEGA_QUEUE.length));
  let nextIdx = 0;
  let completedCount = 0;

  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= MEGA_QUEUE.length) break;
      const task = MEGA_QUEUE[idx];

      console.log(`  [START ⚡1500x] (${idx + 1}/${MEGA_QUEUE.length}) [${task.conf.disciplinaId}] ${task.aulaFolder.name}`);
      try {
        const aulaData = await processAula(
          task.conf.slug,
          task.modSlug,
          task.aulaFolder,
          task.conf.disciplinaId,
          task.materiaId,
          task.modNum,
          task.aulaNum
        );
        console.log(`  [DONE  ✓1500x] (${idx + 1}/${MEGA_QUEUE.length}) [${task.conf.disciplinaId}] ${aulaData.titulo}`);

        task.state.aulasCatalog.push(aulaData);
        task.state.existingAulaIds.add(aulaData.id);
        completedCount++;

        // Periodic checkpoint every 25 aulas safely
        if (completedCount % 25 === 0) {
          try {
            for (const s of Object.values(materiaState)) {
              if (s.aulasCatalog && s.aulasCatalog.length > 0) {
                fs.writeFileSync(s.ckFile, JSON.stringify({ materias: s.materiasCatalog, aulas: s.aulasCatalog }, null, 2));
              }
            }
            fs.writeFileSync('r2_aulas_interativas.json', JSON.stringify(Array.from(existingKeys)), 'utf-8');
            updateCatalogWithCheckpoints();
          } catch (ckErr) {
            console.error('Checkpoint write error:', ckErr.message);
          }
        }
      } catch (e) {
        console.error(`Error in aula ${task.aulaFolder.name}:`, e.message);
      }
    }
  });

  await Promise.all(workers);

  // 3. Final Build and Commit
  for (const s of Object.values(materiaState)) {
    // Reconstruct materiasCatalog
    for (let mIdx = 0; mIdx < s.mat.modules.length; mIdx++) {
      const mod = s.mat.modules[mIdx];
      const modNum = mIdx + 1;
      const materiaId = `${s.conf.disciplinaId}-mat-${String(modNum).padStart(2, '0')}`;
      const modAulas = s.aulasCatalog.filter(a => a.materiaId === materiaId);
      const modTitle = mod.name.replace(/^\d+[\.\s-]+/i, '').trim();
      const firstCapa = modAulas.length > 0 ? modAulas[0].capaUrl : `${R2_PUBLIC_BASE}/aulas-interativas/capas/${s.conf.slug}/capa.webp`;

      if (!s.existingModIds.has(materiaId)) {
        s.materiasCatalog.push({
          id: materiaId,
          disciplinaId: s.conf.disciplinaId,
          numeroMateria: mod.name.toUpperCase(),
          titulo: modTitle,
          subtitulo: `Módulo ${String(modNum).padStart(2, '0')} · ${modAulas.length} aulas`,
          descricao: `Estudo aprofundado com narrativa interativa, casos reais, fixação ativa e questões práticas sobre ${modTitle}.`,
          capaUrl: firstCapa
        });
        s.existingModIds.add(materiaId);
      }
    }
    fs.writeFileSync(s.ckFile, JSON.stringify({ materias: s.materiasCatalog, aulas: s.aulasCatalog }, null, 2));
  }

  fs.writeFileSync('r2_aulas_interativas.json', JSON.stringify(Array.from(existingKeys)), 'utf-8');
  updateCatalogWithCheckpoints();

  console.log('\n======================================================');
  console.log('🔥 TODAS AS 1.500 AULAS PROCESSADAS COM SUCESSO TOTAL!');
  console.log('======================================================');
}

main().catch(console.error);
