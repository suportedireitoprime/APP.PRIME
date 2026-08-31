import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const inputPath = 'C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/bc17a713-8221-454f-8448-3f6c01779129/.user_uploaded/media_1788155643426.jpg';
  
  console.log('Reading image...');
  const buffer = fs.readFileSync(inputPath);
  
  console.log('Uploading to Supabase...');
  const { data, error } = await supabase.storage.from('biblioteca-obras').upload('capas_fixas/cp_artigos_v2.jpg', buffer, {
    contentType: 'image/jpeg',
    upsert: true
  });
  
  if (error) console.error('Error uploading:', error);
  else console.log('Successfully uploaded:', data);
}

run();
