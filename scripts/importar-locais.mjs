import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OVERPASS_URL = 'https://overpass.private.coffee/api/interpreter';

const CATEGORIAS = {
  delegacias: `
    node["amenity"="police"](area.a);
    way["amenity"="police"](area.a);
  `,
  oab: `
    node["office"="lawyer"]["name"~"OAB|Ordem dos Advogados", i](area.a);
    way["office"="lawyer"]["name"~"OAB|Ordem dos Advogados", i](area.a);
    node["name"~"OAB|Ordem dos Advogados", i](area.a);
    way["name"~"OAB|Ordem dos Advogados", i](area.a);
  `,
  defensoria: `
    node["name"~"Defensoria", i](area.a);
    way["name"~"Defensoria", i](area.a);
  `,
  ministerio_publico: `
    node["name"~"Ministério Público|Promotoria|Procuradoria", i](area.a);
    way["name"~"Ministério Público|Promotoria|Procuradoria", i](area.a);
  `,
};

// Vamos selecionar os principais estados para garantir que conclua rapidamente e traga centenas de registros
const UFS = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'PE', 'DF', 'CE', 'GO', 'SC', 'ES', 'AM', 'PA'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractCoords(el) {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') return [el.lat, el.lon];
  if (el.center && typeof el.center.lat === 'number') return [el.center.lat, el.center.lon];
  return null;
}

function joinEndereco(tags) {
  const parts = [
    [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', '),
    tags['addr:suburb'] || tags['addr:district'],
  ].filter(Boolean);
  return parts.join(' — ').trim() || null;
}

async function run() {
  console.log('--- Iniciando Ingestão de Locais Jurídicos ---');

  for (const [catName, filtro] of Object.entries(CATEGORIAS)) {
    console.log(`\n=== Categoria: ${catName.toUpperCase()} ===`);

    for (const uf of UFS) {
      const query = `
        [out:json][timeout:60];
        area["ISO3166-2"="BR-${uf}"]->.a;
        (
          ${filtro}
        );
        out center tags;
      `;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        
        const res = await fetch(OVERPASS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'DireitoApp/1.0',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          console.log(`[${uf}] HTTP Error ${res.status}`);
          continue;
        }

        const data = await res.json();
        const elements = data.elements || [];

        const rows = elements
          .map((el) => {
            const coords = extractCoords(el);
            if (!coords) return null;
            const tags = el.tags || {};
            const nome = tags.name || tags['name:pt'] || tags.official_name || 'Sem nome';
            return {
              osm_id: `${el.type}/${el.id}`,
              categoria: catName,
              nome,
              endereco: joinEndereco(tags),
              cidade: tags['addr:city'] || null,
              uf,
              cep: tags['addr:postcode'] || null,
              lat: coords[0],
              lng: coords[1],
              telefone: tags.phone || tags['contact:phone'] || null,
              site: tags.website || tags['contact:website'] || null,
              email: tags.email || tags['contact:email'] || null,
              horario: tags.opening_hours ? { raw: tags.opening_hours } : null,
              tags,
              fonte: 'osm',
            };
          })
          .filter(Boolean);

        if (rows.length > 0) {
          const { error } = await supabase
            .from('locais_juridicos')
            .upsert(rows, { onConflict: 'osm_id' });
          if (error) console.log(`[${uf}] Erro no upsert: ${error.message}`);
          else console.log(`[${uf}] Salvo: ${rows.length} locais.`);
        } else {
          console.log(`[${uf}] 0 locais.`);
        }
      } catch (err) {
        console.log(`[${uf}] Timeout/Erro: ${err.message}`);
      }

      await sleep(1000);
    }
  }

  console.log('\n--- Ingestão concluída! ---');
}

run();
