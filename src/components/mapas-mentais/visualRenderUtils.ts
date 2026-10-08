import { buildScene, PALETA, type Scene, type SceneNode } from '@/lib/visuaisJuridicos/layout';
import type { VisualContent, VisualEstilo } from '@/lib/visuaisJuridicos/types';

export const SANS = '"Barlow", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const SERIF = '"Plus Jakarta Sans", "Barlow", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function sceneToSvgMarkup(scene: Scene, estilo: VisualEstilo): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fam = (serif?: boolean) => esc(serif ? SERIF : SANS);

  const body = scene.nodes
    .map((n) => {
      if (n.k === 'rect')
        return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.r ?? 0}" fill="${n.fill ?? 'none'}" stroke="${n.stroke ?? 'none'}" stroke-width="${n.sw ?? 0}"/>`;
      if (n.k === 'circle')
        return `<circle cx="${n.cx}" cy="${n.cy}" r="${n.r}" fill="${n.fill ?? 'none'}" stroke="${n.stroke ?? 'none'}" stroke-width="${n.sw ?? 0}"/>`;
      if (n.k === 'path')
        return `<path d="${n.d}" fill="${n.fill ?? 'none'}" stroke="${n.stroke ?? PALETA.ink}" stroke-width="${n.sw ?? 2}" stroke-linecap="round" stroke-linejoin="round"${n.transform ? ` transform="${n.transform}"` : ''}${n.opacity !== undefined ? ` opacity="${n.opacity}"` : ''}${n.dash ? ` stroke-dasharray="${n.dash}"` : ''}${n.arrow ? ' marker-end="url(#vj-arrow)"' : ''}/>`;

      return `<text x="${n.x}" y="${n.y}" font-size="${n.size}" font-weight="${n.weight ?? 400}" fill="${n.fill ?? PALETA.ink}" text-anchor="${n.anchor ?? 'start'}" font-family="${fam(n.serif)}"${n.italic ? ' font-style="italic"' : ''}${n.spacing ? ` letter-spacing="${n.spacing}"` : ''}>${esc(n.text)}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.w} ${scene.h}" width="${scene.w}" height="${scene.h}"><defs><marker id="vj-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${PALETA.wine}"/></marker><filter id="vj-rough"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g${estilo === 'rascunho' ? ' filter="url(#vj-rough)"' : ''}>${body}</g></svg>`;
}

/** Renderiza o visual num canvas de alta resolucao. */
export async function renderCanvas(content: VisualContent, estilo: VisualEstilo) {
  const scene = buildScene(content);
  const markup = sceneToSvgMarkup(scene, estilo);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('falha ao renderizar'));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = scene.w * scale;
    canvas.height = scene.h * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponível');
    ctx.fillStyle = PALETA.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { canvas, scene };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Envia uma copia do arquivo para a pasta do Google Drive (best-effort). */
export async function espelhar(content: VisualContent, dataUrl: string, mime: string) {
  try {
    const { espelharNoDrive } = await import('@/services/driveMirror');
    const categoria = (['mapa_mental', 'infografico', 'fluxograma', 'diagrama'] as const).includes(
      (content as any).tipo,
    )
      ? ((content as any).tipo as 'mapa_mental')
      : 'outro';
    await espelharNoDrive({
      categoria,
      titulo: content.titulo,
      b64Data: dataUrl.split(',')[1],
      mimeType: mime,
    });
  } catch (err) {
    console.error('Falha ao espelhar no Drive:', err);
  }
}
