import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Check, CheckCircle2, XCircle, RotateCcw, Link2, 
  HelpCircle, ChevronDown, ChevronRight, Award, Sparkles, 
  Layers, ArrowRight, ArrowLeft
} from 'lucide-react';
import { SlideItem } from '@/types/aulaInterativa';
import { haptic } from '@/lib/nativeHaptics';

interface EtapaProps {
  slide: SlideItem;
  tema: {
    bg: string;
    headerBg: string;
    headerBorder: string;
    footerBg: string;
    destaque: string;
    accentGradient: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMPLETAR A FRASE (LACUNAS INTERATIVAS + BANCO DE PALAVRAS TÁTIL)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaCompletar({ slide, tema }: EtapaProps) {
  const partes = slide.partes || [];
  const respostas = slide.respostas || [];
  const bancoOriginal = slide.banco || respostas;

  // Estado do progresso
  const [filledCount, setFilledCount] = useState<number>(0);
  const [usedIndices, setUsedIndices] = useState<Record<number, boolean>>({});
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);

  const isCompleto = filledCount >= respostas.length;

  const handleWordClick = (palavra: string, wi: number) => {
    if (isCompleto || usedIndices[wi]) return;

    const respostaEsperada = respostas[filledCount];
    if (palavra.trim().toLowerCase() === respostaEsperada?.trim().toLowerCase()) {
      haptic.success();
      setUsedIndices(prev => ({ ...prev, [wi]: true }));
      const proximoFilled = filledCount + 1;
      setFilledCount(proximoFilled);

      if (proximoFilled >= respostas.length) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.75 }
        });
      }
    } else {
      haptic.error();
      setShakingIndex(wi);
      setTimeout(() => setShakingIndex(null), 400);
    }
  };

  const handleReset = () => {
    haptic.medium();
    setFilledCount(0);
    setUsedIndices({});
    setShakingIndex(null);
  };

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {/* Intro explicativa */}
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      {/* Caixa do Texto com Lacunas */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 shadow-xl leading-[2.1] sm:leading-[2.3] text-base sm:text-lg text-zinc-100 font-serif">
        {partes.map((parte, pi) => {
          const slotPreenchido = pi < filledCount;
          const isProximo = pi === filledCount;
          const temSlot = pi < respostas.length;

          return (
            <React.Fragment key={pi}>
              <span>{parte}</span>
              {temSlot && (
                <span
                  className={`inline-block min-w-[76px] sm:min-w-[96px] text-center px-2 py-0.5 mx-1.5 align-baseline rounded-lg transition-all duration-300 font-sans ${
                    slotPreenchido
                      ? 'border-b-2 border-amber-400 bg-amber-400/15 text-amber-200 font-bold shadow-sm'
                      : isProximo
                      ? 'border-b-2 border-amber-400/80 animate-blankglow text-amber-400/60 font-mono text-sm'
                      : 'border-b-2 border-zinc-600/60 text-zinc-600 font-mono text-sm'
                  }`}
                >
                  {slotPreenchido ? respostas[pi] : '· · · · · ·'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Banco de Palavras */}
      {!isCompleto ? (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span className="uppercase tracking-wider">Banco de Palavras:</span>
            <span>{filledCount} de {respostas.length} preenchidas</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {bancoOriginal.map((palavra, wi) => {
              const used = Boolean(usedIndices[wi]);
              const shaking = shakingIndex === wi;

              return (
                <button
                  key={wi}
                  type="button"
                  disabled={used}
                  onClick={() => handleWordClick(palavra, wi)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-md ${
                    used
                      ? 'opacity-25 border border-dashed border-white/10 text-zinc-600 cursor-not-allowed bg-transparent'
                      : shaking
                      ? 'animate-shake border-2 border-red-500 bg-red-500/25 text-red-200 font-bold'
                      : 'border border-white/20 bg-white/5 hover:bg-white/10 hover:border-amber-400 text-zinc-100 hover:text-white'
                  }`}
                >
                  {palavra}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Card de Conclusão e Fecho */
        <motion.div 
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl sm:rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-[#180a10]/95 to-[#120409] p-5 sm:p-6 shadow-2xl space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Excelente! Frase Completa!</span>
          </div>

          {slide.fecho && (
            <div 
              className="text-sm sm:text-base text-zinc-200 leading-relaxed font-serif [&_b]:text-amber-300 [&_strong]:text-amber-300"
              dangerouslySetInnerHTML={{ __html: slide.fecho }}
            />
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refazer este exercício</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VERDADEIRO OU FALSO (ARRASTE E DECIDA · TÁTIL COM BOTÕES + SWIPE)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaVerdadeiroFalso({ slide, tema }: EtapaProps) {
  const afirmacoes = slide.afirmacoes || [];
  const [curIdx, setCurIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const [isFinalizado, setIsFinalizado] = useState(false);
  const [dragX, setDragX] = useState(0);

  const curAfirmacao = afirmacoes[curIdx];

  const handleAnswer = (val: boolean) => {
    if (respondido || !curAfirmacao) return;

    setRespondido(true);
    setEscolha(val);

    if (val === curAfirmacao.v) {
      haptic.success();
      setScore(prev => prev + 1);
    } else {
      haptic.error();
    }
  };

  const handleNext = () => {
    haptic.selection();
    if (curIdx >= afirmacoes.length - 1) {
      setIsFinalizado(true);
      if (score + 1 >= Math.ceil(afirmacoes.length * 0.6)) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      setCurIdx(prev => prev + 1);
      setRespondido(false);
      setEscolha(null);
      setDragX(0);
    }
  };

  const handleReset = () => {
    haptic.medium();
    setCurIdx(0);
    setScore(0);
    setRespondido(false);
    setEscolha(null);
    setIsFinalizado(false);
    setDragX(0);
  };

  if (!curAfirmacao && !isFinalizado) return null;

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {/* Intro */}
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      {/* Placar Superior */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-400 border-b border-white/10 pb-2.5">
        <span className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Carta <b className="text-white">{Math.min(curIdx + 1, afirmacoes.length)}</b> de {afirmacoes.length}</span>
        </span>
        <span className="text-amber-300">
          Acertos: <b className="text-white text-base">{score}</b>
        </span>
      </div>

      {!isFinalizado ? (
        <div className="space-y-4">
          {/* Card Interativo com Arraste */}
          <div className="relative touch-pan-y" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <motion.div
              drag={!respondido ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              onDrag={(_, info) => setDragX(info.offset.x)}
              onDragEnd={(_, info) => {
                setDragX(0);
                if (!respondido) {
                  if (info.offset.x > 75) handleAnswer(true);
                  else if (info.offset.x < -75) handleAnswer(false);
                }
              }}
              className="relative min-h-[170px] sm:min-h-[190px] rounded-3xl border border-white/15 bg-gradient-to-b from-[#2e1219]/95 via-[#250d14]/95 to-[#16040a] p-6 flex flex-col justify-between shadow-2xl cursor-grab active:cursor-grabbing select-none"
            >
              {/* Carimbos de Feedback de Arraste (Stamps) */}
              <div 
                className="absolute top-4 left-4 border-2 border-red-500 text-red-400 font-black text-xs sm:text-sm tracking-widest px-3 py-1 rounded-lg uppercase -rotate-12 pointer-events-none transition-opacity duration-150"
                style={{ opacity: dragX < -15 ? Math.min(1, -dragX / 70) : 0 }}
              >
                FALSO
              </div>
              <div 
                className="absolute top-4 right-4 border-2 border-emerald-500 text-emerald-400 font-black text-xs sm:text-sm tracking-widest px-3 py-1 rounded-lg uppercase rotate-12 pointer-events-none transition-opacity duration-150"
                style={{ opacity: dragX > 15 ? Math.min(1, dragX / 70) : 0 }}
              >
                VERDADEIRO
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8296]">
                  AFIRMAÇÃO · DECIDA
                </span>
                <span className="text-[11px] text-zinc-500">
                  {respondido ? 'Respondido' : 'Arraste ou toque abaixo'}
                </span>
              </div>

              <div className="my-auto py-3">
                <p className="text-base sm:text-xl font-serif text-white font-bold leading-relaxed text-center max-w-xl mx-auto">
                  {curAfirmacao.t}
                </p>
              </div>

              <div className="border-t border-white/10 pt-2 text-center text-[11px] text-zinc-400">
                {respondido ? (
                  <span className="text-zinc-300 font-medium">Veja a explicação abaixo</span>
                ) : (
                  <span>← Arraste para a Esquerda (Falso) | (Verdadeiro) Direita →</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Botões de Ação */}
          {!respondido ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="h-13 sm:h-14 rounded-2xl border border-red-500/40 bg-red-950/20 hover:bg-red-950/40 text-red-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
              >
                <XCircle className="w-5 h-5 text-red-400" />
                <span>← Falso</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="h-13 sm:h-14 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
              >
                <span>Verdadeiro →</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          ) : (
            /* Feedback por Afirmação */
            <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div 
                className={`p-4 sm:p-5 rounded-2xl border ${
                  escolha === curAfirmacao.v
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                    : 'border-red-500/50 bg-red-950/30 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base mb-1">
                  {escolha === curAfirmacao.v ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Acertou! {curAfirmacao.v ? 'É verdadeira.' : 'É falsa.'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span>Não foi dessa vez. {curAfirmacao.v ? 'É verdadeira.' : 'É falsa.'}</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif pt-1 border-t border-white/10 mt-2">
                  {curAfirmacao.exp}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full h-13 sm:h-14 rounded-2xl text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-98 cursor-pointer"
                style={{ background: tema.accentGradient }}
              >
                <span>{curIdx === afirmacoes.length - 1 ? 'Ver Resultado Final' : 'Próxima Carta →'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Placar Final */
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 p-6 sm:p-8 text-center space-y-4 shadow-2xl"
        >
          <Award className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-black text-white">Você acertou</h3>
          <p className="text-4xl sm:text-5xl font-black text-amber-300 font-mono">
            {score} de {afirmacoes.length}
          </p>
          <p className="text-sm sm:text-base text-zinc-300 max-w-md mx-auto leading-relaxed">
            {score === afirmacoes.length 
              ? 'Perfeito! Nenhuma pegadinha te derrubou. Você dominou este ponto!'
              : score >= Math.ceil(afirmacoes.length * 0.6)
              ? 'Muito bem! Seu raciocínio jurídico está ficando cada vez mais afiado.'
              : 'Bom treino! Vale a pena refazer as cartas para consolidar a fixação.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-bold text-white flex items-center justify-center gap-2 mx-auto transition active:scale-95 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LIGAR TERMOS (2 COLUNAS CLARAS · TOQUE NO TERMO E NA DEFINIÇÃO)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaLigarTermos({ slide, tema }: EtapaProps) {
  const pares = slide.pares || [];
  
  // Ordem das definições (embaralhada para o desafio)
  const ordemDefs = useMemo(() => {
    if (slide.ordemDefs && slide.ordemDefs.length === pares.length) {
      return slide.ordemDefs;
    }
    // Fallback: ordem invertida / alternada
    return pares.map((_, i) => (i + 2) % pares.length);
  }, [slide.ordemDefs, pares.length]);

  const [selTerm, setSelTerm] = useState<number | null>(null);
  const [selDef, setSelDef] = useState<number | null>(null);
  const [conectados, setConectados] = useState<Record<number, boolean>>({});
  const [shakingTerm, setShakingTerm] = useState<number | null>(null);
  const [shakingDef, setShakingDef] = useState<number | null>(null);

  const count = Object.keys(conectados).length;
  const isCompleto = count >= pares.length;

  const handleTermClick = (idx: number) => {
    if (conectados[idx]) return;
    haptic.selection();

    if (selTerm === idx) {
      setSelTerm(null);
    } else {
      setSelTerm(idx);
      if (selDef !== null) {
        verificarPar(idx, selDef);
      }
    }
  };

  const handleDefClick = (idx: number) => {
    if (conectados[idx]) return;
    haptic.selection();

    if (selDef === idx) {
      setSelDef(null);
    } else {
      setSelDef(idx);
      if (selTerm !== null) {
        verificarPar(selTerm, idx);
      }
    }
  };

  const verificarPar = (tIdx: number, dIdx: number) => {
    if (tIdx === dIdx) {
      // MATCH!
      haptic.success();
      setConectados(prev => {
        const next = { ...prev, [tIdx]: true };
        if (Object.keys(next).length >= pares.length) {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.75 } });
        }
        return next;
      });
      setSelTerm(null);
      setSelDef(null);
    } else {
      // ERRO
      haptic.error();
      setShakingTerm(tIdx);
      setShakingDef(dIdx);
      setTimeout(() => {
        setShakingTerm(null);
        setShakingDef(null);
        setSelTerm(null);
        setSelDef(null);
      }, 400);
    }
  };

  const handleReset = () => {
    haptic.medium();
    setSelTerm(null);
    setSelDef(null);
    setConectados({});
    setShakingTerm(null);
    setShakingDef(null);
  };

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {/* Instrução */}
      {slide.instrucao && (
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif">
          {slide.instrucao}
        </p>
      )}

      {/* Placar de pares */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold border-b border-white/10 pb-2.5">
        <span className="text-[#ff8296] uppercase tracking-wider flex items-center gap-1.5">
          <Link2 className="w-4 h-4" />
          <span>Ligue os Termos Corretos</span>
        </span>
        <span className="text-zinc-400">
          Pares encontrados: <b className="text-amber-300 text-base">{count}</b> de {pares.length}
        </span>
      </div>

      {/* Grid de 2 Colunas Limpas e Responsivas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-1">
        {/* Coluna 1: Termos */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400/90 block px-1">
            Coluna 1 · Conceito
          </span>
          {pares.map((p, pi) => {
            const isDone = Boolean(conectados[pi]);
            const isSel = selTerm === pi;
            const isShake = shakingTerm === pi;

            return (
              <button
                key={pi}
                type="button"
                disabled={isDone}
                onClick={() => handleTermClick(pi)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm ${
                  isDone
                    ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-200 cursor-default opacity-85'
                    : isShake
                    ? 'animate-shake border-2 border-red-500 bg-red-500/25 text-red-200'
                    : isSel
                    ? 'border-amber-400 bg-amber-400/20 text-white ring-2 ring-amber-400 shadow-md scale-[1.01]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-100 hover:border-white/20'
                }`}
              >
                <span>{p[0]}</span>
                {isDone && <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Coluna 2: Definições */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400/90 block px-1">
            Coluna 2 · Definição
          </span>
          {ordemDefs.map((defIdx, i) => {
            const isDone = Boolean(conectados[defIdx]);
            const isSel = selDef === defIdx;
            const isShake = shakingDef === defIdx;
            const defText = pares[defIdx]?.[1] || '';

            return (
              <button
                key={i}
                type="button"
                disabled={isDone}
                onClick={() => handleDefClick(defIdx)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm leading-relaxed transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm ${
                  isDone
                    ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-200 cursor-default opacity-85'
                    : isShake
                    ? 'animate-shake border-2 border-red-500 bg-red-500/25 text-red-200'
                    : isSel
                    ? 'border-amber-400 bg-amber-400/20 text-white ring-2 ring-amber-400 shadow-md scale-[1.01]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 hover:border-white/20'
                }`}
              >
                <span>{defText}</span>
                {isDone && <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card de Conclusão */}
      {isCompleto && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 text-center space-y-2 shadow-xl mt-3"
        >
          <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5" />
            <span>Muito bem! Todos os pares foram ligados corretamente!</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-bold flex items-center gap-1.5 mx-auto transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jogar novamente</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LINHA DO TEMPO (MARCOS CRONOLÓGICOS EXPANSÍVEIS)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaLinhaDoTempo({ slide, tema }: EtapaProps) {
  const marcos = slide.marcos || [];
  const [abertos, setAbertos] = useState<Record<number, boolean>>({ 0: true });
  const [vistos, setVistos] = useState<Record<number, boolean>>({ 0: true });

  const toggleMarco = (mi: number) => {
    haptic.selection();
    setAbertos(prev => ({ ...prev, [mi]: !prev[mi] }));
    setVistos(prev => ({ ...prev, [mi]: true }));
  };

  const countVistos = Object.keys(vistos).length;

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-400 border-b border-white/10 pb-2">
        <span className="uppercase tracking-wider text-[#d4af37]">Marcos Cronológicos</span>
        <span>Explorados: <b className="text-amber-300 text-base">{countVistos}</b> de {marcos.length}</span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-3 sm:space-y-4 border-l-2 border-amber-500/30 ml-3">
        {marcos.map((marco, mi) => {
          const isOpen = Boolean(abertos[mi]);
          const isSeen = Boolean(vistos[mi]);

          return (
            <div key={mi} className="relative">
              {/* Ponto / Nó na linha */}
              <div 
                className={`absolute -left-[31px] sm:-left-[39px] top-3.5 w-4 h-4 rounded-full border-2 transition-colors ${
                  isSeen
                    ? 'border-amber-400 bg-amber-400 ring-4 ring-amber-400/20'
                    : 'border-white/30 bg-[#18040a]'
                }`}
              />

              {/* Botão de Título */}
              <button
                type="button"
                onClick={() => toggleMarco(mi)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 shadow-md cursor-pointer ${
                  isOpen
                    ? 'border-amber-400/60 bg-[#2e1219] text-white'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 block font-mono">
                    {marco.ano}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-white mt-0.5 truncate font-serif">
                    {marco.titulo}
                  </h4>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Corpo expansível */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-b-2xl border-x border-b border-amber-500/30 bg-[#250d14]/90 text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif -mt-2">
                      {marco.texto}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAPA MENTAL (NÓ CENTRAL COM RAMOS EXPANSÍVEIS E CHIPS)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaMapaMental({ slide, tema }: EtapaProps) {
  const ramos = slide.ramos || [];
  const centro = slide.centro || slide.titulo || 'MAPA MENTAL';

  const [abertos, setAbertos] = useState<Record<number, boolean>>({ 0: true });
  const [vistos, setVistos] = useState<Record<number, boolean>>({ 0: true });

  const toggleRamo = (ri: number) => {
    haptic.selection();
    setAbertos(prev => ({ ...prev, [ri]: !prev[ri] }));
    setVistos(prev => ({ ...prev, [ri]: true }));
  };

  const countVistos = Object.keys(vistos).length;

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      {/* Nó Central Imponente */}
      <div className="text-center p-5 rounded-2xl sm:rounded-3xl border-2 border-[#d4af37] bg-gradient-to-b from-[#3d1620] to-[#250d14] shadow-2xl space-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
          TEMA CENTRAL
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-white font-serif tracking-wide">
          {centro}
        </h3>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-400 border-b border-white/10 pb-2">
        <span className="uppercase tracking-wider text-amber-400">Ramos da Matéria</span>
        <span>Explorados: <b className="text-amber-300 text-base">{countVistos}</b> de {ramos.length}</span>
      </div>

      {/* Ramos Acordeão */}
      <div className="space-y-3">
        {ramos.map((ramo, ri) => {
          const isOpen = Boolean(abertos[ri]);

          return (
            <div key={ri} className="rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-md">
              <button
                type="button"
                onClick={() => toggleRamo(ri)}
                className="w-full p-4 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-3 hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-black font-mono">
                    {ri + 1}
                  </span>
                  <span className="text-white font-serif">{ramo.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline">
                    {isOpen ? 'recolher' : 'ver detalhes'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="p-4 pt-1 border-t border-white/10 bg-[#250d14]/70 space-y-3">
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif">
                        {ramo.texto}
                      </p>

                      {ramo.chips && ramo.chips.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                          {ramo.chips.map((chip, ci) => (
                            <span
                              key={ci}
                              className="text-[11px] font-semibold text-amber-300/90 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DESAFIO QUIZ (PONTUAÇÃO +100 E FEEDBACK IMEDIATO)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaDesafio({ slide, tema }: EtapaProps) {
  const perguntas = slide.perguntas || [];
  const [curQ, setCurQ] = useState(0);
  const [pts, setPts] = useState(0);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [isFinalizado, setIsFinalizado] = useState(false);

  const pq = perguntas[curQ];

  const handleChoose = (oi: number) => {
    if (respondido || !pq) return;

    setRespondido(true);
    setEscolha(oi);

    if (oi === pq.certa) {
      haptic.success();
      setPts(prev => prev + 100);
    } else {
      haptic.error();
    }
  };

  const handleNext = () => {
    haptic.selection();
    if (curQ >= perguntas.length - 1) {
      setIsFinalizado(true);
      if (pts + 100 >= Math.ceil(perguntas.length * 100 * 0.7)) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      setCurQ(prev => prev + 1);
      setRespondido(false);
      setEscolha(null);
    }
  };

  const handleReset = () => {
    haptic.medium();
    setCurQ(0);
    setPts(0);
    setRespondido(false);
    setEscolha(null);
    setIsFinalizado(false);
  };

  if (!pq && !isFinalizado) return null;

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      {/* Barra de Pontuação */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-400 border-b border-white/10 pb-2">
        <span className="text-white">
          Pergunta <b className="text-amber-300">{curQ + 1}</b> de {perguntas.length}
        </span>
        <span className="text-amber-400 font-mono text-base font-black">
          {pts} pts
        </span>
      </div>

      {!isFinalizado ? (
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white font-serif leading-relaxed">
            {pq.q}
          </h3>

          <div className="space-y-2.5">
            {pq.ops.map((op, oi) => {
              const letras = ['A', 'B', 'C', 'D', 'E'];
              const isSelected = escolha === oi;
              const isCorreta = oi === pq.certa;

              let btnStyle = 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200';
              if (respondido) {
                if (isCorreta) {
                  btnStyle = 'border-emerald-500 bg-emerald-500/25 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-red-500 bg-red-500/25 text-red-200 font-bold';
                } else {
                  btnStyle = 'opacity-30 border-white/5';
                }
              }

              return (
                <button
                  key={oi}
                  type="button"
                  disabled={respondido}
                  onClick={() => handleChoose(oi)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${btnStyle}`}
                >
                  <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black shrink-0">
                    {letras[oi]}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5">{op}</span>
                </button>
              );
            })}
          </div>

          {respondido && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <div 
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                  escolha === pq.certa
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                    : 'border-red-500/50 bg-red-950/30 text-red-200'
                }`}
              >
                <p className="font-bold mb-1">
                  {escolha === pq.certa ? 'Resposta certa! +100 pontos' : 'Não foi dessa vez.'}
                </p>
                <p>{pq.exp}</p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full h-13 rounded-2xl text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl transition active:scale-98"
                style={{ background: tema.accentGradient }}
              >
                <span>{curQ === perguntas.length - 1 ? 'Ver meu placar final' : 'Próxima pergunta →'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Placar */
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 p-6 text-center space-y-4 shadow-2xl">
          <Award className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-black text-white">Seu Placar Final</h3>
          <p className="text-4xl sm:text-5xl font-black text-amber-300 font-mono">
            {pts} pontos
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-bold text-white flex items-center justify-center gap-2 mx-auto transition active:scale-95 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMPARADOR VISUAL (ANTES / DEPOIS · SLIDER DINÂMICO)
// ─────────────────────────────────────────────────────────────────────────────
export function EtapaComparador({ slide, tema }: EtapaProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
      {slide.intro && (
        <p 
          className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: slide.intro }}
        />
      )}

      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl select-none bg-black/60">
        {/* Imagem Base */}
        {slide.imgUrl && (
          <img 
            src={slide.imgUrl} 
            alt="Base" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
          />
        )}

        {/* Imagem Sobreposta com ClipPath */}
        {slide.img2 && (
          <img 
            src={slide.img2} 
            alt="Comparação" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          />
        )}

        {/* Etiquetas Esquerda e Direita */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 z-10">
          {slide.rotuloL || 'ANTES'}
        </span>
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 z-10">
          {slide.rotuloR || 'DEPOIS'}
        </span>

        {/* Linha Divisória e Alça */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs shadow-xl ring-2 ring-black">
            ◂▸
          </div>
        </div>
      </div>

      {/* Input Range Deslizante */}
      <div className="pt-1">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="w-full accent-amber-400 cursor-ew-resize h-2 bg-white/10 rounded-lg appearance-none"
        />
        <p className="text-center text-xs text-zinc-400 mt-2 font-medium">
          Arraste a barra para comparar as duas perspectivas
        </p>
      </div>
    </div>
  );
}

