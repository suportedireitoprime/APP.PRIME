import pdf from "npm:pdf-parse";

async function run() {
  try {
    const url = "http://www.stf.jus.br/arquivo/biblioteca/PastasMinistros/AndreMendonca/DadosDatas/001.pdf";
    console.log("Fetching", url);
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    console.log("TEXT:");
    console.log(data.text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
} run();
