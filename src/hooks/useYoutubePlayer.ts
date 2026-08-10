import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return apiPromise;
}

interface Opts {
  videoId: string;
  startAt?: number;
  /** Quando false, nada do YouTube é baixado (fachada com capa). */
  ativo?: boolean;
  /** Começa a tocar assim que o player fica pronto. */
  autoplay?: boolean;
  onTick?: (tempo: number, duracao: number) => void;
  onEnded?: () => void;
}

/** Baixa o script da API em idle, para que o 1º toque no play já o encontre pronto. */
export function preaquecerYoutubeApi() {
  if (typeof window === 'undefined') return;
  const ric: any = (window as any).requestIdleCallback || ((fn: any) => setTimeout(fn, 1200));
  ric(() => { void loadYouTubeApi(); }, { timeout: 3000 });
}

/** Embute o player do YouTube com API JS: retoma o ponto e reporta progresso. */
export function useYoutubePlayer({ videoId, startAt = 0, ativo = true, autoplay = false, onTick, onEnded }: Opts) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [pronto, setPronto] = useState(false);
  const [playing, setPlaying] = useState(false);
  const cbRef = useRef({ onTick, onEnded });
  cbRef.current = { onTick, onEnded };
  const startRef = useRef(startAt);
  startRef.current = startAt;

  useEffect(() => {
    if (!videoId) return;
    let cancelado = false;
    let timer: number | undefined;

    loadYouTubeApi().then(() => {
      if (cancelado || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { 
          rel: 0, 
          modestbranding: 1, 
          playsinline: 1, 
          hl: 'pt', 
          autoplay: autoplay ? 1 : 0,
          origin: window.location.origin,
          controls: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (e: any) => {
            setPronto(true);
            if (startRef.current > 5) e.target.seekTo(startRef.current, true);
            if (autoplay) {
              setTimeout(() => {
                e.target.playVideo?.();
              }, 150);
            }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setPlaying(false);
            
            if (e.data === window.YT.PlayerState.ENDED) cbRef.current.onEnded?.();
          },
        },
      });

      timer = window.setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        const t = p.getCurrentTime() || 0;
        const d = p.getDuration() || 0;
        if (d > 0 && t > 0) cbRef.current.onTick?.(t, d);
      }, 1000);
    });

    return () => {
      cancelado = true;
      setPlaying(false);
      if (timer) window.clearInterval(timer);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, autoplay]);

  // Hook para play/pause externo via "ativo"
  useEffect(() => {
    if (!pronto || !playerRef.current) return;
    if (ativo) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [ativo, pronto]);

  return { containerRef, playerRef, pronto, playing };
}
