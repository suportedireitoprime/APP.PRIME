import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const GIDS = [
  '1890035872', '682493921', '1126134905', '578137110', '693499360',
  '1492511597', '2077773956', '1325047972', '1533356006', '711827692',
  '914031760', '1013818251', '2122908569', '903532549', '1575506108',
  '305678038', '1953173589', '1478824879', '1161131999', '52698622',
  '400554447', '1561446241', '481133844', '798952820', '1309604476',
  '1788156764', '954014332', '396452777', '1388596560', '1595502497',
  '527550183', '1940306070', '122136823', '1614674507', '500557013',
  '1766495795', '1026539733', '648917442', '1636958146', '825878805',
  '1288425590', '651133509', '580699013', '1766471739', '1088171271'
];

function parseCSV(text) {
  const result = [];
  let current = [];
  let inQuotes = false;
  let val = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        val += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        val += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(val);
        val = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        current.push(val);
        result.push(current);
        current = [];
        val = '';
        if (char === '\r') i++;
      } else if (char === '\r') {
        current.push(val);
        result.push(current);
        current = [];
        val = '';
      } else {
        val += char;
      }
    }
  }
  
  if (val !== '' || current.length > 0) {
    current.push(val);
    result.push(current);
  }
  
  const headers = result[0].map(h => h.trim());
  const rows = [];
  for (let i = 1; i < result.length; i++) {
    if (result[i].length <= 1) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = result[i][j] || '';
    }
    rows.push(obj);
  }
  
  return rows;
}

async function fetchTab(gid) {
  const url = `https://docs.google.com/spreadsheets/d/1o2wPWhSHjAWZGJ3ZF5T1EOHVfHyB1B7K/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.text();
}

async function getModuleNames() {
  const text = await fetchTab('165784632');
  const rows = parseCSV(text);
  const names = [];
  for (const row of rows) {
    if (row['Matéria / PDF de Direito Penal']) {
      names.push(row['Matéria / PDF de Direito Penal'].replace(/^\d+\.\s*/, '').trim());
    }
  }
  return names;
}

async function main() {
  const AREA_ID = '892fe81f-e205-4cbd-b931-20582a8658c1'; // Direito Penal

  console.log('Obtendo nomes dos módulos...');
  const moduleNames = await getModuleNames();
  console.log('Módulos encontrados na planilha:', moduleNames.length);

  console.log('Apagando módulos antigos...');
  const { data: modulos, error: modErr } = await supabase.from('aprender_modulos').select('id').eq('area_id', AREA_ID);
  if (modErr) throw modErr;

  const moduloIds = modulos.map(m => m.id);
  if (moduloIds.length > 0) {
    // Apagar blocos primeiro
    for (const moduloId of moduloIds) {
      const { data: aulas } = await supabase.from('aprender_aulas').select('id').eq('modulo_id', moduloId);
      if (aulas && aulas.length > 0) {
        const aulaIds = aulas.map(a => a.id);
        const batchSize = 10;
        for (let i = 0; i < aulaIds.length; i += batchSize) {
          const batch = aulaIds.slice(i, i + batchSize);
          await supabase.from('aprender_blocos').delete().in('aula_id', batch);
        }
        await supabase.from('aprender_aulas').delete().in('id', aulaIds);
      }
    }
    await supabase.from('aprender_modulos').delete().in('id', moduloIds);
  }
  
  let modOrdem = 1;

  for (let g = 0; g < GIDS.length; g++) {
    const gid = GIDS[g];
    const modName = moduleNames[g] || `Módulo ${g + 1}`;
    console.log(`\nBaixando aba ${g + 1}/${GIDS.length} (GID ${gid}) - Módulo: ${modName}...`);
    
    let text;
    try {
      text = await fetchTab(gid);
    } catch(err) {
      console.error(`Erro ao baixar aba ${gid}:`, err);
      continue;
    }

    if (!text.includes('Titulo_da_Aula')) {
      console.log(`Aba ${gid} não possui as colunas corretas. Ignorando.`);
      continue;
    }

    const rows = parseCSV(text);

    const { data: novoModulo, error: newModErr } = await supabase.from('aprender_modulos').insert({
      area_id: AREA_ID,
      titulo: modName,
      slug: modName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      resumo: `Trilha completa e aulas interativas de ${modName}`,
      ordem: modOrdem++
    }).select().single();
    
    if (newModErr) {
      console.error('Erro ao criar módulo:', newModErr);
      continue;
    }

    let aulaOrdem = 1;
    for (const row of rows) {
      const tituloAula = row['Titulo_da_Aula'];
      if (!tituloAula) continue;

      const slugBase = tituloAula.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: aula, error: aulaErr } = await supabase.from('aprender_aulas').insert({
        modulo_id: novoModulo.id,
        titulo: tituloAula,
        slug: `${slugBase}-${aulaOrdem}`,
        ordem: aulaOrdem++
      }).select().single();

      if (aulaErr) {
        console.error('Erro ao criar aula:', aulaErr);
        continue;
      }
      
      const slidesColumns = Object.keys(row).filter(k => k.startsWith('Slide_'));
      let blocoOrdem = 1;
      const blocosToInsert = [];

      for (const col of slidesColumns) {
        const conteudo = row[col];
        if (!conteudo || conteudo.trim() === '') continue;

        let tipo = 'leitura';
        let payload = { conteudo };

        if (col.includes('_Flashcard_')) {
          tipo = 'flashcard';
          let frente = conteudo;
          let verso = '';
          const match = conteudo.match(/Frente:(.*?)Verso:(.*)/is);
          if (match) {
            frente = match[1].trim();
            verso = match[2].trim();
          } else if (conteudo.includes('Verso:')) {
            const parts = conteudo.split('Verso:');
            frente = parts[0].replace('Frente:', '').trim();
            verso = parts[1].trim();
          }
          payload = { frente, verso, subtipo: 'flashcard' };
        } else if (col.includes('_Pergunta') || col.includes('Questao_Comentada')) {
          tipo = 'pergunta';
          if (col.includes('Multipla_Escolha') || col.includes('Pergunta')) {
            payload = { 
              enunciado: conteudo, 
              opcoes: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'], 
              gabarito: 0, 
              justificativa: 'Verifique o material para a justificativa.',
              subtipo: 'multipla_escolha'
            };
          } else if (col.includes('Certo_Errado')) {
             payload = { 
              enunciado: conteudo, 
              opcoes: ['Certo', 'Errado'], 
              gabarito: 0, 
              justificativa: 'Verifique o material para a justificativa.',
              subtipo: 'certo_errado'
            };
          }
        } else if (col.includes('Grafo') || col.includes('Fluxo')) {
          payload.subtipo = 'grafo_decisao';
          payload.titulo = col.replace(/Slide_\d+_/g, '').replace(/_/g, ' ');
        } else if (col.includes('Letra_da_Lei')) {
          payload.subtipo = 'artigo_lei';
        } else {
          payload.titulo = col.replace(/Slide_\d+_/g, '').replace(/_/g, ' ');
        }

        blocosToInsert.push({
          aula_id: aula.id,
          tipo,
          payload,
          ordem: blocoOrdem++
        });
      }

      if (blocosToInsert.length > 0) {
        const { error: blockErr } = await supabase.from('aprender_blocos').insert(blocosToInsert);
        if (blockErr) {
          console.error(`Erro ao inserir blocos da aula ${tituloAula}:`, blockErr);
        }
      }
    }
  }

  console.log('Importação Concluída com sucesso!');
}

main().catch(console.error);
