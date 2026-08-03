// Controle de mídia unificado (notificação / lockscreen / controles do fone).
//
// Web: usa a Media Session API do navegador.
// Nativo (Capacitor Android/iOS): usa @jofr/capacitor-media-session, que
// implementa a sessão de mídia no nativo — o WebView do Android ignora a API
// web — criando a notificação com capa, progresso e botões, e mantendo um
// foreground service para o áudio continuar em segundo plano.
//
// Seguro em qualquer plataforma: sem suporte, tudo é ignorado.

import { MediaSession } from '@jofr/capacitor-media-session';

const DEFAULT_ARTIST = 'Direito Prime';
const FALLBACK_ART = '/icon-512.png';

type Handler = (() => void) | undefined;

export type RegistrarMidiaArgs = {
  /** Linha principal da notificação. */
  titulo: string;
  /** Linha secundária (lei, matéria, área…). */
  subtitulo?: string;
  /** Agrupador opcional (ex.: "Leis Cantadas", "Audioaulas"). */
  album?: string;
  /** URL da capa/thumb. Relativa ou absoluta. */
  capaUrl?: string;
  audio: HTMLAudioElement;
  onNext?: Handler;
  onPrev?: Handler;
  onStop?: Handler;
  onSeek?: (timeSec: number) => void;
};

const ACOES: MediaSessionAction[] = [
  'play',
  'pause',
  'stop',
  'seekbackward',
  'seekforward',
  'seekto',
  'nexttrack',
  'previoustrack',
];

function urlAbsoluta(url?: string): string {
  const alvo = url && url.trim() ? url : FALLBACK_ART;
  if (/^(https?:|data:|blob:)/.test(alvo)) return alvo;
  if (typeof window === 'undefined') return alvo;
  try {
    return new URL(alvo, window.location.origin).toString();
  } catch {
    return alvo;
  }
}

function tipoDaArte(url: string): string {
  if (/\.webp(\?|$)/i.test(url)) return 'image/webp';
  if (/\.jpe?g(\?|$)/i.test(url)) return 'image/jpeg';
  return 'image/png';
}

// ————— camada de adaptação (plugin nativo ⇄ Media Session web) —————

const setMetadata = (m: { title: string; artist: string; album: string; artwork: MediaImage[] }) => {
  void MediaSession.setMetadata(m).catch(() => {});
};

const setPlaybackState = (playbackState: MediaSessionPlaybackState) => {
  void MediaSession.setPlaybackState({ playbackState }).catch(() => {});
};

const setPositionState = (opts: { duration: number; position: number; playbackRate: number }) => {
  void MediaSession.setPositionState(opts).catch(() => {});
};

const setActionHandler = (
  action: MediaSessionAction,
  handler: ((details: { seekTime?: number | null }) => void) | null,
) => {
  void MediaSession.setActionHandler({ action }, handler).catch(() => {});
};

/** Guarda os listeners de cada <audio> para poder remover ao trocar de faixa. */
const limpezas = new WeakMap<HTMLAudioElement, () => void>();
let audioAtivo: HTMLAudioElement | null = null;

/**
 * Registra o áudio como a mídia atual do sistema.
 * Chame no momento em que a reprodução começa (ou ao trocar de faixa).
 */
export function registrarMidia({
  titulo,
  subtitulo,
  album,
  capaUrl,
  audio,
  onNext,
  onPrev,
  onStop,
  onSeek,
}: RegistrarMidiaArgs) {
  if (typeof window === 'undefined' || !audio) return;

  // Solta o áudio anterior para não ficarem duas sessões concorrentes.
  if (audioAtivo && audioAtivo !== audio) limpezas.get(audioAtivo)?.();
  limpezas.get(audio)?.();
  audioAtivo = audio;

  try {
    const arte = urlAbsoluta(capaUrl);
    const type = tipoDaArte(arte);
    setMetadata({
      title: titulo,
      artist: subtitulo || DEFAULT_ARTIST,
      album: album || DEFAULT_ARTIST,
      artwork: [
        { src: arte, sizes: '512x512', type },
        { src: arte, sizes: '256x256', type },
        { src: arte, sizes: '96x96', type },
      ],
    });

    setActionHandler('play', () => {
      audio.play().catch(() => {});
    });
    setActionHandler('pause', () => audio.pause());
    setActionHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
      onStop?.();
    });
    setActionHandler('seekbackward', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    setActionHandler('seekforward', () => {
      const limite = Number.isFinite(audio.duration) ? audio.duration : Number.MAX_SAFE_INTEGER;
      audio.currentTime = Math.min(limite, audio.currentTime + 10);
    });
    setActionHandler('seekto', (d) => {
      if (d?.seekTime == null) return;
      audio.currentTime = d.seekTime;
      onSeek?.(d.seekTime);
    });
    setActionHandler('nexttrack', onNext ? () => onNext() : null);
    setActionHandler('previoustrack', onPrev ? () => onPrev() : null);

    let ultimaPosicao = -1;
    const atualizarPosicao = (forcar = false) => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const pos = Math.min(audio.currentTime, audio.duration);
      // Evita spam de chamadas na ponte nativa a cada timeupdate.
      if (!forcar && Math.abs(pos - ultimaPosicao) < 1) return;
      ultimaPosicao = pos;
      setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: pos,
      });
    };

    const aoTocar = () => {
      setPlaybackState('playing');
      atualizarPosicao(true);
    };
    const aoPausar = () => {
      setPlaybackState('paused');
      atualizarPosicao(true);
    };
    const aoFinalizar = () => setPlaybackState('none');
    const aoAtualizar = () => atualizarPosicao();
    const aoMetadata = () => atualizarPosicao(true);

    audio.addEventListener('play', aoTocar);
    audio.addEventListener('playing', aoTocar);
    audio.addEventListener('pause', aoPausar);
    audio.addEventListener('ended', aoFinalizar);
    audio.addEventListener('loadedmetadata', aoMetadata);
    audio.addEventListener('durationchange', aoMetadata);
    audio.addEventListener('ratechange', aoMetadata);
    audio.addEventListener('timeupdate', aoAtualizar);

    limpezas.set(audio, () => {
      audio.removeEventListener('play', aoTocar);
      audio.removeEventListener('playing', aoTocar);
      audio.removeEventListener('pause', aoPausar);
      audio.removeEventListener('ended', aoFinalizar);
      audio.removeEventListener('loadedmetadata', aoMetadata);
      audio.removeEventListener('durationchange', aoMetadata);
      audio.removeEventListener('ratechange', aoMetadata);
      audio.removeEventListener('timeupdate', aoAtualizar);
      limpezas.delete(audio);
    });

    setPlaybackState(audio.paused ? 'paused' : 'playing');
    atualizarPosicao(true);
  } catch {
    /* Media Session indisponível — ignora */
  }
}

/** Compatibilidade com o helper antigo. */
export function setupMediaSession(args: {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  audio: HTMLAudioElement;
  onSeek?: (timeSec: number) => void;
}) {
  registrarMidia({
    titulo: args.title,
    subtitulo: args.artist,
    album: args.album,
    capaUrl: args.artworkUrl,
    audio: args.audio,
    onSeek: args.onSeek,
  });
}

/** Remove a notificação de mídia (ao fechar/parar o player). */
export function clearMediaSession(audio?: HTMLAudioElement | null) {
  const alvo = audio ?? audioAtivo;
  if (alvo) limpezas.get(alvo)?.();
  if (alvo === audioAtivo) audioAtivo = null;
  if (typeof window === 'undefined') return;
  setPlaybackState('none');
  ACOES.forEach((a) => setActionHandler(a, null));
}
