import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  FileText, Subtitles, Volume2, Sparkles, 
  ChevronLeft, ChevronRight, BookOpen, ExternalLink, X, List,
  Bookmark, Loader2, Maximize2, HelpCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import penalCover from '@/assets/covers/cp_artigos_v2.webp';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
import modulesData from '@/data/pilulasDireitoPenalCatalog.json';
import cornellNotesMapRaw from '@/data/pilulasCornellNotes.json';

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

interface CornellItem {
  pergunta: string;
  resposta: string;
}

interface CornellNote {
  id: string;
  titulo: string;
  moduloId: string;
  moduloTitulo: string;
  moduloIndex: number;
  rawText: string;
  itens: CornellItem[];
  resumoGuardaAssim: string;
  perguntaRapida: string;
  respostaRapida: string;
}

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

type PainelAba = 'legenda' | 'ficha' | 'pdf';

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
  const cornellNotesMap = cornellNotesMapRaw as Record<string, CornellNote>;

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

  // Dados da Ficha Cornell estruturada
  const cornellData: CornellNote | null = useMemo(() => {
    if (!topico) return null;
    return cornellNotesMap[topico.id] || null;
  }, [topico, cornellNotesMap]);

  // Audio & Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [legendaAtual, setLegendaAtual] = useState('');
  const [pdfAberto, setPdfAberto] = useState(false);

  // Menu de Alternância (Legenda, Ficha Cornell Layout, Ficha PDF)
  const [abaPainel, setAbaPainel] = useState<PainelAba>('legenda');

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

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-[135px] sm:pb-[145px] text-white relative flex flex-col justify-between overflow-x-hidden select-none">
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

      {/* Menu de Alternância: Legenda | Ficha Cornell (Layout) | Ficha (PDF) */}
      <div className="relative z-20 max-w-md mx-auto w-full px-4 mt-3">
        <div className="p-1 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-lg">
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
              setAbaPainel('ficha');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              abaPainel === 'ficha'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ficha (Layout)</span>
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
      </div>

      {/* Conteúdo Central Scrollável em Tela Toda */}
      <main className="relative z-10 w-full flex-1 flex flex-col justify-start items-center pt-3 px-3 sm:px-6">
        
        {/* ── ABA 1: LEGENDA (Capa Pequena com Título Dentro e Legenda Grande Elegante) ── */}
        {abaPainel === 'legenda' && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 py-2">
            {/* Capa Pequena Compacta com Título DENTRO e Degradê Inferior */}
            <div className="relative group shrink-0">
              <div 
                className="absolute -inset-3 rounded-3xl bg-red-600/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none transform-gpu"
              />

              <div className="relative w-44 sm:w-48 aspect-[3/3.8] rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl shadow-black/90 bg-zinc-900 flex flex-col justify-end">
                <img 
                  src={penalCover} 
                  alt="Capa Vermelha Direito Penal" 
                  className="absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-bold text-amber-300">
                  Pílula {indiceNoModulo + 1}
                </div>

                {/* Degradê Inferior e Título DENTRO da Capa */}
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

            {/* Legenda Maior e Elegante */}
            <div className="w-full min-h-[110px] max-h-[160px] px-6 py-4 rounded-3xl bg-zinc-900/90 border border-amber-500/25 backdrop-blur-md flex items-center justify-center text-center shadow-2xl overflow-y-auto">
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
          </div>
        )}

        {/* ── ABA 2: FICHA CORNELL EM TELA TODA (IGUAL AO LAYOUT DO PDF) ── */}
        {abaPainel === 'ficha' && (
          <div className="w-full max-w-3xl mx-auto py-1">
            <div className="rounded-3xl bg-zinc-900/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl overflow-hidden text-left p-4 sm:p-6 select-text">
              
              {/* Cabeçalho da Ficha Cornell */}
              <div className="border-b border-amber-500/20 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-red-600/25 border border-red-500/40 text-[10px] font-extrabold text-red-300 uppercase tracking-wider">
                      Direito Penal • Módulo {modulo.folderIndex}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400">
                      Ficha Cornell #{indiceNoModulo + 1}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {topico.titulo}
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Pílulas de Direito • Metodologia Cornell de Revisão em 1 Página
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setPdfAberto(true);
                  }}
                  className="self-start sm:self-auto flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-amber-300 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ver PDF Original</span>
                </button>
              </div>

              {/* Grid Cornell Autêntico: Coluna de Pistas (Esquerda) e Coluna de Notas (Direita) */}
              <div className="border border-amber-500/20 rounded-2xl overflow-hidden divide-y divide-amber-500/15 bg-black/30">
                {/* Linha de Título das Colunas Cornell */}
                <div className="grid grid-cols-12 bg-amber-500/10 font-bold text-[11px] uppercase tracking-wider text-amber-300">
                  <div className="col-span-12 sm:col-span-4 p-2.5 sm:border-r border-amber-500/20 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conceito / Pergunta</span>
                  </div>
                  <div className="hidden sm:flex col-span-8 p-2.5 items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Anotações & Esquema (Notes)</span>
                  </div>
                </div>

                {/* Itens do Grid Cornell Extraídos */}
                {cornellData && cornellData.itens && cornellData.itens.length > 0 ? (
                  cornellData.itens.map((item, idx) => {
                    // Pular itens vazios
                    if (!item.pergunta && !item.resposta) return null;

                    return (
                      <div key={idx} className="grid grid-cols-12 text-xs sm:text-sm divide-y sm:divide-y-0 sm:divide-x divide-amber-500/10 hover:bg-white/[0.02] transition-colors">
                        {/* Coluna Esquerda: Palavra-Chave / Pergunta-Chave */}
                        <div className="col-span-12 sm:col-span-4 p-3 bg-amber-500/[0.03]">
                          <span className="font-extrabold text-amber-300 tracking-tight leading-snug">
                            {item.pergunta.replace(/^:/, '').trim() || 'Tópico'}
                          </span>
                        </div>

                        {/* Coluna Direita: Anotação Explicativa / Esquema */}
                        <div className="col-span-12 sm:col-span-8 p-3 text-zinc-200 leading-relaxed font-normal">
                          {item.resposta}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-xs text-zinc-400 italic">
                    Carregando estrutura Cornell desta pílula...
                  </div>
                )}
              </div>

              {/* Rodapé Cornell: RESUMO: GUARDA ASSIM */}
              {(cornellData?.resumoGuardaAssim || cornellData?.perguntaRapida) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900/90 to-red-950/25 border border-amber-500/35 shadow-lg">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Resumo: Guarda Assim</span>
                  </div>

                  {cornellData.resumoGuardaAssim && (
                    <p className="text-xs sm:text-sm font-semibold text-zinc-100 leading-relaxed mb-3">
                      {cornellData.resumoGuardaAssim}
                    </p>
                  )}

                  {cornellData.perguntaRapida && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-amber-300 font-bold">
                        <span>⚡ Pergunta rápida:</span>
                        <span className="text-zinc-200 font-normal">{cornellData.perguntaRapida}</span>
                      </div>
                      {cornellData.respostaRapida && (
                        <div className="flex items-start gap-1.5 text-xs text-emerald-400 font-bold pl-4">
                          <span>👉</span>
                          <span>{cornellData.respostaRapida}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: FICHA EM PDF ORIGINAL (EM TELA TODA) ── */}
        {abaPainel === 'pdf' && (
          <div className="w-full max-w-3xl mx-auto py-2">
            <div className="rounded-3xl bg-zinc-900/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Ficha Cornell Original em PDF
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Visualização em formato livro paginado com controle de zoom e navegação dedicada no app.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPdfAberto(true);
                }}
                className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                <span>Abrir Ficha Cornell em Tela Cheia</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── PLAYER DE ÁUDIO 100% FIXO NO RODAPÉ ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 px-4 pt-2 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl">
        <div className="max-w-xl mx-auto w-full">
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

          {/* Botões do Player Fixo */}
          <div className="flex items-center justify-between gap-1 mt-1">
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
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-zinc-950" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
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
