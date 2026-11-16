import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'offline-bundle');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fg4Q9U47TMW7voFVPVZb0Q_--H03YrT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll(table, select = '*', orderColumn = null) {
  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;
  let hasMore = true;

  console.log(`[Export] Buscando tabela: ${table}...`);

  while (hasMore) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: true });
    }
    const { data, error } = await query;

    if (error) {
      console.warn(`[Export] Erro ao buscar ${table}:`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    allData = allData.concat(data);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) {
      hasMore = false;
    }
  }

  console.log(`[Export] Sucesso ${table}: ${allData.length} registros obtidos.`);
  return allData;
}

const TARGETS = [
  {
    name: 'biblioteca-classicos',
    fn: () => fetchAll('biblioteca_classicos', 'id, livro, autor, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'biblioteca-oab',
    fn: () => fetchAll('biblioteca_oab', 'id, area, ordem, tema, capa_livro, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'ordem')
  },
  {
    name: 'biblioteca-estudos',
    fn: () => fetchAll('biblioteca_estudos', 'id, tema, area, capa_livro, sobre, link, download, ordem, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'ordem')
  },
  {
    name: 'biblioteca-portugues',
    fn: () => fetchAll('biblioteca_portugues', 'id, area, livro, autor, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'biblioteca-oratoria',
    fn: () => fetchAll('biblioteca_oratoria', 'id, area, livro, autor, capa_livro, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'biblioteca-lideranca',
    fn: () => fetchAll('biblioteca_lideranca', 'id, livro, autor, area, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'biblioteca-fora-da-toga',
    fn: () => fetchAll('biblioteca_fora_da_toga', 'id, area, livro, autor, capa_livro, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'biblioteca-pesquisa-cientifica',
    fn: () => fetchAll('biblioteca_pesquisa_cientifica', 'id, area, livro, autor, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura', 'id')
  },
  {
    name: 'flashcards-areas',
    fn: () => fetchAll('flashcards_areas', '*')
  },
  {
    name: 'flashcards-decks',
    fn: () => fetchAll('flashcards_decks', '*')
  },
  {
    name: 'questoes-cargos',
    fn: () => fetchAll('questoes_cargos', '*')
  },
  {
    name: 'lei-seca-trilhas',
    fn: () => fetchAll('lei_seca_trilhas', '*')
  },
  {
    name: 'stf-ministros',
    fn: () => fetchAll('stf_ministros', '*')
  }
];

async function run() {
  console.log('🚀 Iniciando exportação completa do Offline Bundle...');
  for (const target of TARGETS) {
    try {
      const data = await target.fn();
      if (data && data.length > 0) {
        const filePath = path.join(outDir, `${target.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data));
        const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
        console.log(`💾 Salvo: ${target.name}.json (${sizeMb} MB, ${data.length} itens)`);
      }
    } catch (e) {
      console.error(`❌ Falha no target ${target.name}:`, e.message);
    }
  }
  console.log('✨ Exportação do Offline Bundle concluída!');
}

run();
