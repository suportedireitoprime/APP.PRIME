const https = require('https');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const dnsCache = new Map();
const origLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  if (dnsCache.has(hostname)) {
    const cached = dnsCache.get(hostname);
    if (Date.now() - cached.ts < 3600000) return options && options.all ? callback(null, [{ address: cached.ip, family: 4 }]) : callback(null, cached.ip, 4);
  }
  dns.resolve4(hostname, (err, addrs) => {
    if (!err && addrs && addrs.length > 0) {
      dnsCache.set(hostname, { ip: addrs[0], ts: Date.now() });
      return options && options.all ? callback(null, addrs.map(a => ({ address: a, family: 4 }))) : callback(null, addrs[0], 4);
    }
    return origLookup(hostname, options, callback);
  });
};

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0'
);

const items = [
  { name: 'Direito Administrativo.webp', id: '1yRvtsM9epEDI81wyuTQyVvhWPYm-xjyd', slug: 'direito-administrativo' },
  { name: 'Direito Ambiental.webp', id: '1sYHqPx7ZfZVFAejORXxtohIEgXPZkxLW', slug: 'direito-ambiental' },
  { name: 'Direito Civil.webp', id: '1BXVwAsmaROy5ZWBRMfq0Np3mUDmCNQh0', slug: 'direito-civil' },
  { name: 'Direito Constitucional.webp', id: '1MVnka3-ljQn7iN_xZkFlBNe7p-gN_V7W', slug: 'direito-constitucional' },
  { name: 'Direito da Criança e do Adolescente (ECA).webp', id: '1cIKZFdEIixPMrfA7pIqp46RmacYkwvZG', slug: 'direito-crianca-adolescente-eca' },
  { name: 'Direito do Consumidor.webp', id: '1M9hmia2AAGLfIj0cz9Ua6rj6vvZKgzqL', slug: 'direito-do-consumidor' },
  { name: 'Direito do Trabalho.webp', id: '1rlKPjEmEg7CeC-DVyH5hUuQnl7n9oT-o', slug: 'direito-do-trabalho' },
  { name: 'Direito Eleitoral.webp', id: '1cUIJsSB2TpmB4rHhGgan1Ww0tsykLDBT', slug: 'direito-eleitoral' },
  { name: 'Direito Empresarial.webp', id: '1iE5fkG_KuwXobMtLX19fstkeHsJ-nlAJ', slug: 'direito-empresarial' },
  { name: 'Direito Internacional.webp', id: '1jLjiiTTqkUU_9SVcNfYjx2RLFri54o-Z', slug: 'direito-internacional' },
  { name: 'Direito Penal.webp', id: '1L9iEz0Cq6DurLHhKiN24H1Nfcmf-sF69', slug: 'direito-penal' },
  { name: 'Direito Previdenciário.webp', id: '1P-BSV-ubExxS15QpZ2Ahg3QEcU1QG8pF', slug: 'direito-previdenciario' },
  { name: 'Direito Processual Civil.webp', id: '1eWhWrTYqtP2r57rKGxFoz6RIm4YdrOZF', slug: 'direito-processual-civil' },
  { name: 'Direito Processual do Trabalho.webp', id: '1NyWpYwnNqH3-JOa7qAWTAbJj-xo6yYZn', slug: 'direito-processual-do-trabalho' },
  { name: 'Direito Processual Penal.webp', id: '1KRn6tldBZ60EHHgKjK1P_J06sgnsEv7w', slug: 'direito-processual-penal' },
  { name: 'Direito Tributário.webp', id: '1E8fjZ7ywEz4fHyVXFcxdSiBVph4EGhjV', slug: 'direito-tributario' },
  { name: 'Direitos Humanos.webp', id: '1FZQsT8rTpKE-60FiT8hINDjupxyrr0Ml', slug: 'direitos-humanos' }
];

function downloadDrive(id) {
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log(`Iniciando download e upload de ${items.length} capas para o Supabase Storage...`);
  const urlsMapeadas = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i+1}/${items.length}] Baixando: ${item.name} (${item.id})...`);
    
    try {
      const buffer = await downloadDrive(item.id);
      if (buffer.length < 1000) {
        throw new Error(`Buffer muito pequeno (${buffer.length} bytes) - possível erro de permissão ou redirect HTML`);
      }

      const storagePath = `capas_areas/${item.slug}.webp`;
      console.log(`  ↪ Fazendo upload para biblioteca-obras -> ${storagePath} (${buffer.length} bytes)...`);

      const { data, error } = await sb.storage
        .from('biblioteca-obras')
        .upload(storagePath, buffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (error) throw error;

      const { data: pubData } = sb.storage
        .from('biblioteca-obras')
        .getPublicUrl(storagePath);

      urlsMapeadas[item.slug] = pubData.publicUrl;
      console.log(`  ✓ Sucesso: ${pubData.publicUrl}`);
    } catch (err) {
      console.error(`  ✗ Falha ao processar ${item.name}:`, err.message);
    }
  }

  console.log('\n=== MAPEAMENTO FINAL DE CAPAS NO SUPABASE ===');
  console.log(JSON.stringify(urlsMapeadas, null, 2));

  fs.writeFileSync('scratch/capas_supabase_map.json', JSON.stringify(urlsMapeadas, null, 2));
}

run().catch(console.error);
