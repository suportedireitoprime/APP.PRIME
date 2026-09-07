import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export type FotoEscolhida = { blob: Blob; nome: string; dataUrl: string };

/**
 * Fase 60: Comprime e redimensiona fotos de perfil/avatar tiradas pela câmera ou galeria
 * para teto de 500x500px a 80% WebP, evitando upload e tráfego de fotos de 12MB (Item 60).
 */
export async function compressAvatarBlob(blob: Blob, maxDim = 500, quality = 0.8): Promise<{ blob: Blob; dataUrl: string }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob, dataUrl: '' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ blob, dataUrl: '' });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            resolve({ blob, dataUrl: '' });
            return;
          }
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve({ blob: compressedBlob, dataUrl });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob, dataUrl: '' });
    };

    img.src = url;
  });
}

/**
 * Escolhe uma foto (câmera ou galeria).
 * Nativo: @capacitor/camera (galeria/câmera do sistema).
 * Web: retorna null — o chamador deve manter o <input type="file"> como fallback.
 */
export async function escolherFoto(origem: 'galeria' | 'camera' = 'galeria'): Promise<FotoEscolhida | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const foto = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: origem === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      promptLabelHeader: 'Foto',
      promptLabelPhoto: 'Escolher da galeria',
      promptLabelPicture: 'Tirar foto',
      promptLabelCancel: 'Cancelar',
    });
    const url = foto.webPath || foto.path;
    if (!url) return null;
    const resp = await fetch(url);
    const rawBlob = await resp.blob();

    // Fase 60: Redimensiona e comprime instantaneamente para WebP 500x500
    const { blob, dataUrl } = await compressAvatarBlob(rawBlob, 500, 0.8);
    return { blob, nome: `foto-${Date.now()}.webp`, dataUrl };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    if (/cancel/i.test(msg)) return null;
    console.error('Falha ao escolher foto:', e);
    toast.error('Não consegui abrir a galeria');
    return null;
  }
}

/** Indica se o seletor nativo de fotos está disponível. */
export const temSeletorNativo = () => Capacitor.isNativePlatform();

