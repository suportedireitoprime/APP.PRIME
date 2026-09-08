import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching Termos Jurídicos...');
  
  // Fetch all in a loop
  let allRecords = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('flashcards_cards')
      .select('id, pergunta')
      .eq('area', 'Termos Jurídicos')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error('Error fetching:', error);
      break;
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data);
      if (data.length < limit) break;
      from += limit;
    } else {
      break;
    }
  }

  console.log(`Found ${allRecords.length} records. Updating tema...`);

  let updated = 0;
  for (let i = 0; i < allRecords.length; i += 50) {
    const batch = allRecords.slice(i, i + 50);
    await Promise.all(batch.map(async (record) => {
      let letra = record.pergunta.trim()[0].toUpperCase();
      // normalize to remove accents if necessary, but A-Z is fine
      letra = letra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!/[A-Z]/.test(letra)) letra = '#'; // fallback
      
      const { error } = await supabase
        .from('flashcards_cards')
        .update({ tema: letra })
        .eq('id', record.id);
        
      if (error) {
         console.error('Error updating', record.id, error);
      }
    }));
    updated += batch.length;
    console.log(`Updated ${updated}/${allRecords.length}`);
  }
  
  console.log('Done!');
}

run();
