import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUNDLE_DIR = path.join(process.cwd(), 'public', 'offline-bundle');
const BATCH_SIZE = 1000;

async function run() {
  console.log('Starting migration...');

  const files = fs.readdirSync(BUNDLE_DIR).filter(f => f.startsWith('questoes_') && f.endsWith('.json'));
  console.log(`Found ${files.length} question files.`);

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const filePath = path.join(BUNDLE_DIR, file);
    console.log(`\nProcessing ${file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const questoes = JSON.parse(content);
      console.log(`Loaded ${questoes.length} questions from ${file}.`);

      for (let i = 0; i < questoes.length; i += BATCH_SIZE) {
        const batch = questoes.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase
          .from('questoes')
          .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error(`Error inserting batch ${i} to ${i + batch.length}:`, error.message);
          totalErrors += batch.length;
        } else {
          totalImported += batch.length;
          console.log(`  -> Inserted/Upserted ${i + batch.length} / ${questoes.length}`);
        }
      }
    } catch (e) {
      console.error(`Failed to process file ${file}:`, e.message);
    }
  }

  console.log('\n=============================================');
  console.log(`Migration completed!`);
  console.log(`Total questions successfully imported/upserted: ${totalImported}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('=============================================');
}

run();
