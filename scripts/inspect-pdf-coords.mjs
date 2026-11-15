import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

async function main() {
  const res = await fetch("https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/pilulas/direito-penal/01-historia-do-direito-penal/01-vinganca-privada-e-taliao-ficha-cornell.pdf");
  const ab = await res.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  for (const it of tc.items.slice(45)) {
    console.log(`X: ${Math.round(it.transform[4])}, Y: ${Math.round(it.transform[5])} | "${it.str}"`);
  }
}

main().catch(console.error);
