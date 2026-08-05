import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize2, X, Move } from 'lucide-react';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { ytThumb, limparTitulo } from '@/lib/videoaulasCatalogos';
import { haptic } from '@/lib/nativeHaptics';

/**
 * Player Flutuante de Vídeo (Estilo YouTube PiP / Floating Picture-in-Picture).
 * Quando o usuário navega pelo aplicativo enquanto assiste a uma videoaula,
 * o vídeo continua rodando em segundo plano no cantinho da tela.
 */
export default function GlobalVideoaulaMiniPlayer() {
  const { atual, tocando, togglePlay, fechar, tempo, duracao } = useVideoaulasPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se o usuário está na página dedicada do player completo
  const onVideoPage = location.pathname.includes('/videoaulas/') && location.pathname.split('/').length >= 4;

  // O miniplayer é exibido em todas as telas quando há vídeo ativo e o usuário NÃO está na página cheia do vídeo
  const visible = !!atual && !onVideoPage;

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
      {visible && atual && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          drag
          dragConstraints={{ left: -300, right: 20, top: -500, bottom: 20 }}
          className="fixed bottom-20 right-4 z-[85] w-72 sm:w-80 rounded-2xl border border-white/15 bg-black/95 backdrop-blur-md shadow-2xl shadow-black/90 overflow-hidden pointer-events-auto select-none"
        >
          {/* Header do Miniplayer com botões de fechar e expandir */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-white/10 text-xs text-white">
            <div className="flex items-center gap-1.5 min-w-0">
              <Move className="w-3.5 h-3.5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
              <span className="font-semibold text-[11px] truncate max-w-[140px] text-zinc-200">
                {atual.area || 'Videoaula'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleExpand}
                aria-label="Expandir vídeo"
                title="Expandir para tela cheia"
                className="p-1 rounded-full hover:bg-white/15 text-zinc-300 hover:text-white transition active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  haptic.selection();
                  fechar();
                }}
                aria-label="Fechar vídeo"
                title="Fechar player"
                className="p-1 rounded-full hover:bg-white/15 text-zinc-300 hover:text-white transition active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Vídeo / Thumbnail PiP Container */}
          <div className="relative aspect-video w-full bg-black group overflow-hidden">
            <img
              src={atual.thumb || atual.thumbnail || ytThumb(atual.video_id, 'hq')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            {/* Overlay com botão central de Play / Pause */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => {
                  haptic.selection();
                  togglePlay();
                }}
                aria-label={tocando ? 'Pausar' : 'Tocar'}
                className="h-12 w-12 grid place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-xl shadow-black/50 hover:scale-105 active:scale-95 transition"
              >
                {tocando ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              </button>
            </div>

            {/* Título da aula na parte inferior */}
            <div className="absolute bottom-1.5 left-2.5 right-2.5 pointer-events-none">
              <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                {tituloLimpo}
              </p>
            </div>
          </div>

          {/* Barra de progresso inferior */}
          <div className="h-1 w-full bg-white/10">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
