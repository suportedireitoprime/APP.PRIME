import React, { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ArrowRight, X } from "lucide-react";
import { useAudiobookPlayer } from "@/contexts/AudiobookPlayerContext";
import { haptic } from "@/lib/nativeHaptics";

/**
 * Mini Player Flutuante de Audiobooks — Estilo Cápsula idêntico a Áudio Aulas.
 * Permanece ativo e flutuando acima da barra de navegação em qualquer tela do app quando minimizado.
 */
export const GlobalAudiobookMiniPlayer: React.FC = memo(() => {
  const {
    livroAtual,
    capituloAtual,
    tocando,
    togglePlay,
    modalAberto,
    setModalAberto,
    fechar,
    tempo,
    dur,
    isPlayingTitulo,
  } = useAudiobookPlayer();

  const navigate = useNavigate();
  const location = useLocation();
  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const medir = () => {
      const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
      setNavHeight(nav ? nav.getBoundingClientRect().height : 0);
    };
    medir();

    const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
    let ro: ResizeObserver | undefined;
    if (nav && "ResizeObserver" in window) {
      ro = new ResizeObserver(medir);
      ro.observe(nav);
    }
    window.addEventListener("resize", medir);
    const t = window.setTimeout(medir, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", medir);
      window.clearTimeout(t);
    };
  }, [location.pathname]);

  // Se não houver livro tocando ou se o modal estiver aberto em tela cheia, não mostra o mini player
  const visible = Boolean(livroAtual && capituloAtual && !modalAberto);

  const handleReopen = () => {
    haptic.selection();
    setModalAberto(true);
  };

  const progress = dur > 0 ? (tempo / dur) * 100 : 0;
  const eqBars = [0, 1, 2, 3];

  if (!visible || !livroAtual || !capituloAtual) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed left-0 right-0 z-[80] px-3 pointer-events-none md:left-auto md:right-6 md:px-0"
          style={{
            bottom: navHeight ? `${navHeight + 28}px` : `calc(9.5rem + var(--sai-bottom,0px))`,
          }}
        >
          <div className="pointer-events-auto mx-auto max-w-md md:w-96 rounded-full border border-purple-500/30 bg-[#0d0d12]/95 backdrop-blur-md shadow-2xl shadow-black/80 flex items-center gap-2 pl-1.5 pr-1.5 py-1.5 relative overflow-hidden transition-all hover:scale-[1.02]">
            {/* Efeito de brilho/reflexo passando */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-purple-400/15 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
            />

            {/* Barra de progresso vibrante roxa na parte inferior da cápsula */}
            <div
              className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 transition-[width] duration-200"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />

            {/* Botão Play / Pause circular roxo vibrante */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={tocando ? "Pausar" : "Continuar"}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:opacity-70 transition flex items-center justify-center relative z-10 shadow-md shadow-purple-600/40"
            >
              {tocando ? (
                <Pause className="w-4 h-4 text-white" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Capa em miniatura da obra */}
            <button
              onClick={handleReopen}
              aria-label={`Reabrir ${livroAtual.titulo}`}
              className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-purple-400/40 relative z-10 shadow-sm"
            >
              <img
                src={livroAtual.capaUrl}
                alt={livroAtual.titulo}
                className="w-full h-full object-cover"
              />
            </button>

            {/* Equalizador animado quando tocando */}
            <div
              className="flex items-end gap-[2px] h-5 flex-shrink-0 pl-0.5 relative z-10"
              aria-hidden
            >
              {eqBars.map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-purple-400"
                  initial={{ height: 4 }}
                  animate={tocando ? { height: [4, 14, 7, 16, 5, 12, 4] } : { height: 4 }}
                  transition={
                    tocando
                      ? {
                          duration: 0.9 + i * 0.15,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.08,
                        }
                      : { duration: 0.2 }
                  }
                />
              ))}
            </div>

            {/* Metadados: Título do Capítulo e Autor/Livro legíveis sem truncamento abusivo */}
            <button
              onClick={handleReopen}
              className="flex-1 min-w-0 text-left px-1 relative z-10"
              aria-label="Abrir audiobook em tela cheia"
            >
              <p className="text-[12px] font-sans font-bold text-white truncate leading-tight">
                {isPlayingTitulo ? `Apresentando: ${capituloAtual.titulo}` : capituloAtual.titulo}
              </p>
              <p className="text-[10px] text-white/70 truncate leading-tight mt-0.5">
                {livroAtual.titulo} • {livroAtual.autor}
              </p>
            </button>

            {/* Botão Fechar (X) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                fechar();
              }}
              aria-label="Fechar player"
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/10 active:opacity-70 transition flex items-center justify-center relative z-10 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Seta animada para reabrir o modal */}
            <button
              onClick={handleReopen}
              aria-label="Abrir audiobook completo"
              title="Abrir audiobook completo"
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/10 active:opacity-70 transition flex items-center justify-center relative z-10 overflow-hidden"
            >
              <motion.span
                className="inline-flex"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-4 h-4 text-purple-300" strokeWidth={2.4} />
              </motion.span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GlobalAudiobookMiniPlayer.displayName = "GlobalAudiobookMiniPlayer";
export default GlobalAudiobookMiniPlayer;

