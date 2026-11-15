import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const DESKTOP_PATH = 'C:\\Users\\ext_wpereira\\Desktop';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

function parseJsonSafe(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    let str;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // UTF-16 LE
      str = buffer.toString('utf16le');
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE
      str = buffer.toString('utf16be');
    } else {
      str = buffer.toString('utf8');
    }
    // Remove BOM se presente
    str = str.replace(/^\uFEFF/, '');
    const data = JSON.parse(str);
    return data.rows || [];
  } catch (err) {
    console.error(`Erro ao ler ${filePath}:`, err.message);
    return [];
  }
}

async function run() {
  console.log('Carregando dados das videoaulas...');

  const areasRows = parseJsonSafe('scripts/videoaulas_areas.json');
  const inicianteRows = parseJsonSafe('scripts/videoaulas_iniciante.json');
  const oab1Rows = parseJsonSafe('scripts/videoaulas_oab1.json');
  const artigoRows = parseJsonSafe('scripts/artigo_videos.json');

  console.log(`- Áreas do Direito: ${areasRows.length}`);
  console.log(`- Para Iniciantes: ${inicianteRows.length}`);
  console.log(`- OAB 1ª Fase: ${oab1Rows.length}`);
  console.log(`- Artigos com Vídeos: ${artigoRows.length}`);

  // 1. Mapear Áreas do Direito
  const sheetAreas = areasRows.map((r, i) => {
    const videoId = r.video_id || '';
    return {
      'Nº': i + 1,
      'Catálogo': 'Áreas do Direito',
      'Área / Matéria': r.area || 'Geral',
      'Título da Videoaula': r.titulo || 'Sem título',
      'Link YouTube': videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      'ID do Vídeo': videoId,
      'Duração': formatDuration(r.duracao_segundos),
      'Duração (seg)': r.duracao_segundos || '',
      'Playlist ID': r.playlist_id || '',
      'Ordem': r.ordem ?? '',
      'Thumbnail': r.thumb || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    };
  });

  // 2. Mapear OAB 1ª Fase
  const sheetOab1 = oab1Rows.map((r, i) => {
    const videoId = r.video_id || '';
    return {
      'Nº': i + 1,
      'Catálogo': 'OAB 1ª Fase',
      'Área / Matéria': r.area || 'Geral',
      'Título da Videoaula': r.titulo || 'Sem título',
      'Link YouTube': videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      'ID do Vídeo': videoId,
      'Duração': formatDuration(r.duracao_segundos),
      'Duração (seg)': r.duracao_segundos || '',
      'Playlist ID': r.playlist_id || '',
      'Ordem': r.ordem ?? '',
      'Thumbnail': r.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    };
  });

  // 3. Mapear Para Iniciantes
  const sheetIniciante = inicianteRows.map((r, i) => {
    const videoId = r.video_id || '';
    return {
      'Nº': i + 1,
      'Catálogo': 'Para Iniciantes',
      'Área / Matéria': 'Introdução & Fundamentos',
      'Título da Videoaula': r.titulo || 'Sem título',
      'Link YouTube': videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      'ID do Vídeo': videoId,
      'Duração': formatDuration(r.duracao_segundos),
      'Duração (seg)': r.duracao_segundos || '',
      'Playlist ID': r.playlist_id || '',
      'Ordem': r.ordem ?? '',
      'Thumbnail': r.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    };
  });

  // 4. Mapear Videoaulas por Artigo
  const sheetArtigos = [];
  let artigoCount = 1;
  for (const row of artigoRows) {
    const tabelaCodigo = row.tabela_codigo || 'LEI';
    const numArtigo = row.numero_artigo || '';
    const videos = Array.isArray(row.videos) ? row.videos : [];

    for (const v of videos) {
      const vId = v.videoId || v.video_id || '';
      const vUrl = v.url || (vId ? `https://www.youtube.com/watch?v=${vId}` : '');
      sheetArtigos.push({
        'Nº': artigoCount++,
        'Catálogo': 'Videoaula por Artigo (Lei Seca)',
        'Código / Lei': tabelaCodigo,
        'Artigo': `Art. ${numArtigo}`,
        'Tipo': v.tipo ? (v.tipo === 'mais_visto' ? 'Mais Visto' : v.tipo === 'mais_curtido' ? 'Mais Curtido' : 'Mais Recente') : '',
        'Título da Videoaula': v.titulo || 'Sem título',
        'Canal YouTube': v.canal || '',
        'Link YouTube': vUrl,
        'ID do Vídeo': vId,
        'Duração': v.duration || '',
        'Visualizações': v.views ?? '',
        'Likes': v.likes ?? '',
        'Publicado': v.publishedAt || '',
        'Thumbnail': v.thumb || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : ''),
      });
    }
  }

  // 5. Consolidado Master (Todas)
  const sheetMaster = [];
  let masterIdx = 1;

  for (const item of sheetAreas) {
    sheetMaster.push({
      'Nº': masterIdx++,
      'Catálogo / Módulo': item['Catálogo'],
      'Matéria / Origem': item['Área / Matéria'],
      'Título da Videoaula': item['Título da Videoaula'],
      'Link YouTube': item['Link YouTube'],
      'ID do Vídeo': item['ID do Vídeo'],
      'Duração': item['Duração'],
      'Canal / Detalhes': `Playlist: ${item['Playlist ID'] || 'Direito Prime'}`,
      'Thumbnail': item['Thumbnail'],
    });
  }

  for (const item of sheetOab1) {
    sheetMaster.push({
      'Nº': masterIdx++,
      'Catálogo / Módulo': item['Catálogo'],
      'Matéria / Origem': item['Área / Matéria'],
      'Título da Videoaula': item['Título da Videoaula'],
      'Link YouTube': item['Link YouTube'],
      'ID do Vídeo': item['ID do Vídeo'],
      'Duração': item['Duração'],
      'Canal / Detalhes': `Playlist: ${item['Playlist ID'] || 'OAB 1ª Fase'}`,
      'Thumbnail': item['Thumbnail'],
    });
  }

  for (const item of sheetIniciante) {
    sheetMaster.push({
      'Nº': masterIdx++,
      'Catálogo / Módulo': item['Catálogo'],
      'Matéria / Origem': item['Área / Matéria'],
      'Título da Videoaula': item['Título da Videoaula'],
      'Link YouTube': item['Link YouTube'],
      'ID do Vídeo': item['ID do Vídeo'],
      'Duração': item['Duração'],
      'Canal / Detalhes': `Playlist: ${item['Playlist ID'] || 'Para Iniciantes'}`,
      'Thumbnail': item['Thumbnail'],
    });
  }

  for (const item of sheetArtigos) {
    sheetMaster.push({
      'Nº': masterIdx++,
      'Catálogo / Módulo': item['Catálogo'],
      'Matéria / Origem': `${item['Código / Lei']} (${item['Artigo']})`,
      'Título da Videoaula': item['Título da Videoaula'],
      'Link YouTube': item['Link YouTube'],
      'ID do Vídeo': item['ID do Vídeo'],
      'Duração': item['Duração'],
      'Canal / Detalhes': `${item['Canal YouTube'] || ''} • ${item['Tipo'] || ''} (${item['Visualizações'] ? item['Visualizações'] + ' views' : ''})`.trim(),
      'Thumbnail': item['Thumbnail'],
    });
  }

  console.log(`Total consolidado de links de videoaulas: ${sheetMaster.length}`);

  // Criar Workbook
  const wb = XLSX.utils.book_new();

  const addSheet = (data, name, cols) => {
    const ws = XLSX.utils.json_to_sheet(data);
    if (cols) ws['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  const defaultCols = [
    { wch: 6 },   // Nº
    { wch: 25 },  // Catálogo
    { wch: 32 },  // Matéria
    { wch: 65 },  // Título
    { wch: 45 },  // Link
    { wch: 18 },  // ID Vídeo
    { wch: 14 },  // Duração
    { wch: 35 },  // Detalhes
    { wch: 55 },  // Thumb
  ];

  addSheet(sheetMaster, 'TODAS AS VIDEOAULAS', defaultCols);
  addSheet(sheetAreas, 'Áreas do Direito', defaultCols);
  addSheet(sheetOab1, 'OAB 1ª Fase', defaultCols);
  addSheet(sheetIniciante, 'Para Iniciantes', defaultCols);
  addSheet(sheetArtigos, 'Por Artigo de Lei', [
    { wch: 6 },
    { wch: 28 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 60 },
    { wch: 25 },
    { wch: 45 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 15 },
    { wch: 50 },
  ]);

  const excelPath = path.join(DESKTOP_PATH, 'Videoaulas_Direito_Prime_YouTube.xlsx');
  XLSX.writeFile(wb, excelPath);
  console.log(`Excel gerado com sucesso em: ${excelPath}`);

  // Gerar CSV consolidado
  const csvPath = path.join(DESKTOP_PATH, 'Videoaulas_Direito_Prime_YouTube.csv');
  const headers = ['Nº', 'Catálogo / Módulo', 'Matéria / Origem', 'Título da Videoaula', 'Link YouTube', 'ID do Vídeo', 'Duração', 'Canal / Detalhes', 'Thumbnail'];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...sheetMaster.map(r => [
      r['Nº'],
      escapeCsv(r['Catálogo / Módulo']),
      escapeCsv(r['Matéria / Origem']),
      escapeCsv(r['Título da Videoaula']),
      escapeCsv(r['Link YouTube']),
      escapeCsv(r['ID do Vídeo']),
      escapeCsv(r['Duração']),
      escapeCsv(r['Canal / Detalhes']),
      escapeCsv(r['Thumbnail']),
    ].join(';'))
  ].join('\r\n');

  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`CSV gerado com sucesso em: ${csvPath}`);
}

run().catch(console.error);
