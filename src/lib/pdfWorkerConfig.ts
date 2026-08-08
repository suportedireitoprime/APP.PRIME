// Configuração unificada do PDF.js Worker para evitar erros de private getters / workers no Vite
// Importamos explicitamente a build legacy que é transpilada com ES5/Babel sem private getters
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

let workerConfigurado = false;

export function configurarPdfWorker(lib: typeof pdfjsLib = pdfjsLib) {
  if (workerConfigurado && lib.GlobalWorkerOptions.workerSrc) {
    return;
  }
  // Usamos o worker local e embutido via Vite ?url garantindo funcionamento offline perfeito e seguro
  lib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  workerConfigurado = true;
}

export function getPdfDocumentParams(buf: Uint8Array | ArrayBuffer) {
  const version = pdfjsLib.version || '3.11.174';
  return {
    data: buf instanceof Uint8Array ? buf : new Uint8Array(buf),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
    isEvalSupported: true,
  };
}

// Exportar pdfjsLib do config para centralizar o import correto (legacy build) e evitar mix de versões
export { pdfjsLib };
