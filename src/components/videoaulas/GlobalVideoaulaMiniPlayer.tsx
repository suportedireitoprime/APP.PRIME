import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize2, X, Move } from 'lucide-react';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { limparTitulo, getCatalogo } from '@/lib/videoaulasCatalogos';
import { haptic } from '@/lib/nativeHaptics';
import { useYoutubePlayer } from '@/hooks/useYoutubePlayer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { invalidarProgresso } from '@/lib/videoaulasStore';
import { registrarMidia, clearMediaSession, setPositionState } from '@/lib/mediaSession';

const GHOST_AUDIO_B64 = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

/**
 * Player Flutuante Global de Vídeo.
 * Hospeda o <iframe> do YouTube.
 * Quando na página do vídeo, assume o tamanho e posição exatos do placeholder.
 * Quando fora da página, vira um Mini Player flutuante (PiP).
 */
export default function GlobalVideoaulaMiniPlayer() {
  const { atual, tocando, togglePlay, fechar, tempo, duracao, setTempoState, setDuracaoState, setTocandoState } = useVideoaulasPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>();
  const salvandoRef = useRef(false);

  const onVideoPage = location.pathname.includes('/videoaulas/') && location.pathname.split('/').length >= 4;

  const salvarProgresso = useCallback(
    async (t: number, d: number, forcarConclusao = false) => {
      if (!userId || !atual || !atual.catalogoId || salvandoRef.current) return;
      const catalogo = getCatalogo(atual.catalogoId);
      if (!catalogo) return;

      salvandoRef.current = true;
      const percentual = d > 0 ? Math.min(100, Math.round((t / d) * 100)) : 0;
      const done = forcarConclusao || percentual >= 92;
      const { error } = await supabase.from('videoaulas_progresso').upsert(
        {
          user_id: userId,
          tabela: catalogo.tabela,
          registro_id: String(atual.id),
          video_id: atual.video_id,
          tempo_atual: Math.round(t),
          duracao: Math.round(d),
          percentual,
          concluida: done,
        },
        { onConflict: 'user_id,tabela,registro_id' },
      );
      salvandoRef.current = false;
      if (error) console.error('[videoaula global] progresso', error.message);
      else if (done) invalidarProgresso();
    },
    [userId, atual]
  );

  const { containerRef, playerRef } = useYoutubePlayer({
    videoId: atual?.video_id || '',
    ativo: tocando,
    autoplay: true,
    startAt: tempo,
    onTick: (t, d) => {
      setTempoState(t);
      setDuracaoState(d);
      salvarProgresso(t, d);
      setPositionState({ duration: d, position: t, playbackRate: 1 });
    },
    onEnded: () => {
      setTocandoState(false);
      salvarProgresso(duracao, duracao, true);
    },
  });

  // Registrar Media Session
  useEffect(() => {
    const audio = audioRef.current;
    if (!atual || !audio) {
      clearMediaSession(audio);
      return;
    }
    
    registrarMidia({
      titulo: limparTitulo(atual.titulo) || 'Videoaula',
      subtitulo: atual.professor || 'Professor',
      album: atual.area,
      capaUrl: atual.capa || undefined,
      audio: audio,
      syncPosition: false,
      onSeek: (timeSec) => {
        playerRef.current?.seekTo?.(timeSec, true);
        setTempoState(timeSec);
      },
    });
    
    return () => clearMediaSession(audio);
  }, [atual, setTempoState, playerRef]);

  // Sincronizar estado 'tocando' para o áudio fantasma
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [tocando]);

  // Sincronizar eventos do áudio fantasma (lockscreen) de volta para o estado global
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => setTocandoState(true);
    const handlePause = () => setTocandoState(false);
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [setTocandoState]);

  // Track the placeholder when on the video page
  useEffect(() => {
    if (!atual) return;
    const el = playerWrapperRef.current;
    if (!el) return;

    if (!onVideoPage) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.width = '';
      el.style.height = '';
      el.style.zIndex = '';
      el.style.borderRadius = '';
      return;
    }

    const loop = () => {
      const placeholder = document.getElementById('videoaula-placeholder');
      if (placeholder && el && onVideoPage) {
        const rect = placeholder.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.top = `${rect.top}px`;
        el.style.left = `${rect.left}px`;
        el.style.width = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
        el.style.zIndex = '40';
        el.style.borderRadius = getComputedStyle(placeholder).borderRadius;
      } else if (el) {
        el.style.top = '';
        el.style.left = '';
        el.style.width = '';
        el.style.height = '';
        el.style.borderRadius = '16px'; // 2xl
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onVideoPage, atual]);

  // Se não tem vídeo ativo, não renderiza nada
  if (!atual) return null;

  const handleExpand = () => {
    haptic.selection();
    if (!atual) return;
    const cat = atual.catalogoId ?? 'areas';
    const area = atual.areaSlug ?? encodeURIComponent(atual.area || 'todas');
    navigate(`/videoaulas/${cat}/${area}/${atual.video_id}`);
  };

  const progress = duracao > 0 ? (tempo / duracao) * 100 : 0;
  const tituloLimpo = atual ? limparTitulo(atual.titulo) : '';

  return (
    <AnimatePresence>
      <motion.div
        ref={playerWrapperRef}
        initial={false}
        animate={
          onVideoPage
            ? { opacity: 1, scale: 1, y: 0, width: 'auto', height: 'auto', bottom: 'auto', right: 'auto', display: 'block' }
            : tocando
              ? { opacity: 1, scale: 1, y: 0, width: 320, height: 180, bottom: 80, right: 16, display: 'block' }
              : { opacity: 0, scale: 0.8, y: 20, width: 320, height: 180, bottom: 80, right: 16, transitionEnd: { display: 'none' } }
        }
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag={!onVideoPage && tocando}
        dragConstraints={{ left: -300, right: 20, top: -500, bottom: 20 }}
        className={
          onVideoPage
            ? "fixed pointer-events-auto bg-black overflow-hidden"
            : `fixed z-[85] rounded-2xl border border-white/15 bg-black overflow-hidden shadow-2xl shadow-black/90 touch-none ${!tocando ? 'pointer-events-none' : 'pointer-events-auto'}`
        }
      >
        <audio ref={audioRef} src={GHOST_AUDIO_B64} loop preload="auto" playsInline className="hidden" />

        {/* Container do Iframe (sempre montado) */}
        <div ref={containerRef} className="w-full h-full pointer-events-auto" />

        {/* Overlays apenas no modo Mini Player */}
        {!onVideoPage && (
          <div className="absolute inset-0 z-10 flex flex-col pointer-events-none group">
            {/* Camada bloqueadora de cliques no iframe. Ao clicar, navega para o vídeo (expande) */}
            <div 
              className="absolute inset-0 pointer-events-auto bg-transparent z-0 cursor-pointer" 
              onClick={handleExpand}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/60 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Botão de Fechar Saliente - Sempre visível */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptic.selection();
                fechar();
              }}
              aria-label="Fechar vídeo"
              className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-rose-600/90 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] pointer-events-auto hover:bg-rose-500 hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <X className="w-5 h-5 drop-shadow-md" />
            </button>

            {/* Ícone indicando que arrasta e título (apenas on hover) */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
              <Move className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-semibold text-[10px] truncate max-w-[120px] text-zinc-200">
                {atual.area || 'Videoaula'}
              </span>
            </div>

            {/* Título da aula na parte inferior (on hover) */}
            <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                {tituloLimpo}
              </p>
            </div>

            {/* Barra de progresso inferior */}
            <div className="absolute bottom-0 left-0 right-0 z-10 h-1 w-full bg-white/10 pointer-events-none">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
