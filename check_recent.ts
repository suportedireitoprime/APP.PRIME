const names = ["Andre Mendonca", "Flavio Dino", "Cristiano Zanin", "Rosa Weber", "Luiz Fux", "Dias Toffoli", "Carmen Lucia", "Edson Fachin", "Gilmar Mendes", "Kassio Nunes Marques", "Luis Roberto Barroso"];
const HEADERS = { "User-Agent": "Mozilla/5.0" };
function sanitizeName(name) {
  const noAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const parts = noAccents.split(" ").filter(p => !["de", "da", "do", "das", "dos"].includes(p.toLowerCase()));
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
}
async function run() {
  for (const n of names) {
    const s = sanitizeName(n);
    const url = `https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=${s}DadosDatas`;
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    console.log(s, "->", res.status, res.url.includes("erro-404") ? "404 redirect" : "OK", "Size:", text.length, "PDFs:", text.match(/\.pdf/gi)?.length || 0);
  }
}
run();
