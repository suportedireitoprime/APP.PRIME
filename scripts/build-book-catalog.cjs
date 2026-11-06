const fs = require('fs');
const path = require('path');

const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';
const queue = JSON.parse(fs.readFileSync('C:\\Users\\ext_wpereira\\.gemini\\antigravity\\brain\\71d2fe71-1013-47d3-af98-abf6a18982f5\\scratch\\full_upload_queue.json', 'utf8'));

// Helper de delay
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function downloadText(fileId) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  return await res.text();
}

function parseSrt(srtContent) {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\n+/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    let timeLine = lines[1];
    let textStartIndex = 2;
    if (!timeLine || !timeLine.includes('-->')) {
      timeLine = lines[0];
      textStartIndex = 1;
    }
    if (!timeLine || !timeLine.includes('-->')) continue;
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const parseTime = (t) => {
      const parts = t.split(/[,.]/);
      const [h, m, s] = parts[0].split(':').map(Number);
      const ms = Number(parts[1] || 0) / 1000;
      return h * 3600 + m * 60 + s + ms;
    };
    const start = Math.round(parseTime(startStr) * 100) / 100;
    const end = Math.round(parseTime(endStr) * 100) / 100;
    const text = lines.slice(textStartIndex).join(' ').trim();
    if (text) {
      cues.push({ id: cues.length + 1, start, end, text });
    }
  }
  return cues;
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTotalDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}min`;
  }
  return `${m} min`;
}

async function buildBookCatalog(slug, meta) {
  console.log(`\nGerando catálogo para livro: ${meta.titulo} (${slug})...`);
  const bookFiles = queue.filter(x => x.bookSlug === slug);
  if (bookFiles.length === 0) {
    console.error(`Nenhum arquivo encontrado para o slug: ${slug}`);
    return null;
  }

  // Agrupa arquivos por subpasta (ou raiz)
  const rootFiles = bookFiles.filter(x => x.location === 'raiz');
  const chapterFolders = {};
  for (const f of bookFiles) {
    if (f.location === 'raiz') continue;
    if (!chapterFolders[f.location]) chapterFolders[f.location] = [];
    chapterFolders[f.location].push(f);
  }

  const capitulos = [];

  // 1. Apresentação (intro.mp3 + intro.srt se existir)
  const introMp3 = rootFiles.find(x => x.fileName === 'intro.mp3');
  const introSrt = rootFiles.find(x => x.fileName === 'intro.srt');
  if (introMp3) {
    let cues = [];
    let durSec = 60;
    if (introSrt) {
      try {
        const text = await downloadText(introSrt.fileId);
        cues = parseSrt(text);
        if (cues.length > 0) durSec = Math.round(cues[cues.length - 1].end);
      } catch (e) {
        console.warn('Erro ao ler intro.srt:', e.message);
      }
    }
    capitulos.push({
      numero: 0,
      id: 'capitulo-00-apresentacao',
      titulo: 'Apresentação da Obra',
      autor: meta.autor,
      descricao: `Apresentação de ${meta.titulo}: introdução e contextualização da obra.`,
      duracaoSegundos: durSec,
      duracaoFormatada: formatDuration(durSec),
      audioUrl: `${R2_DOMAIN}/${introMp3.r2Key}`,
      srtUrl: introSrt ? `${R2_DOMAIN}/${introSrt.r2Key}` : undefined,
      cues,
      imagens: []
    });
  }

  // 2. Sumário (sumario.mp3 + sumario.srt se existir)
  const sumarioMp3 = rootFiles.find(x => x.fileName === 'sumario.mp3');
  const sumarioSrt = rootFiles.find(x => x.fileName === 'sumario.srt');
  if (sumarioMp3) {
    let cues = [];
    let durSec = 90;
    if (sumarioSrt) {
      try {
        const text = await downloadText(sumarioSrt.fileId);
        cues = parseSrt(text);
        if (cues.length > 0) durSec = Math.round(cues[cues.length - 1].end);
      } catch (e) {
        console.warn('Erro ao ler sumario.srt:', e.message);
      }
    }
    capitulos.push({
      numero: 0.5,
      id: 'capitulo-00-sumario',
      titulo: 'Sumário Narrado',
      autor: meta.autor,
      descricao: `Visão geral da estrutura e sequência dos capítulos de ${meta.titulo}.`,
      duracaoSegundos: durSec,
      duracaoFormatada: formatDuration(durSec),
      audioUrl: `${R2_DOMAIN}/${sumarioMp3.r2Key}`,
      srtUrl: sumarioSrt ? `${R2_DOMAIN}/${sumarioSrt.r2Key}` : undefined,
      cues,
      imagens: []
    });
  }

  // 3. Capítulos
  const sortedFolders = Object.keys(chapterFolders).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let chapIndex = 1;
  for (const folderName of sortedFolders) {
    if (folderName.toLowerCase().includes('imagem') || folderName.toLowerCase().includes('cena')) continue;
    const files = chapterFolders[folderName];
    const audioFile = files.find(x => x.fileName.startsWith('audiobook') && x.fileName.endsWith('.mp3')) || files.find(x => x.fileName.endsWith('.mp3') && !x.fileName.startsWith('titulo'));
    const tituloFile = files.find(x => x.fileName.startsWith('titulo') && x.fileName.endsWith('.mp3'));
    const srtFile = files.find(x => x.fileName.endsWith('.srt'));

    if (!audioFile) continue;

    let cues = [];
    let durSec = 1200;
    if (srtFile) {
      try {
        const text = await downloadText(srtFile.fileId);
        cues = parseSrt(text);
        if (cues.length > 0) durSec = Math.round(cues[cues.length - 1].end);
      } catch (e) {
        console.warn(`Erro ao ler srt de ${folderName}:`, e.message);
      }
    }

    const numMatch = folderName.match(/(?:cap[íi]tulo|livro|se[çc][ãa]o)?\s*(\d+)/i) || folderName.match(/^(\d+)/);
    const capNum = numMatch ? parseInt(numMatch[1], 10) : chapIndex;
    const cleanTitle = folderName.replace(/^\d+\s*[-—]\s*/, '').replace(/^Capítulo\s*\d+\s*[-—]\s*/i, '').trim();

    capitulos.push({
      numero: capNum,
      id: `capitulo-${String(capNum).padStart(2, '0')}`,
      titulo: `Capítulo ${String(capNum).padStart(2, '0')}${cleanTitle ? ' — ' + cleanTitle : ''}`,
      autor: meta.autor,
      descricao: `${meta.titulo}: ${cleanTitle || 'Capítulo ' + capNum}.`,
      duracaoSegundos: durSec,
      duracaoFormatada: formatDuration(durSec),
      audioUrl: `${R2_DOMAIN}/${audioFile.r2Key}`,
      audioTituloUrl: tituloFile ? `${R2_DOMAIN}/${tituloFile.r2Key}` : undefined,
      srtUrl: srtFile ? `${R2_DOMAIN}/${srtFile.r2Key}` : undefined,
      cues,
      imagens: []
    });

    chapIndex++;
    await sleep(50);
  }

  const totalSeg = capitulos.reduce((acc, c) => acc + (c.duracaoSegundos || 0), 0);

  const livroObj = {
    id: slug,
    tableId: meta.tableId,
    status: 'disponivel',
    titulo: meta.titulo,
    subtitulo: meta.subtitulo,
    autor: meta.autor,
    ano: meta.ano,
    descricao: meta.descricao,
    sinopse: meta.sinopse || meta.descricao,
    capaUrl: meta.capaUrl || `${R2_DOMAIN}/audiobooks/${slug}/capa-do-livro.jpg`,
    totalCapitulos: capitulos.length,
    duracaoTotalSegundos: totalSeg,
    duracaoTotalFormatada: formatTotalDuration(totalSeg),
    tags: meta.tags || ['Clássico', 'Direito'],
    capitulos
  };

  return livroObj;
}

module.exports = { buildBookCatalog };

