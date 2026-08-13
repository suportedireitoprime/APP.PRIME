import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

try {
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

async function estimateTable(tableName) {
  // 1. Get total count
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error(`Error counting ${tableName}:`, countError.message);
    return;
  }

  // 2. Get a sample of 100 rows
  const { data, error: dataError } = await supabase
    .from(tableName)
    .select('*')
    .limit(100);

  if (dataError) {
    console.error(`Error fetching sample for ${tableName}:`, dataError.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`Table ${tableName} is empty.`);
    return;
  }

  const sampleSize = JSON.stringify(data).length;
  const avgRowSize = sampleSize / data.length;
  const estimatedTotalSize = avgRowSize * count;
  
  console.log(`--- ${tableName} ---`);
  console.log(`Total Rows: ${count}`);
  console.log(`Sample Avg Row Size: ${(avgRowSize / 1024).toFixed(2)} KB`);
  console.log(`Estimated Total Size: ${(estimatedTotalSize / 1024 / 1024).toFixed(2)} MB`);
}

async function run() {
  await estimateTable('flashcards_decks');
  await estimateTable('flashcards_cards');
  await estimateTable('questoes');
}

run();
