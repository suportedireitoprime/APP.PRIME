import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  HelpCircle,
  BookOpen,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { audioEngine } from './audio/audioEngine';
import { PANELS, CHAPTERS, NPANELS, ELEMENTS, panelEst } from './cenas/cenasData';
import { drawPanel, telestrate } from './cenas/cenasRenderer';
import { drawBalloon } from './personagens/personagensRenderer';
import { SPEAK2CHAR, estDur } from './narracao/narracaoData';
import { buildCaptionState, getActiveCaptionPhrase, CaptionState } from './legendas/legendasEngine';
import { QUIZ, EXPLAIN, ESE, STUDY, LEGALCARDS, QuizAlt } from './quiz/quizData';
import { haptic } from '@/lib/nativeHaptics';

interface QuestoesAnimadasViewProps {
  onVoltar?: () => void;
}

export const QuestoesAnimadasView: React.FC<QuestoesAnimadasViewProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados principais
  const [mode, setMode] = useState<'idle' | 'playing' | 'quiz' | 'rewind' | 'explain' | 'done'>('idle');
  const [panelIdx, setPanelIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'estudo' | 'elementos' | 'ese'>('estudo');

  // Quiz e feedback
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  // Explicação
  const [explainIdx, setExplainIdx] = useState<number>(-1);
  const [explainPanelIdx, setExplainPanelIdx] = useState<number>(-1);

  // Ficha de estudo carousel
  const [studyIdx, setStudyIdx] = useState<number>(0);

  // E se card aberto
  const [openEse, setOpenEse] = useState<number | null>(null);

  // Confetti
  const confettiRef = useRef<{ x: number; y: number; vx: number; vy: number; rot: number; c: string }[]>([]);
  const confettiActiveRef = useRef<boolean>(false);

  // Heads e audio state para o canvas
  const headsRef = useRef<Record<string, { x: number; y: number }>>({});
  const curAudioRef = useRef<{
    charId: string | null;
    text: string;
    who: string;
    startedAt: number;
    dur: number;
    file?: string;
  } | null>(null);

  const captionStateRef = useRef<CaptionState | null>(null);
  const [captionText, setCaptionText] = useState<{ who: string; text: string } | null>(null);

  const balloonJobRef = useRef<{ x: number; y: number; text: string; prog: number } | null>(null);

  // Refs de tempo
  const panelTRef = useRef<number>(0);
  const panelDurRef = useRef<number>(8);
  const audioIdxRef = useRef<number>(0);
  const silentTimerRef = useRef<any>(null);
  const shakeRef = useRef<number>(0);
  const cueDoneRef = useRef<Record<string, number>>({});

  // Atualizar ficha de estudo automaticamente a cada 6s
  useEffect(() => {
    const iv = setInterval(() => {
      setStudyIdx((prev) => (prev + 1) % STUDY.length);
    }, 6500);
    return () => clearInterval(iv);
  }, []);

  // Tocar fala atual
  const playAudioLine = useCallback(
    (pIdx: number, aIdx: number) => {
      const pn = PANELS[pIdx];
      if (!pn) return;

      if (!pn.audios.length) {
        // Painel mudo de gibi
        curAudioRef.current = null;
        if (pn.cap) {
          const capState = buildCaptionState(pn.cap[0], pn.cap[1], pn.dur || 3.2);
          captionStateRef.current = capState;
          setCaptionText(getActiveCaptionPhrase(capState));
        }
        if (pIdx === 4) audioEngine.sfx.shhh();

        clearTimeout(silentTimerRef.current);
        silentTimerRef.current = setTimeout(() => {
          advancePanel();
        }, (pn.dur || 3.2) * 1000);
        return;
      }

      if (aIdx >= pn.audios.length) {
        advancePanel();
        return;
      }

      const [, who, text] = pn.audios[aIdx];
      const duration = estDur(text);
      const charId = SPEAK2CHAR[who] || null;

      curAudioRef.current = {
        file: '',
        who,
        text,
        charId,
        startedAt: performance.now(),
        dur: duration,
      };

      const capState = buildCaptionState(who, text, duration);
      captionStateRef.current = capState;
      setCaptionText(getActiveCaptionPhrase(capState));

      audioEngine.narrate({
        text,
        who,
        onBoundary: () => {},
        onEnd: () => {
          curAudioRef.current = null;
          audioIdxRef.current = aIdx + 1;
          setTimeout(() => {
            playAudioLine(pIdx, aIdx + 1);
          }, 350);
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const goToPanel = useCallback(
    (p: number) => {
      const nextIdx = Math.max(0, Math.min(NPANELS - 1, p));
      setPanelIdx(nextIdx);
      panelTRef.current = 0;
      audioIdxRef.current = 0;
      cueDoneRef.current = {};
      panelDurRef.current = panelEst(nextIdx);
      clearTimeout(silentTimerRef.current);

      if (nextIdx === 1) audioEngine.sfx.ding();
      if (nextIdx === 6) audioEngine.sfx.beep();

      playAudioLine(nextIdx, 0);
    },
    [playAudioLine]
  );

  const advancePanel = useCallback(() => {
    setPanelIdx((curr) => {
      if (curr >= NPANELS - 1) {
        // Chegou ao fim: abre o Quiz
        setMode('quiz');
        setShowQuizModal(true);
        audioEngine.sfx.whoosh();
        audioEngine.narrate({
          text: QUIZ.enunciado,
          who: 'NARRADORA',
        });
        return curr;
      }
      const next = curr + 1;
      goToPanel(next);
      return next;
    });
  }, [goToPanel]);

  // Iniciar cena
  const handleStartScene = () => {
    try {
      haptic.selection();
    } catch {}
    setMode('playing');
    setIsPaused(false);
    audioEngine.getContext();
    audioEngine.ambientStart();
    goToPanel(panelIdx);
  };

  // Pausar / Continuar
  const handleTogglePlay = () => {
    try {
      haptic.selection();
    } catch {}
    if (mode === 'idle' || mode === 'done') {
      handleStartScene();
      return;
    }
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      audioEngine.pauseNarration();
      clearTimeout(silentTimerRef.current);
    } else {
      audioEngine.resumeNarration();
      if (!curAudioRef.current) {
        playAudioLine(panelIdx, audioIdxRef.current);
      }
    }
  };

  // Reiniciar
  const handleRestart = () => {
    try {
      haptic.selection();
    } catch {}
    audioEngine.stopNarration();
    clearTimeout(silentTimerRef.current);
    setMode('idle');
    setPanelIdx(0);
    setIsPaused(false);
    setAnswered(false);
    setSelectedAlt(null);
    setShowQuizModal(false);
    setExplainIdx(-1);
    setExplainPanelIdx(-1);
    curAudioRef.current = null;
    captionStateRef.current = null;
    setCaptionText(null);
  };

  // Responder Quiz
  const handleAnswer = (idx: number) => {
    if (answered) return;
    try {
      haptic.impact();
    } catch {}
    setSelectedAlt(idx);
    setAnswered(true);
    const alt = QUIZ.alts[idx];

    if (alt.ok) {
      audioEngine.sfx.pop();
      setTimeout(() => audioEngine.sfx.thud(), 120);

      // Disparar confetti
      const cols = ['#f5d97e', '#b3372f', '#3e7d4e', '#2e5f8a', '#e0a51f'];
      confettiRef.current = [];
      for (let i = 0; i < 90; i++) {
        confettiRef.current.push({
          x: Math.random() * 720,
          y: -20 - Math.random() * 160,
          vy: 1 + Math.random() * 2.2,
          vx: -0.6 + Math.random() * 1.2,
          rot: Math.random() * 6,
          c: cols[i % 5],
        });
      }
      confettiActiveRef.current = true;
      setTimeout(() => {
        confettiActiveRef.current = false;
      }, 5200);

      audioEngine.narrate({
        text: 'Isso mesmo, você acertou! É furto tentado. Agora vamos recapitular e voltar às cenas para a explicação.',
        who: 'NARRADORA',
      });
    } else {
      audioEngine.sfx.alarm();
      audioEngine.narrate({
        text: 'Não foi dessa vez. A resposta certa é a tentativa de furto. Vamos recapitular e voltar às cenas para explicar.',
        who: 'NARRADORA',
      });
    }
  };

  // Iniciar Explicação Encenada (Rebobinar)
  const handleStartExplain = () => {
    try {
      haptic.selection();
    } catch {}
    setShowQuizModal(false);
    setMode('rewind');
    audioEngine.sfx.rewind();

    let count = 0;
    const rewindIv = setInterval(() => {
      setPanelIdx((p) => (p + NPANELS - 1) % NPANELS);
      count++;
      if (count > 8) {
        clearInterval(rewindIv);
        setMode('explain');
        playExplainSegment(0);
      }
    }, 180);
  };

  const playExplainSegment = (i: number) => {
    setExplainIdx(i);
    const seg = EXPLAIN[i];
    if (!seg) {
      setMode('done');
      return;
    }
    setExplainPanelIdx(seg.panel);
    panelTRef.current = 0;
    panelDurRef.current = estDur(seg.text) + 2.5;

    const capState = buildCaptionState('NARRADORA', seg.text, estDur(seg.text));
    captionStateRef.current = capState;
    setCaptionText(getActiveCaptionPhrase(capState));

    audioEngine.narrate({
      text: seg.text,
      who: 'NARRADORA',
      onEnd: () => {
        if (i < EXPLAIN.length - 1) {
          setTimeout(() => playExplainSegment(i + 1), 600);
        } else {
          setMode('done');
          setExplainIdx(-1);
          setCaptionText(null);
        }
      },
    });
  };

  // Loop de Animação 120fps no Canvas
  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const loop = (ts: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      const nowT = ts / 1000;

      // Atualizar legenda
      if (captionStateRef.current) {
        setCaptionText(getActiveCaptionPhrase(captionStateRef.current));
      }

      if ((mode === 'playing' || mode === 'explain') && !isPaused) {
        panelTRef.current += dt;
      }
      const t01 = Math.max(0, Math.min(1, panelTRef.current / Math.max(1, panelDurRef.current)));

      // Efeitos de som sincronizados em frames
      if (mode === 'playing' && panelIdx === 4 && t01 > 0.25 && !cueDoneRef.current.shh) {
        cueDoneRef.current.shh = 1;
        audioEngine.sfx.pop();
      }
      if (mode === 'playing' && panelIdx === 9 && t01 > 0.3 && !cueDoneRef.current.alm) {
        cueDoneRef.current.alm = 1;
        shakeRef.current = 1;
        audioEngine.sfx.alarm();
      }
      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 2.6);
      }

      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;

      const dispPanel = mode === 'explain' && explainPanelIdx >= 0 ? explainPanelIdx : panelIdx;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0f1622';
      ctx.fillRect(0, 0, 720, 960);

      if (shakeRef.current > 0) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current * 7, (Math.random() - 0.5) * shakeRef.current * 5);
      }

      // Desenhar o painel da cena
      balloonJobRef.current = null;
      drawPanel(
        ctx,
        dispPanel,
        mode === 'explain' ? 0.55 : t01,
        nowT,
        curAudioRef.current,
        headsRef.current,
        (job) => {
          balloonJobRef.current = job;
        }
      );

      // Balão de fala de quadrinhos
      if (balloonJobRef.current) {
        drawBalloon(ctx, balloonJobRef.current.x, balloonJobRef.current.y, balloonJobRef.current.text, balloonJobRef.current.prog);
      }

      // Telestrator na explicação
      if (mode === 'explain' && explainIdx >= 0) {
        telestrate(ctx, explainIdx, Math.min(1, panelTRef.current / 2.2));
      }

      // Confetti
      if (confettiActiveRef.current) {
        for (const p of confettiRef.current) {
          p.y += p.vy * dt * 60;
          p.x += p.vx * dt * 60;
          p.rot += dt * 4;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-4, -2.5, 8, 5);
          ctx.restore();
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, panelIdx, isPaused, explainIdx, explainPanelIdx]);

  const currentPanelConfig = PANELS[panelIdx];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[#0a0d14] text-zinc-100 select-none">
      {/* ========================================================
          PALCO PRINCIPAL 2D (CANVAS CENTRALIZADO, RESPONSIVO, SEM SCROLLBAR)
         ======================================================== */}
      <section className="flex-1 flex flex-col relative overflow-hidden items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-[#0c0f16] to-[#07090e]">
        {/* Placa Superior da Cena & Selo OAB */}
        <div className="w-full max-w-[720px] flex items-center justify-between gap-2 px-2 py-1.5 mb-1.5 z-20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
              OAB XLI · Q57
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-200 truncate">
              {currentPanelConfig?.placa || 'SUPERMERCADO'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const muted = audioEngine.toggleMute();
                setIsMuted(muted);
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 border border-white/10 transition-all"
              title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline-block">
              {panelIdx + 1} / {NPANELS}
            </span>
          </div>
        </div>

        {/* Contêiner de Proporção 3:4 com Canvas Fluido */}
        <div className="relative w-full max-w-[620px] flex-1 max-h-[calc(100vh-190px)] sm:max-h-[calc(100vh-180px)] aspect-[3/4] flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f1622]">
          <canvas
            ref={canvasRef}
            width={720}
            height={960}
            className="w-full h-full object-contain block select-none cursor-pointer"
            onClick={mode === 'idle' ? handleStartScene : undefined}
          />

          {/* Efeito de Rebobinar */}
          {mode === 'rewind' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs text-amber-300 font-black text-2xl tracking-widest animate-pulse">
              ◂◂ REBOBINANDO CENAS ◂◂
            </div>
          )}

          {/* Cartão de Apresentação / Repara Nisto */}
          {currentPanelConfig?.present && mode === 'playing' && (
            <div className="absolute top-4 right-4 z-20 max-w-[220px] bg-amber-50/95 dark:bg-[#1a202c]/95 border border-amber-500/40 rounded-xl p-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-right-3 duration-300">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">
                {currentPanelConfig.present[0]}
              </span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                {currentPanelConfig.present[1]}
              </p>
            </div>
          )}

          {/* Overlay de Abertura (Big Play Button) */}
          {mode === 'idle' && (
            <div
              onClick={handleStartScene}
              className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-black/40 via-black/20 to-black/80 cursor-pointer"
            >
              <div className="max-w-md p-4 rounded-xl bg-zinc-950/85 border border-amber-500/40 text-center text-xs sm:text-sm text-zinc-200 leading-relaxed shadow-xl">
                Amanda e Fernando escondem R$ 2.000 em mercadorias e são abordados dentro do supermercado. Toque para encenar com narração de voz sincronizada.
              </div>

              <button
                type="button"
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Encenar a Questão (Áudio Ativo)
              </button>
            </div>
          )}

          {/* Legenda Fluida na Parte Inferior do Palco */}
          {captionText && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-[92%] px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm text-center shadow-lg pointer-events-none animate-in fade-in duration-200">
              <span className="font-bold text-amber-400 tracking-wide mr-1.5 uppercase text-[11px]">
                {captionText.who}
              </span>
              <span className="text-zinc-200">{captionText.text.replace(/^.*?: /, '')}</span>
            </div>
          )}
        </div>

        {/* Controles de Reprodução Minimalistas */}
        <div className="w-full max-w-[720px] mt-2 flex flex-col gap-2 z-20">
          <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-xl px-3 py-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              {isPaused ? 'Continuar' : 'Pausar'}
            </button>

            <button
              type="button"
              onClick={() => goToPanel(panelIdx - 1)}
              disabled={panelIdx === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300"
              title="Painel Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => goToPanel(panelIdx + 1)}
              disabled={panelIdx >= NPANELS - 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300"
              title="Próximo Painel"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
              title="Recomeçar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Barra de Progresso */}
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden mx-1">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${((panelIdx + 1) / NPANELS) * 100}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQuizModal(true);
                audioEngine.sfx.whoosh();
              }}
              className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Questão
            </button>
          </div>

          {/* Linha do Tempo das 17 Cenas (Pills Horizontais) */}
          <div className="w-full flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {CHAPTERS.map((title, idx) => (
              <button
                key={title}
                type="button"
                onClick={() => goToPanel(idx)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  panelIdx === idx
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                    : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                {idx + 1}. {title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          PAINEL LATERAL DIREITO (DESKTOP: DOCK FIXO / MOBILE: ABAIXO)
         ======================================================== */}
      <aside className="w-full lg:w-[420px] xl:w-[480px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0b0e15] flex flex-col overflow-y-auto">
        {/* Navegação de Abas Laterais */}
        <div className="flex items-center border-b border-white/5 bg-zinc-950/40 sticky top-0 z-10">
          <button
            type="button"
            onClick={() => setActiveTab('estudo')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'estudo'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Ficha de Estudo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ese')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'ese'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            E se...? (3 Casos)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('elementos')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'elementos'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Elementos
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-4 flex-1 space-y-4">
          {activeTab === 'estudo' && (
            <div className="space-y-4">
              {/* Carrossel Dinâmico de Estudo */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    Ponto Jurídico #{studyIdx + 1}
                  </span>
                  <div className="flex gap-1">
                    {STUDY.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === studyIdx ? 'bg-amber-400 w-3' : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{STUDY[studyIdx].t}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{STUDY[studyIdx].p}</p>
              </div>

              {/* Explicação Encenada & 4 Lances Decisivos */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    4 Lances Decisivos
                  </h4>
                  <button
                    type="button"
                    onClick={handleStartExplain}
                    className="text-[11px] font-semibold text-amber-300 hover:underline flex items-center gap-1"
                  >
                    Encenar Explicação ›
                  </button>
                </div>

                <div className="space-y-2">
                  {EXPLAIN.map((seg, idx) => (
                    <div
                      key={seg.title}
                      onClick={() => {
                        setMode('explain');
                        playExplainSegment(idx);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        explainIdx === idx
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-zinc-950/40 border-white/5 hover:border-white/15 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-amber-300">{seg.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500">Cena {seg.panel + 1}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{seg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cartões de Fundamentação Legal */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block px-1">
                  Base Legal Aplicada
                </span>
                {LEGALCARDS.map((card, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-950/40 border border-white/5 text-left">
                    <h5 className="text-xs font-semibold text-amber-300 mb-1">{card.t}</h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{card.p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ese' && (
            <div className="space-y-3">
              <span className="text-xs text-zinc-400 block px-1">
                Toque no cenário para alterar um fato da questão e ver como a resposta do Direito Penal muda:
              </span>
              {ESE.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    audioEngine.sfx.pop();
                    setOpenEse(openEse === idx ? null : idx);
                  }}
                  className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all text-left space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-semibold text-zinc-200">{item.q}</h5>
                    <ChevronRight
                      className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${
                        openEse === idx ? 'rotate-90 text-amber-400' : ''
                      }`}
                    />
                  </div>

                  {openEse === idx && (
                    <div
                      className="pt-2 border-t border-white/5 text-xs text-emerald-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.r }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'elementos' && (
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 block px-1">
                Elementos identificados no iter criminis da cena:
              </span>
              {ELEMENTS.map((el) => {
                const isLit = currentPanelConfig?.els.includes(el.id);
                return (
                  <div
                    key={el.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isLit
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-semibold'
                        : 'bg-zinc-900/30 border-white/5 text-zinc-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLit ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-xs">{el.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
          MODAL / BOTTOM SHEET DO QUIZ INTERATIVO DA FGV
         ======================================================== */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#12151c] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
                FGV · OAB XLI EXAME · QUESTÃO 57 · DIREITO PENAL
              </span>
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-2">Agora responda:</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{QUIZ.enunciado}</p>
            </div>

            {/* Alternativas A, B, C, D */}
            <div className="space-y-2">
              {QUIZ.alts.map((alt, idx) => {
                const isSelected = selectedAlt === idx;
                let btnStyle = 'bg-zinc-900/70 border-white/10 text-zinc-200 hover:border-amber-500/40';

                if (answered) {
                  if (alt.ok) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (isSelected && !alt.ok) {
                    btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'bg-zinc-900/30 border-white/5 text-zinc-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={alt.k}
                    type="button"
                    disabled={answered}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="font-bold text-amber-400 mt-0.5">{alt.k})</span>
                    <span className="flex-1 leading-snug">{alt.t}</span>
                    {answered && alt.ok && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {answered && isSelected && !alt.ok && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Feedback da Resposta */}
            {answered && (
              <div
                className={`p-3.5 rounded-xl border text-xs sm:text-sm space-y-1 animate-in fade-in duration-300 ${
                  QUIZ.alts[selectedAlt!]?.ok
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  {QUIZ.alts[selectedAlt!]?.ok ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      GABARITO CORRETO: ALTERNATIVA A
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      NÃO FOI DESSA VEZ · A CORRETA É A ALTERNATIVA A
                    </>
                  )}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">{QUIZ.alts[0].c}</p>
              </div>
            )}

            {answered && (
              <button
                type="button"
                onClick={handleStartExplain}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Ver a Explicação Encenada (Rebobinar)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestoesAnimadasView;
