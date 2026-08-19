/**
 * Modo Aula — gravação em segmentos.
 *
 * A aula é gravada em blocos de ~5 minutos: cada bloco é um arquivo completo e
 * decodificável, o que evita os limites de tamanho do modelo de transcrição,
 * garante timestamps corretos (o offset de cada bloco é conhecido) e faz com que
 * uma queda no meio da aula não perca o que já foi gravado.
 *
 * Nativo (APK/IPA): capacitor-voice-recorder.
 * Web/preview: MediaRecorder reaproveitando o mesmo MediaStream.
 */
import { Capacitor } from '@capacitor/core';
import { voiceRecorder } from '@/lib/nativeVoiceRecorder';

export const SEGUNDOS_POR_SEGMENTO = 300; // 5 min

export interface SegmentoGravado {
  ordem: number;
  duracaoSeg: number;
  mimeType: string;
  base64?: string;
  blob?: Blob;
}

export type StatusGravacao = 'idle' | 'gravando' | 'pausado' | 'encerrando';

export interface GravadorOpts {
  onSegmento: (segmento: SegmentoGravado) => void | Promise<void>;
  onStatus?: (status: StatusGravacao) => void;
  onErro?: (mensagem: string) => void;
  segundosPorSegmento?: number;
}

export interface Gravador {
  iniciar: () => Promise<boolean>;
  pausar: () => Promise<void>;
  retomar: () => Promise<void>;
  encerrar: () => Promise<void>;
  cancelar: () => Promise<void>;
  segundosDecorridos: () => number;
  status: () => StatusGravacao;
}

export function formatarHms(totalSeg: number): string {
  const s = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const dois = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(seg)}` : `${dois(m)}:${dois(seg)}`;
}

export function criarGravador(opts: GravadorOpts): Gravador {
  const limiteSegmento = opts.segundosPorSegmento ?? SEGUNDOS_POR_SEGMENTO;
  const nativo = Capacitor.isNativePlatform();

  let status: StatusGravacao = 'idle';
  let ordem = 0;
  let totalAcumuladoMs = 0; // aula inteira, sem contar o segmento atual
  let segmentoInicioMs = 0;
  let segmentoAcumuladoMs = 0; // dentro do segmento atual, antes de pausas
  let rotativo: number | null = null;

  // Web
  let stream: MediaStream | null = null;
  let rec: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  const setStatus = (s: StatusGravacao) => {
    status = s;
    opts.onStatus?.(s);
  };

  const msDoSegmento = () =>
    segmentoAcumuladoMs + (status === 'gravando' ? Date.now() - segmentoInicioMs : 0);

  const agendarRotacao = () => {
    limparRotacao();
    const restanteMs = Math.max(1000, limiteSegmento * 1000 - msDoSegmento());
    rotativo = window.setTimeout(() => {
      void rotacionar();
    }, restanteMs);
  };
  const limparRotacao = () => {
    if (rotativo) {
      clearTimeout(rotativo);
      rotativo = null;
    }
  };

  /** Fecha o bloco atual e devolve o arquivo. */
  async function fecharBloco(): Promise<SegmentoGravado | null> {
    const duracaoMs = msDoSegmento();
    const duracaoSeg = Math.max(1, Math.round(duracaoMs / 1000));

    if (nativo) {
      const r = await voiceRecorder.stop();
      if (!r.ok || !r.base64) return null;
      return {
        ordem: ordem++,
        duracaoSeg: r.duration ? Math.max(1, Math.round(r.duration / 1000)) : duracaoSeg,
        mimeType: r.mimeType || 'audio/aac',
        base64: r.base64,
      };
    }

    if (!rec) return null;
    const gravador = rec;
    const blob = await new Promise<Blob>((resolve) => {
      gravador.onstop = () => resolve(new Blob(chunks, { type: gravador.mimeType || 'audio/webm' }));
      if (gravador.state !== 'inactive') gravador.stop();
      else resolve(new Blob(chunks, { type: gravador.mimeType || 'audio/webm' }));
    });
    chunks = [];
    rec = null;
    if (blob.size < 2048) return null;
    return { ordem: ordem++, duracaoSeg, mimeType: blob.type || 'audio/webm', blob };
  }

  /** Abre um novo bloco de gravação. */
  async function abrirBloco(): Promise<boolean> {
    segmentoAcumuladoMs = 0;
    segmentoInicioMs = Date.now();

    if (nativo) {
      const r = await voiceRecorder.start();
      if (!r.ok) {
        opts.onErro?.(r.reason === 'permission_denied'
          ? 'Permissão de microfone negada.'
          : 'Não foi possível iniciar a gravação.');
        return false;
      }
      return true;
    }

    try {
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.start();
      return true;
    } catch {
      opts.onErro?.('Permissão de microfone negada.');
      return false;
    }
  }

  async function rotacionar() {
    if (status !== 'gravando') return;
    const bloco = await fecharBloco();
    totalAcumuladoMs += (bloco?.duracaoSeg ?? 0) * 1000;
    if (bloco) await opts.onSegmento(bloco);
    const ok = await abrirBloco();
    if (!ok) {
      setStatus('idle');
      return;
    }
    agendarRotacao();
  }

  function soltarStream() {
    limparRotacao();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    rec = null;
    chunks = [];
  }

  return {
    async iniciar() {
      if (status !== 'idle') return true;
      ordem = 0;
      totalAcumuladoMs = 0;
      const ok = await abrirBloco();
      if (!ok) return false;
      setStatus('gravando');
      agendarRotacao();
      return true;
    },

    async pausar() {
      if (status !== 'gravando') return;
      segmentoAcumuladoMs = msDoSegmento();
      limparRotacao();
      if (nativo) await voiceRecorder.pause();
      else if (rec && rec.state === 'recording') rec.pause();
      setStatus('pausado');
    },

    async retomar() {
      if (status !== 'pausado') return;
      segmentoInicioMs = Date.now();
      if (nativo) await voiceRecorder.resume();
      else if (rec && rec.state === 'paused') rec.resume();
      setStatus('gravando');
      agendarRotacao();
    },

    async encerrar() {
      if (status === 'idle' || status === 'encerrando') return;
      setStatus('encerrando');
      const bloco = await fecharBloco();
      totalAcumuladoMs += (bloco?.duracaoSeg ?? 0) * 1000;
      if (bloco) await opts.onSegmento(bloco);
      soltarStream();
      setStatus('idle');
    },

    async cancelar() {
      limparRotacao();
      if (status === 'idle') return;
      try {
        if (nativo) await voiceRecorder.stop();
        else if (rec && rec.state !== 'inactive') rec.stop();
      } catch { /* noop */ }
      soltarStream();
      setStatus('idle');
    },

    segundosDecorridos() {
      return Math.round((totalAcumuladoMs + msDoSegmento()) / 1000);
    },

    status() {
      return status;
    },
  };
}
