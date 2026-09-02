import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

function sanitizeName(name) {
  const noAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const parts = noAccents.split(" ").filter(p => !["de", "da", "do", "das", "dos"].includes(p.toLowerCase()));
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
}

async function run() {
  const { data } = await supabase.from("stf_ministros").select("id, nome, dados_e_datas").is("dados_e_datas", null);
  console.log(`Faltam ${data.length} ministros`);
  
  for (const min of data) {
    const s = sanitizeName(min.nome);
    console.log(`Processando ${min.nome} -> ${s}`);
    
    let url = `https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=${s}DadosDatas`;
    let res = await fetch(url, { headers: HEADERS });
    if (res.status === 200 && !res.url.includes("erro-404")) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const contentDiv = doc.querySelector("#conteudo-principal");
      if (contentDiv) {
        let eventos = [];
        const linhas = contentDiv.querySelectorAll("p, span, div");
        let etapaAtual = null;
        let pdfAtual = null;
        for (const linha of linhas) {
           const texto = linha.textContent.trim().toUpperCase();
           if (!texto) continue;
           const a = linha.querySelector("a");
           if (a && a.getAttribute("href")?.toLowerCase().includes(".pdf")) {
              pdfAtual = a.getAttribute("href");
              if (!pdfAtual.startsWith("http")) pdfAtual = "https://www.stf.jus.br" + pdfAtual;
           } else if (texto.length > 5 && texto.length < 150 && !texto.includes("PDF") && !texto.includes("MENSAGEM") && !texto.includes("DADOS E DATAS")) {
              if (etapaAtual && pdfAtual) {
                 eventos.push({ etapa: etapaAtual, pdf_url: pdfAtual, ocr_text: null });
              } else if (etapaAtual && !pdfAtual) {
                 eventos.push({ etapa: etapaAtual, pdf_url: null, ocr_text: null });
              }
              etapaAtual = texto;
              pdfAtual = null;
           }
        }
        if (etapaAtual && pdfAtual) eventos.push({ etapa: etapaAtual, pdf_url: pdfAtual, ocr_text: null });
        else if (etapaAtual && !pdfAtual) eventos.push({ etapa: etapaAtual, pdf_url: null, ocr_text: null });
        
        if (eventos.length > 0) {
           await supabase.from("stf_ministros").update({ dados_e_datas: eventos }).eq("id", min.id);
           console.log(`  Salvo ${eventos.length} eventos`);
        } else {
           console.log("  Sem eventos extraidos");
        }
      }
    } else {
      console.log(`  404/403`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
run();
