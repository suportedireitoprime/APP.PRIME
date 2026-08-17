export async function ensureSpeechPermission(): Promise<boolean> {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export type SpeechListener = (partial: string, isFinal: boolean) => void;

let webRec: any = null;

export async function startListening(onResult: SpeechListener, lang = 'pt-BR'): Promise<void> {
  const ok = await ensureSpeechPermission();
  if (!ok) throw new Error('Permissão de microfone negada ou reconhecimento indisponível neste navegador');

  const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  webRec = new Ctor();
  webRec.lang = lang;
  webRec.continuous = false;
  webRec.interimResults = true;
  webRec.onresult = (e: any) => {
    let text = '';
    let isFinal = false;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
      if (e.results[i].isFinal) isFinal = true;
    }
    onResult(text.trim(), isFinal);
  };
  webRec.onerror = (e: any) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      throw new Error('Permissão de microfone negada');
    }
  };
  webRec.onend = () => {
    webRec = null;
  };
  webRec.start();
}

/** Para o reconhecimento. `cancel=true` descarta o texto (não chama onFinal). */
export async function stopListening(cancel = false): Promise<void> {
  if (webRec) {
    if (cancel) webRec.onresult = null;
    try { webRec.onend = null; webRec.stop(); } catch { /* ignore */ }
    webRec = null;
  }
}
