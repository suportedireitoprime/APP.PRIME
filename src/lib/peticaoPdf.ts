import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { PeticaoPdfDoc, PeticaoPdfInput } from '@/components/pdf/PeticaoPdfDoc';
import brasaoUrl from '@/assets/juris-brasao.webp';
import coverArtUrl from '@/assets/juris-cover-art.webp';

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

export type { PeticaoPdfInput } from '@/components/pdf/PeticaoPdfDoc';

export async function gerarPeticaoPDF(input: PeticaoPdfInput) {
  const [brasao, coverArt] = await Promise.all([
    urlToDataUrl(brasaoUrl),
    urlToDataUrl(coverArtUrl),
  ]);

  const doc = React.createElement(PeticaoPdfDoc, {
    data: input,
    coverArtSrc: coverArt || undefined,
    watermarkSrc: brasao || undefined,
  });

  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();

  const filename = `peticao-inicial-${slug(input.titulo)}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
