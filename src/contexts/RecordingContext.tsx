import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { voiceRecorder } from '@/lib/nativeVoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Status = 'idle' | 'recording' | 'paused' | 'saving';

interface Ctx {
  status: Status;
  elapsedMs: number;
  title: string;
  setTitle: (t: string) => void;
  liveText: string;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<{ id: string } | null>;
  cancel: () => Promise<void>;
}

const RecordingContext = createContext<Ctx | null>(null);

async function scheduleOngoingNotification(title: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: 909090,
        title: 'Gravando aula',
        body: title,
        ongoing: true,
        autoCancel: false,
        smallIcon: 'ic_stat_icon_config_sample',
      }],
    });
  } catch { /* ignora se o plugin não estiver configurado */ }
}
async function clearOngoingNotification() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: 909090 }] });
  } catch {}
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [title, setTitle] = useState<string>('');
  const [liveText, setLiveText] = useState<string>('');

  const isNative = Capacitor.isNativePlatform();
  const startedAt = useRef(0);
  const accumulated = useRef(0); // ms acumulado antes de pausas
  const tick = useRef<number | null>(null);
  const mediaRec = useRef<MediaRecorder | null>(null);
  const mediaChunks = useRef<Blob[]>([]);
  const mediaStream = useRef<MediaStream | null>(null);

  const recognition = useRef<any>(null);
  const finalChunks = useRef<string[]>([]); // Armazena texto final caso o motor reinicie
  // Variável ref local para ajudar o onend a checar status sem dependência pesada
  const isRecordingRef = useRef(false);

  const startTicker = () => {
    startedAt.current = Date.now();
    tick.current = window.setInterval(() => {
      setElapsedMs(accumulated.current + (Date.now() - startedAt.current));
    }, 500);
  };
  const stopTicker = () => {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
  };

  const initSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    
    recognition.current = new SpeechRec();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'pt-BR';
    
    recognition.current.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        finalChunks.current.push(final);
      }
      const allText = finalChunks.current.join('') + interim;
      setLiveText(allText);
    };

    recognition.current.onend = () => {
      // Reinicia o reconhecimento se ainda estiver gravando
      if (isRecordingRef.current && recognition.current) {
        try { recognition.current.start(); } catch {}
      }
    };
  };

  useEffect(() => {
    isRecordingRef.current = status === 'recording';
  }, [status]);

  const setKeepAwake = async (keep: boolean) => {
    if (!isNative) return;
    try {
      const { KeepAwake } = await import('@capacitor-community/keep-awake');
      if (keep) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
    } catch { /* ignora se falhar */ }
  };

  const start = useCallback(async () => {
    const t = title.trim() || `Aula ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    setTitle(t);
    accumulated.current = 0;
    setElapsedMs(0);
    setLiveText('');
    finalChunks.current = [];

    if (isNative) {
      const r = await voiceRecorder.start();
      if (!r.ok) { toast.error('Permissão de microfone negada.'); return; }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream.current = stream;
        const rec = new MediaRecorder(stream);
        mediaChunks.current = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) mediaChunks.current.push(e.data); };
        rec.start();
        mediaRec.current = rec;
      } catch { toast.error('Sem acesso ao microfone.'); return; }
      // Wake lock: mantém a tela acordada no PWA/desktop
      try { (navigator as any).wakeLock?.request?.('screen').catch(() => {}); } catch {}
    }

    initSpeechRecognition();
    if (recognition.current) {
      try { recognition.current.start(); } catch {}
    }

    setStatus('recording');
    startTicker();
    scheduleOngoingNotification(t);
    setKeepAwake(true);
    haptic.medium();
  }, [title, isNative]);

  const pause = useCallback(async () => {
    if (status !== 'recording') return;
    stopTicker();
    accumulated.current += Date.now() - startedAt.current;
    if (isNative) {
      await voiceRecorder.pause();
    } else {
      mediaRec.current?.pause();
    }
    setStatus('paused');
    haptic.selection();
  }, [status, isNative]);

  const resume = useCallback(async () => {
    if (status !== 'paused') return;
    if (isNative) {
      await voiceRecorder.resume();
    } else {
      mediaRec.current?.resume();
    }
    startTicker();
    setStatus('recording');
    haptic.selection();
  }, [status, isNative]);

  const stop = useCallback(async (): Promise<{ id: string, liveText: string } | null> => {
    if (status === 'idle') return null;
    stopTicker();
    if (status === 'recording') accumulated.current += Date.now() - startedAt.current;
    setStatus('saving');
    clearOngoingNotification();
    setKeepAwake(false);

    if (recognition.current) {
      try { recognition.current.stop(); } catch {}
    }

    try {
      let bytes: Uint8Array;
      let mime = 'audio/aac';

      if (isNative) {
        const r = await voiceRecorder.stop();
        if (!r.ok || !r.base64) { toast.error('Falha ao salvar gravação.'); setStatus('idle'); return null; }
        mime = r.mimeType || mime;
        const bin = atob(r.base64);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } else {
        const rec = mediaRec.current;
        if (!rec) { setStatus('idle'); return null; }
        await new Promise<void>((resolve) => { rec.onstop = () => resolve(); rec.stop(); });
        mediaStream.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(mediaChunks.current, { type: rec.mimeType || 'audio/webm' });
        mime = blob.type;
        bytes = new Uint8Array(await blob.arrayBuffer());
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { toast.error('Faça login para salvar.'); setStatus('idle'); return null; }

      const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a'
        : mime.includes('aac') ? 'aac'
        : mime.includes('webm') ? 'webm' : 'wav';
      const recId = crypto.randomUUID();
      const filePath = `${user.id}/${recId}.${ext}`;

      const durMs = accumulated.current;
      const finalLiveText = liveText;
      const blob = new Blob([bytes as any], { type: mime });

      const payload = {
        id: recId,
        user_id: user.id,
        title,
        duration_ms: durMs,
        file_path: filePath,
        status: finalLiveText.trim().length > 10 ? 'processando' : 'pronto',
        mode: 'aula',
        transcription: finalLiveText // salva o raw text preliminar
      };

      try {
        const { mediaSyncQueue } = await import('@/services/mediaSyncQueue');
        await mediaSyncQueue.enqueue(
          blob,
          'aulas-audio',
          filePath,
          'audio_recordings',
          payload
        );
        toast.success('Aula salva! Será sincronizada quando houver conexão.');
      } catch (err: any) {
        toast.error('Erro ao salvar localmente: ' + err.message);
        setStatus('idle'); 
        return null;
      }

      setStatus('idle'); setElapsedMs(0); accumulated.current = 0; setTitle(''); setLiveText('');
      finalChunks.current = [];
      haptic.success();
      return { id: recId, liveText: finalLiveText };
    } catch (e: any) {
      toast.error('Erro ao parar: ' + (e?.message ?? 'desconhecido'));
      setStatus('idle');
      return null;
    }
  }, [status, title, isNative, liveText]);

  const cancel = useCallback(async () => {
    stopTicker();
    clearOngoingNotification();
    setKeepAwake(false);
    if (recognition.current) {
      try { recognition.current.stop(); } catch {}
    }
    try {
      if (isNative) await voiceRecorder.stop();
      else {
        mediaRec.current?.stop();
        mediaStream.current?.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    setStatus('idle'); setElapsedMs(0); accumulated.current = 0;
    setLiveText(''); finalChunks.current = [];
  }, [isNative]);

  // Não desmontamos nada: o provider vive no root, então a gravação continua
  // entre navegações. Ao fechar a aba (web), o navegador encerra o mic sozinho.
  useEffect(() => () => { stopTicker(); }, []);

  return (
    <RecordingContext.Provider value={{ status, elapsedMs, title, setTitle, liveText, start, pause, resume, stop, cancel }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording deve ser usado dentro de RecordingProvider');
  return ctx;
}

export function formatHms(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}
