import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Play, Pause, Check, CheckCircle2, 
  RotateCcw, Sparkles, BookOpen, Volume2, VolumeX,
  ChevronRight, ChevronLeft, Award
} from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AulaData, SlideItem } from '@/types/aulaInterativa';
import { loadAulaData } from '@/utils/aulaDataLoader';

interface PlayerAulaNativoProps {
  aula: AulaItem;
  disciplinaNome: string;
  corDestaque: string;
  onVoltar: () => void;
  onConcluir: (totalEtapas: number) => void;
  onProgresso?: (etapaAtual: number, totalEtapas: number) => void;
}

export function PlayerAulaNativo({
  aula,
  disciplinaNome,
  corDestaque,
  onVoltar,
  onConcluir,
  onProgresso
}: PlayerAulaNativoProps) {
  const [aulaData, setAulaData] = useState<AulaData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [idx, setIdx] = useState(0);

  // Estados de Áudio e Karaokê
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [karaIdx, setKaraIdx] = useState(-1);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [flashcardVirado, setFlashcardVirado] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Cores e tema dinâmicos por disciplina
  const tema = useMemo(() => {
    switch (aula.disciplinaId) {
      case 'administrativo':
        return {
          bg: '#120d04',
          headerBg: 'linear-gradient(180deg, #2e2410 0%, #1a1205 100%)',
          headerBorder: 'rgba(217,160,10,0.35)',
          footerBg: '#181206',
          destaque: '#d9a00a',
          accentGradient: 'linear-gradient(135deg, #d9a00a, #b45309)',
        };
      case 'constitucional':
        return {
          bg: '#051208',
          headerBg: 'linear-gradient(180deg, #0e2916 0%, #08170c 100%)',
          headerBorder: 'rgba(34,197,94,0.35)',
          footerBg: '#08170d',
          destaque: '#22c55e',
          accentGradient: 'linear-gradient(135deg, #22c55e, #15803d)',
        };
      case 'trabalho':
        return {
          bg: '#0e0618',
          headerBg: 'linear-gradient(180deg, #25123d 0%, #150924 100%)',
          headerBorder: 'rgba(168,85,247,0.35)',
          footerBg: '#150924',
          destaque: '#a855f7',
          accentGradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
        };
      case 'penal':
      default:
        return {
          bg: '#120409',
          headerBg: 'linear-gradient(180deg, #280611 0%, #16040a 100%)',
          headerBorder: 'rgba(226,62,87,0.35)',
          footerBg: '#18060c',
          destaque: '#ff8296',
          accentGradient: 'linear-gradient(135deg, #e23e57, #c8102e)',
        };
    }
  }, [aula.disciplinaId]);

  // Carregar dados da aula
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setIdx(0);
    setTocando(false);

    loadAulaData(aula).then((data) => {
      if (ativo) {
        setAulaData(data);
        setCarregando(false);
      }
    });

    return () => {
      ativo = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [aula.id]);

  const slides = aulaData?.slides || [];
  const total = slides.length || 1;
  const slideAtual: SlideItem | undefined = slides[idx];

  // URL do áudio da etapa atual (se houver gravação no R2)
  const currentAudioSrc = useMemo(() => {
    if (!aulaData?.audioBaseUrl) return null;
    return `${aulaData.audioBaseUrl}${String(idx + 1).padStart(2, '0')}.mp3`;
  }, [aulaData?.audioBaseUrl, idx]);

  // Informar progresso ao componente pai
  useEffect(() => {
    if (onProgresso && total > 0) {
      onProgresso(idx + 1, total);
    }
  }, [idx, total, onProgresso]);

  // Estruturar os parágrafos e frases do slide para o Karaokê
  const paragrafosComFrases = useMemo(() => {
    if (!slideAtual?.corpo) return [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = slideAtual.corpo;
    
    // Obter todos os nós de parágrafo ou o texto direto
    const pElements = Array.from(tempDiv.querySelectorAll('p'));
    const blocosTexto = pElements.length > 0 
      ? pElements.map(p => p.textContent || '') 
      : [tempDiv.textContent || ''];

    let globalFraseIdx = 0;
    return blocosTexto.map(bloco => {
      const frases = bloco.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [bloco];
      const frasesComIdx = frases.map(frase => ({
        texto: frase,
        idx: globalFraseIdx++
      }));
      return frasesComIdx;
    });
  }, [slideAtual?.corpo]);

  const totalFrases = useMemo(() => {
    return paragrafosComFrases.reduce((acc, p) => acc + p.length, 0);
  }, [paragrafosComFrases]);

  // Resetar estados ao mudar de etapa e iniciar autoplay contínuo
  useEffect(() => {
    setTempoAtual(0);
    setDuracao(0);
    setKaraIdx(-1);
    setRespostaSelecionada(null);
    setFlashcardVirado(false);

    // Se temos áudio MP3 gravado no R2
    if (currentAudioSrc && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentAudioSrc;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise
          .then(() => setTocando(true))
          .catch(() => setTocando(false));
      }
    } else if (slideAtual?.narr && window.speechSynthesis) {
      // Fallback para síntese TTS nativa em português caso não haja MP3 gravado
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(slideAtual.narr);
      utter.lang = 'pt-BR';
      utter.rate = 1.05;
      utter.onstart = () => setTocando(true);
      utter.onend = () => {
        setTocando(false);
        // Autoplay contínuo: avançar automaticamente ao terminar narração
        if (idx < total - 1) {
          setIdx(prev => prev + 1);
        }
      };
      utter.onerror = () => setTocando(false);
      window.speechSynthesis.speak(utter);
    }
  }, [idx, currentAudioSrc, slideAtual?.narr, total]);

  // Sincronização do Karaokê em tempo real
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setTempoAtual(cur);
    setDuracao(dur);

    const pos = cur / dur;
    if (totalFrases > 0) {
      const activeI = Math.min(totalFrases - 1, Math.floor(pos * totalFrases));
      setKaraIdx(activeI);
    }
  };

  const handleAudioEnded = () => {
    setTocando(false);
    // Autoplay contínuo: ao terminar áudio, avança automaticamente para a próxima etapa
    if (idx < total - 1) {
      setIdx(prev => prev + 1);
    }
  };

  const toggleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentAudioSrc && audioRef.current) {
      if (tocando) {
        audioRef.current.pause();
        setTocando(false);
      } else {
        audioRef.current.play().then(() => setTocando(true)).catch(() => {});
      }
    } else if (window.speechSynthesis) {
      if (tocando) {
        window.speechSynthesis.cancel();
        setTocando(false);
      } else if (slideAtual?.narr) {
        const utter = new SpeechSynthesisUtterance(slideAtual.narr);
        utter.lang = 'pt-BR';
        utter.rate = 1.05;
        utter.onstart = () => setTocando(true);
        utter.onend = () => {
          setTocando(false);
          if (idx < total - 1) setIdx(prev => prev + 1);
        };
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const avancarEtapa = () => {
    if (idx < total - 1) {
      setIdx(prev => prev + 1);
    } else {
      // Concluir aula
      onConcluir(total);
    }
  };

  const voltarEtapa = () => {
    if (idx > 0) {
      setIdx(prev => prev - 1);
    }
  };

  // Atalhos de teclado no PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        avancarEtapa();
      } else if (e.key === 'ArrowLeft') {
        voltarEtapa();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [idx, total, tocando]);

  // Gestos de Touch (Swipe no celular)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX < 0) {
        avancarEtapa(); // swipe esquerda -> próximo
      } else {
        voltarEtapa(); // swipe direita -> anterior
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const formatTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (carregando) {
    return (
      <div 
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white space-y-4"
        style={{ backgroundColor: tema.bg }}
      >
        <div 
          className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" 
          style={{ borderTopColor: tema.destaque }} 
        />
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Carregando aula...</p>
      </div>
    );
  }

  const imagemUrl = slideAtual?.imgUrl || aulaData?.imagens[slideAtual?.img || ''] || aula.capaUrl;
  const isUltimaEtapa = idx === total - 1;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col w-screen h-screen text-white select-none overflow-hidden"
      style={{ backgroundColor: tema.bg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Elemento de áudio oculto */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => setTocando(false)}
        preload="auto"
      />

      {/* HEADER SUPERIOR NATIVO COM PALETA DINÂMICA E SAFE AREA INSET */}
      <header 
        className="flex items-center justify-between px-3 sm:px-6 border-b shrink-0 z-30 backdrop-blur-md shadow-lg shadow-black/60"
        style={{
          background: tema.headerBg,
          borderColor: tema.headerBorder,
          paddingTop: 'calc(1rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
          paddingBottom: '0.85rem'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onVoltar}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center shrink-0 transition active:scale-95 shadow-md shadow-black/40 bg-white/5 hover:bg-white/10 text-white"
            style={{ borderColor: tema.headerBorder }}
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest truncate"
                style={{ color: tema.destaque }}
              >
                {disciplinaNome} · {aula.numeroAula}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                {idx + 1} de {total}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif leading-tight">
              {aula.titulo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isUltimaEtapa ? (
            <button
              type="button"
              onClick={() => onConcluir(total)}
              className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[11px] transition flex items-center gap-1.5 active:scale-95 shadow-md"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden xs:inline">Concluir</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
              <span>{Math.round(((idx + 1) / total) * 100)}%</span>
            </div>
          )}
        </div>
      </header>

      {/* BARRA DE PROGRESSO DECORATIVA NO TOPO */}
      <div className="w-full h-1 bg-white/5 overflow-hidden">
        <div 
          className="h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${((idx + 1) / total) * 100}%`,
            background: tema.accentGradient
          }}
        />
      </div>

      {/* ÁREA CENTRAL DE CONTEÚDO (ROLAGEM SUAVE SEM SCROLLBAR VISÍVEL COM PADDING SEGURO NO RODAPÉ) */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-36 md:pb-32 max-w-3xl mx-auto scroll-smooth">
        {slideAtual && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            {/* Tag / Kicker da Etapa */}
            <div className="flex items-center justify-between gap-2">
              <span 
                className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
                style={{ color: tema.destaque }}
              >
                {slideAtual.kicker || `Etapa ${idx + 1} de ${total} · ${slideAtual.tipo}`}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {slideAtual.tipo}
              </span>
            </div>

            {/* Imagem Cinematográfica em Alta Resolução (Altura Generosa 16:9.5 sem cortes) */}
            {imagemUrl && (
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group">
                <img
                  src={imagemUrl}
                  alt={slideAtual.alt || slideAtual.titulo || aula.titulo}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* Título do Slide */}
            {slideAtual.titulo && (
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-serif text-white tracking-tight leading-snug">
                {slideAtual.titulo}
              </h1>
            )}

            {/* Divisor sutil */}
            <div 
              className="w-16 h-1 rounded-full shadow-sm"
              style={{ backgroundColor: tema.destaque }}
            />

            {/* Bloco de Questão Prática (se for slide de questão) */}
            {(slideAtual.tipo === 'Questão' || slideAtual.tipo === 'Questão de banca' || slideAtual.opcoes) && (
              <div className="rounded-2xl border border-white/15 p-4 sm:p-5 bg-white/5 space-y-3 mt-4">
                {slideAtual.intro && (
                  <p className="text-xs sm:text-sm text-zinc-300 italic">{slideAtual.intro}</p>
                )}
                {slideAtual.questao && (
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">{slideAtual.questao}</p>
                )}
                {slideAtual.opcoes && (
                  <div className="space-y-2 pt-2">
                    {slideAtual.opcoes.map((opcao, oi) => {
                      const letras = ['A', 'B', 'C', 'D', 'E'];
                      const isSelected = respostaSelecionada === oi;
                      const isCorreta = oi === (slideAtual.correta ?? 0);
                      const showFeedback = respostaSelecionada !== null;

                      let btnStyle = 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200';
                      if (showFeedback) {
                        if (isCorreta) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'border-red-500 bg-red-500/20 text-red-200';
                        }
                      }

                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setRespostaSelecionada(oi)}
                          className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-[0.99] ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black shrink-0">
                            {letras[oi]}
                          </span>
                          <span className="text-xs sm:text-sm leading-relaxed">{opcao}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Flashcard Interativo (se for slide de Flashcard) */}
            {slideAtual.tipo === 'Flashcard' && (
              <div 
                onClick={() => setFlashcardVirado(!flashcardVirado)}
                className="cursor-pointer rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-black/60 p-6 sm:p-8 text-center transition-all duration-300 hover:border-amber-400 active:scale-98 shadow-xl shadow-amber-950/20"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-3">
                  {flashcardVirado ? 'RESPOSTA DO FLASHCARD' : 'TOQUE PARA VIRAR O CARTÃO'}
                </span>
                <p className="text-base sm:text-lg font-serif font-bold text-white leading-relaxed">
                  {flashcardVirado ? slideAtual.verso : slideAtual.frente}
                </p>
              </div>
            )}

            {/* Texto do Slide com Efeito Karaokê Sincronizado por Frase */}
            {slideAtual.corpo && (
              <div className="rounded-2xl border border-white/10 p-4 sm:p-5 bg-white/[0.03] space-y-3 font-sans">
                {paragrafosComFrases.length > 0 ? (
                  <div className="space-y-3 text-sm sm:text-base leading-relaxed text-zinc-300">
                    {paragrafosComFrases.map((paragrafo, pi) => (
                      <p key={pi} className="space-x-1">
                        {paragrafo.map(({ texto, idx: fraseGlobalIdx }) => {
                          const isAtual = karaIdx === fraseGlobalIdx;
                          return (
                            <span
                              key={fraseGlobalIdx}
                              className={`transition-all duration-200 rounded px-1.5 py-0.5 inline-block my-0.5 ${
                                isAtual
                                  ? 'bg-amber-400/25 text-white font-semibold ring-1 ring-amber-400/40 shadow-sm'
                                  : 'text-zinc-300'
                              }`}
                            >
                              {texto}
                            </span>
                          );
                        })}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-zinc-300/95" 
                    dangerouslySetInnerHTML={{ __html: slideAtual.corpo }} 
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ NATIVO COMPACTO, FINO E 100% RESPONSIVO COM SAFE AREA INSET BOTTOM */}
      <footer 
        className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t border-white/10 px-3 sm:px-6 py-2.5 shadow-2xl"
        style={{
          backgroundColor: tema.footerBg,
          paddingBottom: 'calc(0.65rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Botão Anterior */}
          <button
            type="button"
            onClick={voltarEtapa}
            disabled={idx === 0}
            className={`min-w-[74px] sm:min-w-[88px] h-10 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 ${
              idx === 0 
                ? 'opacity-30 border-white/5 bg-white/5 text-zinc-500 cursor-not-allowed'
                : 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {/* Player Central Ergonômico em Linha Única */}
          <div 
            onClick={toggleAudio}
            className="flex-1 min-w-0 h-10 px-2.5 sm:px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 flex items-center gap-2 sm:gap-2.5 cursor-pointer transition active:scale-[0.99] shadow-inner"
            title="Tocar ou pausar narração desta etapa"
          >
            <button
              type="button"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-md transition active:scale-90"
              style={{ background: tema.accentGradient }}
              aria-label={tocando ? 'Pausar narração' : 'Tocar narração'}
            >
              {tocando ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none">
                <span className="truncate" style={{ color: tema.destaque }}>
                  {tocando ? 'NARRANDO...' : 'NARRAÇÃO'}
                </span>
                <span className="text-zinc-400 font-mono text-[9px]">
                  {formatTempo(tempoAtual)} / {duracao > 0 ? formatTempo(duracao) : '0:45'}
                </span>
              </div>

              {/* Barra fina de progresso do áudio */}
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-200"
                  style={{ 
                    width: `${duracao > 0 ? (tempoAtual / duracao) * 100 : (tocando ? 50 : 0)}%`,
                    backgroundColor: tema.destaque
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botão Próximo / Concluir */}
          <button
            type="button"
            onClick={avancarEtapa}
            className={`min-w-[78px] sm:min-w-[94px] h-10 px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shrink-0 ${
              isUltimaEtapa
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/40'
                : 'text-white shadow-red-950/40'
            }`}
            style={{
              background: isUltimaEtapa 
                ? '#10b981' 
                : tema.accentGradient
            }}
          >
            <span>{isUltimaEtapa ? 'Concluir' : 'Próximo'}</span>
            {isUltimaEtapa ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
