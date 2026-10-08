import React from 'react';
import { pdf, Document, Page, Image as PdfImage } from '@react-pdf/renderer';
import type { VisualContent, VisualEstilo } from '@/lib/visuaisJuridicos/types';
import { renderCanvas, espelhar } from './visualRenderUtils';

/** Salva/compartilha o arquivo: nativo via Filesystem + Share, web via link de blob. */
export async function entregarArquivo(dataUrl: string, nomeArquivo: string, mime: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const nativo = (window as any)?.Capacitor?.isNativePlatform?.() === true;

  if (nativo) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const escrito = await Filesystem.writeFile({
      path: nomeArquivo,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({ title: nomeArquivo, files: [escrito.uri] });
    return;
  }

  // Web: converte para Blob (evita limite de tamanho de URLs data:).
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = nomeArquivo;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
}

/** Exporta o visual em PDF (página ajustada ao formato do visual). */
export async function exportarPdf(content: VisualContent, estilo: VisualEstilo, nome: string) {
  const { canvas } = await renderCanvas(content, estilo);
  const w = canvas.width / 2;
  const h = canvas.height / 2;
  const data = canvas.toDataURL('image/png');
  
  const Doc = (
    <Document>
      <Page size={[w, h]} style={{ margin: 0, padding: 0 }}>
        <PdfImage src={data} style={{ width: '100%', height: '100%', margin: 0, padding: 0, objectFit: 'fill' }} />
      </Page>
    </Document>
  );

  const blob = await pdf(Doc).toBlob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = async () => {
    const dataUrl = reader.result as string;
    await entregarArquivo(dataUrl, `${nome}.pdf`, 'application/pdf');
    void espelhar(content, dataUrl, 'application/pdf');
  };
}

/** Gera o arquivo PDF como Blob e URL para visualização direta no leitor de PDF. */
export async function gerarPdfBlob(content: VisualContent, estilo: VisualEstilo = 'limpo'): Promise<{ blob: Blob; url: string }> {
  const { canvas } = await renderCanvas(content, estilo);
  const w = canvas.width / 2;
  const h = canvas.height / 2;
  const data = canvas.toDataURL('image/png');

  const Doc = (
    <Document>
      <Page size={[w, h]} style={{ margin: 0, padding: 0 }}>
        <PdfImage src={data} style={{ width: '100%', height: '100%', margin: 0, padding: 0, objectFit: 'fill' }} />
      </Page>
    </Document>
  );

  const blob = await pdf(Doc).toBlob();
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

/** Exporta o visual em PNG de alta resolução. */
export async function exportarPng(content: VisualContent, estilo: VisualEstilo, nome: string) {
  const { canvas } = await renderCanvas(content, estilo);
  const dataUrl = canvas.toDataURL('image/png');
  await entregarArquivo(dataUrl, `${nome}.png`, 'image/png');
  void espelhar(content, dataUrl, 'image/png');
}
