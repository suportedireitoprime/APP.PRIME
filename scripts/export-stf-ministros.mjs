import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Tentar ler de .env ou .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUNDLE_DIR = path.resolve('public', 'offline-bundle');
const ASSETS_DIR = path.resolve('public', 'ministros_offline');

// Cria diretórios se não existirem
if (!fs.existsSync(BUNDLE_DIR)) fs.mkdirSync(BUNDLE_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const options = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    client.get(url, options, (response) => {
      // 301/302 redirects might happen, but usually not on imagem.asp. We just check 200.
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        resolve(false); 
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

async function exportMinistros() {
  console.log('Baixando dados dos ministros...');
  const { data, error } = await supabase
    .from('stf_ministros')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar ministros:', error);
    process.exit(1);
  }

  console.log(`Encontrados ${data.length} ministros. Processando imagens...`);

  // Processa as imagens sequencialmente
  let downloadedCount = 0;
  for (const ministro of data) {
    if (ministro.foto_url) {
      // O STF usa .asp que retorna JPEGs. Forçamos .jpg
      let ext = path.extname(new URL(ministro.foto_url).pathname);
      if (!ext || ext === '.asp' || ext === '.php') ext = '.jpg';
      
      const filename = `${ministro.id}${ext}`;
      const dest = path.join(ASSETS_DIR, filename);

      // Baixa a foto fisicamente
      const success = await downloadImage(ministro.foto_url, dest);
      if (success) {
        // Atualiza a URL no JSON para apontar para o arquivo offline
        ministro.foto_url_offline = `/ministros_offline/${filename}`;
        downloadedCount++;
      }
    }
  }

  // Salva o JSON final em offline-bundle
  const jsonPath = path.join(BUNDLE_DIR, 'stf-ministros.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data));

  console.log(`Exportação concluída! JSON criado. ${downloadedCount} imagens baixadas para public/ministros_offline/`);
}

exportMinistros().catch(console.error);
