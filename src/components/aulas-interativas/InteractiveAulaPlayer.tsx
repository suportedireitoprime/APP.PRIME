import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, ArrowLeft, ArrowRight, RotateCcw, Volume2, 
  CheckCircle2, XCircle, Sparkles, HelpCircle, Layers, 
  BookOpen, ChevronRight, Award, Trophy, Compass, Check,
  Sliders, Eye, ListTree, Calendar, Zap, RefreshCw, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { haptic } from '@/lib/nativeHaptics';

export interface EtapaAula {
  etapa: number;
  tipo: string;
  titulo: string;
  imagem?: string;
  imagemUrl?: string;
  audio?: string;
  audioUrl?: string;
  narracao?: string;
  texto?: string;
  
  // Questão
  questao?: string;
  opcoes?: string[];
  certa?: number;
  feedback?: string;

  // Flashcard
  frente?: string;
  verso?: string;

  // Karaokê
  frases?: string[];

  // Comparador
  rotuloL?: string;
  rotuloR?: string;

  // Explorar
  pontos?: Array<{ x: number; y: number; num: number; titulo: string; texto: string }>;

  // Toque e revele
  cartas?: Array<{ pergunta: string; resposta: string }>;

  // Ligar termos
  pares?: Array<[string, string]>;

  // Completar lacunas
  partes?: string[];
  respostas?: string[];

  // Verdadeiro ou falso
  afirmacoes?: Array<{ texto: string; certa: boolean; feedback: string }>;

  // Linha do tempo
  marcos?: Array<{ ano?: string; data?: string; momento?: string; titulo: string; texto: string }>;

  // Mapa mental
  ramos?: Array<{ titulo: string; itens: string[] }>;

  // Desafio final
  perguntas?: Array<{ questao: string; opcoes: string[]; certa: number; explicacao?: string }>;

  // Encerramento
  pontosPrincipais?: string[];
}

export interface AulaData {
  aula?: string;
  materia?: string;
  titulo: string;
  slug?: string;
  total_etapas: number;
  etapas: EtapaAula[];
  capaUrl?: string;
}

interface InteractiveAulaPlayerProps {
  aula: AulaData;
  onClose: () => void;
  onComplete?: () => void;
}

export const InteractiveAulaPlayer: React.FC<InteractiveAulaPlayerProps> = ({
  aula,
  onClose,
  onComplete
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showDrawerEtapas, setShowDrawerEtapas] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Estados locais das atividades interativas
  const [interactiveStates, setInteractiveStates] = useState<Record<number, any>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentStep = aula.etapas[currentIdx] || aula.etapas[0];
  const total = aula.etapas.length;

  // Resetar scroll para o topo a cada troca de etapa
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentIdx]);

  // Carregar e tocar áudio da etapa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setCurrentTime(0);
    setDuration(0);

    if (currentStep.audioUrl) {
      audio.src = currentStep.audioUrl;
      audio.playbackRate = playbackRate;
      audio.load();

      // Tocar automaticamente se já estava tocando ou se for etapa subsequente
      if (isPlaying || currentIdx > 0) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      setIsPlaying(false);
    }
  }, [currentIdx, currentStep.audioUrl]);

  // Atalhos de teclado no Desktop (Setas e Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, isPlaying, total]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    haptic.selection();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Erro ao tocar áudio:', err);
      });
    }
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      haptic.impact();
      setCurrentIdx((prev) => prev + 1);
    } else {
      haptic.success();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      if (onComplete) onComplete();
      else onClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      haptic.selection();
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
    haptic.selection();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Bloco atual (1 de 3, etc.)
  const blocoLabel = useMemo(() => {
    if (currentIdx <= 4) return 'Bloco 1 de 3 · O Terreno da Família';
    if (currentIdx <= 16) return 'Bloco 2 de 3 · Bigamia em Detalhes';
    if (currentIdx <= 29) return 'Bloco 3 de 3 · Prática e Fixação';
    return 'Fechamento · Desafio Final';
  }, [currentIdx]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0D] flex flex-col w-screen h-screen overflow-hidden select-none font-sans text-white">
      {/* Elemento de Áudio HTML5 oculto */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (autoAdvance && currentIdx < total - 1) {
            // Auto avança após terminar o áudio da etapa
            setTimeout(() => {
              handleNext();
            }, 600);
          }
        }}
        onError={(e) => {
          console.warn('Erro no elemento de áudio:', e);
          setIsPlaying(false);
        }}
      />

      {/* TOP HEADER COMPACTO & ELEGANTE */}
      <header className="shrink-0 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-950/80 border-b border-red-500/20 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] px-3 sm:px-5 py-2.5 z-30">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            {/* Botão Voltar */}
            <button
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95 shrink-0"
              title="Voltar ao catálogo"
            >
              <ArrowLeft className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            {/* Informações da Etapa */}
            <div className="flex-1 min-w-0 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10.5px] font-black tracking-widest text-red-400 uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 shrink-0">
                {aula.materia || 'DIREITO PENAL'}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                Etapa <b className="text-white font-bold">{currentIdx + 1}</b> de {total}
              </span>
              <span className="hidden md:inline-flex text-[11px] font-semibold text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {blocoLabel}
              </span>
            </div>

            {/* Gaveta de Etapas */}
            <button
              onClick={() => {
                haptic.selection();
                setShowDrawerEtapas(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition shrink-0"
              title="Ver todas as etapas"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Etapas</span>
            </button>
          </div>

          {/* Barra de Progresso Geral da Aula */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / total) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL DE CONTEÚDO (SCROLL SUAVE SEM BARRA DE ROLAGEM) */}
      <main
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-6 scrollbar-none [&::-webkit-scrollbar]:hidden overscroll-contain"
      >
        <div className="max-w-3xl mx-auto pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.etapa}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {/* RENDERIZADOR ESPECÍFICO CONFORME O TIPO DA ETAPA */}
              <StepRenderer
                step={currentStep}
                idx={currentIdx}
                state={interactiveStates[currentIdx]}
                setState={(val) => {
                  setInteractiveStates((prev) => ({ ...prev, [currentIdx]: val }));
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* RODAPÉ ELEGANTE COM PLAYER CENTRALIZADO & BOTÕES NAS PONTAS (THUMB ZONE) */}
      <footer className="shrink-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/80 border-t border-red-500/20 backdrop-blur-xl px-3 sm:px-5 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Botão Anterior */}
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className={`min-h-[48px] px-3.5 sm:px-5 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold border transition active:scale-95 shrink-0 ${
              currentIdx === 0
                ? 'opacity-30 border-white/5 bg-white/5 text-zinc-500 cursor-not-allowed'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Player de Narração Centralizado no Rodapé */}
          <div className="flex-1 min-w-0 bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900/90 border border-red-500/30 rounded-2xl p-1.5 sm:p-2 flex items-center gap-2.5 shadow-lg shadow-black/40">
            {/* Botão Circular Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:brightness-110 active:scale-95 text-white flex items-center justify-center shadow-md shadow-red-600/40 shrink-0 transition"
              aria-label={isPlaying ? 'Pausar narração' : 'Tocar narração'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Barra de Progresso e Tempo */}
            <div className="flex-1 min-w-0 flex flex-col gap-1 pr-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-400">
                <span className="text-red-400 tracking-wider flex items-center gap-1 truncate">
                  <Volume2 className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="hidden sm:inline">NARRAÇÃO</span>
                </span>
                <span className="tabular-nums text-zinc-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Seekbar com scrubbing */}
              <div
                onClick={handleSeek}
                className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden hover:h-2.5 transition-all"
                title="Toque para avançar/retroceder"
              >
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-400 rounded-full transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Seletor de Velocidade */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-300 hover:text-white transition"
                title="Velocidade de reprodução"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-40 min-w-[70px]">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg text-left transition ${
                        playbackRate === rate
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão Próximo */}
          <button
            onClick={handleNext}
            className="min-h-[48px] px-3.5 sm:px-6 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white shadow-lg shadow-red-600/30 transition active:scale-95 shrink-0"
          >
            <span>{currentIdx === total - 1 ? 'Concluir' : 'Próximo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* DRAWER LATERAL DE ETAPAS */}
      <AnimatePresence>
        {showDrawerEtapas && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-sm h-full bg-zinc-950 border-l border-white/10 flex flex-col p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold text-white">Etapas da Aula</h3>
                </div>
                <button
                  onClick={() => setShowDrawerEtapas(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-1.5 scrollbar-none">
                {aula.etapas.map((step, i) => (
                  <button
                    key={step.etapa}
                    onClick={() => {
                      haptic.selection();
                      setCurrentIdx(i);
                      setShowDrawerEtapas(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition ${
                      currentIdx === i
                        ? 'bg-red-600/20 border border-red-500 text-white'
                        : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        currentIdx === i ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold truncate">
                        {step.tipo}: {step.titulo || `Etapa ${i + 1}`}
                      </span>
                    </div>
                    {i < currentIdx && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================================
   RENDERIZADOR DAS ATIVIDADES DA AULA (TODOS OS TIPOS IMPLEMENTADOS EM REACT)
   ========================================================================= */
interface StepRendererProps {
  step: EtapaAula;
  idx: number;
  state: any;
  setState: (val: any) => void;
}

const StepRenderer: React.FC<StepRendererProps> = ({ step, idx, state, setState }) => {
  switch (step.tipo) {
    case 'Capa':
      return <CapaStep step={step} />;
    case 'Conteúdo':
      return <ConteudoStep step={step} />;
    case 'Questão':
    case 'Questão de banca':
      return <QuestaoStep step={step} state={state} setState={setState} />;
    case 'Flashcard':
      return <FlashcardStep step={step} state={state} setState={setState} />;
    case 'Comparador':
      return <ComparadorStep step={step} state={state} setState={setState} />;
    case 'Explorar':
      return <ExplorarStep step={step} state={state} setState={setState} />;
    case 'Toque e revele':
      return <ToqueEReveleStep step={step} state={state} setState={setState} />;
    case 'Ligar termos':
      return <LigarTermosStep step={step} state={state} setState={setState} />;
    case 'Completar':
      return <CompletarStep step={step} state={state} setState={setState} />;
    case 'Verdadeiro ou falso':
      return <VerdadeiroOuFalsoStep step={step} state={state} setState={setState} />;
    case 'Linha do tempo':
      return <LinhaDoTempoStep step={step} state={state} setState={setState} />;
    case 'Mapa mental':
      return <MapaMentalStep step={step} state={state} setState={setState} />;
    case 'Karaokê':
      return <KaraokeStep step={step} />;
    case 'Desafio':
      return <DesafioStep step={step} state={state} setState={setState} />;
    case 'Encerramento':
      return <EncerramentoStep step={step} />;
    default:
      return <ConteudoStep step={step} />;
  }
};

/* 1. CAPA */
const CapaStep: React.FC<{ step: EtapaAula }> = ({ step }) => (
  <div className="space-y-6">
    {step.imagemUrl && (
      <div className="relative w-full rounded-2xl overflow-hidden border border-red-500/25 shadow-2xl bg-zinc-950 aspect-[16/9] max-h-[420px]">
        <img
          src={step.imagemUrl}
          alt={step.titulo}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 bg-red-950/80 px-2.5 py-1 rounded-md border border-red-500/30">
            AULA COMPLETA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 leading-tight font-serif drop-shadow-md">
            {step.titulo}
          </h1>
        </div>
      </div>
    )}

    {step.texto && (
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-zinc-200 text-sm sm:text-base leading-relaxed space-y-3 font-normal">
        <p>{step.texto}</p>
      </div>
    )}
  </div>
);

/* 2. CONTEÚDO */
const ConteudoStep: React.FC<{ step: EtapaAula }> = ({ step }) => (
  <div className="space-y-5">
    {step.imagemUrl && (
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-950 aspect-[16/9] max-h-[380px]">
        <img
          src={step.imagemUrl}
          alt={step.titulo}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    )}

    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
          {step.tipo}
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
        {step.titulo}
      </h2>
    </div>

    {step.texto && (
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-white/10 text-zinc-200 text-sm sm:text-base leading-relaxed space-y-4">
        <p className="whitespace-pre-line">{step.texto}</p>
      </div>
    )}
  </div>
);

/* 3. QUESTÃO & QUESTÃO DE BANCA */
const QuestaoStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const selectedIdx = state.selected ?? null;
  const isAnswered = selectedIdx !== null;
  const certaIdx = step.certa ?? 0;

  const handleSelect = (i: number) => {
    if (isAnswered) return;
    const isCorrect = i === certaIdx;
    if (isCorrect) {
      haptic.success();
      confetti({ particleCount: 60, spread: 60 });
    } else {
      haptic.error();
    }
    setState({ selected: i });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          <HelpCircle className="w-3.5 h-3.5" />
          {step.tipo === 'Questão de banca' ? 'Questão de Concurso' : 'Desafio de Fixação'}
        </span>
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
        {step.questao || step.titulo}
      </h2>

      {/* Alternativas */}
      <div className="space-y-2.5 pt-2">
        {step.opcoes?.map((opcao, i) => {
          const isSelected = selectedIdx === i;
          const isCorrect = isAnswered && i === certaIdx;
          const isWrong = isSelected && !isCorrect;

          let btnClass = 'border-white/10 bg-zinc-900/70 hover:bg-zinc-800/80 text-zinc-200';
          if (isAnswered) {
            if (isCorrect) {
              btnClass = 'border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold';
            } else if (isWrong) {
              btnClass = 'border-red-500 bg-red-950/60 text-red-200 font-bold';
            } else {
              btnClass = 'border-white/5 bg-zinc-900/30 text-zinc-500 opacity-60';
            }
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.99] ${btnClass}`}
            >
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                isCorrect
                  ? 'border-emerald-400 bg-emerald-500 text-white'
                  : isWrong
                  ? 'border-red-400 bg-red-500 text-white'
                  : 'border-white/20 bg-white/5 text-zinc-300'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm sm:text-base leading-relaxed flex-1">
                {opcao}
              </span>
              {isAnswered && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
              )}
              {isAnswered && isWrong && (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Explicativo */}
      {isAnswered && step.feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-zinc-900 border border-white/15 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Gabarito Comentado
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {step.feedback}
          </p>
        </motion.div>
      )}
    </div>
  );
};

/* 4. FLASHCARD (ROTAÇÃO 3D) */
const FlashcardStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const isFlipped = !!state.flipped;

  const handleFlip = () => {
    haptic.selection();
    setState({ ...state, flipped: !isFlipped });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Flashcard de Memória
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
        <p className="text-xs text-zinc-400">Toque no card para revelar a resposta</p>
      </div>

      <div
        onClick={handleFlip}
        className="relative w-full min-h-[260px] sm:min-h-[300px] cursor-pointer perspective-1000"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full min-h-[260px] sm:min-h-[300px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-red-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/40 shadow-2xl relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {!isFlipped ? (
            <div className="flex flex-col justify-between h-full space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Pergunta
              </span>
              <p className="text-lg sm:text-xl font-bold text-white text-center my-auto leading-relaxed">
                {step.frente || step.texto}
              </p>
              <div className="text-center text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Toque para virar</span>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col justify-between h-full space-y-6"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Resposta & Fundamento
              </span>
              <p className="text-base sm:text-lg font-medium text-emerald-200 text-center my-auto leading-relaxed">
                {step.verso}
              </p>
              <div className="text-center text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Toque para desvirar</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* 5. COMPARADOR (SLIDER DESLIZANTE ANTES/DEPOIS) */
const ComparadorStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const sliderPos = state.pos ?? 50; // 0 a 100

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Comparador Visual
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      {step.imagemUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] max-h-[380px] bg-black">
          <img src={step.imagemUrl} alt="Comparação" className="w-full h-full object-cover" />
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-lg"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              ↔
            </div>
          </div>
        </div>
      )}

      {/* Controle Deslizante */}
      <div className="space-y-2 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-red-400">{step.rotuloL || 'Casamento Civil'}</span>
          <span className="text-amber-400">{step.rotuloR || 'Apenas Religioso'}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setState({ pos: Number(e.target.value) })}
          className="w-full accent-red-500 cursor-pointer"
        />
      </div>

      {step.texto && (
        <p className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-sm text-zinc-300 leading-relaxed">
          {step.texto}
        </p>
      )}
    </div>
  );
};

/* 6. EXPLORAR (HOTSPOTS INTERATIVOS) */
const ExplorarStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const activeSpot = state.activeSpot ?? 0;
  const visited = state.visited || {};
  const pontos = step.pontos || [];

  const handleSelectSpot = (i: number) => {
    haptic.selection();
    setState({
      activeSpot: i,
      visited: { ...visited, [i]: true }
    });
  };

  const currentPonto = pontos[activeSpot] || pontos[0];

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
          Exploração de Cenário
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
        <p className="text-xs text-zinc-400">Toque nos pontos dourados para investigar cada elemento</p>
      </div>

      {/* Imagem com Hotspots */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] max-h-[380px] bg-black">
        {step.imagemUrl && (
          <img src={step.imagemUrl} alt="Cenário" className="w-full h-full object-cover" />
        )}
        {pontos.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSelectSpot(i)}
            style={{ top: `${p.y}%`, left: `${p.x}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform active:scale-90 ${
              activeSpot === i
                ? 'bg-amber-400 text-black scale-110 ring-4 ring-amber-400/40 animate-pulse'
                : visited[i]
                ? 'bg-emerald-500 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {p.num || i + 1}
          </button>
        ))}
      </div>

      {/* Card do Ponto Selecionado */}
      {currentPonto && (
        <motion.div
          key={activeSpot}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-2 shadow-xl"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center">
              {currentPonto.num || activeSpot + 1}
            </span>
            <h4 className="text-sm font-bold text-white">{currentPonto.titulo}</h4>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {currentPonto.texto}
          </p>
        </motion.div>
      )}
    </div>
  );
};

/* 7. TOQUE E REVELE */
const ToqueEReveleStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const revealed = state.revealed || {};
  const cartas = step.cartas || [];

  const toggleCard = (i: number) => {
    haptic.selection();
    setState({
      revealed: { ...revealed, [i]: !revealed[i] }
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Toque e Revele
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
        <p className="text-xs text-zinc-400">Toque em cada carta para revelar o fundamento</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {cartas.map((c, i) => {
          const isRev = !!revealed[i];
          return (
            <div
              key={i}
              onClick={() => toggleCard(i)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-2.5 ${
                isRev
                  ? 'bg-zinc-900 border-amber-500/40 shadow-lg'
                  : 'bg-zinc-900/60 border-white/10 hover:border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Carta {i + 1}
                </span>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  {isRev ? 'Ocultar' : 'Revelar'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-snug">
                {c.pergunta}
              </p>
              {isRev && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-white/10 text-xs sm:text-sm text-emerald-300 leading-relaxed"
                >
                  {c.resposta}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 8. LIGAR TERMOS */
const LigarTermosStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const pares = step.pares || [];
  const selectedTerm = state.selectedTerm ?? null;
  const completed = state.completed || {};

  const handleTermClick = (idx: number) => {
    if (completed[idx]) return;
    haptic.selection();
    setState({ ...state, selectedTerm: idx });
  };

  const handleDefClick = (idx: number) => {
    if (selectedTerm === null) return;
    if (selectedTerm === idx) {
      haptic.success();
      setState({
        ...state,
        selectedTerm: null,
        completed: { ...completed, [idx]: true }
      });
    } else {
      haptic.error();
      setState({ ...state, selectedTerm: null });
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
          Ligar Conceitos
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
        <p className="text-xs text-zinc-400">Selecione um termo na esquerda e ligue à definição na direita</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Coluna Termos */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Termos
          </span>
          {pares.map(([termo], i) => (
            <button
              key={i}
              onClick={() => handleTermClick(i)}
              disabled={completed[i]}
              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition ${
                completed[i]
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 line-through'
                  : selectedTerm === i
                  ? 'border-amber-400 bg-amber-500/20 text-white ring-2 ring-amber-400/30'
                  : 'border-white/10 bg-zinc-900 text-zinc-200 hover:border-white/20'
              }`}
            >
              {termo}
            </button>
          ))}
        </div>

        {/* Coluna Definições */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Definições
          </span>
          {pares.map(([, def], i) => (
            <button
              key={i}
              onClick={() => handleDefClick(i)}
              disabled={completed[i]}
              className={`w-full p-3 rounded-xl border text-left text-xs leading-relaxed transition ${
                completed[i]
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20'
              }`}
            >
              {def}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* 9. COMPLETAR LACUNAS */
const CompletarStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const partes = step.partes || [];
  const respostas = step.respostas || [];
  const filled = state.filled || [];

  const handlePickWord = (word: string) => {
    if (filled.length >= respostas.length) return;
    const nextExpected = respostas[filled.length];
    if (word === nextExpected) {
      haptic.success();
      setState({ filled: [...filled, word] });
    } else {
      haptic.error();
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Complete a Frase
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      {/* Frase com lacunas */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 text-base sm:text-lg leading-loose text-zinc-200">
        {partes.map((p, i) => (
          <React.Fragment key={i}>
            <span>{p}</span>
            {i < respostas.length && (
              <span className={`inline-block px-3 py-1 mx-1.5 rounded-lg border font-bold text-sm ${
                filled[i]
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                  : 'border-dashed border-red-400/50 bg-red-950/20 text-red-400 min-w-[70px] text-center'
              }`}>
                {filled[i] || `[ ${i + 1} ]`}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Banco de palavras */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
          Toque na palavra correta para preencher:
        </span>
        <div className="flex flex-wrap gap-2">
          {respostas.map((w, i) => {
            const isUsed = filled.includes(w);
            return (
              <button
                key={i}
                onClick={() => handlePickWord(w)}
                disabled={isUsed}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                  isUsed
                    ? 'opacity-30 border-white/5 bg-white/5 text-zinc-500'
                    : 'border-red-500/40 bg-red-950/40 text-white hover:bg-red-900/60 active:scale-95'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* 10. VERDADEIRO OU FALSO */
const VerdadeiroOuFalsoStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const afirmacoes = step.afirmacoes || [];
  const answers = state.answers || {};

  const handleAnswer = (i: number, choice: boolean) => {
    const item = afirmacoes[i];
    const isCorrect = choice === item.certa;
    if (isCorrect) haptic.success();
    else haptic.error();
    setState({ answers: { ...answers, [i]: choice } });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
          Verdadeiro ou Falso
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      <div className="space-y-3.5">
        {afirmacoes.map((af, i) => {
          const userAns = answers[i];
          const hasAnswered = userAns !== undefined;
          const isCorrect = hasAnswered && userAns === af.certa;

          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border space-y-3 transition ${
                hasAnswered
                  ? isCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-red-950/30 border-red-500/50'
                  : 'bg-zinc-900 border-white/10'
              }`}
            >
              <p className="text-sm sm:text-base text-zinc-200 leading-snug">{af.texto}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAnswer(i, true)}
                  disabled={hasAnswered}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    userAns === true
                      ? af.certa
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-red-600 text-white border-red-400'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  Verdadeiro
                </button>
                <button
                  onClick={() => handleAnswer(i, false)}
                  disabled={hasAnswered}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    userAns === false
                      ? !af.certa
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-red-600 text-white border-red-400'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  Falso
                </button>
              </div>

              {hasAnswered && af.feedback && (
                <p className="text-xs text-zinc-400 pt-1 border-t border-white/5">
                  {af.feedback}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 11. LINHA DO TEMPO */
const LinhaDoTempoStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step
}) => {
  const marcos = step.marcos || [];

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Linha do Tempo
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      <div className="relative border-l-2 border-red-500/40 ml-4 pl-6 space-y-6">
        {marcos.map((m, i) => (
          <div key={i} className="relative space-y-1">
            <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-red-600 border-2 border-zinc-950" />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              {m.ano || m.momento || `Marco ${i + 1}`}
            </span>
            <h4 className="text-base font-bold text-white">{m.titulo}</h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{m.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* 12. MAPA MENTAL */
const MapaMentalStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const ramos = step.ramos || [];
  const openBranch = state.openBranch ?? null;

  const toggleBranch = (i: number) => {
    haptic.selection();
    setState({ openBranch: openBranch === i ? null : i });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
          Mapa Mental
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      <div className="space-y-2.5">
        {ramos.map((r, i) => {
          const isOpen = openBranch === i;
          return (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggleBranch(i)}
                className="w-full p-4 text-left flex items-center justify-between font-bold text-sm sm:text-base text-white hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-red-400" />
                  {r.titulo}
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90 text-amber-400' : 'text-zinc-500'}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-1.5 text-xs sm:text-sm text-zinc-300">
                  {r.itens?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 13. KARAOKÊ / LEITURA ACOMPANHADA */
const KaraokeStep: React.FC<{ step: EtapaAula }> = ({ step }) => {
  const frases = step.frases || (step.texto ? step.texto.split('. ') : []);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
          Leitura Acompanhada
        </span>
        <h2 className="text-xl font-bold text-white font-serif">{step.titulo}</h2>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 space-y-3 leading-relaxed text-base sm:text-lg">
        {frases.map((frase, i) => (
          <p key={i} className="text-zinc-300 hover:text-white transition-colors">
            {frase}.
          </p>
        ))}
      </div>
    </div>
  );
};

/* 14. DESAFIO FINAL */
const DesafioStep: React.FC<{ step: EtapaAula; state: any; setState: (val: any) => void }> = ({
  step,
  state = {},
  setState
}) => {
  const perguntas = step.perguntas || [];
  const pIdx = state.pIdx || 0;
  const score = state.score || 0;
  const finished = state.finished || false;

  const currentQ = perguntas[pIdx];

  const handleAnswer = (choice: number) => {
    const isCorrect = choice === currentQ.certa;
    const newScore = isCorrect ? score + 100 : score;

    if (isCorrect) {
      haptic.success();
      confetti({ particleCount: 50, spread: 60 });
    } else {
      haptic.error();
    }

    if (pIdx + 1 < perguntas.length) {
      setState({ pIdx: pIdx + 1, score: newScore });
    } else {
      setState({ finished: true, score: newScore });
      confetti({ particleCount: 150, spread: 90 });
    }
  };

  if (finished) {
    return (
      <div className="p-8 rounded-3xl bg-gradient-to-b from-red-950/60 to-zinc-900 border border-red-500/30 text-center space-y-4">
        <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-white">Desafio Concluído!</h2>
        <p className="text-base text-zinc-300">
          Você acumulou <b className="text-amber-400 text-xl font-extrabold">{score} pontos</b> no desafio final!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Desafio Final · Pergunta {pIdx + 1} de {perguntas.length}
        </span>
        <span className="text-xs font-bold text-amber-400">Placar: {score} pts</span>
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
        {currentQ?.questao}
      </h2>

      <div className="space-y-2.5">
        {currentQ?.opcoes?.map((op, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className="w-full p-4 rounded-2xl border border-white/10 bg-zinc-900 text-left text-sm sm:text-base text-zinc-200 hover:bg-white/10 transition active:scale-[0.99] flex items-center gap-3"
          >
            <span className="w-6 h-6 rounded-lg bg-white/10 text-xs font-bold flex items-center justify-center shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{op}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* 15. ENCERRAMENTO */
const EncerramentoStep: React.FC<{ step: EtapaAula }> = ({ step }) => (
  <div className="space-y-6 text-center">
    <Award className="w-16 h-16 text-amber-400 mx-auto" />
    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
      {step.titulo || 'Aula Concluída com Sucesso!'}
    </h2>
    <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
      {step.texto}
    </p>
  </div>
);
