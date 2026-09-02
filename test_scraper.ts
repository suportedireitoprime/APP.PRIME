import "https://deno.land/std@0.192.0/dotenv/load.ts";
async function run() {
  const url = "https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=AlexandreMoraesDadosDatas";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  console.log("HTML:", html);
} run();
