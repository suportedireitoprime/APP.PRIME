import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fg4Q9U47TMW7voFVPVZb0Q_--H03YrT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DESKTOP_PATH = 'C:\\Users\\ext_wpereira\\Desktop';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

async function fetchAllRows(tableName) {
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  console.log(`Buscando dados da tabela ${tableName}...`);
  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      console.error(`Erro ao buscar de ${tableName}:`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows = allRows.concat(data);
      from += step;
      if (data.length < step) {
        hasMore = false;
      }
    }
  }

  console.log(`Total em ${tableName}: ${allRows.length} registros`);
  return allRows;
}

async function main() {
  console.log('Iniciando extração de videoaulas do YouTube...');

  const [areasData, inicianteData, oab1Data, oab2Data] = await Promise.all([
    fetchAllRows('videoaulas_areas_direito'),
    fetchAllRows('videoaulas_iniciante'),
    fetchAllRows('videoaulas_oab_primeira_fase'),
    fetchAllRows('videoaulas_oab_segunda_fase'),
  ]);

  const mapRows = (rows, catalogoNome) => {
    return rows.map((r, idx) => {
      const videoId = r.video_id || '';
      const youtubeLink = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
      const thumb = r.thumb || r.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');

      return {
        'Nº': idx + 1,
        'Catálogo': catalogoNome,
        'Área / Matéria': r.area || 'Geral',
        'Título da Aula': r.titulo || 'Sem título',
        'Link YouTube': youtubeLink,
        'ID do Vídeo': videoId,
        'Duração': formatDuration(r.duracao_segundos),
        'Duração (seg)': r.duracao_segundos || '',
        'Playlist ID': r.playlist_id || '',
        'Thumbnail': thumb,
      };
    });
  };

  const rowsAreas = mapRows(areasData, 'Áreas do Direito');
  const rowsIniciante = mapRows(inicianteData, 'Para Iniciantes');
  const rowsOab1 = mapRows(oab1Data, 'OAB 1ª Fase');
  const rowsOab2 = mapRows(oab2Data, 'OAB 2ª Fase');

  const rowsTodas = [
    ...rowsAreas,
    ...rowsIniciante,
    ...rowsOab1,
    ...rowsOab2,
  ].map((r, i) => ({ ...r, 'Nº': i + 1 }));

  console.log(`Total consolidado de videoaulas: ${rowsTodas.length}`);

  // Criar Workbook XLSX
  const wb = XLSX.utils.book_new();

  const addSheetWithWidths = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },   // Nº
      { wch: 22 },  // Catálogo
      { wch: 28 },  // Área / Matéria
      { wch: 65 },  // Título
      { wch: 45 },  // Link YouTube
      { wch: 18 },  // ID do Vídeo
      { wch: 14 },  // Duração
      { wch: 14 },  // Duração seg
      { wch: 28 },  // Playlist ID
      { wch: 55 },  // Thumbnail
    ];
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheetWithWidths(rowsTodas, 'Todas as Videoaulas');
  addSheetWithWidths(rowsAreas, 'Áreas do Direito');
  addSheetWithWidths(rowsIniciante, 'Para Iniciantes');
  addSheetWithWidths(rowsOab1, 'OAB 1ª Fase');
  addSheetWithWidths(rowsOab2, 'OAB 2ª Fase');

  const excelPath = path.join(DESKTOP_PATH, 'Videoaulas_Direito_Prime_YouTube.xlsx');
  XLSX.writeFile(wb, excelPath);
  console.log(`Planilha Excel salva com sucesso em: ${excelPath}`);

  // Também criar um arquivo CSV com codificação UTF-8 com BOM para abrir perfeito no Excel em português
  const csvPath = path.join(DESKTOP_PATH, 'Videoaulas_Direito_Prime_YouTube.csv');
  const headers = ['Nº', 'Catálogo', 'Área / Matéria', 'Título da Aula', 'Link YouTube', 'ID do Vídeo', 'Duração', 'Playlist ID', 'Thumbnail'];
  
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rowsTodas.map(r => [
      r['Nº'],
      escapeCsv(r['Catálogo']),
      escapeCsv(r['Área / Matéria']),
      escapeCsv(r['Título da Aula']),
      escapeCsv(r['Link YouTube']),
      escapeCsv(r['ID do Vídeo']),
      escapeCsv(r['Duração']),
      escapeCsv(r['Playlist ID']),
      escapeCsv(r['Thumbnail']),
    ].join(';'))
  ].join('\r\n');

  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`Arquivo CSV salvo com sucesso em: ${csvPath}`);

  console.log('Finalizado com sucesso!');
}

main().catch(console.error);
