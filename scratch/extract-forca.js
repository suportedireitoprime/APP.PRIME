import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractAndUpload() {
  const wb = xlsx.readFile('gamificacao.xlsx');
  const ws = wb.Sheets['Jogo_da_Forca'];
  
  // Convert sheet to JSON
  const rawData = xlsx.utils.sheet_to_json(ws);
  
  const records = [];
  
  // Expected columns: Artigo, Texto, Nivel_1_Facil, Nivel_2_Medio, Nivel_3_Dificil
  for (const row of rawData) {
    const artigo = row['Artigo']?.toString();
    const texto = row['Texto']?.toString();
    
    if (!texto) continue;

    // Helper to process a difficulty level
    const processLevel = (levelStr, dificuldade) => {
      if (!levelStr) return;
      const palavras = levelStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
      for (const palavra of palavras) {
        records.push({
          tipo_jogo: 'forca',
          disciplina: 'Código Penal',
          pergunta: texto,
          resposta: palavra,
          artigo: artigo || null,
          dificuldade: dificuldade
        });
      }
    };

    processLevel(row['Nivel_1_Facil'], 'facil');
    processLevel(row['Nivel_2_Medio'], 'medio');
    processLevel(row['Nivel_3_Dificil'], 'dificil');
  }

  console.log(`Parsed ${records.length} records to upload.`);

  // To prevent duplicates, we could delete existing ones for 'forca' and 'Código Penal'
  console.log('Deleting existing forca/Código Penal records...');
  const { error: deleteError } = await supabase
    .from('gamificacao_jogos')
    .delete()
    .eq('tipo_jogo', 'forca')
    .eq('disciplina', 'Código Penal');
    
  if (deleteError) {
    console.error('Error deleting old records:', deleteError);
    // Continue even if error (maybe table doesn't exist yet, we can see the error)
  }

  console.log('Uploading new records in batches of 100...');
  
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('gamificacao_jogos')
      .insert(batch);
      
    if (insertError) {
      console.error(`Error inserting batch ${i}:`, insertError);
      return;
    }
  }

  console.log('Upload complete!');
}

extractAndUpload().catch(console.error);
