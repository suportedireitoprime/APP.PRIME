async function run() {
  const url = "https://www.stf.jus.br/arquivo/biblioteca/PastasMinistros/AndreMendonca/DadosDatas/001.pdf";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const buffer = await res.arrayBuffer();
  console.log("Size:", buffer.byteLength);
  console.log("Content:", new TextDecoder().decode(buffer.slice(0, 200)));
} run();
