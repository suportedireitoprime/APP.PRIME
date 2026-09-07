import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ArtigoPdfDoc, ArtigoPdfInput } from '@/components/pdf/ArtigoPdfDoc';
import brasaoUrl from '@/assets/brasao-republica.webp';

const LOGO_URL = '/icon-512.png';

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

async function toPngDataUrl(url: string, size = 512): Promise<string | null> {
  try {
    const src = await urlToDataUrl(url);
    if (!src) return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    const ratio = Math.min(size / img.width, size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/png');
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

export type { ArtigoPdfModo, ArtigoPdfInput } from '@/components/pdf/ArtigoPdfDoc';

export async function gerarArtigoPDF(data: ArtigoPdfInput) {
  const [brasao, logo] = await Promise.all([
    urlToDataUrl(brasaoUrl),
    toPngDataUrl(LOGO_URL, 512),
  ]);

  const doc = React.createElement(ArtigoPdfDoc, {
    data,
    logoSrc: logo || undefined,
    watermarkSrc: brasao || undefined,
  });

  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();

  const filename = `${slug(data.leiLabel)}-art-${slug(data.numero)}-${data.modo}.pdf`;

  // Download via native browser API (works well enough in Capacitor PWA or triggers browser download)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
