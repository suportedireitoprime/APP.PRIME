import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { toast } from 'sonner';

/**
 * Ditado contínuo com pausa/retomada.
 *
 * Diferente de useVoiceInput (que finaliza no primeiro silêncio),
 * este hook continua ouvindo mesmo com pausas na fala — reinicia
 * o reconhecedor automaticamente quando o navegador/plugin encerra
 * por silêncio. Só para quando o usuário clicar em pause/stop.
 *
 * onFinalChunk é chamado a cada trecho consolidado (final) para o
 * chamador acumular texto.
 */
export type DictationState = 'idle' | 'recording' | 'paused';

const isNative = () => Capacitor.isNativePlatform();

async function ensurePermission(): Promise<boolean> {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function useDictation(
  onFinalChunk: (chunk: string) => void,
  lang = 'pt-BR',
) {
  const [state, setState] = useState<DictationState>('idle');
  const [partial, setPartial] = useState('');

  const stateRef = useRef<DictationState>('idle');
  const webRecRef = useRef<any>(null);
  const nativeAttachedRef = useRef(false);
  const nativeLastPartialRef = useRef('');
  const onFinalRef = useRef(onFinalChunk);
  onFinalRef.current = onFinalChunk;

  const setS = (s: DictationState) => {
    stateRef.current = s;
    setState(s);
  };

  // ---------- Web ----------
  const startWeb = useCallback(() => {
    const Ctor: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      toast.error('Reconhecimento de voz indisponível neste navegador');
      setS('idle');
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0]?.transcript ?? '';
        if (r.isFinal) {
          if (txt.trim()) onFinalRef.current(txt.trim());
        } else {
          interim += txt;
        }
      }
      setPartial(interim);
    };
    rec.onerror = (e: any) => {
      // Ignora "no-speech" e "aborted" — apenas reinicia se ainda gravando.
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        toast.error('Permissão de microfone negada');
        setS('idle');
      }
    };
    rec.onend = () => {
      setPartial('');
      // Auto-restart enquanto o usuário ainda estiver gravando.
      if (stateRef.current === 'recording') {
        try { rec.start(); } catch { /* browser might complain if too soon */
          setTimeout(() => {
            if (stateRef.current === 'recording') {
              try { rec.start(); } catch { /* give up */ }
            }
          }, 200);
        }
      }
    };
    webRecRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  }, [lang]);

  const stopWeb = useCallback(() => {
    const rec = webRecRef.current;
    if (!rec) return;
    try { rec.onend = null; rec.stop(); } catch { /* ignore */ }
    webRecRef.current = null;
    setPartial('');
  }, []);

  // ---------- API ----------
  const start = useCallback(async () => {
    if (stateRef.current !== 'idle') return;
    const ok = await ensurePermission();
    if (!ok) {
      toast.error('Permissão de microfone negada ou indisponível');
      return;
    }
    setS('recording');
    startWeb();
  }, [startWeb]);

  const pause = useCallback(async () => {
    if (stateRef.current !== 'recording') return;
    setS('paused');
    stopWeb();
  }, [stopWeb]);

  const resume = useCallback(async () => {
    if (stateRef.current !== 'paused') return;
    setS('recording');
    startWeb();
  }, [startWeb]);

  const stop = useCallback(async () => {
    if (stateRef.current === 'idle') return;
    setS('idle');
    stopWeb();
  }, [stopWeb]);

  useEffect(() => {
    return () => {
      // Cleanup ao desmontar.
      stateRef.current = 'idle';
      const rec = webRecRef.current;
      if (rec) {
        try { rec.onend = null; rec.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  return { state, partial, start, pause, resume, stop };
}
