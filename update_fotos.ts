import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = "https://portal.stf.jus.br/ostf/ministros";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
};

async function getMinistrosIds() {
  const res = await fetch(`${BASE_URL}/ministro.asp?periodo=STF&consulta=ALFABETICA`, { headers: HEADERS });
  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) return [];

  const links = document.querySelectorAll("a[href^='verMinistro.asp?periodo=STF&id=']");
  const ministros = [];

  for (const node of links) {
    const el = node as unknown as any;
    const href = el.getAttribute("href");
    const idMatch = href.match(/id=(\d+)/);
    if (idMatch) {
      const nomeCompleto = el.textContent.replace(/\s+/g, ' ').trim();
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

async function scrapeFoto(id_stf: string) {
  const url = `${BASE_URL}/verMinistro.asp?periodo=STF&id=${id_stf}`;
  const res = await fetch(url, { headers: HEADERS });
  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) return null;

  const img = document.querySelector("#imagem-ministro img");
  if (!img) return null;

  let src = (img as unknown as any).getAttribute("src");
  if (src) {
    // Ex: ../../util/imagem.asp?tamanho=miniatura&id=707
    src = src.replace("../../", "/"); // Vira /util/imagem.asp...
    if (!src.startsWith("http")) {
      src = "https://portal.stf.jus.br" + src;
    }
    // Melhor usar a imagem original se possível, retirando tamanho=miniatura,
    // mas miniatura é OK se a original for pesada demais. O app pode usar a original!
    // A original está no `href` do <a> pai: href="../../util/imagem.asp?id=707"
    const a = document.querySelector("#imagem-ministro a.thumbnail");
    if (a) {
      let href = (a as unknown as any).getAttribute("href");
      if (href) {
        href = href.replace("../../", "/");
        if (!href.startsWith("http")) href = "https://portal.stf.jus.br" + href;
        return href; // Usa a foto em resolução melhor
      }
    }
    return src;
  }
  return null;
}

async function main() {
  const ministros = await getMinistrosIds();
  console.log(`Encontrados ${ministros.length} ministros.`);

  const batchSize = 10;
  for (let i = 0; i < ministros.length; i += batchSize) {
    const batch = ministros.slice(i, i + batchSize);
    console.log(`Processando lote de fotos ${i / batchSize + 1}...`);
    
    await Promise.all(batch.map(async (m) => {
      try {
        const foto_url = await scrapeFoto(m.id_stf);
        if (foto_url) {
          const { data: existing } = await supabase
            .from('stf_ministros')
            .select('id')
            .ilike('nome', `%${m.nome_stf}%`)
            .limit(1)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('stf_ministros')
              .update({ foto_url: foto_url })
              .eq('id', existing.id);
            console.log(`[OK] Foto atualizada para ${m.nome_stf}: ${foto_url}`);
          }
        } else {
           console.log(`[VAZIO] Sem foto para ${m.nome_stf}`);
        }
      } catch (err) {
        console.error(`Erro: ${m.nome_stf}`, err);
      }
    }));
  }
  console.log("Fotos atualizadas!");
}

main();
