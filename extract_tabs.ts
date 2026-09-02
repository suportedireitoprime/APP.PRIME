import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
async function run() {
  const r = await fetch('https://portal.stf.jus.br/ostf/ministros/ministro.asp?periodo=STF&consulta=ALFABETICA', {headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}});
  const h = await r.text();
  const d = new DOMParser().parseFromString(h,'text/html');
  const links = d.querySelectorAll("a[href^='verMinistro.asp?periodo=STF&id=']");
  
  // just pick the first 3 links
  let i = 0;
  for(const l of links) {
    if (i++ > 3) break;
    const href = (l as any).getAttribute('href');
    const name = (l as any).textContent.trim();
    console.log("Ministro:", name);
    
    const url = "https://portal.stf.jus.br/ostf/ministros/" + href;
    const r2 = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}});
    const h2 = await r2.text();
    const d2 = new DOMParser().parseFromString(h2,'text/html');
    const tabs = d2.querySelectorAll('.nav-tabs li a');
    for (const t of tabs) {
      console.log("Tab:", (t as any).textContent.trim(), "Href:", (t as any).getAttribute('href'));
    }
  }
}
run();
