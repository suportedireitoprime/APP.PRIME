// Configuração unificada do PDF.js Worker para evitar erros de private getters / workers no Vite
import * as pdfjsLib from 'pdfjs-dist';

let workerConfigurado = false;

export function configurarPdfWorker(lib: typeof pdfjsLib = pdfjsLib) {
  if (workerConfigurado && lib.GlobalWorkerOptions.workerSrc) {
    return;
  }

  try {
    const version = lib.version || '3.11.174';
    // Utiliza o CDN oficial do cdnjs/unpkg correspondente à versão instalada do pdfjs-dist
    lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
    workerConfigurado = true;
  } catch (err) {
    console.warn('Falha ao configurar worker CDN para pdfjs-dist:', err);
  }
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
