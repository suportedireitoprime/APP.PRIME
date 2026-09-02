import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sÃ£o obrigatÃ³rios no arquivo .env");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = "https://portal.stf.jus.br/ostf/ministros";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
};

async function getMinistrosIds() {
  console.log("Buscando lista de ministros...");
  const res = await fetch(`${BASE_URL}/ministro.asp?periodo=STF&consulta=ALFABETICA`, { headers: HEADERS });
  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Falha ao parsear HTML do Ã­ndice");

  const links = document.querySelectorAll("a[href^='verMinistro.asp?periodo=STF&id=']");
  const ministros = [];

  for (const node of links) {
    const el = node as unknown as any;
    const href = el.getAttribute("href");
    const idMatch = href.match(/id=(\d+)/);
    if (idMatch) {
      const nomeCompleto = el.textContent.replace(/\s+/g, ' ').trim();
      // O nome completo costuma estar no formato "Nome Conhecido (Nome Completo)"
      // Vamos tentar extrair o nome curto.
      let nomeCurto = nomeCompleto.split('(')[0].trim();
      ministros.push({
        id_stf: idMatch[1],
        nome_stf: nomeCurto
      });
    }
  }

  // Remove duplicatas
  const unique = [];
  const map = new Map();
  for (const m of ministros) {
    if (!map.has(m.id_stf)) {
      map.set(m.id_stf, true);
      unique.push(m);
    }
  }

  return unique;
}

async function scrapeMinistro(id_stf: string) {
  const url = `${BASE_URL}/verMinistro.asp?periodo=STF&id=${id_stf}`;
  const res = await fetch(url, { headers: HEADERS });
  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) return null;

  const tab = document.querySelector("#stf");
  if (!tab) return null;

  // Remover a imagem do html se existir para nÃ£o poluir o texto
  const imagemContainer = tab.querySelector("#imagem-ministro");
  if (imagemContainer) {
    imagemContainer.remove();
  }

  // O texto restante no #stf contÃ©m a biografia completa
  // Extraimos o textContent limpo
  const paragraphs = tab.querySelectorAll("p");
  let biografia = "";
  for (const p of paragraphs) {
    biografia += (p as unknown as any).textContent.trim() + "\n\n";
  }

  // Se nÃ£o pegou parÃ¡grafos bem definidos, pega o texto inteiro
  if (!biografia.trim()) {
    biografia = (tab as unknown as any).textContent.trim();
  }

  return biografia.trim();
}

async function main() {
  const ministros = await getMinistrosIds();
  console.log(`Encontrados ${ministros.length} ministros na lista alfabÃ©tica.`);

  const batchSize = 5;
  for (let i = 0; i < ministros.length; i += batchSize) {
    const batch = ministros.slice(i, i + batchSize);
    console.log(`Processando lote ${i / batchSize + 1}...`);
    
    await Promise.all(batch.map(async (m) => {
      try {
        const biografia = await scrapeMinistro(m.id_stf);
        if (biografia) {
          // Vamos atualizar no Supabase com base no nome para nÃ£o duplicar.
          // Como alguns nomes podem estar ligeiramente diferentes ("MaurÃ­cio CorrÃªa" vs "Mauricio Correa"),
          // usamos o search no banco.
          // Para simplificar, vou fazer update usando ILIKE %nome%. 
          // Melhor: fazer um update direto na tabela usando o nome extraÃ­do do site.
          // Como nÃ£o sabemos o UUID exato de cada um (pois os que nÃ£o tÃªm vamos inserir), fazemos upsert simples
          // (se houver duplicatas por acentos, podemos ajustar depois).
          
          // Verifica se o ministro jÃ¡ existe pelo nome (ignorando case)
          const { data: existing } = await supabase
            .from('stf_ministros')
            .select('id')
            .ilike('nome', `%${m.nome_stf}%`)
            .limit(1)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('stf_ministros')
              .update({ biografia: biografia })
              .eq('id', existing.id);
            console.log(`[UPDATE] ${m.nome_stf}`);
          } else {
            // Se nÃ£o existe, insere o bÃ¡sico
            await supabase
              .from('stf_ministros')
              .insert({
                nome: m.nome_stf,
                nome_completo: m.nome_stf, // a ser preenchido melhor
                status: 'aposentado', // default
                biografia: biografia
              });
            console.log(`[INSERT] ${m.nome_stf}`);
          }
        }
      } catch (err) {
        console.error(`Erro ao processar ${m.nome_stf}: ${err}`);
      }
    }));
    
    // Pequena pausa
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("ExtraÃ§Ã£o concluÃ­da!");
}

main();
