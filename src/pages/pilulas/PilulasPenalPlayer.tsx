import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  FileText, Subtitles, Volume2, Sparkles, 
  ChevronLeft, ChevronRight, BookOpen, ExternalLink, X, List,
  Bookmark, Loader2, Maximize2
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import penalCover from '@/assets/covers/cp_artigos_v2.webp';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
import modulesData from '@/data/pilulasDireitoPenalCatalog.json';

interface TopicoItem {
  id: string;
  baseSlug: string;
  titulo: string;
  audioUrl: string | null;
  srtUrl: string | null;
  pdfUrl: string | null;
  roteiroUrl: string | null;
  driveMp3Id: string | null;
  driveSrtId: string | null;
  drivePdfId: string | null;
  driveTxtId: string | null;
}

interface ModuloItem {
  id: string;
  folderIndex: number;
  titulo: string;
  folderName: string;
  slug: string;
  totalTopicos: number;
  topicos: TopicoItem[];
}

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

type PainelAba = 'legenda' | 'texto' | 'pdf';

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

function parseSRT(srtContent: string): SrtCue[] {
  const clean = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = clean.split(/\n{2,}/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeLineIndex = lines[0].includes('-->') ? 0 : 1;
      const timeLine = lines[timeLineIndex];
      if (timeLine && timeLine.includes('-->')) {
        const [startStr, endStr] = timeLine.split('-->');
        const text = lines.slice(timeLineIndex + 1).join(' ').trim();
        if (text) {
          cues.push({
            start: parseTimeToSeconds(startStr),
            end: parseTimeToSeconds(endStr),
            text: text.replace(/<[^>]*>/g, '')
          });
        }
      }
    }
  }
  return cues;
}

export default function PilulasPenalPlayer() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const modules = modulesData as ModuloItem[];

  // Localizar o tópico e o módulo correspondente
  const { topico, modulo, indiceNoModulo } = useMemo(() => {
    for (const m of modules) {
      const idx = m.topicos.findIndex(t => t.id === topicId || t.baseSlug === topicId);
      if (idx !== -1) {
        return { topico: m.topicos[idx], modulo: m, indiceNoModulo: idx };
      }
    }
    return { 
      topico: modules[0]?.topicos[0] || null, 
      modulo: modules[0] || null, 
      indiceNoModulo: 0 
    };
  }, [modules, topicId]);

  // Audio & Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [legendaAtual, setLegendaAtual] = useState('');
  const [pdfAberto, setPdfAberto] = useState(false);

  // Menu de Alternância (Legenda, Ficha em Texto sem PDF, Ficha em PDF)
  const [abaPainel, setAbaPainel] = useState<PainelAba>('legenda');
  const [textoFicha, setTextoFicha] = useState<string>('');
  const [carregandoTexto, setCarregandoTexto] = useState(false);

  // Favoritos
  const [isFavorito, setIsFavorito] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Marcar como ouvido no localStorage
  const marcarComoOuvido = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem('pilulas_penal_concluidos');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem('pilulas_penal_concluidos', JSON.stringify(list));
      }
    } catch {}
  }, []);

  // Registrar em recentes
  const registrarRecente = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem('pilulas_penal_recentes');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [id, ...list.filter(x => x !== id)].slice(0, 30);
      localStorage.setItem('pilulas_penal_recentes', JSON.stringify(updated));
    } catch {}
  }, []);

  // Checar se é favorito
  useEffect(() => {
    if (!topico) return;
    try {
      const raw = localStorage.getItem('pilulas_penal_favoritos');
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorito(list.includes(topico.id));
    } catch {}
  }, [topico?.id]);

  const toggleFavorito = useCallback(() => {
    if (!topico) return;
    haptic.selection();
    setIsFavorito(prev => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('pilulas_penal_favoritos');
        let list: string[] = raw ? JSON.parse(raw) : [];
        if (next) {
          if (!list.includes(topico.id)) list.push(topico.id);
        } else {
          list = list.filter(x => x !== topico.id);
        }
        localStorage.setItem('pilulas_penal_favoritos', JSON.stringify(list));
      } catch {}
      return next;
    });
  }, [topico]);

  // Carregar texto do resumo (Ficha em Texto sem PDF)
  useEffect(() => {
    if (!topico) return;
    setTextoFicha('');
    setCarregandoTexto(true);

    let cancelado = false;

    const carregarTexto = async () => {
      // 1. Tenta o R2 roteiroUrl
      if (topico.roteiroUrl) {
        try {
          const res = await fetch(topico.roteiroUrl);
          if (res.ok) {
            const txt = await res.text();
            if (txt && !txt.includes('<!doctype html>') && !cancelado) {
              setTextoFicha(txt);
              setCarregandoTexto(false);
              return;
            }
          }
        } catch {}
      }

      // 2. Tenta Google Drive uc download
      if (topico.driveTxtId) {
        try {
          const res = await fetch(`https://drive.google.com/uc?export=download&id=${topico.driveTxtId}`);
          if (res.ok) {
            const txt = await res.text();
            if (txt && !txt.includes('<!doctype html>') && !cancelado) {
              setTextoFicha(txt);
              setCarregandoTexto(false);
              return;
            }
          }
        } catch {}
      }

      // 3. Fallback montado das legendas SRT
      if (!cancelado) {
        if (cues.length > 0) {
          setTextoFicha(cues.map(c => c.text).join(' '));
        }
        setCarregandoTexto(false);
      }
    };

    carregarTexto();

    return () => {
      cancelado = true;
    };
  }, [topico?.id, topico?.roteiroUrl, topico?.driveTxtId, cues]);

  // Inicializar o áudio ao trocar de tópico
  useEffect(() => {
    if (!topico) return;

    setIsPlaying(false);
    setIsLoading(true);
    setCurrentTime(0);
    setCues([]);
    setLegendaAtual('');

    registrarRecente(topico.id);

    const audioSrc = topico.audioUrl || (topico.driveMp3Id ? `https://drive.google.com/uc?export=download&id=${topico.driveMp3Id}` : '');

    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            marcarComoOuvido(topico.id);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    }

    // Carregar Legendas SRT
    const srtSrc = topico.srtUrl || (topico.driveSrtId ? `https://drive.google.com/uc?export=download&id=${topico.driveSrtId}` : '');
    if (srtSrc) {
      fetch(srtSrc)
        .then(r => r.ok ? r.text() : '')
        .then(txt => {
          if (txt) setCues(parseSRT(txt));
        })
        .catch(() => {});
    }
  }, [topico?.id, registrarRecente, marcarComoOuvido]);

  // Atualização de tempo e legendas sincronizadas
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    if (cur > 20 && topico) {
      marcarComoOuvido(topico.id);
    }

    if (cues.length > 0) {
      const activeCue = cues.find(c => cur >= c.start && cur <= c.end);
      setLegendaAtual(activeCue ? activeCue.text : '');
    }
  }, [cues, topico, marcarComoOuvido]);

  // Controles de Playback
  const togglePlay = () => {
    haptic.selection();
    if (!audioRef.current) return;

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            if (topico) marcarComoOuvido(topico.id);
          })
          .catch((err) => {
            console.warn('Erro ao reproduzir áudio:', err);
            setIsLoading(false);
            if (topico?.driveMp3Id && audioRef.current) {
              audioRef.current.src = `https://drive.google.com/uc?export=download&id=${topico.driveMp3Id}`;
              audioRef.current.load();
              audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
    }
  };

  const pular = (segundos: number) => {
    haptic.selection();
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(Math.max(0, audioRef.current.currentTime + segundos), duration);
  };

  const mudarVelocidade = () => {
    haptic.selection();
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const navegarTopico = (delta: number) => {
    if (!modulo) return;
    haptic.selection();
    const novoIdx = indiceNoModulo + delta;
    if (novoIdx >= 0 && novoIdx < modulo.topicos.length) {
      navigate(`/pilulas/penal/player/${modulo.topicos[novoIdx].id}`);
    }
  };

  const pdfUrlResolvida = useMemo(() => {
    if (!topico) return '';
    return topico.pdfUrl || (topico.drivePdfId ? `https://drive.google.com/uc?export=download&id=${topico.drivePdfId}` : '');
  }, [topico]);

  if (!topico || !modulo) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <p className="text-zinc-400 mb-4">Pílula não encontrada.</p>
        <button
          onClick={() => navigate('/pilulas/penal')}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-sm"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Parágrafos formatados para Ficha em Texto
  const paragrafosTexto = useMemo(() => {
    if (!textoFicha) return [];
    return textoFicha
      .split(/\n{2,}|\r\n\r\n/)
      .map(p => p.trim())
      .filter(Boolean);
  }, [textoFicha]);

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-6 text-white relative flex flex-col justify-between overflow-x-hidden select-none">
      {/* Background Padrão Oficial ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.08)"
          hoverFillColor="rgba(255, 255, 255, 0.12)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      {/* Áudio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (topico) marcarComoOuvido(topico.id);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => {
          if (topico) marcarComoOuvido(topico.id);
          navegarTopico(1);
        }}
        onError={(e) => {
          console.warn('Erro ao carregar stream:', e);
          setIsLoading(false);
          if (topico?.driveMp3Id && audioRef.current && !audioRef.current.src.includes('drive.google.com')) {
            audioRef.current.src = `https://drive.google.com/uc?export=download&id=${topico.driveMp3Id}`;
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Header Superior Fixo com Voltar e Ações */}
      <header className="relative z-20 max-w-xl mx-auto w-full px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex items-center justify-between gap-3">
        <button
          onClick={() => {
            haptic.light();
            navigate('/pilulas/penal');
          }}
          aria-label="Voltar para Lista de Pílulas"
          className="grid w-11 h-11 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
        </button>

        <div className="text-center px-2 min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-amber-400/90 truncate">
            {modulo.folderName}
          </p>
          <h1 className="text-xs font-medium text-zinc-400 truncate">
            Faixa {indiceNoModulo + 1} de {modulo.topicos.length}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Favoritar no Player */}
          <button
            type="button"
            onClick={toggleFavorito}
            title={isFavorito ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
              isFavorito 
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorito ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Botão Ver Lista de Módulos */}
          <button
            onClick={() => {
              haptic.light();
              navigate('/pilulas/penal');
            }}
            aria-label="Ver todas as faixas"
            className="grid w-10 h-10 sm:w-11 sm:h-11 shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo Central: Capa Pequena com Título Dentro e Degradê */}
      <main className="relative z-10 max-w-lg mx-auto w-full px-4 flex-1 flex flex-col justify-start items-center pt-2 pb-2">
        {/* Capa Pequena Compacta com Título DENTRO e Degradê Inferior */}
        <div className="relative group shrink-0">
          {/* Glow Atmosférico Vermelho & Dourado */}
          <div 
            className="absolute -inset-3 rounded-3xl bg-red-600/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none transform-gpu"
          />

          <div className="relative w-44 sm:w-48 aspect-[3/3.8] rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl shadow-black/90 bg-zinc-900 flex flex-col justify-end">
            {/* Imagem de Fundo da Capa Vermelha */}
            <img 
              src={penalCover} 
              alt="Capa Vermelha Direito Penal" 
              className="absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-500 group-hover:scale-105"
            />

            {/* Selo no Topo do Card */}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-bold text-amber-300">
              Pílula {indiceNoModulo + 1}
            </div>

            {/* Degradê Inferior e Título DENTRO da Capa com Nova Tipografia */}
            <div className="relative z-10 w-full p-3 pt-8 bg-gradient-to-t from-black/95 via-black/75 to-transparent text-left">
              <span className="inline-block px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-red-300 text-[9px] font-bold uppercase tracking-wider mb-1">
                Módulo {modulo.folderIndex}
              </span>
              <h2 className="text-sm sm:text-[15px] font-bold text-zinc-100 leading-snug tracking-tight line-clamp-2 drop-shadow-md">
                {topico.titulo}
              </h2>
            </div>
          </div>
        </div>

        {/* Menu de Alternância: Legenda | Ficha em Texto (Sem PDF) | Ficha em PDF */}
        <div className="w-full mt-3.5 p-1 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaPainel('legenda');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              abaPainel === 'legenda'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Legenda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaPainel('texto');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              abaPainel === 'texto'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ficha (Texto)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaPainel('pdf');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              abaPainel === 'pdf'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ficha (PDF)</span>
          </button>
        </div>

        {/* ── PAINEL DINÂMICO CONFORME ABA SELECIONADA ── */}
        <div className="w-full mt-2.5 flex-1 flex flex-col justify-center">
          {/* ABA 1: LEGENDA MAIOR E ELEGANTE */}
          {abaPainel === 'legenda' && (
            <div className="w-full min-h-[92px] max-h-[140px] px-5 py-3.5 rounded-2xl bg-zinc-900/90 border border-amber-500/25 backdrop-blur-md flex items-center justify-center text-center shadow-inner overflow-y-auto">
              <p className="text-base sm:text-lg font-medium text-amber-200/95 leading-relaxed tracking-wide drop-shadow animate-fade-in select-text">
                {legendaAtual ? (
                  <span>“{legendaAtual}”</span>
                ) : (
                  <span className="text-zinc-400 text-sm font-normal italic">
                    {isPlaying ? 'Acompanhe a legenda sincronizada ao áudio...' : 'Toque no Play para ouvir e acompanhar a legenda...'}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ABA 2: FICHA FORMATADA COM TEXTO SEM PDF */}
          {abaPainel === 'texto' && (
            <div className="w-full h-[150px] sm:h-[180px] rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-md p-4 overflow-y-auto shadow-inner text-left select-text">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resumo Esquematizado Cornell</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Texto Completo
                </span>
              </div>

              {carregandoTexto ? (
                <div className="flex items-center justify-center h-24 text-zinc-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span className="text-xs">Carregando resumo esquematizado...</span>
                </div>
              ) : paragrafosTexto.length > 0 ? (
                <div className="space-y-2.5 pr-1">
                  {paragrafosTexto.map((paragrafo, i) => (
                    <p key={i} className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                      {paragrafo}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Resumo esquematizado em texto disponível para este tópico.
                </p>
              )}
            </div>
          )}

          {/* ABA 3: FICHA EM PDF (DO LADO) */}
          {abaPainel === 'pdf' && (
            <div className="w-full min-h-[92px] p-4 rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    Ficha Cornell Original em PDF
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Leitor paginado formato livro no app
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPdfAberto(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Abrir Ficha no App</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Rodapé: Controles de Áudio & Scrubbing */}
      <footer className="relative z-20 max-w-xl mx-auto w-full px-5 pt-1 pb-2">
        {/* Barra de Progresso com Scrubbing */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10.5px] font-mono text-zinc-400 px-0.5">
            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Botões do Player */}
        <div className="flex items-center justify-between gap-1 mt-1.5">
          {/* Botão de Velocidade */}
          <button
            type="button"
            onClick={mudarVelocidade}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
          >
            {playbackRate}x
          </button>

          {/* Navegar Anterior */}
          <button
            type="button"
            disabled={indiceNoModulo === 0}
            onClick={() => navegarTopico(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Retroceder 15s */}
          <button
            type="button"
            onClick={() => pular(-15)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer"
            title="Voltar 15s"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Play / Pause Principal */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-zinc-950" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>

          {/* Avançar 15s */}
          <button
            type="button"
            onClick={() => pular(15)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer"
            title="Avançar 15s"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Navegar Próximo */}
          <button
            type="button"
            disabled={modulo ? indiceNoModulo === modulo.topicos.length - 1 : true}
            onClick={() => navegarTopico(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Botão de Fechar / Sair */}
          <button
            type="button"
            onClick={() => navigate('/pilulas/penal')}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </footer>

      {/* Leitor Oficial de PDF Paginated (Igual ao Livro no Próprio App) */}
      {pdfAberto && pdfUrlResolvida && (
        <PdfPaginatedReader
          url={pdfUrlResolvida}
          titulo={`Ficha Cornell: ${topico.titulo}`}
          capaUrl={penalCover}
          onClose={() => setPdfAberto(false)}
        />
      )}
    </div>
  );
}
