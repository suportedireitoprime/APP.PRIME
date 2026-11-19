import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  FileText, Subtitles, Volume2, Scale, 
  ChevronLeft, ChevronRight, BookOpen, ExternalLink, X, List,
  Bookmark, Loader2, Maximize2, HelpCircle
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
import { getMateriaMeta, type PilulaMateriaMeta } from './data/pilulasMateriasConfig';
import { loadPilulasCatalog, type ModuloItem, type TopicoItem } from './data/pilulasCatalogLoader';

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

type PainelAba = 'legenda' | 'tabela' | 'pdf';

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

function getActiveCueAtTime(cur: number, cueList: SrtCue[]): { cue: SrtCue; index: number } | null {
  if (!cueList || cueList.length === 0) return null;
  for (let i = 0; i < cueList.length; i++) {
    const c = cueList[i];
    if (cur >= c.start && cur <= c.end) {
      return { cue: c, index: i };
    }
  }
  for (let i = 0; i < cueList.length; i++) {
    const c = cueList[i];
    const nextC = cueList[i + 1];
    if (cur > c.end && nextC && cur < nextC.start && (nextC.start - c.end) < 1.0) {
      return { cue: c, index: i };
    }
  }
  return null;
}

export default function PilulasMateriaPlayer() {
  const { slug, topicId } = useParams<{ slug: string; topicId: string }>();
  const navigate = useNavigate();

  const meta: PilulaMateriaMeta = useMemo(() => {
    return getMateriaMeta(slug || 'direito-civil') || {
      id: slug || 'direito-civil',
      slug: slug || 'direito-civil',
      nome: 'Pílulas do Conhecimento',
      sigla: 'DIREITO',
      descricao: 'Áudios esquematizados',
      borderColor: '#3B82F6',
      image: '/pilulas/cc_portrait.webp',
      totalModulos: 0,
      totalTopicos: 0,
      aliases: [],
    };
  }, [slug]);

  const [modules, setModules] = useState<ModuloItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Carregar catálogo de módulos da matéria
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    loadPilulasCatalog(meta.slug)
      .then((data) => {
        if (active) {
          setModules(data);
          setCatalogLoading(false);
        }
      })
      .catch((err) => {
        console.error('[PilulasMateriaPlayer] Erro ao carregar catálogo:', err);
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [meta.slug]);

  // Localizar o tópico e o módulo correspondente
  const { topico, modulo, indiceNoModulo } = useMemo(() => {
    if (modules.length === 0) return { topico: null, modulo: null, indiceNoModulo: 0 };
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

  // Audio & playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Subtitles
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [activeCue, setActiveCue] = useState<SrtCue | null>(null);
  const [activeCueIndex, setActiveCueIndex] = useState<number>(-1);
  const [legendaAtual, setLegendaAtual] = useState<string>('');
  const cuesContainerRef = useRef<HTMLDivElement | null>(null);

  // Abas e gaveta
  const [abaAtiva, setAbaAtiva] = useState<PainelAba>('legenda');
  const [drawerAberto, setDrawerAberto] = useState(false);

  // Roteiro TXT
  const [roteiroTxt, setRoteiroTxt] = useState<string>('');

  // Persistência
  const storagePrefix = `pilulas_${meta.slug}`;
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_favoritos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isFavorito = topico ? favoritos.includes(topico.id) : false;

  const toggleFavorito = useCallback(() => {
    if (!topico) return;
    haptic.selection();
    setFavoritos(prev => {
      const next = prev.includes(topico.id) ? prev.filter(id => id !== topico.id) : [...prev, topico.id];
      try {
        localStorage.setItem(`${storagePrefix}_favoritos`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [topico, storagePrefix]);

  const marcarComoOuvido = useCallback((id: string) => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_concluidos`);
      const set = new Set(saved ? JSON.parse(saved) : []);
      set.add(id);
      localStorage.setItem(`${storagePrefix}_concluidos`, JSON.stringify(Array.from(set)));
    } catch {}
  }, [storagePrefix]);

  const registrarRecente = useCallback((id: string) => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_recentes`);
      const list = saved ? JSON.parse(saved) : [];
      const next = [id, ...list.filter((x: string) => x !== id)].slice(0, 30);
      localStorage.setItem(`${storagePrefix}_recentes`, JSON.stringify(next));
    } catch {}
  }, [storagePrefix]);

  // Carregar e iniciar áudio e legendas
  useEffect(() => {
    if (!topico) return;

    setIsPlaying(false);
    setIsLoading(true);
    setCurrentTime(0);
    setCues([]);
    setLegendaAtual('');
    setActiveCue(null);
    setActiveCueIndex(-1);
    setRoteiroTxt('');

    registrarRecente(topico.id);

    // Fonte de áudio: tenta R2 primeiro, com fallback automático
    const primaryAudio = topico.audioUrl;
    const fallbackAudio = topico.driveMp3Id ? `https://drive.google.com/uc?export=download&id=${topico.driveMp3Id}` : '';
    const audioSrc = primaryAudio || fallbackAudio;

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
    const primarySrt = topico.srtUrl;
    const fallbackSrt = topico.driveSrtId ? `https://drive.google.com/uc?export=download&id=${topico.driveSrtId}` : '';

    const loadSrt = async () => {
      try {
        if (primarySrt) {
          const res = await fetch(primarySrt);
          if (res.ok) {
            const txt = await res.text();
            if (txt && txt.trim()) {
              setCues(parseSRT(txt));
              return;
            }
          }
        }
        if (fallbackSrt) {
          const res = await fetch(fallbackSrt);
          if (res.ok) {
            const txt = await res.text();
            if (txt) setCues(parseSRT(txt));
          }
        }
      } catch (err) {
        console.warn('[PilulasMateriaPlayer] Erro ao carregar SRT:', err);
      }
    };
    void loadSrt();

    // Carregar Roteiro TXT
    const primaryTxt = topico.roteiroUrl;
    const fallbackTxt = topico.driveTxtId ? `https://drive.google.com/uc?export=download&id=${topico.driveTxtId}` : '';
    const loadTxt = async () => {
      try {
        if (primaryTxt) {
          const res = await fetch(primaryTxt);
          if (res.ok) {
            const txt = await res.text();
            if (txt) {
              setRoteiroTxt(txt);
              return;
            }
          }
        }
        if (fallbackTxt) {
          const res = await fetch(fallbackTxt);
          if (res.ok) {
            const txt = await res.text();
            if (txt) setRoteiroTxt(txt);
          }
        }
      } catch {}
    };
    void loadTxt();
  }, [topico?.id, registrarRecente, marcarComoOuvido]);

  // Fallback caso o áudio R2 retorne erro
  const handleAudioError = useCallback(() => {
    if (!audioRef.current || !topico) return;
    const fallbackAudio = topico.driveMp3Id ? `https://drive.google.com/uc?export=download&id=${topico.driveMp3Id}` : '';
    if (fallbackAudio && audioRef.current.src !== fallbackAudio) {
      console.log('[PilulasMateriaPlayer] R2 404/Erro, alternando para fallback Google Drive...');
      audioRef.current.src = fallbackAudio;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [topico]);

  // 60fps/120fps sync loop de precisão cirúrgica
  useEffect(() => {
    if (!isPlaying) return;
    let rafId: number;
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const cur = audioRef.current.currentTime;
        setCurrentTime(cur);

        if (cues.length > 0) {
          const match = getActiveCueAtTime(cur, cues);
          if (match) {
            setActiveCue(match.cue);
            setActiveCueIndex(match.index);
            setLegendaAtual(match.cue.text);
          } else {
            setActiveCue(null);
            setActiveCueIndex(-1);
            setLegendaAtual('');
          }
        }
      }
      if (isPlaying) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, cues]);

  const togglePlay = useCallback(() => {
    haptic.selection();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const seekRelative = useCallback((seconds: number) => {
    haptic.light();
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

  const handleRateChange = useCallback(() => {
    haptic.selection();
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  // Navegar para próximo / anterior tópico
  const proximoTopico = useMemo(() => {
    if (!modulo || !topico) return null;
    const idx = modulo.topicos.findIndex(t => t.id === topico.id);
    if (idx !== -1 && idx < modulo.topicos.length - 1) {
      return modulo.topicos[idx + 1];
    }
    // Próximo módulo
    const modIdx = modules.findIndex(m => m.id === modulo.id);
    if (modIdx !== -1 && modIdx < modules.length - 1) {
      return modules[modIdx + 1].topicos[0] || null;
    }
    return null;
  }, [modulo, topico, modules]);

  const anteriorTopico = useMemo(() => {
    if (!modulo || !topico) return null;
    const idx = modulo.topicos.findIndex(t => t.id === topico.id);
    if (idx > 0) {
      return modulo.topicos[idx - 1];
    }
    // Módulo anterior
    const modIdx = modules.findIndex(m => m.id === modulo.id);
    if (modIdx > 0) {
      const prevMod = modules[modIdx - 1];
      return prevMod.topicos[prevMod.topicos.length - 1] || null;
    }
    return null;
  }, [modulo, topico, modules]);

  const irParaTopico = useCallback((novoTopico: TopicoItem) => {
    haptic.selection();
    navigate(`/pilulas/${meta.slug}/player/${novoTopico.id}`, { replace: true });
    setDrawerAberto(false);
  }, [navigate, meta.slug]);

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (catalogLoading) {
    return (
      <div className="theme-vademecum min-h-dvh bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm text-zinc-400 font-medium">Carregando aula...</p>
      </div>
    );
  }

  if (!topico) {
    return (
      <div className="theme-vademecum min-h-dvh bg-zinc-950 flex flex-col items-center justify-center text-white px-4">
        <p className="text-base text-zinc-300 mb-4">Tópico não encontrado no catálogo.</p>
        <button
          onClick={() => navigate(`/pilulas/${meta.slug}`)}
          className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
        >
          Voltar para {meta.nome}
        </button>
      </div>
    );
  }

  const pdfUrl = topico.pdfUrl || (topico.drivePdfId ? `https://drive.google.com/uc?export=download&id=${topico.drivePdfId}` : null);

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-20 text-white relative flex flex-col overflow-x-hidden">
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

      {/* Áudio nativo invisível */}
      <audio
        ref={audioRef}
        onError={handleAudioError}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          marcarComoOuvido(topico.id);
          if (proximoTopico) {
            irParaTopico(proximoTopico);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* ========================================================================= */}
      {/* TOP HEADER: BOTÃO DE VOLTAR PADRÃO OURO + TÍTULO DA MATÉRIA */}
      {/* ========================================================================= */}
      <header className="relative z-20 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-3 flex items-center justify-between gap-3 border-b border-white/5 backdrop-blur-md bg-zinc-950/80">
        <button
          onClick={() => {
            haptic.light();
            navigate(`/pilulas/${meta.slug}`);
          }}
          aria-label="Voltar para a matéria"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <span 
            className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest block font-sans"
            style={{ color: meta.borderColor }}
          >
            {meta.nome} • MÓDULO {modulo?.folderIndex.toString().padStart(2, '0')}
          </span>
          <h1 className="text-xs sm:text-sm font-bold font-sans text-white/95 truncate">
            {modulo?.titulo}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleFavorito}
            aria-label="Favoritar"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${isFavorito ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            aria-label="Abrir playlist de módulos"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CORPO PRINCIPAL DO PLAYER */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 max-w-[1200px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        
        {/* Card do Tópico Ativo */}
        <div className="rounded-3xl bg-zinc-900/90 border border-white/10 p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
              TÓPICO {(indiceNoModulo + 1).toString().padStart(2, '0')} DE {modulo?.topicos.length}
            </span>
            <span 
              className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase"
              style={{
                backgroundColor: `${meta.borderColor}20`,
                color: meta.borderColor,
                border: `1px solid ${meta.borderColor}40`,
              }}
            >
              {meta.sigla}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-white font-sans leading-snug">
            {topico.titulo}
          </h2>

          {/* Legenda em Destaque ao Vivo */}
          <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 min-h-[72px] flex items-center justify-center text-center">
            {legendaAtual ? (
              <p className="text-sm sm:text-base font-semibold text-amber-300 leading-snug drop-shadow-sm">
                "{legendaAtual}"
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                {isPlaying ? 'Acompanhando fala...' : 'Toque no play para iniciar o áudio esquematizado'}
              </p>
            )}
          </div>

          {/* Barra de Progresso e Scrubbing */}
          <div className="mt-5 space-y-1.5">
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
              className="w-full h-1.5 rounded-lg appearance-none bg-white/10 accent-amber-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles de Reprodução */}
          <div className="mt-3 flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRateChange}
              className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-amber-400 hover:bg-white/10 transition-colors"
            >
              {playbackRate}x
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => seekRelative(-10)}
                aria-label="Voltar 10 segundos"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-300 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 fill-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekRelative(10)}
                aria-label="Avançar 10 segundos"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-300 transition-all"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!anteriorTopico}
                onClick={() => anteriorTopico && irParaTopico(anteriorTopico)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  anteriorTopico ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                }`}
                aria-label="Aula anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!proximoTopico}
                onClick={() => proximoTopico && irParaTopico(proximoTopico)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  proximoTopico ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
                }`}
                aria-label="Próxima aula"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SELETOR DE ABAS: LEGENDAS / ROTEIRO / PDF CORNELL */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-2 p-1 rounded-2xl bg-zinc-900/80 border border-white/5">
          <button
            type="button"
            onClick={() => { haptic.selection(); setAbaAtiva('legenda'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              abaAtiva === 'legenda'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Legendas ({cues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.selection(); setAbaAtiva('tabela'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              abaAtiva === 'tabela'
                ? 'bg-white/10 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Roteiro / Resumo</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.selection(); setAbaAtiva('pdf'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              abaAtiva === 'pdf'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ficha Cornell (PDF)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PAINEL DE CONTEÚDO CONFORME ABA */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-[320px] rounded-3xl bg-zinc-900/80 border border-white/10 p-4 backdrop-blur-md overflow-hidden flex flex-col">
          
          {abaAtiva === 'legenda' && (
            <div 
              ref={cuesContainerRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[480px]"
            >
              {cues.map((c, i) => {
                const isActive = i === activeCueIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      if (audioRef.current) {
                        audioRef.current.currentTime = c.start;
                        setCurrentTime(c.start);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      isActive 
                        ? 'bg-amber-400/15 border border-amber-400/40 text-amber-200 font-semibold shadow-sm' 
                        : 'bg-white/[0.02] hover:bg-white/5 border border-white/5 text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-500 pt-0.5 shrink-0">
                      {formatTime(c.start)}
                    </span>
                    <p className="text-xs sm:text-sm leading-relaxed flex-1">
                      {c.text}
                    </p>
                  </button>
                );
              })}

              {cues.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Legendas sincronizadas indisponíveis para este áudio.
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'tabela' && (
            <div className="flex-1 overflow-y-auto pr-1 max-h-[480px]">
              {roteiroTxt ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-sans text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {roteiroTxt}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Roteiro de estudo não disponível para este tópico.
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'pdf' && (
            <div className="flex-1 min-h-[400px] flex flex-col">
              {pdfUrl ? (
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950">
                  <PdfPaginatedReader
                    url={pdfUrl}
                    titulo={`Ficha Cornell • ${topico.titulo}`}
                    capaUrl={meta.image}
                    onClose={() => setAbaAtiva('legenda')}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  PDF da Ficha Cornell indisponível para este tópico.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* DRAWER LATERAL DE MÓDULOS E TÓPICOS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawerAberto && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerAberto(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Painel Lateral */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative ml-auto w-full max-w-[380px] h-full bg-zinc-900 border-l border-white/10 p-5 flex flex-col z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block font-sans">
                    PLAYLIST DA MATÉRIA
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">
                    {meta.nome}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerAberto(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista dos tópicos do módulo ativo */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  MÓDULO ATUAL: {modulo?.titulo}
                </span>

                {modulo?.topicos.map((t, idx) => {
                  const isCurrent = t.id === topico.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => irParaTopico(t)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold'
                          : 'bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs truncate">{t.titulo}</span>
                      </div>
                      {isCurrent && <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />}
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
}
