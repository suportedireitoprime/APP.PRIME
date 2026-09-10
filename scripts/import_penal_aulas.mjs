import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let val = '';
  let inQuote = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuote && nextChar === '"') {
        val += '"';
        i++; // Skip the next quote
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      row.push(val);
      val = '';
    } else if (char === '\n' && !inQuote) {
      row.push(val);
      if(row.some(x => x)) rows.push(row);
      row = [];
      val = '';
    } else if (char === '\r') {
      // Ignore
    } else {
      val += char;
    }
  }
  
  if (val || row.length > 0) {
    row.push(val);
    if(row.some(x => x)) rows.push(row);
  }
  
  const headers = rows[0];
  const data = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] || '';
    });
    return obj;
  });
  
  return { headers, data };
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const mappedModulos = [
  "Crimes Contra a Família",
  "Teoria Geral do Delito",
  "Iter Criminis",
  "Princípio da Insignificância",
  "Teoria do Erro",
  "Imputabilidade Penal - Parte 1",
  "Imputabilidade e Concurso de Pessoas - Parte 2",
  "Concurso de Pessoas e Autoria Imediata",
  "Teoria da Pena",
  "Funções da Pena",
  "Concurso de Crimes",
  "Dosimetria da Pena",
  "Suspensão Condicional da Pena e Livramento Condicional",
  "Efeitos da Condenação e Reabilitação",
  "Medidas de Segurança",
  "Extinção da Punibilidade e Prescrição",
  "Prescrição Penal"
];

function getSlideType(header) {
  const lower = header.toLowerCase();
  if (lower.includes('abertura') || lower.includes('introducao')) return 'leitura';
  if (lower.includes('linha_do_tempo')) return 'leitura';
  if (lower.includes('glossario') || lower.includes('conceito')) return 'leitura';
  if (lower.includes('storytelling') || lower.includes('caso_pratico_1')) return 'leitura';
  if (lower.includes('jurisprudencia')) return 'leitura';
  if (lower.includes('pegadinha')) return 'destaque';
  if (lower.includes('ligue_os_termos')) return 'conexao';
  if (lower.includes('flashcard')) return 'flashcard';
  if (lower.includes('questao_comentada')) return 'pergunta';
  if (lower.includes('certo_errado')) return 'pergunta';
  if (lower.includes('mapa_mental')) return 'mapa_mental';
  return 'leitura';
}

function getSlideSubtipo(header) {
  const lower = header.toLowerCase();
  if (lower.includes('questao_comentada')) return 'multipla_escolha';
  if (lower.includes('certo_errado')) return 'certo_errado';
  if (lower.includes('caso_pratico')) return 'caso_pratico';
  return null;
}

async function runImport() {
  console.log("Iniciando importação de aulas de Direito Penal...");
  
  const { data: areas } = await supabase.from('aprender_areas').select('id').ilike('nome', '%penal%');
  if(!areas || areas.length === 0) return console.log("Area not found");
  const areaId = areas[0].id;
  
  const { data: modulos } = await supabase.from('aprender_modulos').select('id, titulo').eq('area_id', areaId);
  
  const modulosMap = {};
  modulos.forEach(m => modulosMap[m.titulo.trim()] = m.id);
  
  const csvContent = fs.readFileSync('penal_aulas.csv', 'utf8');
  const { headers, data: csvAulas } = parseCSV(csvContent);
  
  // Agrupar por modulos
  let currentGroupStart = -1;
  const groups = [];
  for(let i=0; i<csvAulas.length; i++) {
    if(csvAulas[i]['Aula'] && csvAulas[i]['Aula'].includes('Aula 01')) {
      if(currentGroupStart !== -1) groups.push(csvAulas.slice(currentGroupStart, i));
      currentGroupStart = i;
    }
  }
  if(currentGroupStart !== -1) groups.push(csvAulas.slice(currentGroupStart));
  
  if (groups.length !== mappedModulos.length) {
    console.error(`Mismatch! Found ${groups.length} groups in CSV but mapped ${mappedModulos.length} modules.`);
    return;
  }
  
  // Apagar aulas antigas desses modulos
  const moduloIdsToUpdate = mappedModulos.map(m => modulosMap[m]);
  console.log(`Deletando aulas antigas de ${moduloIdsToUpdate.length} módulos...`);
  
  // Devido a foreign keys, ao deletar aula, deleta blocos.
  const { error: delErr } = await supabase.from('aprender_aulas').delete().in('modulo_id', moduloIdsToUpdate);
  if (delErr) {
    console.error("Error deleting old aulas:", delErr);
    return;
  }
  
  let totalAulas = 0;
  let totalBlocos = 0;
  
  for(let g = 0; g < groups.length; g++) {
    const moduloNome = mappedModulos[g];
    const moduloId = modulosMap[moduloNome];
    if (!moduloId) {
      console.error(`Modulo ID not found for ${moduloNome}`);
      continue;
    }
    
    const groupAulas = groups[g];
    for(let a = 0; a < groupAulas.length; a++) {
      const csvRow = groupAulas[a];
      const aulaStr = csvRow['Aula'] || '';
      // Ex: "Aula 01" -> ordem 1
      const ordemMatch = aulaStr.match(/\d+/);
      const ordemAula = ordemMatch ? parseInt(ordemMatch[0], 10) : (a + 1);
      
      const slug = csvRow['Titulo_da_Aula'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: novaAula, error: aulaErr } = await supabase.from('aprender_aulas').insert({
        modulo_id: moduloId,
        slug: slug,
        titulo: csvRow['Titulo_da_Aula'],
        objetivo: csvRow['Conteudo_Original'] || null,
        duracao_est_min: 15,
        ordem: ordemAula,
        status: 'published'
      }).select().single();
      
      if (aulaErr) {
        console.error("Error inserting aula:", aulaErr);
        continue;
      }
      totalAulas++;
      
      // Inserir blocos (slides)
      const blocos = [];
      let ordemBloco = 1;
      
      for (const key of headers) {
        if (key && key.startsWith('Slide_')) {
          const content = csvRow[key];
          if (content && content.trim() !== '') {
            const tipo = getSlideType(key);
            const subtipo = getSlideSubtipo(key);
            
            blocos.push({
              aula_id: novaAula.id,
              ordem: ordemBloco++,
              tipo: tipo,
              markdown: content,
              payload: subtipo ? { subtipo, texto: content } : { texto: content }
            });
            totalBlocos++;
          }
        }
      }
      
      if (blocos.length > 0) {
        const { error: blocosErr } = await supabase.from('aprender_blocos').insert(blocos);
        if (blocosErr) {
          console.error(`Error inserting blocos for aula ${novaAula.titulo}:`, blocosErr);
        }
      }
    }
  }
  
  console.log(`Importação concluída! Foram criadas ${totalAulas} aulas com um total de ${totalBlocos} blocos (slides).`);
}

runImport();
