const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateCSV() {
  console.log("Fetching articles...");
  let allData = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('vade_mecum_artigos')
      .select('numero, texto')
      .eq('lei_id', 'cf9e9292-4fe0-4b23-ae89-611edbb92503')
      .ilike('texto', 'Art.%')
      .order('ordem', { ascending: true })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error("Error fetching:", error);
      break;
    }
    
    if (data.length === 0) break;
    
    allData = allData.concat(data);
    offset += limit;
  }
  
  console.log(`Fetched ${allData.length} articles.`);
  
  let csvContent = "Numero,Texto,\n";
  
  for (const art of allData) {
    let numero = art.numero;
    let texto = art.texto || "";
    
    // Remove tudo que está entre parênteses, ex: (Redação dada pela Lei nº ...)
    texto = texto.replace(/\([^)]+\)/g, '').trim();
    
    // Trata quebras de linha e aspas para CSV
    texto = texto.replace(/\r?\n/g, '  '); // substitui quebra de linha por espaços duplos
    texto = texto.replace(/"/g, '""'); // escapa aspas duplas
    
    csvContent += `"${numero}","${texto}",\n`;
  }
  
  // \uFEFF é o BOM para UTF-8, garantindo que o Excel abra com acentos corretos
  fs.writeFileSync('codigo_penal_artigos.csv', '\uFEFF' + csvContent, 'utf-8');
  console.log("CSV created: codigo_penal_artigos.csv");
}

generateCSV();
