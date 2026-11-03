import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  ListOrdered,
  Volume2,
  Subtitles,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { useAudiobookPlayer } from "@/contexts/AudiobookPlayerContext";
import { AudiobookCapitulo, AudiobookLivro } from "@/data/audiobooksCatalogo";

interface AudiobookPlayerModalProps {
  livro?: AudiobookLivro | null;
  capituloInicialIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AudiobookPlayerModal: React.FC<AudiobookPlayerModalProps> = ({
  livro: livroProp,
  capituloInicialIndex,
  isOpen: isOpenProp,
  onClose,
}) => {
  const player = useAudiobookPlayer();

  // Permite uso via props diretas ou via contexto global
  const livro = livroProp || player.livroAtual;
  const isAberto = typeof isOpenProp === "boolean" ? isOpenProp : player.modalAberto;

  const [showCapitulosSheet, setShowCapitulosSheet] = useState(false);
  const [viewMode, setViewMode] = useState<"cena" | "legenda">("cena");

  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const activeCueRef = useRef<HTMLDivElement | null>(null);

  // Inicializa o player global caso tenha sido aberto via props
  useEffect(() => {
    if (isAberto && livroProp && (!player.livroAtual || player.livroAtual.id !== livroProp.id)) {
      player.tocarLivro(livroProp, capituloInicialIndex ?? 0);
    }
  }, [isAberto, livroProp, capituloInicialIndex, player]);

  const capituloAtual = useMemo(() => {
    if (!livro || !livro.capitulos || livro.capitulos.length === 0) return null;
    return livro.capitulos[player.capituloIndex] || livro.capitulos[0];
  }, [livro, player.capituloIndex]);

  // Imagem atual calculada pelos timestamps das cenas
  const imagemAtual = useMemo(() => {
    if (!livro) return "";
    if (!capituloAtual?.imagens || capituloAtual.imagens.length === 0) {
      return livro.capaUrl;
    }
    const hit = capituloAtual.imagens.find(
      (img) => player.tempo >= img.startTime && player.tempo <= img.endTime,
    );
    return hit ? hit.url : capituloAtual.imagens[0].url;
  }, [capituloAtual, player.tempo, livro]);

  // Legenda contínua e sem falhas (calculada no contexto)
  const cueAtual = player.cueAtual;

  // Auto-scroll da transcrição no modo legenda
  useEffect(() => {
    if (viewMode === "legenda" && activeCueRef.current && transcriptContainerRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [cueAtual, viewMode]);

  const formatTempo = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleMinimizar = useCallback(() => {
    haptic.selection();
    if (onClose) onClose();
    player.minimizar();
  }, [onClose, player]);

  // Tecla Esc para minimizar e Espaço para Play/Pause no Desktop
  useEffect(() => {
    if (!isAberto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleMinimizar();
      } else if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        player.togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAberto, handleMinimizar, player]);

  if (!isAberto || !livro || !capituloAtual) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#0A0A0C] text-white overflow-hidden select-none">
      {/* IMAGEM EM TELA TODA (FULL SCREEN BACKGROUND) COM AMBIENT GLOW E DEGRADÊ DE LUXO */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={imagemAtual}
            src={imagemAtual}
            alt={capituloAtual.titulo}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 0.45, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full h-full object-cover object-center filter blur-2xl transform-gpu"
          />
        </AnimatePresence>

        {/* Degradê preto profundo que valoriza os cards e controles */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/90 via-45% to-black/60" />

        {/* Vinheta superior suave */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      {/* Header superior translúcido */}
      <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,0px))] px-4 pb-2.5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0">
        <button
          type="button"
          onClick={handleMinimizar}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white shadow-sm"
          aria-label="Minimizar player"
          title="Minimizar para player flutuante"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center max-w-[70%] text-center">
          <span className="text-[14px] sm:text-[15px] font-sans font-bold text-white truncate max-w-full tracking-normal drop-shadow-md">
            {livro.titulo}
          </span>
          <span className="text-[10.5px] uppercase tracking-widest text-purple-300/80 font-bold flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {livro.autor}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setShowCapitulosSheet(true);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white shadow-sm"
          aria-label="Lista de capítulos"
        >
          <ListOrdered className="w-5 h-5 text-purple-300" />
        </button>
      </header>

      {/* Área Central: Cena Visual / Capa Elevada e Legenda Flutuante com Glassmorphism */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between p-4 max-w-xl mx-auto w-full">
        {viewMode === "cena" ? (
          <div className="w-full h-full flex flex-col items-center justify-center py-1">
            {/* Capa Centralizada com Efeito de Card 3D e Respiração */}
            <motion.div
              animate={player.tocando ? { scale: [1, 1.018, 1], rotate: [0, 0.3, 0] } : { scale: 1 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-[0_22px_55px_rgba(0,0,0,0.95)] border border-white/15 my-auto shrink-0 ring-1 ring-purple-500/20"
            >
              <img
                src={imagemAtual}
                alt={capituloAtual.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              {player.tocando && (
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9.5px] font-bold text-white tracking-wider uppercase font-mono">
                    Tocando
                  </span>
                </div>
              )}
            </motion.div>

            {/* Faixa de Legenda em Tempo Real / Apresentação de Título */}
            <div className="w-full flex flex-col items-center mt-auto pb-1">
              {player.isPlayingTitulo ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full max-w-lg bg-[#141418]/85 backdrop-blur-2xl rounded-2xl px-5 py-3.5 border border-purple-500/40 text-center shadow-[0_15px_35px_rgba(0,0,0,0.8)] mb-2.5"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                    Apresentação do Capítulo
                  </span>
                  <p className="text-[14px] sm:text-[15px] font-sans font-semibold leading-snug text-white drop-shadow-md">
                    {capituloAtual.titulo}
                  </p>
                </motion.div>
              ) : cueAtual ? (
                <motion.div
                  key={cueAtual.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-lg bg-[#141418]/85 backdrop-blur-2xl rounded-2xl px-5 py-3.5 border border-white/15 text-center shadow-[0_15px_35px_rgba(0,0,0,0.8)] mb-2.5 relative overflow-hidden"
                >
                  {/* Visualizador de áudio sutil */}
                  {player.tocando && (
                    <div className="flex items-center justify-center gap-1 mb-2 opacity-75">
                      <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" />
                      <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]" />
                    </div>
                  )}
                  <p className="text-[14.5px] sm:text-[15.5px] font-sans font-medium leading-relaxed text-white/95 drop-shadow-md">
                    {cueAtual.text}
                  </p>
                </motion.div>
              ) : null}

              {/* Botão de Alternar para Transcrição */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setViewMode("legenda");
                }}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-xs font-semibold text-white/90 hover:text-white flex items-center gap-2 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <Subtitles className="w-3.5 h-3.5 text-purple-400" />
                <span>Ver Transcrição / Legenda</span>
              </button>
            </div>
          </div>
        ) : (
          /* Modo Legenda / Transcrição Interativa (Karaokê Teleprompter com Glassmorphism) */
          <div className="w-full h-full flex flex-col justify-between py-2">
            <div
              ref={transcriptContainerRef}
              className="w-full flex-1 max-h-[52dvh] rounded-3xl overflow-y-auto px-4 py-5 bg-black/80 border border-white/15 backdrop-blur-xl space-y-3.5 no-scrollbar shadow-2xl"
            >
              {capituloAtual.cues.map((cue) => {
                const isActive = player.tempo >= cue.start && player.tempo <= cue.end;
                return (
                  <div
                    key={cue.id}
                    ref={isActive ? activeCueRef : null}
                    onClick={() => {
                      haptic.selection();
                      player.seek(cue.start);
                    }}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-purple-600/25 border border-purple-500/50 shadow-lg text-white font-semibold scale-[1.01]"
                        : "text-white/65 hover:text-white/95 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/40 block mb-0.5">
                      {formatTempo(cue.start)}
                    </span>
                    <p className="text-[14px] leading-relaxed font-sans">{cue.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setViewMode("cena");
                }}
                className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 transition-all text-xs font-semibold text-white/85 hover:text-white flex items-center gap-1.5 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Ver Cenas em Tela Cheia</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Painel Inferior: Metadados, Scrub e Controles sobre o degradê preto */}
      <div className="relative z-20 w-full max-w-xl mx-auto px-6 pb-[calc(1.25rem+var(--sai-bottom,0px))] pt-1 flex flex-col gap-3 shrink-0">
        {/* Informações do Capítulo — Tipografia sem abreviação e fácil de leitura */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {player.isPlayingTitulo ? (
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block animate-pulse">
                Apresentando Capítulo...
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                {capituloAtual.numero > 0
                  ? `Capítulo ${capituloAtual.numero} de ${livro.totalCapitulos}`
                  : "Faixa Preliminar"}
              </span>
            )}
            <h2 className="font-sans text-[17px] sm:text-[19px] font-bold text-white leading-snug break-words mt-0.5">
              {capituloAtual.titulo}
            </h2>
            <p className="text-[12px] text-white/70 font-sans mt-0.5">{capituloAtual.autor}</p>
          </div>

          <button
            type="button"
            onClick={player.mudarVelocidade}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 shrink-0 mt-1"
          >
            {player.velocidades[player.velocidadeIndex]}x
          </button>
        </div>

        {/* Barra de Progresso Interativa (Scrub) */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={player.dur || capituloAtual.duracaoSegundos || 100}
            value={player.tempo}
            onChange={(e) => {
              const novo = parseFloat(e.target.value);
              player.seek(novo);
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>{formatTempo(player.tempo)}</span>
            <span>{formatTempo(player.dur || capituloAtual.duracaoSegundos)}</span>
          </div>
        </div>

        {/* Controles Principais de Reprodução */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
          {/* Capítulo Anterior */}
          <button
            type="button"
            onClick={player.capituloAnterior}
            disabled={player.capituloIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
            aria-label="Capítulo anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Retroceder 10s */}
          <button
            type="button"
            onClick={() => player.pularSegundos(-10)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/80 hover:text-white active:scale-95 transition-all relative"
            aria-label="Retroceder 10 segundos"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="absolute text-[8px] font-bold font-mono">10</span>
          </button>

          {/* Botão Play / Pause com Glowing Halo */}
          <div className="relative flex items-center justify-center">
            {player.tocando && (
              <div className="absolute inset-0 rounded-full bg-purple-600/35 blur-xl animate-pulse pointer-events-none" />
            )}
            <button
              type="button"
              onClick={player.togglePlay}
              style={{
                background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #6D28D9 100%)",
                boxShadow: "0 8px 32px -4px rgba(147, 51, 234, 0.75)",
              }}
              className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border border-purple-300/40 hover:scale-105 hover:brightness-110"
              aria-label={player.tocando ? "Pausar" : "Reproduzir"}
            >
              {player.tocando ? (
                <Pause className="w-7 h-7 fill-white drop-shadow-md" />
              ) : (
                <Play className="w-7 h-7 fill-white translate-x-0.5 drop-shadow-md" />
              )}
            </button>
          </div>

          {/* Avançar 10s */}
          <button
            type="button"
            onClick={() => player.pularSegundos(10)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/80 hover:text-white active:scale-95 transition-all relative"
            aria-label="Avançar 10 segundos"
          >
            <RotateCw className="w-5 h-5" />
            <span className="absolute text-[8px] font-bold font-mono">10</span>
          </button>

          {/* Próximo Capítulo */}
          <button
            type="button"
            onClick={player.proximoCapitulo}
            disabled={player.capituloIndex === livro.capitulos.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
            aria-label="Próximo capítulo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer / Bottom Sheet de Seleção de Capítulos */}
      <AnimatePresence>
        {showCapitulosSheet && (
          <div className="fixed inset-0 z-[2050] flex items-end justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="w-full max-w-lg bg-[#141416] rounded-t-3xl border-t border-white/10 p-5 max-h-[82vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-purple-400" />
                  <span>Capítulos do Audiobook</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCapitulosSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto py-3 space-y-2 flex-1 no-scrollbar">
                {livro.capitulos.map((cap, idx) => {
                  const isCurrent = idx === player.capituloIndex;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => {
                        player.selecionarCapitulo(idx);
                        setShowCapitulosSheet(false);
                      }}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all relative overflow-hidden ${
                        isCurrent
                          ? "bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/40 border border-purple-500/80 shadow-lg shadow-purple-950/60 ring-1 ring-purple-400/50"
                          : "bg-white/5 hover:bg-white/10 text-white/80 border border-transparent"
                      }`}
                    >
                      {/* Número / Pílula do Capítulo com anel brilhante se ativo */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                          isCurrent
                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/50 ring-2 ring-purple-300/40 font-bold"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {cap.numero > 0 ? cap.numero : "P"}
                      </div>

                      {/* Informações: Título Completo sem abreviação e fácil de leitura */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/50 text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Ouvindo agora
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-white/50">
                            {cap.duracaoFormatada}
                          </span>
                        </div>

                        <p
                          className={`font-sans text-[13.5px] sm:text-[14.5px] leading-snug break-words ${
                            isCurrent ? "font-bold text-white drop-shadow-sm" : "font-medium text-white/90"
                          }`}
                        >
                          {cap.titulo}
                        </p>
                        <p className="text-[11.5px] text-white/50 mt-0.5 font-sans">
                          {cap.autor}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AudiobookPlayerModal);
