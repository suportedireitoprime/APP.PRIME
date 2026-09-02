import * as pdfjsLib from "npm:pdfjs-dist";
import "npm:pdfjs-dist/build/pdf.worker.mjs";

async function run() {
  const url = "http://www.stf.jus.br/arquivo/biblioteca/PastasMinistros/AndreMendonca/DadosDatas/001.pdf";
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  console.log("Pages:", pdfDocument.numPages);
  
  let fullText = "";
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  console.log(fullText);
}
run();
