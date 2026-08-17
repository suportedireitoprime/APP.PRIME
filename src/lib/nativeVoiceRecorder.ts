/**
 * Wrapper de gravação de áudio (substituindo capacitor-voice-recorder temporariamente)
 * Utiliza a API nativa da Web (MediaRecorder) compatível tanto com Navegador quanto WebView.
 */
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const b64 = dataUrl.split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const voiceRecorder = {
  isAvailable: () => true, // Sempre disponível usando Web API

  async hasPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  },

  async requestPermission(): Promise<boolean> {
    return this.hasPermission();
  },

  async start(): Promise<{ ok: boolean; reason?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.start();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? 'permission_denied' };
    }
  },

  async stop(): Promise<{ ok: boolean; base64?: string; mimeType?: string; duration?: number; reason?: string }> {
    return new Promise((resolve) => {
      if (!mediaRecorder) {
        resolve({ ok: false, reason: 'not_recording' });
        return;
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mimeType });
        
        // Desligar o microfone
        mediaRecorder?.stream.getTracks().forEach(t => t.stop());
        mediaRecorder = null;
        
        try {
          const base64 = await convertBlobToBase64(blob);
          resolve({ ok: true, base64, mimeType, duration: 1000 });
        } catch (e: any) {
          resolve({ ok: false, reason: e?.message ?? 'encode_error' });
        }
      };

      mediaRecorder.stop();
    });
  },

  async pause() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
  },

  async resume() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  },
};
