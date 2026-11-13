import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  FileText, Subtitles, Volume2, Sparkles, 
  ChevronLeft, ChevronRight, BookOpen, ExternalLink, X, List,
  Bookmark, Loader2
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
    // Fallback: primeiro tópico do primeiro módulo se não encontrado
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
  const [mostrarLegendas, setMostrarLegendas] = useState(true);
  const [pdfAberto, setPdfAberto] = useState(false);

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
      // Tentativa de autoplay com tratamento gracioso de bloqueio de autoplay
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            marcarComoOuvido(topico.id);
          })
          .catch(() => {
            // Autoplay bloqueado pelo navegador (normal antes do primeiro clique do usuário)
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

    // Se ouviu mais de 20s, marcar como concluído
    if (cur > 20 && topico) {
      marcarComoOuvido(topico.id);
    }

    if (cues.length > 0) {
      const activeCue = cues.find(c => cur >= c.start && cur <= c.end);
      setLegendaAtual(activeCue ? activeCue.text : '');
    }
  }, [cues, topico, marcarComoOuvido]);

  // Controles
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
            console.warn('Erro ao reproduzir áudio principal:', err);
            setIsLoading(false);
            // Fallback para Drive se o link do R2 falhar
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

  // Navegar para próximo ou anterior dentro do módulo
  const navegarTopico = (delta: number) => {
    if (!modulo) return;
    haptic.selection();
    const novoIdx = indiceNoModulo + delta;
    if (novoIdx >= 0 && novoIdx < modulo.topicos.length) {
      navigate(`/pilulas/penal/player/${modulo.topicos[novoIdx].id}`);
    }
  };

  // URL do PDF para visualização
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
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-16 text-white relative flex flex-col justify-between overflow-x-hidden select-none">
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

      {/* Áudio Element com Eventos Robustos */}
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

      {/* Header Superior Fixo com Botão Voltar e Ações */}
      <header className="relative z-20 max-w-xl mx-auto w-full px-4 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex items-center justify-between gap-3">
        <button
          onClick={() => {
            haptic.light();
            navigate('/pilulas/penal');
          }}
          aria-label="Voltar para Lista de Pílulas"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
        </button>

        <div className="text-center px-2 min-w-0 flex-1">
          <p className="text-[10.5px] uppercase tracking-widest font-black text-amber-400/90 truncate">
            {modulo.folderName}
          </p>
          <h1 className="text-xs font-semibold text-zinc-400 truncate">
            Faixa {indiceNoModulo + 1} de {modulo.topicos.length}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Favoritar no Player */}
          <button
            type="button"
            onClick={toggleFavorito}
            title={isFavorito ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
              isFavorito 
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isFavorito ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Botão Ver Lista de Módulos */}
          <button
            onClick={() => {
              haptic.light();
              navigate('/pilulas/penal');
            }}
            aria-label="Ver todas as faixas"
            className="grid w-11 h-11 shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo Central: Capa Vermelha Oficial e Informações da Faixa */}
      <main className="relative z-10 max-w-md mx-auto w-full px-6 flex-1 flex flex-col justify-center items-center py-4">
        {/* Capa Vermelha Oficial com Brilho Volumétrico */}
        <div className="relative group my-auto">
          {/* Glow Atmosférico Vermelho & Dourado */}
          <div 
            className="absolute -inset-4 rounded-3xl bg-red-600/25 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none transform-gpu"
          />

          <div className="relative w-56 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl shadow-black/80 bg-zinc-900">
            <img 
              src={penalCover} 
              alt="Capa Vermelha Direito Penal" 
              className="w-full h-full object-cover transform-gpu transition-transform duration-500 group-hover:scale-105"
            />

            {/* Selo no Card */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9.5px] font-bold text-amber-300">
              Pílula {indiceNoModulo + 1}
            </div>
          </div>
        </div>

        {/* Títulos e Metadados com Tipografia Elegante */}
        <div className="w-full text-center mt-6 space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10.5px] font-bold uppercase tracking-wider">
            Direito Penal • Módulo {modulo.folderIndex}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow leading-tight">
            {topico.titulo}
          </h2>
          <p className="text-xs text-zinc-400">
            Resumo em áudio esquematizado de alta precisão
          </p>
        </div>

        {/* Botão Oficial: Ver PDF da Ficha Cornell Igual ao Livro no Próprio App */}
        <div className="w-full mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setPdfAberto(true);
            }}
            className="flex-1 max-w-[280px] flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span>Ver Ficha Cornell (PDF)</span>
          </button>

          {/* Botão de Alternar Legendas */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setMostrarLegendas(!mostrarLegendas);
            }}
            className={`h-11 px-3 rounded-2xl border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              mostrarLegendas
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Alternar Legendas"
          >
            <Subtitles className="w-4 h-4" />
            <span>Legenda</span>
          </button>
        </div>

        {/* Banner de Legenda em Tempo Real (SRT Sincronizado) */}
        {mostrarLegendas && (
          <div className="w-full min-h-[46px] mt-3 px-4 py-2 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-center shadow-inner">
            <p className="text-xs sm:text-sm font-semibold text-amber-300 drop-shadow animate-fade-in">
              {legendaAtual ? `"${legendaAtual}"` : 'Acompanhe as legendas sincronizadas...'}
            </p>
          </div>
        )}
      </main>

      {/* Rodapé: Controles de Áudio & Scrubbing */}
      <footer className="relative z-20 max-w-xl mx-auto w-full px-6 pb-4">
        {/* Barra de Progresso com Scrubbing */}
        <div className="space-y-1.5">
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
          <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-0.5">
            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Botões do Player */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Botão de Velocidade */}
          <button
            type="button"
            onClick={mudarVelocidade}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
          >
            {playbackRate}x
          </button>

          {/* Navegar Anterior */}
          <button
            type="button"
            disabled={indiceNoModulo === 0}
            onClick={() => navegarTopico(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Retroceder 15s */}
          <button
            type="button"
            onClick={() => pular(-15)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer"
            title="Voltar 15s"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play / Pause Principal com Spinner se carregando */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80"
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-zinc-950" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          {/* Avançar 15s */}
          <button
            type="button"
            onClick={() => pular(15)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer"
            title="Avançar 15s"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Navegar Próximo */}
          <button
            type="button"
            disabled={modulo ? indiceNoModulo === modulo.topicos.length - 1 : true}
            onClick={() => navegarTopico(1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Botão de Fechar / Sair */}
          <button
            type="button"
            onClick={() => navigate('/pilulas/penal')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
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
