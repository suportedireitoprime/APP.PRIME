import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importTermos() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1A2Q_pgxSJR80dEMoUrIizH58f9Q3n9hN36P4vvHaG6c/export?format=csv';
  console.log('Fetching CSV from Google Sheets...');
  
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  console.log('CSV downloaded, parsing...');
  
  // Parse CSV (simple regex for CSV with quoted fields)
  const rows = csvText.split('\n');
  const headers = rows[0].split(',');
  
  const records = [];
  
  // Custom CSV parser to handle quotes
  const parseCSVRow = (row) => {
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    return values;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    
    const values = parseCSVRow(row);
    
    const termo = values[0]?.trim();
    const significado = values[1]?.trim()?.replace(/^"|"$/g, '');
    const exemplo = values[2]?.trim()?.replace(/^"|"$/g, '');
    
    if (termo && significado) {
      records.push({
        area: 'Termos Jurídicos',
        tema: 'Geral',
        pergunta: termo,
        resposta: significado,
        exemplo: exemplo || null,
      });
    }
  }

  console.log(`Found ${records.length} records. Cleaning up old 'Termos Jurídicos' first...`);
  
  // Optional: delete existing so we don't duplicate on re-runs
  const { error: delErr } = await supabase
    .from('flashcards_cards')
    .delete()
    .eq('area', 'Termos Jurídicos');
    
  if (delErr) {
    console.error('Error deleting old records:', delErr);
  }

  console.log('Inserting into Supabase flashcards_cards...');
  
  // Insert in batches of 50
  for (let i = 0; i < records.length; i += 50) {
    const batch = records.slice(i, i + 50);
    const { error: insErr } = await supabase
      .from('flashcards_cards')
      .insert(batch);
      
    if (insErr) {
      console.error(`Error inserting batch ${i}:`, insErr);
    } else {
      console.log(`Inserted ${i + batch.length} records...`);
    }
  }
  
  console.log('Import completed successfully!');
}

importTermos().catch(console.error);
