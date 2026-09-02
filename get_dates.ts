import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
async function run() {
  const url = "https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=GilmarMendesDadosDatas";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const contentDiv = doc.querySelector("#conteudo-principal");
  if (contentDiv) {
    console.log(contentDiv.textContent.trim().substring(0, 1500));
  }
} run();
