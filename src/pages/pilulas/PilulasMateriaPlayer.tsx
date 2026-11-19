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

type PainelAba = 'tabela' | 'legenda' | 'pdf';

interface LinhaCornell {
  pergunta: string;
  resposta: string;
}

interface CornellParsedData {
  rows: LinhaCornell[];
  resumoGuardaAssim?: string;
  perguntaRapida?: string;
  respostaRapida?: string;
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

/**
 * Converte o roteiro TXT ou título do tópico em linhas estruturadas de Ficha Cornell (Pergunta e Resposta)
 */
function parseRoteiroParaCornell(txt: string, topicoTitulo: string, moduloTitulo: string): CornellParsedData {
  if (!txt || txt.trim().length < 50) {
    return {
      rows: [
        { pergunta: 'Conceito e Definição', resposta: `Fundamentos essenciais e estrutura doutrinária sobre ${topicoTitulo}.` },
        { pergunta: 'Aplicação Prática', resposta: `Regras de incidência, requisitos e repercussão jurídica aplicáveis a ${moduloTitulo}.` },
        { pergunta: 'Base Normativa e Jurisprudência', resposta: `Dispositivos legais correlatos, precedentes dos Tribunais Superiores e pontos de atenção em provas e prática forense.` }
      ],
      resumoGuardaAssim: `Para fixar: ${topicoTitulo} exige a compreensão de sua finalidade, requisitos fundamentais e consequências jurídicas diretas no ordenamento.`,
      perguntaRapida: `Qual o ponto fulcral de ${topicoTitulo}?`,
      respostaRapida: `A correta identificação dos requisitos legais e sua incidência no caso concreto.`
    };
  }

  const clean = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragrafos = clean.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 20);

  const rows: LinhaCornell[] = [];

  const perguntasPadrao = [
    'Conceito e Origem',
    'Qual a finalidade e alcance?',
    'Base Legal e Requisitos',
    'Diferenciação e Pontos Críticos',
    'Aspectos Práticos e Repercussão',
    'Regras de Exceção'
  ];

  paragrafos.forEach((p, idx) => {
    // Ignora parágrafo inicial se for apenas introdução de podcast ("Pílula de...")
    if (idx === 0 && p.toLowerCase().startsWith('pílula de') && paragrafos.length > 3) {
      return;
    }

    if (rows.length < 5) {
      const pergunta = perguntasPadrao[rows.length] || `Ponto ${rows.length + 1}`;
      rows.push({
        pergunta,
        resposta: p
      });
    }
  });

  const ultimoParagrafo = paragrafos[paragrafos.length - 1] || '';
  const resumo = ultimoParagrafo.length > 30 && !rows.some(r => r.resposta === ultimoParagrafo)
    ? ultimoParagrafo
    : `Em resumo, ${topicoTitulo} consolida as diretrizes essenciais sobre a matéria, conectando a teoria à aplicação jurisprudencial pacificada.`;

  return {
    rows: rows.length > 0 ? rows : [
      { pergunta: 'Conceito Central', resposta: paragrafos[0] || `Conceito fundamental de ${topicoTitulo}.` },
      { pergunta: 'Fundamentos', resposta: paragrafos[1] || `Fundamentação e alcance no Direito.` }
    ],
    resumoGuardaAssim: resumo,
    perguntaRapida: `Qual a regra geral aplicável a ${topicoTitulo}?`,
    respostaRapida: `A incidência direta dos preceitos legais e jurisprudenciais consolidados na grade de ${moduloTitulo}.`
  };
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Subtitles
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [activeCue, setActiveCue] = useState<SrtCue | null>(null);
  const [activeCueIndex, setActiveCueIndex] = useState<number>(-1);
  const [legendaAtual, setLegendaAtual] = useState<string>('');

  // Abas do Painel: Tabela (Default), Legenda, PDF
  const [abaPainel, setAbaPainel] = useState<PainelAba>('tabela');
  const [pdfAberto, setPdfAberto] = useState(false);

  // Roteiro TXT e Ficha Cornell Parseada
  const [roteiroTxt, setRoteiroTxt] = useState<string>('');

  const cornellData: CornellParsedData = useMemo(() => {
    return parseRoteiroParaCornell(roteiroTxt, topico?.titulo || 'Tópico de Estudo', modulo?.titulo || meta.nome);
  }, [roteiroTxt, topico?.titulo, modulo?.titulo, meta.nome]);

  const linhasTabela = useMemo(() => {
    return cornellData.rows || [];
  }, [cornellData]);

  // Persistência
  const storagePrefix = `pilulas_${meta.slug}`;
  const [isFavorito, setIsFavorito] = useState(false);

  // Checar se é favorito
  useEffect(() => {
    if (!topico) return;
    try {
      const saved = localStorage.getItem(`${storagePrefix}_favoritos`);
      const list: string[] = saved ? JSON.parse(saved) : [];
      setIsFavorito(list.includes(topico.id));
    } catch {}
  }, [topico?.id, storagePrefix]);

  const toggleFavorito = useCallback(() => {
    if (!topico) return;
    haptic.selection();
    setIsFavorito(prev => {
      const next = !prev;
      try {
        const saved = localStorage.getItem(`${storagePrefix}_favoritos`);
        let list: string[] = saved ? JSON.parse(saved) : [];
        if (next) {
          if (!list.includes(topico.id)) list.push(topico.id);
        } else {
          list = list.filter(id => id !== topico.id);
        }
        localStorage.setItem(`${storagePrefix}_favoritos`, JSON.stringify(list));
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

  // Inicializar o áudio ao trocar de tópico
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

    // Fonte de áudio: tenta R2 primeiro, com fallback automático para Google Drive
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
    const srtSrc = topico.srtUrl || (topico.driveSrtId ? `https://drive.google.com/uc?export=download&id=${topico.driveSrtId}` : '');
    if (srtSrc) {
      fetch(srtSrc)
        .then(r => r.ok ? r.text() : '')
        .then(txt => {
          if (txt) setCues(parseSRT(txt));
        })
        .catch(() => {});
    }

    // Carregar Roteiro TXT para Ficha Cornell
    const txtSrc = topico.roteiroUrl || (topico.driveTxtId ? `https://drive.google.com/uc?export=download&id=${topico.driveTxtId}` : '');
    if (txtSrc) {
      fetch(txtSrc)
        .then(r => r.ok ? r.text() : '')
        .then(txt => {
          if (txt && !txt.includes('<!doctype html>')) {
            setRoteiroTxt(txt);
          }
        })
        .catch(() => {});
    }
  }, [topico?.id, registrarRecente, marcarComoOuvido]);

  // 60fps/120fps sync loop de precisão cirúrgica sem latência de eventos
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

  // Palavras da legenda atual para animação tipo Karaoke em tempo real
  const currentWords = useMemo(() => {
    if (!activeCue?.text) return [];
    return activeCue.text.split(/\s+/).filter(Boolean);
  }, [activeCue?.text]);

  const currentWordProgress = useMemo(() => {
    if (!activeCue || currentWords.length === 0) return 0;
    const dur = Math.max(0.25, activeCue.end - activeCue.start);
    const elapsed = currentTime - activeCue.start;
    return Math.max(0, Math.min(1, elapsed / dur));
  }, [activeCue, currentTime, currentWords.length]);

  const activeWordIdx = Math.min(
    currentWords.length - 1,
    Math.floor(currentWordProgress * currentWords.length)
  );

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
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const navegarTopico = (delta: number) => {
    if (!modulo || !topico) return;
    const novoIdx = indiceNoModulo + delta;
    if (novoIdx >= 0 && novoIdx < modulo.topicos.length) {
      const novoTopico = modulo.topicos[novoIdx];
      haptic.selection();
      navigate(`/pilulas/materia/${meta.slug}/player/${novoTopico.id}`, { replace: true });
    }
  };

  const pdfUrlResolvida = useMemo(() => {
    if (!topico) return null;
    return topico.pdfUrl || (topico.drivePdfId ? `https://drive.google.com/uc?export=download&id=${topico.drivePdfId}` : null);
  }, [topico]);

  if (catalogLoading) {
    return (
      <div className="theme-vademecum min-h-dvh bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm text-zinc-400 font-medium font-sans">Carregando player...</p>
      </div>
    );
  }

  if (!topico || !modulo) {
    return (
      <div className="theme-vademecum min-h-dvh bg-zinc-950 flex flex-col items-center justify-center text-white px-4">
        <p className="text-base text-zinc-300 mb-4 font-sans">Tópico não encontrado no catálogo.</p>
        <button
          onClick={() => navigate(`/pilulas/materia/${meta.slug}`)}
          className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-sans cursor-pointer hover:bg-white/20 transition-colors"
        >
          Voltar para {meta.nome}
        </button>
      </div>
    );
  }

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-32 text-white relative flex flex-col overflow-x-hidden">
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
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          marcarComoOuvido(topico.id);
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

      {/* Header Superior Fixo Compacto com Voltar e Ações */}
      <header className="relative z-20 w-full px-3 sm:px-6 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-2 flex items-center justify-between gap-2.5 border-b border-white/5">
        <button
          onClick={() => {
            haptic.light();
            navigate(`/pilulas/materia/${meta.slug}?modulo=${modulo.id}`);
          }}
          aria-label="Voltar para Lista de Pílulas"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
        </button>

        <div className="text-center px-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-amber-400/90 truncate font-sans">
            {modulo.folderName || meta.nome}
          </p>
          <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate font-sans mt-0.5">
            Faixa {indiceNoModulo + 1} de {modulo.topicos.length} • {topico.titulo}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={toggleFavorito}
            title={isFavorito ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
            className={`w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation shrink-0 ${
              isFavorito 
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isFavorito ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              haptic.light();
              navigate(`/pilulas/materia/${meta.slug}?modulo=${modulo.id}`);
            }}
            aria-label="Ver todas as faixas"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer touch-manipulation"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Menu de Alternância - Padrão de Toque Google 48px */}
      <div className="relative z-20 w-full px-3 sm:px-6 mt-2.5">
        <div className="max-w-md mx-auto min-h-[48px] p-1 rounded-2xl bg-zinc-900/95 border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaPainel('tabela');
            }}
            className={`flex-1 min-h-[44px] sm:min-h-[46px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer touch-manipulation font-sans ${
              abaPainel === 'tabela'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ficha (Tabela)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaPainel('legenda');
            }}
            className={`flex-1 min-h-[44px] sm:min-h-[46px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer touch-manipulation font-sans ${
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
              setAbaPainel('pdf');
            }}
            className={`flex-1 min-h-[44px] sm:min-h-[46px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer touch-manipulation font-sans ${
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

      {/* Conteúdo Central em Tela Toda (SEM MARGENS LATERAIS) */}
      <main className="relative z-10 w-full flex-1 flex flex-col justify-start items-center pt-2 px-0">
        
        {/* ── ABA 1: TABELA CORNELL (PERGUNTA NA ESQUERDA E RESPOSTA AO LADO) ── */}
        {abaPainel === 'tabela' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col px-0 select-text">
            {/* Header da Ficha (Método Cornell no título e badges de navegação) */}
            <div className="px-3 sm:px-6 py-3 border-b border-amber-500/20 bg-zinc-900/70 backdrop-blur-md flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold font-sans">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/10">
                    Método Cornell
                  </span>
                  <span 
                    className="px-2 py-0.5 rounded-md text-white border"
                    style={{ backgroundColor: `${meta.borderColor}30`, borderColor: `${meta.borderColor}50` }}
                  >
                    Módulo {modulo.folderIndex}
                  </span>
                  <span className="text-zinc-400 font-medium">
                    • Ficha #{indiceNoModulo + 1} de {modulo.topicos.length}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-normal truncate mt-1.5 font-sans">
                  {topico.titulo}
                </h2>
              </div>
            </div>

            {/* TABELA CORNELL PURO: PERGUNTA NA ESQUERDA E RESPOSTA AO LADO */}
            <div className="w-full overflow-x-hidden">
              <table className="w-full border-collapse text-left border-y border-white/10 table-fixed">
                <thead>
                  <tr className="bg-amber-500/15 border-b border-amber-500/25 text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 font-sans">
                    <th className="w-[36%] sm:w-[32%] py-2.5 px-3 sm:px-5 border-r border-amber-500/20">
                      Pergunta / Pista
                    </th>
                    <th className="w-[64%] sm:w-[68%] py-2.5 px-3 sm:px-5">
                      Resposta / Anotação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {linhasTabela.length > 0 ? (
                    linhasTabela.map((linha, idx) => (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${idx % 2 === 0 ? 'bg-zinc-950/70' : 'bg-zinc-900/40'} hover:bg-amber-500/[0.04]`}
                      >
                        {/* Coluna 1: Pergunta / Conceito (Ao lado) */}
                        <td className="w-[36%] sm:w-[32%] py-3 sm:py-3.5 px-3 sm:px-5 align-top font-bold text-amber-300 text-xs sm:text-sm border-r border-white/10 leading-snug break-words font-sans">
                          {linha.pergunta}
                        </td>

                        {/* Coluna 2: Resposta / Explicação (Ao lado) */}
                        <td className="w-[64%] sm:w-[68%] py-3 sm:py-3.5 px-3 sm:px-5 align-top text-zinc-200 text-xs sm:text-sm leading-relaxed break-words font-sans font-normal">
                          {linha.resposta}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-xs text-zinc-400 italic font-sans">
                        Carregando tabela da Ficha Cornell...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BLOCO RESUMO: GUARDA ASSIM (NO FINAL DA TABELA, SEM MARGEM LATERAL NO MOBILE) */}
            {(cornellData?.resumoGuardaAssim || cornellData?.perguntaRapida) && (
              <div className="w-full p-3.5 sm:p-5 bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-black/80 border-b border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider mb-2 font-sans">
                  <Scale className="w-4 h-4" />
                  <span>Resumo: Guarda Assim</span>
                </div>

                {cornellData.resumoGuardaAssim && (
                  <p className="text-xs sm:text-sm font-semibold text-zinc-100 leading-relaxed mb-3 font-sans">
                    {cornellData.resumoGuardaAssim}
                  </p>
                )}

                {cornellData.perguntaRapida && (
                  <div className="p-3 rounded-xl bg-black/45 border border-white/5 space-y-1.5">
                    <div className="flex items-start gap-1.5 text-xs sm:text-[13px] text-amber-300 font-bold font-sans">
                      <span className="shrink-0">⚡ Pergunta:</span>
                      <span className="text-zinc-200 font-normal">{cornellData.perguntaRapida}</span>
                    </div>
                    {cornellData.respostaRapida && (
                      <div className="flex items-start gap-1.5 text-xs sm:text-[13px] text-emerald-400 font-bold font-sans">
                        <span className="shrink-0">👉</span>
                        <span>{cornellData.respostaRapida}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ABA 2: LEGENDA (Capa Pequena e Legenda Elegante Maior) ── */}
        {abaPainel === 'legenda' && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3 py-2 px-3">
            {/* Capa Pequena Compacta com Título DENTRO e Degradê Inferior */}
            <div className="relative group shrink-0">
              <div 
                className="absolute -inset-2.5 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none transform-gpu"
                style={{ backgroundColor: `${meta.borderColor}30` }}
              />

              <div 
                className="relative w-40 sm:w-44 aspect-[3/3.8] rounded-2xl overflow-hidden border-2 shadow-2xl shadow-black/90 bg-zinc-900 flex flex-col justify-end"
                style={{ borderColor: `${meta.borderColor}80` }}
              >
                <img 
                  src={meta.image} 
                  alt={`Capa ${meta.nome}`} 
                  className="absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[8.5px] font-bold text-amber-300">
                  Pílula {indiceNoModulo + 1}
                </div>

                {/* Degradê Inferior e Título DENTRO da Capa */}
                <div className="relative z-10 w-full p-2.5 pt-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent text-left">
                  <span 
                    className="inline-block px-1 py-0.2 rounded border text-[8.5px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ 
                      backgroundColor: `${meta.borderColor}30`, 
                      borderColor: `${meta.borderColor}50`,
                      color: '#FFFFFF'
                    }}
                  >
                    Módulo {modulo.folderIndex}
                  </span>
                  <h2 className="text-[13px] sm:text-sm font-bold text-zinc-100 leading-tight tracking-tight line-clamp-2 drop-shadow-md">
                    {topico.titulo}
                  </h2>
                </div>
              </div>
            </div>

            {/* Legenda Animada, Elegante e Certeira no Time */}
            <div className="w-full min-h-[125px] sm:min-h-[145px] px-5 py-4 rounded-2xl bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-black/95 border border-amber-500/30 backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              {/* Equalizador e Status de Sincronia */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-end gap-1 h-3.5">
                  <span className={`w-1 rounded-full bg-amber-400 transition-all ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-40'}`} />
                  <span className={`w-1 rounded-full bg-amber-400 transition-all ${isPlaying ? 'h-2 animate-pulse delay-75' : 'h-1 opacity-40'}`} />
                  <span className={`w-1 rounded-full bg-amber-400 transition-all ${isPlaying ? 'h-3 animate-pulse delay-150' : 'h-2 opacity-40'}`} />
                  <span className={`w-1 rounded-full bg-amber-400 transition-all ${isPlaying ? 'h-2.5 animate-pulse delay-100' : 'h-1.5 opacity-40'}`} />
                </div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400/90 font-sans">
                  {isPlaying ? 'Áudio Sincronizado ao Vivo' : 'Legenda Sincronizada'}
                </span>
              </div>

              {/* Texto com Animação e Efeito Karaoke */}
              <AnimatePresence mode="wait">
                {activeCue && currentWords.length > 0 ? (
                  <motion.div
                    key={activeCueIndex}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 select-text"
                  >
                    {currentWords.map((word, wIdx) => {
                      const isSpoken = wIdx <= activeWordIdx;
                      const isCurrent = wIdx === activeWordIdx && isPlaying;
                      return (
                        <span
                          key={wIdx}
                          className={`transition-all duration-150 text-base sm:text-lg leading-relaxed ${
                            isCurrent
                              ? 'text-amber-300 font-extrabold scale-105 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]'
                              : isSpoken
                              ? 'text-amber-200/95 font-semibold'
                              : 'text-zinc-400 font-normal opacity-70'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-zinc-400 text-xs sm:text-sm font-normal italic font-sans"
                  >
                    {isPlaying ? 'Acompanhe a legenda sincronizada ao áudio...' : 'Toque no Play para ouvir e acompanhar a legenda...'}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Barra de Progresso Fina da Frase no Rodapé do Card */}
              {activeCue && isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    style={{ width: `${Math.round(currentWordProgress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: FICHA EM PDF ORIGINAL (EM TELA TODA) ── */}
        {abaPainel === 'pdf' && (
          <div className="w-full max-w-xl mx-auto py-4 px-3">
            <div className="rounded-2xl bg-zinc-900/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-white font-sans">
                  Ficha Cornell Original em PDF
                </h3>
                <p className="text-[11.5px] text-zinc-400 mt-1 max-w-xs font-sans">
                  Leitor paginado oficial em formato livro com controles de zoom e tela cheia.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPdfAberto(true);
                }}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer font-sans"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Abrir Ficha Cornell em Tela Cheia</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── PLAYER DE ÁUDIO 100% FIXO NO RODAPÉ COM CONTROLES COMPLETOS (PADRÃO GOOGLE 48PX / APPLE HIG) ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/98 backdrop-blur-2xl border-t border-white/10 px-3 sm:px-6 pt-2 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl">
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
                if (cues.length > 0) {
                  const match = getActiveCueAtTime(val, cues);
                  if (match) {
                    setActiveCue(match.cue);
                    setActiveCueIndex(match.index);
                    setLegendaAtual(match.cue.text);
                  }
                }
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 touch-manipulation"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-0.5 leading-none">
              <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
              <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Botões do Player Fixo - Touch Target Google Material 3 (min 48x48) */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 mt-1.5 px-0.5">
            {/* Velocidade */}
            <button
              type="button"
              onClick={mudarVelocidade}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer touch-manipulation shrink-0 font-sans"
              title="Velocidade de reprodução"
            >
              {playbackRate}x
            </button>

            {/* Anterior */}
            <button
              type="button"
              disabled={indiceNoModulo === 0}
              onClick={() => navegarTopico(-1)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Faixa anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Retroceder 15s */}
            <button
              type="button"
              onClick={() => pular(-15)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Voltar 15s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Play / Pause Principal */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80 touch-manipulation shrink-0"
              title={isPlaying ? 'Pausar áudio' : 'Tocar áudio'}
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Avançar 15s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Próximo */}
            <button
              type="button"
              disabled={modulo ? indiceNoModulo === modulo.topicos.length - 1 : true}
              onClick={() => navegarTopico(1)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Próxima faixa"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={() => navigate(`/pilulas/materia/${meta.slug}?modulo=${modulo.id}`)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Fechar player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Leitor Oficial de PDF Paginated (Igual ao Livro no Próprio App) */}
      {pdfAberto && pdfUrlResolvida && (
        <PdfPaginatedReader
          url={pdfUrlResolvida}
          titulo={`Ficha Cornell: ${topico.titulo}`}
          capaUrl={meta.image}
          onClose={() => setPdfAberto(false)}
        />
      )}
    </div>
  );
}
