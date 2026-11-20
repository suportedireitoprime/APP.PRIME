import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  FileText, Subtitles, Scale, 
  ChevronLeft, ChevronRight, BookOpen, X, List,
  Bookmark, Loader2, Maximize2, AlertCircle
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import capaClassicosPadrao from '@/assets/capa-classicos-filosofos.webp';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
import classicosCatalogRaw from '@/data/pilulas/classicos-do-direito.json';
import { supabase } from '@/integrations/supabase/client';
import { getMateriaMeta } from './data/pilulasMateriasConfig';

interface TopicoItem {
  id: string;
  dbId: number;
  baseSlug: string;
  titulo: string;
  autor: string;
  audioUrl: string;
  srtUrl?: string;
  pdfUrl?: string;
  roteiroUrl?: string;
}

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

interface CornellRow {
  pergunta: string;
  resposta: string;
}

interface CornellData {
  rows: CornellRow[];
  resumoGuardaAssim: string;
  perguntaRapida: string;
  respostaRapida: string;
}

type PainelAba = 'tabela' | 'legenda' | 'pdf';

const CLASSICOS_SLUG_MAP: Record<string, number> = {
  'ihering': 133,
  'a-luta-pelo-direito': 133,
  'mill': 138,
  'sobre-a-liberdade': 138,
  'suntzu': 125,
  'a-arte-da-guerra': 125,
  'montesquieu': 130,
  'o-espirito-das-leis': 130,
  'sagan': 137,
  'o-mundo-assombrado-pelos-demonios': 137,
  'foucault': 145,
  'vigiar-e-punir': 145,
  'rousseau': 129,
  'o-contrato-social': 129,
  'beccaria': 123,
  'dos-delitos-e-das-penas': 123,
  'o-caso-dos-exploradores-de-cavernas': 121,
  'o-mundo-de-sofia': 149,
  '1984': 131,
  'o-principe': 140,
  'maquiavel': 140,
  'kelsen': 144,
  'teoria-pura-do-direito': 144,
  'platao': 139,
  'a-republica': 139,
};

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

function parseCornellFromText(rawText: string, fallbackSobre?: string): CornellData {
  const clean = (rawText || fallbackSobre || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!clean) {
    return {
      rows: [],
      resumoGuardaAssim: '',
      perguntaRapida: '',
      respostaRapida: ''
    };
  }

  let perguntaRapida = '';
  let respostaRapida = '';
  const matchPergunta = clean.match(/Pergunta r[áa]pida:\s*(.+?)(?:\s*Resposta:|\s*R:|$)([\s\S]*)$/i);
  if (matchPergunta) {
    perguntaRapida = matchPergunta[1].trim();
    respostaRapida = (matchPergunta[2] || '').trim();
  }

  let resumoGuardaAssim = '';
  const matchRecap = clean.match(/Recapitulando:\s*([\s\S]+?)(?=\n|Pergunta r[áa]pida:|$)/i);
  if (matchRecap) {
    resumoGuardaAssim = matchRecap[1].trim();
  }

  let mainBody = clean
    .replace(/Pergunta r[áa]pida:[\s\S]*$/i, '')
    .replace(/Recapitulando:[\s\S]*$/i, '')
    .trim();

  const rawParagraphs = mainBody
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 20 && !p.startsWith('Pílula de'));

  const cues = [
    'Qual o problema / reflexão inicial?',
    'Quem é o autor e qual a obra?',
    'Qual a tese central da obra?',
    'Qual é o dever do indivíduo?',
    'Quais os fundamentos morais e práticos?',
    'Por que o Direito é uma força viva?',
    'Exemplo prático do cotidiano',
    'Não confunda (Aviso importante)',
    'Conclusão e lição essencial'
  ];

  const rows: CornellRow[] = [];
  rawParagraphs.forEach((p, idx) => {
    let pergunta = cues[idx] || 'Ponto Chave / Conceito';
    const lower = p.toLowerCase();
    if (lower.includes('não confunda') || lower.includes('cuidado')) {
      pergunta = '⚠️ Não Confunda';
    } else if (lower.includes('pensa num') || lower.includes('imagine') || lower.includes('exemplo')) {
      pergunta = '💡 Exemplo Prático';
    } else if (lower.includes('o autor') || lower.includes('o livro é') || lower.includes('publicada em')) {
      pergunta = '📚 Contexto & Obra';
    } else if (lower.includes('a frase de abertura') || lower.includes('premissa central') || lower.includes('resume tudo')) {
      pergunta = '🎯 Tese Central';
    } else if (lower.includes('dois motivos') || lower.includes('fundamento') || lower.includes('motivo prático')) {
      pergunta = '⚖️ Fundamento Jurídico';
    } else if (lower.includes('o livro defende') || lower.includes('dever para consigo')) {
      pergunta = '🛡️ Dever Jurídico e Moral';
    } else if (lower.includes('teoria pura') || lower.includes('força viva')) {
      pergunta = '⚡ O Direito em Ação';
    }
    rows.push({ pergunta, resposta: p });
  });

  // Fallback se não conseguiu dividir em parágrafos de roteiro
  if (rows.length === 0 && fallbackSobre) {
    const sentences = fallbackSobre.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
    if (sentences.length > 0) {
      rows.push({ pergunta: '🎯 Tese Central', resposta: sentences.slice(0, 2).join(' ') });
    }
    if (sentences.length > 2) {
      rows.push({ pergunta: '⚖️ Fundamento Jurídico', resposta: sentences.slice(2, 4).join(' ') });
    }
    if (sentences.length > 4) {
      rows.push({ pergunta: '📚 Relevância Contemporânea', resposta: sentences.slice(4).join(' ') });
    }
    if (!resumoGuardaAssim) {
      resumoGuardaAssim = sentences[0] || 'Obra fundamental do pensamento jurídico universal.';
    }
    if (!perguntaRapida) {
      perguntaRapida = 'Qual é a principal lição desta obra clássica para o Direito?';
      respostaRapida = 'Compreender a evolução histórica das normas e agir na defesa ativa da ordem jurídica.';
    }
  }

  return { rows, resumoGuardaAssim, perguntaRapida, respostaRapida };
}

export default function PilulasPlayer() {
  const { slug, id: paramId } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();

  const id = paramId || slug || '';

  // Redireciona se for slug de matéria geral
  const materiaMeta = id ? getMateriaMeta(id) : null;
  useEffect(() => {
    if (materiaMeta) {
      if (materiaMeta.slug === 'direito-penal') {
        navigate('/pilulas/penal', { replace: true });
      } else {
        navigate(`/pilulas/materia/${materiaMeta.slug}`, { replace: true });
      }
    }
  }, [materiaMeta, navigate]);

  // Lista de tópicos de Clássicos do Direito
  const catalogList: TopicoItem[] = useMemo(() => {
    try {
      const cat = classicosCatalogRaw as Array<{ topicos: TopicoItem[] }>;
      return cat[0]?.topicos || [];
    } catch {
      return [];
    }
  }, []);

  // Localizar o índice e o tópico correspondente
  const { topico, indice } = useMemo(() => {
    if (!catalogList || catalogList.length === 0) {
      return { topico: null, indice: -1 };
    }

    const cleanId = String(id || '').trim().toLowerCase();
    const numericId = !isNaN(Number(cleanId)) ? Number(cleanId) : (CLASSICOS_SLUG_MAP[cleanId] ?? null);

    let idx = -1;
    if (numericId !== null) {
      idx = catalogList.findIndex(t => t.dbId === numericId);
    }
    if (idx === -1) {
      idx = catalogList.findIndex(t => t.id.toLowerCase() === cleanId || t.baseSlug?.toLowerCase() === cleanId);
    }
    if (idx === -1) {
      const termo = cleanId.replace(/-/g, ' ');
      idx = catalogList.findIndex(t => t.titulo.toLowerCase().includes(termo));
    }
    if (idx === -1) {
      idx = 0;
    }

    return { topico: catalogList[idx] || null, indice: idx };
  }, [catalogList, id]);

  // Metadados complementares do Supabase (Capa real, Sobre, Download PDF original)
  const [dbMeta, setDbMeta] = useState<{
    capa: string;
    sobre: string;
    downloadPdf: string;
    fichaCornellPdf: string;
  } | null>(null);

  // Estados de Roteiro e Ficha Cornell
  const [cornellData, setCornellData] = useState<CornellData>({
    rows: [],
    resumoGuardaAssim: '',
    perguntaRapida: '',
    respostaRapida: ''
  });

  // Audio & Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [legendaAtual, setLegendaAtual] = useState('');
  const [activeCue, setActiveCue] = useState<SrtCue | null>(null);
  const [activeCueIndex, setActiveCueIndex] = useState<number>(-1);
  const [pdfAberto, setPdfAberto] = useState(false);

  // Menu de Alternância (Tabela Cornell sem margem, Legenda com Capa, PDF)
  const [abaPainel, setAbaPainel] = useState<PainelAba>('tabela');

  // Favoritos
  const [isFavorito, setIsFavorito] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Marcar como ouvido no localStorage
  const marcarComoOuvido = useCallback((bookId: string) => {
    try {
      const raw = localStorage.getItem('pilulas_classicos_concluidos');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(bookId)) {
        list.push(bookId);
        localStorage.setItem('pilulas_classicos_concluidos', JSON.stringify(list));
      }
    } catch {}
  }, []);

  // Registrar em recentes
  const registrarRecente = useCallback((bookId: string) => {
    try {
      const raw = localStorage.getItem('pilulas_classicos_recentes');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [bookId, ...list.filter(x => x !== bookId)].slice(0, 30);
      localStorage.setItem('pilulas_classicos_recentes', JSON.stringify(updated));
    } catch {}
  }, []);

  // Checar se é favorito
  useEffect(() => {
    if (!topico) return;
    try {
      const raw = localStorage.getItem('pilulas_classicos_favoritos');
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorito(list.includes(topico.id) || list.includes(String(topico.dbId)));
    } catch {}
  }, [topico?.id, topico?.dbId]);

  const toggleFavorito = useCallback(() => {
    if (!topico) return;
    haptic.selection();
    setIsFavorito(prev => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('pilulas_classicos_favoritos');
        let list: string[] = raw ? JSON.parse(raw) : [];
        const key = topico.id;
        if (next) {
          if (!list.includes(key)) list.push(key);
        } else {
          list = list.filter(x => x !== key && x !== String(topico.dbId));
        }
        localStorage.setItem('pilulas_classicos_favoritos', JSON.stringify(list));
      } catch {}
      return next;
    });
  }, [topico]);

  // Carregar dados adicionais do banco (Capa, Sobre, PDFs)
  useEffect(() => {
    if (!topico) return;
    let isMounted = true;

    async function carregarMetadados() {
      try {
        const { data, error } = await supabase
          .from('biblioteca_classicos')
          .select('id, imagem, sobre, download, curiosidades')
          .eq('id', topico.dbId)
          .maybeSingle();

        if (!error && data && isMounted) {
          const curiosidades = data.curiosidades as any;
          setDbMeta({
            capa: data.imagem || '',
            sobre: data.sobre || '',
            downloadPdf: data.download || '',
            fichaCornellPdf: curiosidades?.ficha_cornell_pdf || ''
          });
        }
      } catch (e) {
        console.warn('Erro ao carregar metadados da obra:', e);
      }
    }

    carregarMetadados();
    return () => { isMounted = false; };
  }, [topico?.dbId]);

  // Carregar e processar o roteiro em Ficha Cornell estruturada
  useEffect(() => {
    if (!topico) return;
    let isMounted = true;

    async function carregarRoteiro() {
      const roteiroUrl = topico.roteiroUrl;
      if (roteiroUrl) {
        try {
          const res = await fetch(roteiroUrl);
          if (res.ok) {
            const txt = await res.text();
            if (isMounted) {
              setCornellData(parseCornellFromText(txt, dbMeta?.sobre));
              return;
            }
          }
        } catch {}
      }

      // Fallback para `sobre` do livro
      if (isMounted) {
        setCornellData(parseCornellFromText('', dbMeta?.sobre));
      }
    }

    carregarRoteiro();
    return () => { isMounted = false; };
  }, [topico?.roteiroUrl, dbMeta?.sobre]);

  // Inicializar o áudio e carregar SRT ao trocar de tópico
  useEffect(() => {
    if (!topico) return;

    setIsPlaying(false);
    setIsLoading(true);
    setCurrentTime(0);
    setCues([]);
    setLegendaAtual('');
    setActiveCue(null);
    setActiveCueIndex(-1);

    registrarRecente(topico.id);

    const audioSrc = topico.audioUrl;

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
    const srtSrc = topico.srtUrl;
    if (srtSrc) {
      fetch(srtSrc)
        .then(r => r.ok ? r.text() : '')
        .then(txt => {
          if (txt) setCues(parseSRT(txt));
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

  // Atualização de tempo e legendas sincronizadas (fallback para scrubbing/seek)
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    if (cur > 20 && topico) {
      marcarComoOuvido(topico.id);
    }

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
  }, [cues, topico, marcarComoOuvido]);

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
    haptic.selection();
    const novoIdx = indice + delta;
    if (novoIdx >= 0 && novoIdx < catalogList.length) {
      navigate(`/pilulas/${catalogList[novoIdx].id}`);
    }
  };

  const capaFinal = dbMeta?.capa || capaClassicosPadrao;
  const pdfUrlResolvida = topico?.pdfUrl || dbMeta?.fichaCornellPdf || dbMeta?.downloadPdf || '';

  if (!topico) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-14 h-14 text-amber-500/80 mb-4" />
        <h2 className="text-xl font-bold mb-2">Pílula não encontrada</h2>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          O conteúdo solicitado não foi localizado no acervo de clássicos.
        </p>
        <button
          onClick={() => navigate('/pilulas/classicos')}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          Voltar para Clássicos
        </button>
      </div>
    );
  }

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-[115px] sm:pb-[125px] text-white relative flex flex-col justify-between overflow-x-hidden select-none">
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
        }}
      />

      {/* Header Superior Fixo Compacto com Voltar e Ações */}
      <header className="relative z-20 w-full px-3 sm:px-6 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-2 flex items-center justify-between gap-2.5 border-b border-white/5">
        <button
          onClick={() => {
            haptic.light();
            navigate('/pilulas/classicos');
          }}
          aria-label="Voltar para Lista de Clássicos"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
        </button>

        <div className="text-center px-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-amber-400/90 truncate font-sans">
            Clássicos do Direito • {topico.autor}
          </p>
          <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate font-sans mt-0.5">
            Obra {indice + 1} de {catalogList.length} • {topico.titulo}
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
              navigate('/pilulas/classicos');
            }}
            aria-label="Ver todas as obras"
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
        
        {/* ── ABA 1: TABELA CORNELL (ONDE TEM A PERGUNTA E AO LADO A RESPOSTA, SEM MARGEM LATERAL) ── */}
        {abaPainel === 'tabela' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col px-0 select-text">
            {/* Header da Ficha */}
            <div className="px-3 sm:px-6 py-3 border-b border-amber-500/20 bg-zinc-900/70 backdrop-blur-md flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold font-sans">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/10">
                    Método Cornell
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-600/30 text-red-300 border border-red-500/30">
                    Clássicos do Direito
                  </span>
                  <span className="text-zinc-400 font-medium">
                    • Obra #{indice + 1} de {catalogList.length}
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
                  {cornellData.rows.length > 0 ? (
                    cornellData.rows.map((linha, idx) => (
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
            {(cornellData.resumoGuardaAssim || cornellData.perguntaRapida) && (
              <div className="w-full p-3.5 sm:p-5 bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-red-950/20 border-b border-amber-500/30">
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
                className="absolute -inset-2.5 rounded-3xl bg-amber-600/20 blur-lg opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none transform-gpu"
              />

              <div className="relative w-40 sm:w-44 aspect-[3/3.8] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-black/90 bg-zinc-900 flex flex-col justify-end">
                <img 
                  src={capaFinal} 
                  alt={topico.titulo} 
                  className="absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[8.5px] font-bold text-amber-300">
                  Obra {indice + 1}
                </div>

                {/* Degradê Inferior e Título DENTRO da Capa */}
                <div className="relative z-10 w-full p-2.5 pt-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent text-left">
                  <span className="inline-block px-1 py-0.2 rounded bg-amber-600/30 border border-amber-500/40 text-amber-300 text-[8.5px] font-bold uppercase tracking-wider mb-0.5">
                    Clássicos do Direito
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
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400/90">
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
                    className="text-zinc-400 text-xs sm:text-sm font-normal italic"
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
                <h3 className="text-sm sm:text-base font-black text-white">
                  Obra / Ficha Cornell em PDF
                </h3>
                <p className="text-[11.5px] text-zinc-400 mt-1 max-w-xs">
                  Leitor paginado oficial em formato livro com controles de zoom e tela cheia.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPdfAberto(true);
                }}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Abrir Obra Completa em PDF</span>
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Velocidade de reprodução"
            >
              {playbackRate}x
            </button>

            {/* Anterior */}
            <button
              type="button"
              disabled={indice === 0}
              onClick={() => navegarTopico(-1)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Obra anterior"
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
              disabled={indice === catalogList.length - 1}
              onClick={() => navegarTopico(1)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-95 cursor-pointer touch-manipulation shrink-0"
              title="Próxima obra"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={() => navigate('/pilulas/classicos')}
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
          capaUrl={capaFinal}
          onClose={() => setPdfAberto(false)}
        />
      )}
    </div>
  );
}
