import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import "https://deno.land/std@0.210.0/dotenv/load.ts";

const supabase = createClient(
  Deno.env.get('VITE_SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const SECTIONS = [
  { key: 'CurriculoBiografia', dbField: 'curriculo' },
  { key: 'Livros', dbField: 'livros' },
  { key: 'ArtigosRevistas', dbField: 'artigos_revistas' },
  { key: 'Discursos', dbField: 'datas_historicas' }, // Some might be grouped here
  { key: 'Diversos', dbField: 'diversos' }
];

function sanitizeName(name: string): string {
  // Remove accents
  const noAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Remove prepositions and capitalize
  const parts = noAccents.split(' ').filter(p => !['de', 'da', 'do', 'das', 'dos'].includes(p.toLowerCase()));
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
}

async function scrapeSection(pastaName: string, sectionKey: string): Promise<string | null> {
  const url = `https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=${pastaName}${sectionKey}`;
  const res = await fetch(url, { headers: HEADERS });
  
  // se houver redirect para erro-404, cai aqui tb
  if (res.status !== 200 || res.url.includes("erro-404")) {
    return null;
  }
  
  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) return null;

  const content = document.querySelector("#texto-pagina-interna");
  if (!content) return null;

  // extrair texto limpo
  let text = "";
  const paragraphs = content.querySelectorAll("p");
  if (paragraphs.length > 0) {
    for (const p of paragraphs) {
      const pText = (p as any).textContent.trim();
      if (pText) text += pText + "\n\n";
    }
  } else {
    text = (content as any).textContent.trim();
  }

  // Remove coisas repetitivas que o STF coloca no final
  text = text.replace(/O documento a seguir foi elaborado(.*)/g, "");

  return text.trim() || null;
}

async function main() {
  const { data: ministros } = await supabase
    .from('stf_ministros')
    .select('id, nome');
    
  if (!ministros) {
    console.error("Nenhum ministro encontrado");
    return;
  }
  
  console.log(`Verificando pastas para ${ministros.length} ministros...`);

  for (const min of ministros) {
    const pastaName = sanitizeName(min.nome);
    console.log(`\nProcessando ${min.nome} -> ${pastaName}`);
    
    const updates: Record<string, string> = {};
    let foundAny = false;

    for (const sec of SECTIONS) {
      const text = await scrapeSection(pastaName, sec.key);
      if (text) {
        updates[sec.dbField] = text;
        foundAny = true;
        console.log(`  [OK] Encontrou ${sec.key} (${text.length} chars)`);
      }
    }
    
    if (foundAny) {
      const { error } = await supabase
        .from('stf_ministros')
        .update(updates)
        .eq('id', min.id);
        
      if (error) console.error(`Erro ao atualizar ${min.nome}:`, error.message);
      else console.log(`  Atualizado no banco com sucesso.`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

main();
