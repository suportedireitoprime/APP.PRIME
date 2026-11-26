import type { Attachment } from './assistenteTypes';

/**
 * Converte imagem (redimensionada e comprimida em JPEG) ou PDF em `Attachment` base64.
 */
export function processChatAttachmentFile(file: File): Promise<Attachment> {
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxW = 1200;
        const maxH = 1200;
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          if (width > height) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao inicializar canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64String = dataUrl.split(',')[1];
        resolve({ mime: 'image/jpeg', data: base64String, name: file.name });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erro ao ler a imagem'));
      };
      img.src = url;
    });
  }

  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          reject(new Error('Erro ao ler o PDF'));
          return;
        }
        const base64String = result.split(',')[1];
        resolve({ mime: 'application/pdf', data: base64String, name: file.name });
      };
      reader.onerror = () => reject(new Error('Erro ao ler o PDF'));
      reader.readAsDataURL(file);
    });
  }

  return Promise.reject(new Error('Apenas imagens e PDFs são suportados'));
}
