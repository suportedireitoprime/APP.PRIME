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
      if(row.some(x => x)) {
        rows.push(row);
      }
      row = [];
      val = '';
    } else if (char === '\r') {
      // Ignore carriage return
    } else {
      val += char;
    }
  }
  
  if (val || row.length > 0) {
    row.push(val);
    if(row.some(x => x)) {
      rows.push(row);
    }
  }
  
  const headers = rows[0];
  const data = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] || '';
    });
    return obj;
  });
  
  return data;
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function matchModulos() {
  const { data: areas } = await supabase.from('aprender_areas').select('id').ilike('nome', '%penal%');
  if(!areas || areas.length === 0) return console.log("Area not found");
  
  const areaId = areas[0].id;
  
  const { data: modulos } = await supabase.from('aprender_modulos').select('id, titulo, ordem').eq('area_id', areaId).order('ordem', { ascending: true });
  
  const csvContent = fs.readFileSync('penal_aulas.csv', 'utf8');
  const csvAulas = parseCSV(csvContent);
  
  let currentGroupStart = -1;
  const groups = [];
  
  for(let i=0; i<csvAulas.length; i++) {
    const aulaNum = csvAulas[i]['Aula'];
    if(aulaNum && aulaNum.includes('Aula 01')) {
      if(currentGroupStart !== -1) {
        groups.push(csvAulas.slice(currentGroupStart, i));
      }
      currentGroupStart = i;
    }
  }
  if(currentGroupStart !== -1) {
    groups.push(csvAulas.slice(currentGroupStart));
  }
  
  console.log(`Encontrados ${modulos.length} módulos no BD e ${groups.length} grupos de aulas no CSV.`);
  
  for(let i=0; i<Math.min(modulos.length, groups.length); i++) {
    console.log(`Modulo [${i+1}] (Ordem: ${modulos[i].ordem}): ${modulos[i].titulo}`);
    console.log(`  -> Aulas no CSV: ${groups[i].length} (Primeira: ${groups[i][0]['Titulo_da_Aula']})`);
  }
}

matchModulos();
