import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { AudiobookCapitulo, AudiobookLivro } from '@/data/audiobooksCatalogo';

interface AudiobookPlayerModalProps {
  livro: AudiobookLivro;
  capituloInicialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const VELOCIDADES = [1, 1.25, 1.5, 2];

export const AudiobookPlayerModal: React.FC<AudiobookPlayerModalProps> = ({
  livro,
  capituloInicialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [capituloIndex, setCapituloIndex] = useState(capituloInicialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [velocidadeIndex, setVelocidadeIndex] = useState(0);
  const [showCapitulosSheet, setShowCapitulosSheet] = useState(false);
  const [viewMode, setViewMode] = useState<'cena' | 'legenda'>('cena');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const activeCueRef = useRef<HTMLDivElement | null>(null);

  const capituloAtual = useMemo(() => {
    return livro.capitulos[capituloIndex] || livro.capitulos[0];
  }, [livro, capituloIndex]);

  // Atualiza capítulo quando a prop mudar
  useEffect(() => {
    setCapituloIndex(capituloInicialIndex);
  }, [capituloInicialIndex]);

  // Salva e restaura progresso do livro
  const storageKey = `audiobook_prog_${livro.id}`;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.capituloIndex === 'number' && parsed.capituloIndex === capituloIndex) {
          if (parsed.time && audioRef.current && Math.abs(audioRef.current.currentTime - parsed.time) > 2) {
            audioRef.current.currentTime = parsed.time;
            setCurrentTime(parsed.time);
          }
        }
      }
    } catch {}
  }, [isOpen, capituloIndex, storageKey]);

  const salvarProgresso = useCallback((time: number) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          capituloIndex,
          time,
          updatedAt: Date.now(),
        })
      );
    } catch {}
  }, [capituloIndex, storageKey]);

  // Imagem atual calculada pelos timestamps das cenas
  const imagemAtual = useMemo(() => {
    if (!capituloAtual.imagens || capituloAtual.imagens.length === 0) {
      return livro.capaUrl;
    }
    const hit = capituloAtual.imagens.find(
      (img) => currentTime >= img.startTime && currentTime <= img.endTime
    );
    return hit ? hit.url : capituloAtual.imagens[0].url;
  }, [capituloAtual, currentTime, livro.capaUrl]);

  // Legenda atual em tempo real
  const cueAtual = useMemo(() => {
    if (!capituloAtual.cues || capituloAtual.cues.length === 0) return null;
    return capituloAtual.cues.find(
      (c) => currentTime >= c.start && currentTime <= c.end
    );
  }, [capituloAtual, currentTime]);

  // Auto-scroll da transcrição no modo legenda
  useEffect(() => {
    if (viewMode === 'legenda' && activeCueRef.current && transcriptContainerRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [cueAtual, viewMode]);

  // Controles de áudio
  const togglePlay = useCallback(() => {
    haptic.impact();
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const pularSegundos = useCallback((delta: number) => {
    haptic.selection();
    const el = audioRef.current;
    if (!el) return;
    const novo = Math.max(0, Math.min(duration || el.duration || 9999, el.currentTime + delta));
    el.currentTime = novo;
    setCurrentTime(novo);
    salvarProgresso(novo);
  }, [duration, salvarProgresso]);

  const mudarVelocidade = useCallback(() => {
    haptic.selection();
    const proximoIdx = (velocidadeIndex + 1) % VELOCIDADES.length;
    setVelocidadeIndex(proximoIdx);
    const taxa = VELOCIDADES[proximoIdx];
    if (audioRef.current) {
      audioRef.current.playbackRate = taxa;
    }
  }, [velocidadeIndex]);

  const selecionarCapitulo = useCallback((idx: number) => {
    haptic.selection();
    setCapituloIndex(idx);
    setCurrentTime(0);
    setShowCapitulosSheet(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 150);
  }, []);

  const proximoCapitulo = useCallback(() => {
    if (capituloIndex < livro.capitulos.length - 1) {
      selecionarCapitulo(capituloIndex + 1);
    }
  }, [capituloIndex, livro.capitulos.length, selecionarCapitulo]);

  const capituloAnterior = useCallback(() => {
    if (capituloIndex > 0) {
      selecionarCapitulo(capituloIndex - 1);
    }
  }, [capituloIndex, selecionarCapitulo]);

  const formatTempo = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fecharPlayer = useCallback(() => {
    haptic.selection();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearMediaSession(audioRef.current);
    }
    void telaAcesa('audiobook', false);
    onClose();
  }, [onClose]);

  // Tecla Esc para fechar e Espaço para Play/Pause no Desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fecharPlayer();
      } else if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, fecharPlayer, togglePlay]);

  // Gerenciamento de WakeLock (mantém a tela acesa enquanto o usuário ouve/lê as legendas)
  useEffect(() => {
    if (!isOpen) {
      void telaAcesa('audiobook', false);
      return;
    }
    void telaAcesa('audiobook', isPlaying);
    return () => {
      void telaAcesa('audiobook', false);
    };
  }, [isOpen, isPlaying]);

  // MediaSession API & Notificação Nativa em Segundo Plano (Lockscreen / Central de Controle)
  useEffect(() => {
    const el = audioRef.current;
    if (!isOpen || !el || !capituloAtual) return;

    registrarMidia({
      titulo: capituloAtual.titulo,
      subtitulo: `${livro.autor} • Cap. ${capituloIndex + 1} de ${livro.capitulos.length}`,
      album: livro.titulo,
      capaUrl: imagemAtual || livro.capaUrl,
      audio: el,
      onNext: capituloIndex < livro.capitulos.length - 1 ? proximoCapitulo : undefined,
      onPrev: capituloIndex > 0 ? capituloAnterior : undefined,
      onSeek: (timeSec) => {
        if (audioRef.current) {
          audioRef.current.currentTime = timeSec;
          setCurrentTime(timeSec);
          salvarProgresso(timeSec);
        }
      },
      onStop: () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      },
    });

    return () => {
      clearMediaSession(el);
    };
  }, [
    isOpen,
    capituloAtual,
    capituloIndex,
    livro.autor,
    livro.titulo,
    livro.capitulos.length,
    livro.capaUrl,
    imagemAtual,
    proximoCapitulo,
    capituloAnterior,
    salvarProgresso,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#0A0A0C] text-white overflow-hidden select-none">
      {/* Elemento de áudio nativo */}
      <audio
        ref={audioRef}
        src={capituloAtual.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const t = audioRef.current.currentTime;
            setCurrentTime(t);
            if (Math.floor(t) % 5 === 0) {
              salvarProgresso(t);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const d = audioRef.current.duration || capituloAtual.duracaoSegundos;
            setDuration(d);
            audioRef.current.playbackRate = VELOCIDADES[velocidadeIndex];
          }
        }}
        onEnded={() => {
          if (capituloIndex < livro.capitulos.length - 1) {
            proximoCapitulo();
          } else {
            setIsPlaying(false);
          }
        }}
      />

      {/* IMAGEM EM TELA TODA (FULL SCREEN BACKGROUND) COM DEGRADÊ PRETO DE BAIXO PARA CIMA */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={imagemAtual}
            src={imagemAtual}
            alt={capituloAtual.titulo}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full h-full object-cover object-center"
          />
        </AnimatePresence>

        {/* Degradê preto profundo de baixo para cima */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/85 via-55% to-black/35" />

        {/* Vinheta superior suave para proteger o header */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/85 to-transparent" />
      </div>

      {/* Header superior translúcido com z-index acima da imagem */}
      <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,0px))] px-4 pb-2 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={fecharPlayer}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
          aria-label="Minimizar player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center max-w-[65%] text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E11D48] flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[#E11D48]" />
            Audiobook Oficial
          </span>
          <span className="text-[13px] font-display font-bold text-white truncate max-w-full drop-shadow">
            {livro.titulo}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setShowCapitulosSheet(true);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
          aria-label="Lista de capítulos"
        >
          <ListOrdered className="w-5 h-5" />
        </button>
      </header>

      {/* Área Central: Cena Visual / Legenda Flutuante vs Modo Transcrição Completa */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-end p-4 max-w-xl mx-auto w-full">
        {viewMode === 'cena' ? (
          <div className="w-full flex flex-col items-center justify-end pb-2">
            {/* Faixa inferior de Legenda em Tempo Real (Closed Caption sincronizado sobre a imagem) */}
            {cueAtual && (
              <motion.div
                key={cueAtual.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg bg-black/85 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/15 text-center shadow-2xl mb-3"
              >
                <p className="text-[14px] sm:text-[15px] font-sans font-medium leading-snug text-white/95 drop-shadow-md">
                  {cueAtual.text}
                </p>
              </motion.div>
            )}

            {/* Botão de Alternar para Transcrição */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setViewMode('legenda');
              }}
              className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 transition-all text-xs font-semibold text-white/85 hover:text-white flex items-center gap-1.5 border border-white/15 backdrop-blur-md shadow-lg"
            >
              <Subtitles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Ver Transcrição / Legenda</span>
            </button>
          </div>
        ) : (
          /* Modo Legenda / Transcrição Interativa (Karaokê Teleprompter com Glassmorphism) */
          <div className="w-full h-full flex flex-col justify-between py-2">
            <div
              ref={transcriptContainerRef}
              className="w-full flex-1 max-h-[52dvh] rounded-3xl overflow-y-auto px-4 py-5 bg-black/80 border border-white/15 backdrop-blur-xl space-y-3.5 no-scrollbar shadow-2xl"
            >
              {capituloAtual.cues.map((cue) => {
                const isActive = currentTime >= cue.start && currentTime <= cue.end;
                return (
                  <div
                    key={cue.id}
                    ref={isActive ? activeCueRef : null}
                    onClick={() => {
                      haptic.selection();
                      if (audioRef.current) {
                        audioRef.current.currentTime = cue.start;
                        setCurrentTime(cue.start);
                      }
                    }}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#E11D48]/25 border border-[#E11D48]/50 shadow-lg text-white font-semibold scale-[1.01]'
                        : 'text-white/65 hover:text-white/95 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/40 block mb-0.5">
                      {formatTempo(cue.start)}
                    </span>
                    <p className="text-[14px] leading-relaxed">{cue.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setViewMode('cena');
                }}
                className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 transition-all text-xs font-semibold text-white/85 hover:text-white flex items-center gap-1.5 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Ver Cenas em Tela Cheia</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Painel Inferior: Metadados, Scrub e Controles sobre o degradê preto */}
      <div className="relative z-20 w-full max-w-xl mx-auto px-6 pb-[calc(1.25rem+var(--sai-bottom,0px))] pt-1 flex flex-col gap-3 shrink-0">
        {/* Informações do Capítulo */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
              Capítulo {capituloAtual.numero} de {livro.totalCapitulos}
            </span>
            <h2 className="font-display text-[17px] sm:text-[19px] font-bold text-white truncate leading-tight">
              {capituloAtual.titulo}
            </h2>
            <p className="text-[12px] text-white/70 font-sans truncate">
              {capituloAtual.autor}
            </p>
          </div>

          <button
            type="button"
            onClick={mudarVelocidade}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 shrink-0"
          >
            {VELOCIDADES[velocidadeIndex]}x
          </button>
        </div>

        {/* Barra de Progresso Interativa (Scrub) */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || capituloAtual.duracaoSegundos || 100}
            value={currentTime}
            onChange={(e) => {
              const novo = parseFloat(e.target.value);
              setCurrentTime(novo);
              if (audioRef.current) {
                audioRef.current.currentTime = novo;
              }
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
          />
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>{formatTempo(currentTime)}</span>
            <span>{formatTempo(duration || capituloAtual.duracaoSegundos)}</span>
          </div>
        </div>

        {/* Controles Principais de Reprodução */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
          {/* Capítulo Anterior */}
          <button
            type="button"
            onClick={capituloAnterior}
            disabled={capituloIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
            aria-label="Capítulo anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Retroceder 10s */}
          <button
            type="button"
            onClick={() => pularSegundos(-10)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/80 hover:text-white active:scale-95 transition-all relative"
            aria-label="Retroceder 10 segundos"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="absolute text-[8px] font-bold font-mono">10</span>
          </button>

          {/* Botão Play / Pause Gigante */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-[#E11D48] hover:bg-[#E11D48]/90 text-white shadow-xl shadow-[#E11D48]/30 active:scale-95 transition-all cursor-pointer"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Avançar 10s */}
          <button
            type="button"
            onClick={() => pularSegundos(10)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/80 hover:text-white active:scale-95 transition-all relative"
            aria-label="Avançar 10 segundos"
          >
            <RotateCw className="w-5 h-5" />
            <span className="absolute text-[8px] font-bold font-mono">10</span>
          </button>

          {/* Próximo Capítulo */}
          <button
            type="button"
            onClick={proximoCapitulo}
            disabled={capituloIndex === livro.capitulos.length - 1}
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-lg bg-[#141416] rounded-t-3xl border-t border-white/10 p-5 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#E11D48]" />
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
                  const isCurrent = idx === capituloIndex;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => selecionarCapitulo(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                        isCurrent
                          ? 'bg-[#E11D48]/20 border border-[#E11D48]/40 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                          isCurrent ? 'bg-[#E11D48] text-white' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {cap.numero}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{cap.titulo}</p>
                        <p className="text-xs text-white/50 truncate">{cap.autor}</p>
                      </div>

                      <span className="text-xs font-mono text-white/50 shrink-0">
                        {cap.duracaoFormatada}
                      </span>
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

