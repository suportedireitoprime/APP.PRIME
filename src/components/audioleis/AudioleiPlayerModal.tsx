import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  BookOpen,
  Volume2,
  Scale,
  ListMusic,
} from "lucide-react";
import { CapaOtimizada } from "@/components/audioaulas/home/CapaOtimizada";
import { capaDaArea } from "@/lib/audioaulasHelper";
import { haptic } from "@/lib/nativeHaptics";
import type { ArtigoLei } from "@/data/mockData";
import type { NarracaoItem } from "./AudioleiPlaylistSheet";
import { AudioleiArtigoVadeMecumSheet } from "./AudioleiArtigoVadeMecumSheet";

interface LawOption {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  descricao: string;
  tipo: string;
}

interface AudioleiPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArtigo: NarracaoItem | null;
  currentLaw: LawOption;
  capituloNome?: string;
  artigoDetalhe?: ArtigoLei | null;
  playlistArtigos: NarracaoItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onPlayAudio: (item: NarracaoItem) => void;
  onSeek: (seconds: number) => void;
  onSkip: (direction: "prev" | "next") => void;
  onChangeSpeed: (speed: number) => void;
  onIrParaVadeMecum?: (artigoNumero: string) => void;
}

const COVER_AREAS: Record<string, string> = {
  cf88: "Direito Constitucional",
  cp: "Direito Penal",
  cpp: "Processo Penal",
  cc: "Direito Civil",
  cpc: "Processo Civil",
  clt: "Direito do Trabalho",
  ctn: "Direito Tributário",
  cdc: "Consumidor",
  ce: "Eleitoral",
  cpm: "Direito Penal",
  cppm: "Processo Penal",
  ctb: "Direito Administrativo",
  cflor: "Direito Ambiental",
  ccom: "Direito Empresarial",
  cba: "Direito Administrativo",
  cagua: "Direito Ambiental",
  cmin: "Direito Ambiental",
  ctel: "Direito Administrativo",
  eca: "Direito da Criança e do Adolescente",
  ei: "Direito Civil",
  epd: "Direitos Humanos",
  eir: "Direitos Humanos",
  ec: "Direito Urbanístico",
  ed: "Direito Penal",
  eoab: "Deontologia e Estatuto da OAB",
  et: "Direito Desportivo",
  ej: "Direitos Humanos",
  em: "Direito Administrativo",
  eind: "Direitos Humanos",
  eterra: "Direito Agrário",
  emig: "Direito Internacional",
  eref: "Direitos Humanos",
  emet: "Direito Urbanístico",
  emus: "Direito Administrativo",
  eme: "Direito Empresarial",
  epc: "Direito Médico",
  lep: "Direito Penal",
  lmp: "Direito Penal",
  ld: "Direito Penal",
  loc: "Direito Penal",
  laa: "Direito Penal",
  lit: "Processo Penal",
  l8112: "Direito Administrativo",
  lia: "Direito Administrativo",
};

const formatSeconds = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const AudioleiPlayerModal: React.FC<AudioleiPlayerModalProps> = ({
  isOpen,
  onClose,
  currentArtigo,
  currentLaw,
  capituloNome,
  artigoDetalhe,
  playlistArtigos,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onTogglePlay,
  onPlayAudio,
  onSeek,
  onSkip,
  onChangeSpeed,
  onIrParaVadeMecum,
}) => {
  const currentArea =
    COVER_AREAS[currentLaw.sigla.toLowerCase()] || "Direito Geral";
  const capaUrl = capaDaArea(currentArea);

  const [isVerArtigoOpen, setIsVerArtigoOpen] = useState(false);

  // Índice atual na playlist para controle de avançar/voltar
  const currentIndex = useMemo(() => {
    if (!currentArtigo) return -1;
    return playlistArtigos.findIndex(
      (a) =>
        a.artigo_numero.toLowerCase() ===
        currentArtigo.artigo_numero.toLowerCase(),
    );
  }, [currentArtigo, playlistArtigos]);

  if (!currentArtigo || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop com fade — z-[200] para ficar SEMPRE na frente de qualquer Sheet (z-[100]) */}
      <div
        onClick={() => {
          haptic.selection();
          onClose();
        }}
        aria-hidden
        className={`fixed inset-0 z-[200] bg-black/85 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Conteúdo do Player deslizante de baixo para cima — z-[210] na frente de qualquer Sheet e overlay */}
      <div
        className={`fixed inset-0 z-[210] flex flex-col transition-all duration-300 ease-out lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl lg:h-[88vh] lg:max-h-[720px] lg:rounded-3xl lg:border lg:border-white/15 lg:shadow-2xl lg:shadow-black/90 lg:overflow-hidden ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-full lg:translate-y-[-40%] lg:scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {/* Fundo Cinemático com Blur */}
        <div className="absolute inset-0 -z-10 bg-zinc-950">
          <img
            src={capaUrl}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-25 blur-3xl scale-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-zinc-950/90 to-black" />
        </div>

        {/* Header do Player */}
        <div className="relative z-30 flex items-center justify-between px-4 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+0.75rem)] pb-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              haptic.selection();
              onClose();
            }}
            aria-label="Minimizar player"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-lg grid place-items-center transition active:scale-95 cursor-pointer z-30 shrink-0"
          >
            <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
          </button>

          <div className="text-center min-w-0 px-2 flex-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-widest font-black text-primary leading-tight">
              Em Reprodução • Audioleis
            </p>
            <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs mx-auto mt-0.5">
              {currentLaw.nome}
            </p>
          </div>

          {/* Atalho para ver artigo completo (Vade Mecum) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              haptic.selection();
              setIsVerArtigoOpen(true);
            }}
            aria-label="Ver artigo completo"
            title="Ver artigo completo"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-lg grid place-items-center transition active:scale-95 cursor-pointer z-30 shrink-0"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo Principal do Player */}
        <div className="mx-auto w-full max-w-xl flex-1 min-h-0 flex flex-col justify-between overflow-y-auto px-6 py-2 pb-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))+1.5rem)] lg:pb-8">
          {/* Capa Compacta e Centralizada */}
          <div className="flex items-center justify-center shrink-0 my-2 sm:my-3">
            <span className="w-36 h-36 xs:w-40 xs:h-40 sm:w-48 sm:h-48 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 relative">
              <CapaOtimizada src={capaUrl} alt="" animacaoEntrada />
              {/* Badge da Lei no topo da capa */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-black text-primary tracking-wider uppercase">
                {currentLaw.sigla}
              </div>
            </span>
          </div>

          {/* Título e Metadados do Artigo */}
          <div className="text-center shrink-0 space-y-2 max-w-lg mx-auto">
            {/* Tag da Lei e Capítulo */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300 shadow-sm">
                <Scale className="w-3 h-3 text-primary" />
                <span>{currentLaw.sigla}</span>
              </span>
              {capituloNome && (
                <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[240px]">
                  • {capituloNome}
                </span>
              )}
            </div>

            {/* Número do Artigo em Destaque */}
            <h2 className="text-xl sm:text-2xl md:text-[26px] font-heading font-black text-white tracking-wide leading-snug px-2">
              Artigo {currentArtigo.artigo_numero}
            </h2>

            {/* Botão Ver artigo — estilo Vade Mecum limpo (sem menus de alternância) */}
            <div className="flex justify-center pt-0.5 pb-0.5">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setIsVerArtigoOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-xs sm:text-[13px] font-bold text-white shadow-md shadow-black/40 transition active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Ver artigo</span>
              </button>
            </div>

            {/* Texto do Caput com Scroll se necessário */}
            <div className="max-h-20 sm:max-h-24 overflow-y-auto px-2">
              <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed">
                {artigoDetalhe?.caput ||
                  currentArtigo.titulo_artigo ||
                  "Dispositivo legal em reprodução"}
              </p>
            </div>
          </div>

          {/* Progresso de Áudio */}
          <div className="shrink-0 mt-2 sm:mt-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Progresso do artigo"
              className="w-full accent-primary h-2 rounded-lg bg-white/10 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-zinc-400 mt-1">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Controles de Reprodução */}
          <div className="shrink-0 mt-2 sm:mt-3 flex items-center justify-center gap-4 sm:gap-6">
            {/* Seletor de Velocidade */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                const speeds = [1, 1.25, 1.5, 2];
                const nextIdx =
                  (speeds.indexOf(playbackRate) + 1) % speeds.length;
                onChangeSpeed(speeds[nextIdx]);
              }}
              aria-label="Alterar velocidade"
              className="px-2.5 h-9 rounded-xl text-xs font-mono font-bold bg-white/10 border border-white/15 text-primary hover:bg-white/20 transition active:scale-95"
            >
              {playbackRate}x
            </button>

            {/* Voltar 15s */}
            <button
              type="button"
              onClick={() => onSeek(Math.max(0, currentTime - 15))}
              aria-label="Voltar 15 segundos"
              title="Voltar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:opacity-70"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            {/* Artigo Anterior */}
            <button
              type="button"
              onClick={() => onSkip("prev")}
              disabled={currentIndex <= 0}
              aria-label="Artigo anterior"
              className="h-11 w-11 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:opacity-70"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </button>

            {/* Botão Play / Pause Principal */}
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="h-15 w-15 sm:h-16 sm:w-16 grid place-items-center rounded-full bg-gradient-to-br from-primary via-primary to-rose-600 text-white shadow-xl shadow-primary/40 active:scale-95 transition hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-0.5" />
              )}
            </button>

            {/* Próximo Artigo */}
            <button
              type="button"
              onClick={() => onSkip("next")}
              disabled={
                currentIndex < 0 || currentIndex >= playlistArtigos.length - 1
              }
              aria-label="Próximo artigo"
              className="h-11 w-11 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:opacity-70"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </button>

            {/* Avançar 15s */}
            <button
              type="button"
              onClick={() => onSeek(Math.min(duration, currentTime + 15))}
              aria-label="Avançar 15 segundos"
              title="Avançar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:opacity-70"
            >
              <span className="text-[11px] font-bold">+15s</span>
            </button>
          </div>

          {/* MENU DE ALTERNÂNCIA / ACESSO RÁPIDO AOS PRÓXIMOS ARTIGOS */}
          {playlistArtigos.length > 1 && (
            <div className="shrink-0 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5 text-primary" />
                  <span>Acesso Rápido • Próximos Artigos</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {currentIndex + 1} de {playlistArtigos.length}
                </span>
              </div>

              {/* Trilho Horizontal de Artigos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                {playlistArtigos.map((item, idx) => {
                  const isActive =
                    item.artigo_numero.toLowerCase() ===
                    currentArtigo.artigo_numero.toLowerCase();

                  return (
                    <button
                      key={item.artigo_numero || idx}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        if (!isActive) {
                          onPlayAudio(item);
                        } else {
                          onTogglePlay();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 snap-start ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-primary/40"
                          : "bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10"
                      }`}
                    >
                      {isActive && isPlaying && (
                        <Volume2 className="w-3 h-3 animate-pulse text-white" />
                      )}
                      <span>Art. {item.artigo_numero}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheet deslizante do Artigo Completo no padrão visual Vade Mecum (sem abas de alternância) */}
      <AudioleiArtigoVadeMecumSheet
        isOpen={isVerArtigoOpen}
        onClose={() => setIsVerArtigoOpen(false)}
        artigo={artigoDetalhe || null}
        artigoNumero={currentArtigo.artigo_numero}
        leiNome={currentLaw.nome}
        leiSigla={currentLaw.sigla}
        capituloNome={capituloNome}
        fallbackText={artigoDetalhe?.caput || currentArtigo.titulo_artigo}
      />
    </>,
    document.body,
  );
};
