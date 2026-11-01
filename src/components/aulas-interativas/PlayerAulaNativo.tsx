import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Play, Pause, Check, CheckCircle2, 
  RotateCcw, Sparkles, BookOpen, Volume2, VolumeX,
  ChevronRight, ChevronLeft, Award, HelpCircle, XCircle,
  Clock, GitBranch, Link2, CheckSquare, LayoutGrid, X,
  Highlighter
} from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AulaData, SlideItem } from '@/types/aulaInterativa';
import { loadAulaData, formatNarracaoParaHtml } from '@/utils/aulaDataLoader';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { getLocalAulaProgress, saveLocalAulaProgress } from '@/lib/aprenderProgressoStorage';

interface PlayerAulaNativoProps {
  aula: AulaItem;
  disciplinaNome: string;
  corDestaque: string;
  onVoltar: () => void;
  onConcluir: (totalEtapas: number) => void;
  onProgresso?: (etapaAtual: number, totalEtapas: number) => void;
}

function highlightFraseInHtml(html: string, frase: string): string {
  if (!frase || frase.trim().length < 4) return html;

  const cleanFrase = frase.trim();
  const escaped = cleanFrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                            .replace(/\s+/g, '\\s+');

  try {
    const reg = new RegExp(`(${escaped})`, 'i');
    if (reg.test(html)) {
      return html.replace(reg, '<mark class="karaoke-grifo">$1</mark>');
    }
  } catch {}

  // Testar sem o ponto final ou pontuação terminal (que muitas vezes fica adjacente a tags HTML)
  const semPonto = cleanFrase.replace(/[.!?]+$/, '').trim();
  if (semPonto.length >= 4) {
    const escapedSemPonto = semPonto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    try {
      const reg = new RegExp(`(${escapedSemPonto})`, 'i');
      if (reg.test(html)) {
        return html.replace(reg, '<mark class="karaoke-grifo">$1</mark>');
      }
    } catch {}
  }

  // Match flexível: aceita tags HTML internas como <b>, <span>, <i> e pontuação adjacente
  try {
    const tokens = (semPonto || cleanFrase).match(/[\w\u00C0-\u017F]+|[^\s\w\u00C0-\u017F]+/g) || [];
    if (tokens.length >= 2) {
      const pattern = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:<[^>]+>|\\s)*');
      const regFlex = new RegExp(`(${pattern})`, 'i');
      if (regFlex.test(html)) {
        return html.replace(regFlex, '<mark class="karaoke-grifo">$1</mark>');
      }
    }
  } catch {}

  return html;
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
  const [velocidade, setVelocidade] = useState<number>(1);
  const [karaIdx, setKaraIdx] = useState(-1);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modalGrifoAberto, setModalGrifoAberto] = useState(false);
  const [grifoAulaAtivo, setGrifoAulaAtivo] = useState(true);
  const [grifoGlobalAtivo, setGrifoGlobalAtivo] = useState(() => {
    try {
      return localStorage.getItem('aulas_grifo_global_desativado') !== 'true';
    } catch {
      return true;
    }
  });

  // O grifo está ativo se não foi desativado globalmente nem nesta aula
  const grifoAtivo = grifoGlobalAtivo && grifoAulaAtivo;

  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [respostaConfirmada, setRespostaConfirmada] = useState(false);
  const [flashcardVirado, setFlashcardVirado] = useState(false);
  const [vfRespostas, setVfRespostas] = useState<Record<number, boolean | null>>({});
  const [cartasReveladas, setCartasReveladas] = useState<Record<number, boolean>>({});
  const [pontoAtivo, setPontoAtivo] = useState<number>(0);
  const [parSelecionadoL, setParSelecionadoL] = useState<number | null>(null);
  const [paresConectados, setParesConectados] = useState<Record<number, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
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

  // Carregar dados da aula e restaurar ponto de parada
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setIdx(0);
    setTocando(false);

    loadAulaData(aula).then(async (data) => {
      if (ativo) {
        setAulaData(data);
        setCarregando(false);

        // Restaurar onde parou (IndexedDB + Supabase)
        try {
          const salvo = await getLocalAulaProgress(aula.id);
          if (salvo && salvo.currentIdx > 0 && salvo.currentIdx < (data.slides?.length || 1) && !salvo.concluida) {
            setIdx(salvo.currentIdx);
          }
        } catch (e) {
          console.warn('Erro ao restaurar progresso da aula:', e);
        }
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
  const isQuestao = slideAtual?.tipo === 'Questão' || slideAtual?.tipo === 'Questão de banca' || Boolean(slideAtual?.opcoes);
  const isFlashcard = slideAtual?.tipo === 'Flashcard';
  const isInterativo = Boolean(
    isQuestao || 
    isFlashcard || 
    slideAtual?.tipo === 'Karaokê' || 
    slideAtual?.tipo === 'Ligar termos' || 
    slideAtual?.tipo === 'Verdadeiro ou falso' || 
    slideAtual?.tipo === 'Completar' || 
    slideAtual?.tipo === 'Desafio' ||
    slideAtual?.tipo === 'Explorar' ||
    slideAtual?.tipo === 'Toque e revele' ||
    Boolean(slideAtual?.frases && slideAtual.frases.length > 0)
  );

  // URL do áudio da etapa atual (se houver gravação no R2)
  const currentAudioSrc = useMemo(() => {
    if (slideAtual?.audioUrl && slideAtual.audioUrl.startsWith('http')) {
      return slideAtual.audioUrl;
    }
    const baseFolder = (aulaData?.urlJsonR2 || aula.urlJsonR2 || aulaData?.urlHtmlR2 || aula.urlHtmlR2 || '')
      .replace(/\/(?:aula\.json|aula\.html).*$/, '');

    if (slideAtual?.audio && baseFolder) {
      if (slideAtual.audio.startsWith('http')) return slideAtual.audio;
      return `${baseFolder}/${slideAtual.audio}`;
    }
    if (!aulaData?.audioBaseUrl) {
      return baseFolder ? `${baseFolder}/assets/audio/s${String(idx + 1).padStart(2, '0')}.mp3` : null;
    }
    return `${aulaData.audioBaseUrl}${String(idx + 1).padStart(2, '0')}.mp3`;
  }, [slideAtual?.audioUrl, slideAtual?.audio, aulaData?.audioBaseUrl, aulaData?.urlJsonR2, aulaData?.urlHtmlR2, aula.urlJsonR2, aula.urlHtmlR2, idx]);

  // URL da imagem cinematográfica da etapa atual
  const imagemUrl = useMemo(() => {
    if (slideAtual?.imgUrl && slideAtual.imgUrl.startsWith('http')) {
      return slideAtual.imgUrl;
    }
    const baseFolder = (aulaData?.urlJsonR2 || aula.urlJsonR2 || aulaData?.urlHtmlR2 || aula.urlHtmlR2 || '')
      .replace(/\/(?:aula\.json|aula\.html).*$/, '');

    if (slideAtual?.imgUrl && baseFolder) {
      if (slideAtual.imgUrl.startsWith('assets/')) {
        return `${baseFolder}/${slideAtual.imgUrl}`;
      }
      if (slideAtual.imgUrl.startsWith('http')) {
        return slideAtual.imgUrl;
      }
    }
    if (slideAtual?.img && baseFolder) {
      if (slideAtual.img === 'capa') {
        return aula.capaUrl || `${baseFolder}/assets/img/capa.webp`;
      }
      const cleanImg = slideAtual.img.replace(/\.(?:webp|jpg|png)$/, '');
      return `${baseFolder}/assets/img/${cleanImg}.webp`;
    }
    if (aulaData?.imagens && slideAtual?.img && aulaData.imagens[slideAtual.img]) {
      return aulaData.imagens[slideAtual.img];
    }
    return aula.capaUrl;
  }, [slideAtual?.imgUrl, slideAtual?.img, aulaData?.urlJsonR2, aulaData?.urlHtmlR2, aulaData?.imagens, aula.urlJsonR2, aula.urlHtmlR2, aula.capaUrl]);

  // Informar progresso ao componente pai sem disparar loops de re-render
  const onProgressoRef = useRef(onProgresso);
  useEffect(() => {
    onProgressoRef.current = onProgresso;
  }, [onProgresso]);

  useEffect(() => {
    if (onProgressoRef.current && total > 0) {
      onProgressoRef.current(idx + 1, total);
    }
  }, [idx, total]);

  // Sentenças da narração para sincronizar o karaokê
  const frasesNarr = useMemo(() => {
    if (slideAtual?.frases && slideAtual.frases.length > 0) {
      return slideAtual.frases;
    }
    const text = slideAtual?.narr || '';
    if (!text) return [];
    const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
    return matches && matches.length > 0 ? matches.map(s => s.trim()) : [text.trim()];
  }, [slideAtual?.narr, slideAtual?.frases]);

  // Faixas temporais ponderadas proporcionalmente ao tamanho e pausas reais da fala
  const faixasKaraoke = useMemo(() => {
    if (!frasesNarr || frasesNarr.length === 0) return [];
    
    // Cada frase consome tempo ponderado por caracteres e pausas naturais
    const pesos = frasesNarr.map(f => {
      const clean = f.trim();
      const baseChars = Math.max(6, clean.length);
      const pontuacaoFinal = /[.!?]$/.test(clean) ? 5 : 2;
      const virgulas = (clean.match(/[,;]/g) || []).length * 2;
      const doisPontos = (clean.match(/[:]/g) || []).length * 3;
      return baseChars + pontuacaoFinal + virgulas + doisPontos;
    });

    const totalPeso = pesos.reduce((acc, p) => acc + p, 0);
    const ranges: { start: number; end: number }[] = [];
    let acumulado = 0;

    for (let i = 0; i < frasesNarr.length; i++) {
      const startRatio = acumulado / totalPeso;
      acumulado += pesos[i];
      const endRatio = acumulado / totalPeso;
      ranges.push({ start: startRatio, end: endRatio });
    }

    return ranges;
  }, [frasesNarr]);

  // HTML com o Grifo Leve e Elegante por cima na frase ativa (respeita a chavinha de ativar/desativar)
  const htmlComGrifo = useMemo(() => {
    let rawHtml = slideAtual?.corpo || '';
    if (!rawHtml.trim() && (slideAtual?.narr || slideAtual?.intro)) {
      rawHtml = formatNarracaoParaHtml(slideAtual?.narr || slideAtual?.intro || '', slideAtual?.titulo);
    }
    if (!rawHtml.trim()) return '';

    // Eliminar tags de marcas d'água quebradas/relativas que causam risco vertical na tela
    rawHtml = rawHtml.replace(/<img[^>]*class=["'][^"']*wm[^"']*["'][^>]*>/gi, '');

    if (!grifoAtivo || !tocando || karaIdx < 0 || !frasesNarr[karaIdx]) {
      return rawHtml;
    }
    return highlightFraseInHtml(rawHtml, frasesNarr[karaIdx]);
  }, [slideAtual?.corpo, slideAtual?.narr, slideAtual?.intro, slideAtual?.titulo, grifoAtivo, tocando, karaIdx, frasesNarr]);

  // Verifica se o título do slide deve receber o grifo inicial quando a narração começa nele
  const isTituloAtivo = useMemo(() => {
    if (!grifoAtivo || !tocando || karaIdx < 0 || !frasesNarr[karaIdx] || !slideAtual?.titulo) return false;
    const fNorm = frasesNarr[karaIdx].toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñ0-9]/g, ' ').trim();
    const tNorm = slideAtual.titulo.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñ0-9]/g, ' ').trim();
    return fNorm.length > 3 && (fNorm.includes(tNorm) || tNorm.includes(fNorm));
  }, [grifoAtivo, tocando, karaIdx, frasesNarr, slideAtual?.titulo]);

  // Formatação inteligente do Kicker para eliminar redundâncias visuais
  const kickerFormatado = useMemo(() => {
    if (!slideAtual) return '';
    const raw = (slideAtual.kicker || '').trim();
    if (!raw || raw.toLowerCase() === 'conteúdo' || raw.toLowerCase() === 'conteudo') {
      if (isQuestao) return 'Fixação Ativa';
      if (isFlashcard) return 'Memorização Ativa';
      if (slideAtual.bloco) return `Bloco ${slideAtual.bloco}`;
      return `Etapa ${idx + 1} de ${total}`;
    }

    if (isQuestao) {
      const temaSub = raw.replace(/^QUESTÃO\s*\d*\s*·\s*/i, '').trim();
      return temaSub && !/^QUESTÃO/i.test(temaSub) 
        ? `Fixação Ativa · ${temaSub}`
        : 'Fixação Ativa';
    }

    if (isFlashcard) {
      const temaSub = raw.replace(/^FLASHCARD\s*\d*\s*·\s*/i, '').trim();
      return temaSub && !/^FLASHCARD/i.test(temaSub)
        ? `Memorização Ativa · ${temaSub}`
        : 'Memorização Ativa';
    }

    return raw;
  }, [slideAtual, isQuestao, isFlashcard, idx, total]);

  // Verificar se o H1 é redundante com o kicker (ex: 'Questão 1' ou 'Flashcard 1')
  const isTituloRedundante = useMemo(() => {
    if (!slideAtual?.titulo) return false;
    const t = slideAtual.titulo.trim();
    if (isQuestao && /^Questão\s*\d*$/i.test(t)) return true;
    if (isFlashcard && /^Flashcard\s*\d*$/i.test(t)) return true;
    return false;
  }, [slideAtual?.titulo, isQuestao, isFlashcard]);

  // Resetar estados ao mudar de etapa e iniciar autoplay contínuo
  useEffect(() => {
    setTempoAtual(0);
    setDuracao(0);
    setKaraIdx(-1);
    setRespostaSelecionada(null);
    setRespostaConfirmada(false);
    setFlashcardVirado(false);
    setVfRespostas({});
    setCartasReveladas({});
    setPontoAtivo(0);
    setParSelecionadoL(null);
    setParesConectados({});

    // SEMPRE rolar para o topo absoluto do conteúdo ao passar a página
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    // Se temos áudio MP3 gravado no R2
    if (currentAudioSrc && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentAudioSrc;
      audioRef.current.load();
      audioRef.current.playbackRate = velocidade;
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
      utter.rate = 1.05 * velocidade;
      utter.onstart = () => setTocando(true);
      utter.onend = () => {
        setTocando(false);
        // Autoplay contínuo: avançar automaticamente apenas em conteúdo puro
        if (!isInterativo && idx < total - 1) {
          setIdx(prev => prev + 1);
        }
      };
      utter.onerror = () => setTocando(false);
      window.speechSynthesis.speak(utter);
    }
  }, [idx, currentAudioSrc, slideAtual?.narr, total, isInterativo, velocidade]);

  // Sincronização em Nuvem (Supabase) e Persistência Local (IndexedDB)
  useEffect(() => {
    if (!aulaData || total <= 0) return;
    const isConcluida = idx === total - 1;
    saveLocalAulaProgress(aula.id, idx, total, isConcluida);

    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('aprender_progresso_aula').upsert({
            user_id: user.id,
            aula_id: aula.id,
            blocos_concluidos: idx + 1,
            total_perguntas: total,
            tempo_ms: 0,
            concluida_em: isConcluida ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,aula_id' });
        }
      } catch (err) {
        // Silencioso se offline
      }
    })();
  }, [idx, total, aula.id, aulaData]);

  // Preload da próxima etapa (Imagem + Áudio) para Latência 0ms
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const proxIdx = idx + 1;
    if (proxIdx < total) {
      const proxSlide = slides[proxIdx];
      // Preload da imagem
      const proxImg = proxSlide?.imgUrl || (aulaData?.imagens && proxSlide?.img ? aulaData.imagens[proxSlide.img] : null);
      if (proxImg) {
        const img = new Image();
        img.src = proxImg;
      }
      // Preload do áudio
      if (aulaData?.audioBaseUrl) {
        const proxAudioUrl = `${aulaData.audioBaseUrl}${String(proxIdx + 1).padStart(2, '0')}.mp3`;
        const a = new Audio();
        a.preload = 'auto';
        a.src = proxAudioUrl;
      }
    }
  }, [idx, slides, total, aulaData?.audioBaseUrl, aulaData?.imagens]);

  // Alternar velocidade de reprodução da narração (1.0x, 1.25x, 1.5x, 2.0x)
  const velocidades = [1, 1.25, 1.5, 2];
  const alternarVelocidade = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.selection();
    const nextIdx = (velocidades.indexOf(velocidade) + 1) % velocidades.length;
    const novaVel = velocidades[nextIdx];
    setVelocidade(novaVel);
    if (audioRef.current) {
      audioRef.current.playbackRate = novaVel;
    }
  };

  // Alternar estado do Grifo da Narração (Ligar direto ou abrir modal com 2 opções de desativação)
  const handleToggleGrifoClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (grifoAtivo) {
      haptic.light();
      setModalGrifoAberto(true);
    } else {
      haptic.selection();
      setGrifoAulaAtivo(true);
      setGrifoGlobalAtivo(true);
      try {
        localStorage.removeItem('aulas_grifo_global_desativado');
      } catch {}
    }
  };

  // Metadados do áudio: define a duração exata assim que o arquivo é reconhecido
  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuracao(audioRef.current.duration);
    }
  };

  // Sincronização do Karaokê em tempo real com compensação de timing precisa
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setTempoAtual(cur);

    const realDur = (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0)
      ? audioRef.current.duration
      : duracao;

    if (realDur > 0 && realDur !== duracao) {
      setDuracao(realDur);
    }

    if (faixasKaraoke.length > 0 && realDur > 0) {
      // Offset de antecipação fino: +0.08s para sincronia perceptual perfeita com o início da fala
      const pos = Math.max(0, (cur + 0.08) / realDur);
      const foundIdx = faixasKaraoke.findIndex(r => pos >= r.start && pos < r.end);
      if (foundIdx !== -1) {
        setKaraIdx(foundIdx);
      } else if (pos >= 1) {
        setKaraIdx(faixasKaraoke.length - 1);
      }
    }
  };

  const handleAudioEnded = () => {
    setTocando(false);
    // Em etapas interativas (Flashcards, Questões, Karaokê, etc.), JAMAIS avança sozinho!
    // O aluno decide quando quer avançar clicando em "Próximo".
    if (!isInterativo && idx < total - 1) {
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
      haptic.light();
      setIdx(prev => prev + 1);
    } else {
      haptic.success();
      onConcluir(total);
    }
  };

  const voltarEtapa = () => {
    if (idx > 0) {
      haptic.light();
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

  const isUltimaEtapa = idx === total - 1;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col w-screen h-screen text-white select-none overflow-hidden"
      style={{ backgroundColor: tema.bg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Estilos CSS da Tipografia Padrão do HTML e Grifo Leve */}
      <style>{`
        @keyframes imgZoomInSlow {
          0% {
            transform: scale(1.15);
            opacity: 0.88;
          }
          100% {
            transform: scale(1.0);
            opacity: 1;
          }
        }
        .img-zoom-in {
          animation: imgZoomInSlow 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes pageTurnSmooth {
          0% {
            opacity: 0;
            transform: translateX(20px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1.0);
          }
        }
        .animate-page-turn {
          animation: pageTurnSmooth 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        .aula-html-tipografia {
          font-family: "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: #f8edef;
          font-size: 16.5px;
          line-height: 1.62;
        }
        .aula-html-tipografia p {
          font-size: 16.5px;
          line-height: 1.62;
          margin: 0 0 14px;
          color: #f8edef;
        }
        .aula-html-tipografia p.lead {
          font-size: 17.5px;
          color: #fdf3f4;
          line-height: 1.65;
          font-weight: 400;
        }
        .aula-html-tipografia b, 
        .aula-html-tipografia strong {
          color: #e9cd6d;
          font-weight: 700;
        }
        .aula-html-tipografia p b,
        .aula-html-tipografia ul.tight li b,
        .aula-html-tipografia .box p b,
        .aula-html-tipografia .fimbloco li b {
          color: #e9cd6d;
          font-weight: 700;
        }
        .aula-html-tipografia .term {
          color: ${tema.destaque};
          font-weight: 700;
        }
        .aula-html-tipografia h1,
        .aula-html-tipografia .covertitle {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 28px;
          line-height: 1.15;
          margin: 6px 0 6px;
          font-weight: 800;
          color: #ffffff;
        }
        .aula-html-tipografia h2 {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 25px;
          line-height: 1.22;
          margin: 0 0 12px;
          font-weight: 700;
          color: #ffffff;
        }
        .aula-html-tipografia h3 {
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 700;
          color: #ffffff;
        }
        .aula-html-tipografia .kicker {
          color: ${tema.destaque};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          margin: 0 0 6px;
        }
        .aula-html-tipografia .kicker::before {
          content: "◆";
          font-size: 8px;
          vertical-align: 2px;
          margin-right: 7px;
          color: #d4af37;
        }
        .aula-html-tipografia .coverrule {
          height: 3px;
          width: 72px;
          border-radius: 99px;
          margin: 12px 0 16px;
          background: linear-gradient(90deg, ${tema.destaque}, #d4af37);
        }
        .aula-html-tipografia .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 14px 0 8px;
        }
        .aula-html-tipografia .chip {
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: #e9cd6d;
          border-radius: 99px;
          padding: 6px 14px;
          font-size: 13.5px;
          font-weight: 600;
          background: rgba(212, 175, 55, 0.08);
        }
        .aula-html-tipografia .viarow {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #250d14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 13px 14px;
          margin: 12px 0;
        }
        .aula-html-tipografia .viarow h3 {
          margin: 2px 0 3px;
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
        }
        .aula-html-tipografia .viarow p {
          margin: 0;
          font-size: 15px;
          color: #c9a7ad;
          line-height: 1.5;
        }
        .aula-html-tipografia .vianum {
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid ${tema.destaque};
          color: ${tema.destaque};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 700;
          font-size: 16px;
        }
        .aula-html-tipografia .box {
          background: #2e1219;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 14px 0;
        }
        .aula-html-tipografia .box .blabel {
          color: ${tema.destaque};
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 1.8px;
          margin: 0 0 6px;
          text-transform: uppercase;
        }
        .aula-html-tipografia .box p {
          margin: 0;
          font-size: 15.5px;
          color: #f8edef;
        }
        .aula-html-tipografia .box p + p {
          margin-top: 8px;
        }
        .aula-html-tipografia .box.exemplo {
          position: relative;
          overflow: hidden;
        }
        .aula-html-tipografia .box.exemplo .wm,
        .aula-html-tipografia .wm,
        .aula-html-tipografia img.wm {
          display: none !important;
        }
        .aula-html-tipografia .box.exemplo .wm_disabled {
          position: absolute;
          top: 0;
          right: 0;
          width: 74%;
          height: 100%;
          object-fit: cover;
          opacity: 0.15;
          mix-blend-mode: screen;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(to left, #000 40%, transparent 96%);
          mask-image: linear-gradient(to left, #000 40%, transparent 96%);
        }
        .aula-html-tipografia .box.exemplo .excontent {
          position: relative;
          z-index: 1;
        }
        .aula-html-tipografia .frasechave {
          background: linear-gradient(160deg, rgba(226, 62, 87, 0.17), rgba(226, 62, 87, 0.05));
          border: 1px solid rgba(226, 62, 87, 0.45);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 16px 0;
        }
        .aula-html-tipografia .frasechave .flabel {
          color: ${tema.destaque};
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 1.8px;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
        }
        .aula-html-tipografia .frasechave p.fq2 {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 19px;
          line-height: 1.45;
          margin: 0;
          color: #fdf3f4;
        }
        .aula-html-tipografia .fimbloco {
          background: #2e1219;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 16px 0 4px;
        }
        .aula-html-tipografia .fimbloco .flabel {
          color: #e9cd6d;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 1.8px;
          margin: 0 0 8px;
          display: flex;
          align-items: center;
          text-transform: uppercase;
        }
        .aula-html-tipografia .fimbloco ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .aula-html-tipografia .fimbloco li {
          position: relative;
          font-size: 15.5px;
          line-height: 1.5;
          padding: 5px 0 5px 22px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          color: #f8edef;
        }
        .aula-html-tipografia .fimbloco li:last-child {
          border-bottom: none;
        }
        .aula-html-tipografia .fimbloco li::before {
          content: "◆";
          position: absolute;
          left: 2px;
          top: 8px;
          font-size: 8px;
          color: #d4af37;
        }
        .aula-html-tipografia .vazada {
          position: relative;
          height: 140px;
          border-radius: 14px;
          overflow: hidden;
          margin: 16px 0;
          border: 1px solid rgba(212, 175, 55, 0.2);
          background: #250d14;
        }
        .aula-html-tipografia .vazada img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 40%;
          opacity: 0.45;
          display: block;
        }
        .aula-html-tipografia .vazada::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(29, 8, 16, 0.72), rgba(29, 8, 16, 0) 38%, rgba(29, 8, 16, 0) 62%, rgba(29, 8, 16, 0.72));
        }
        .aula-html-tipografia ul.tight {
          list-style: none;
          margin: 4px 0 14px;
          padding: 0;
        }
        .aula-html-tipografia ul.tight li {
          position: relative;
          font-size: 16.5px;
          line-height: 1.55;
          padding: 7px 0 7px 24px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.07);
          color: #f8edef;
        }
        .aula-html-tipografia ul.tight li:last-child {
          border-bottom: none;
        }
        .aula-html-tipografia ul.tight li::before {
          content: "◆";
          position: absolute;
          left: 2px;
          top: 10px;
          font-size: 8px;
          color: #d4af37;
        }
        .aula-html-tipografia mark.karaoke-grifo,
        h1 mark.karaoke-grifo {
          background-color: rgba(253, 224, 71, 0.12) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          box-decoration-break: slice !important;
          -webkit-box-decoration-break: slice !important;
          outline: 1px solid rgba(250, 204, 21, 0.3) !important;
          outline-offset: 1px !important;
          box-shadow: none !important;
          transition: background-color 0.25s ease-out, outline-color 0.25s ease-out !important;
        }

        /* Animação Cinematográfica de Flip 3D para Flashcards */
        .flip-perspective {
          perspective: 1200px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.34, 1.45, 0.64, 1);
        }
        .flip-card-inner.is-flipped {
          transform: rotateY(180deg);
        }
        .flip-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-face-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Elemento de áudio oculto com captura imediata de metadados e duração real */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => setTocando(false)}
        preload="auto"
      />

      {/* HEADER SUPERIOR NATIVO DINÂMICO (COMPACTO EM QUESTÕES/FLASHCARDS PARA MÁXIMO ESPAÇO) */}
      <header 
        className={`flex items-center justify-between px-3 sm:px-6 border-b shrink-0 z-30 backdrop-blur-md shadow-lg shadow-black/60 transition-all ${
          isQuestao || isFlashcard ? 'py-2 sm:py-2.5' : 'py-3 sm:py-3.5'
        }`}
        style={{
          background: tema.headerBg,
          borderColor: tema.headerBorder,
          paddingTop: isQuestao || isFlashcard 
            ? 'calc(0.65rem + var(--sai-top, env(safe-area-inset-top, 0px)))' 
            : 'calc(1rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
          paddingBottom: isQuestao || isFlashcard ? '0.55rem' : '0.85rem'
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
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setDrawerAberto(true);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shrink-0 hover:bg-amber-500/25 transition active:scale-95 cursor-pointer"
                title="Abrir sumário de etapas"
              >
                {idx + 1} de {total}
              </button>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif leading-tight">
              {aula.titulo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Chavinha (Switch Toggle) do Grifo da Narração */}
          <button
            type="button"
            onClick={handleToggleGrifoClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all active:scale-95 shadow-sm cursor-pointer ${
              grifoAtivo 
                ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' 
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
            title={grifoAtivo ? 'Grifo da narração ligado (toque para opções)' : 'Grifo da narração desligado (toque para ligar)'}
            aria-label="Alternar grifo da narração"
          >
            <Highlighter className={`w-3.5 h-3.5 transition-colors ${grifoAtivo ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span className="text-[10px] sm:text-[11px] font-bold hidden xs:inline">
              Grifo
            </span>
            {/* Chavinha Switch Visual */}
            <div 
              className={`w-7 h-4 sm:w-8 sm:h-4.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                grifoAtivo ? 'bg-amber-400' : 'bg-zinc-700'
              }`}
            >
              <div 
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ${
                  grifoAtivo ? 'translate-x-3 sm:translate-x-3.5 bg-black' : 'translate-x-0 bg-zinc-300'
                }`}
              />
            </div>
          </button>

          {isUltimaEtapa && (
            <button
              type="button"
              onClick={() => onConcluir(total)}
              className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[11px] transition flex items-center gap-1.5 active:scale-95 shadow-md shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden xs:inline">Concluir</span>
            </button>
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
      <main ref={mainRef} className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-44 sm:pb-48 max-w-3xl mx-auto scroll-smooth">
        {slideAtual && (
          <div key={idx} className="space-y-4 sm:space-y-5 animate-page-turn">
            {/* Tag / Kicker da Etapa limpo e elegante (Sem redundâncias de tags na direita) */}
            <div className="flex items-center justify-between gap-2">
              <span 
                className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: tema.destaque }}
              >
                <span className="text-[9px] text-[#d4af37]">◆</span>
                {kickerFormatado}
              </span>
              {/* Tag contextual apenas em tipos específicos (sem poluir Questões/Flashcards/Conteúdo) */}
              {!isQuestao && !isFlashcard && slideAtual.tipo !== 'Conteúdo' && (
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {slideAtual.tipo}
                </span>
              )}
            </div>

            {/* Imagem Cinematográfica com Altura Otimizada e Efeito de Zoom Suave "pra dentro" (Oculta em Questões/Flashcards para máximo espaço) */}
            {imagemUrl && !isQuestao && !isFlashcard && (
              <div className="relative w-full aspect-[16/8] sm:aspect-[16/7.5] max-h-[190px] sm:max-h-[230px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#250d14] group">
                <img
                  key={`${idx}-${imagemUrl}`}
                  src={imagemUrl}
                  alt={slideAtual.alt || slideAtual.titulo || aula.titulo}
                  className="w-full h-full object-cover object-center img-zoom-in group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                  fetchPriority="high"
                  onError={(e) => {
                    const fallbackSrc = aula.capaUrl || '';
                    if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
                      e.currentTarget.src = fallbackSrc;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* Título do Slide: Oculta se for apenas 'Questão 1' ou 'Flashcard 1' para despoluir a tela */}
            {slideAtual.titulo && !isTituloRedundante && (
              <>
                <h1 
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {isTituloAtivo ? (
                    <mark className="karaoke-grifo">{slideAtual.titulo}</mark>
                  ) : (
                    slideAtual.titulo
                  )}
                </h1>
                <div 
                  className="h-[3px] w-20 rounded-full shadow-sm"
                  style={{ background: `linear-gradient(90deg, ${tema.destaque}, #d4af37)` }}
                />
              </>
            )}

            {/* Bloco de Questão Prática com Seleção -> Botão Responder -> Comentário com feedback */}
            {isQuestao && (
              <div className="rounded-3xl border border-white/15 p-5 sm:p-6 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 shadow-2xl space-y-4 animate-in fade-in zoom-in-[0.98] duration-300">
                {/* Header da questão com foco no aprendizado prático (Sem repetir 'Questão') */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <span 
                    className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5"
                    style={{ color: tema.destaque }}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Treinamento Prático</span>
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400">
                    {respostaConfirmada ? 'Gabarito e Comentário' : 'Selecione e confirme'}
                  </span>
                </div>

                {slideAtual.intro && (
                  <p 
                    className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: slideAtual.intro }}
                  />
                )}

                {slideAtual.questao && (
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed font-serif">
                    {slideAtual.questao}
                  </h3>
                )}

                {slideAtual.opcoes && (
                  <div className="space-y-2.5 pt-1">
                    {slideAtual.opcoes.map((opcao, oi) => {
                      const letras = ['A', 'B', 'C', 'D', 'E'];
                      const isSelected = respostaSelecionada === oi;
                      const corretaIdx = slideAtual.correta ?? slideAtual.certa ?? 0;
                      const isCorreta = oi === corretaIdx;

                      let btnStyle = 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200';
                      
                      if (!respostaConfirmada) {
                        if (isSelected) {
                          btnStyle = 'border-amber-400 bg-amber-400/15 text-white font-bold ring-1 ring-amber-400/40 shadow-md scale-[1.01]';
                        }
                      } else {
                        if (isCorreta) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/25 text-emerald-200 font-bold ring-1 ring-emerald-500/50 shadow-md';
                        } else if (isSelected && !isCorreta) {
                          btnStyle = 'border-red-500 bg-red-500/25 text-red-200 font-bold ring-1 ring-red-500/50 shadow-md';
                        } else {
                          btnStyle = 'border-white/5 bg-white/[0.02] text-zinc-500 opacity-40';
                        }
                      }

                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={respostaConfirmada}
                          onClick={() => {
                            haptic.selection();
                            setRespostaSelecionada(oi);
                          }}
                          className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer ${btnStyle}`}
                        >
                          <span 
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                              respostaConfirmada && isCorreta
                                ? 'bg-emerald-500 text-white'
                                : respostaConfirmada && isSelected && !isCorreta
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-amber-400 text-black font-black'
                                : 'bg-white/10 text-zinc-300'
                            }`}
                          >
                            {letras[oi]}
                          </span>
                          <span className="text-xs sm:text-sm leading-relaxed pt-0.5">{opcao}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Botão Responder: surge assim que o aluno escolhe uma alternativa */}
                {slideAtual.opcoes && respostaSelecionada !== null && !respostaConfirmada && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        const corretaIdx = slideAtual.correta ?? slideAtual.certa ?? 0;
                        if (respostaSelecionada === corretaIdx) {
                          haptic.success();
                        } else {
                          haptic.error();
                        }
                        setRespostaConfirmada(true);
                      }}
                      className="w-full py-3.5 sm:py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                      style={{ background: tema.accentGradient }}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Responder</span>
                    </button>
                  </div>
                )}

                {/* Card de Comentário / Justificativa que sobe após responder */}
                {respostaConfirmada && (
                  <div 
                    className="rounded-2xl border p-4 sm:p-5 mt-3 space-y-2.5 animate-in slide-in-from-bottom-3 fade-in duration-300 shadow-xl"
                    style={{
                      backgroundColor: respostaSelecionada === (slideAtual.correta ?? slideAtual.certa ?? 0)
                        ? 'rgba(6, 78, 59, 0.4)'
                        : 'rgba(127, 29, 29, 0.4)',
                      borderColor: respostaSelecionada === (slideAtual.correta ?? slideAtual.certa ?? 0)
                        ? 'rgba(52, 211, 153, 0.45)'
                        : 'rgba(248, 113, 113, 0.45)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {respostaSelecionada === (slideAtual.correta ?? slideAtual.certa ?? 0) ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                            Excelente! Resposta Correta!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400 stroke-[2.5]" />
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-red-300">
                            Resposta Incorreta! Veja a explicação:
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-zinc-200 pt-2 border-t border-white/10">
                      <p className="font-bold text-white mb-1">
                        Comentário do Professor / Gabarito Comentado:
                      </p>
                      <p>
                        {slideAtual.feedback || slideAtual.explicacao || slideAtual.comentario || (
                          `A alternativa correta é a letra ${['A', 'B', 'C', 'D', 'E'][slideAtual.correta ?? slideAtual.certa ?? 0]}.`
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Flashcard Interativo com Efeito 3D Flip Card */}
            {isFlashcard && (
              <div className="w-full flip-perspective my-2 select-none">
                <div 
                  onClick={() => {
                    haptic.medium();
                    setFlashcardVirado(!flashcardVirado);
                  }}
                  className={`flip-card-inner min-h-[300px] sm:min-h-[340px] cursor-pointer ${
                    flashcardVirado ? 'is-flipped' : ''
                  }`}
                >
                  {/* FACE 1: FRENTE DO FLASHCARD */}
                  <div className="flip-face absolute inset-0 w-full h-full rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-[#180a10]/95 to-[#120409] p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-amber-950/30 hover:border-amber-400/70 transition-colors">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                        FRENTE · CONCEITO
                      </span>
                      <span className="text-xs text-amber-200/80 font-medium flex items-center gap-1.5 hover:text-amber-300 transition">
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                        <span>Toque para virar</span>
                      </span>
                    </div>

                    <div className="my-auto py-6 flex items-center justify-center text-center">
                      <div 
                        className="text-lg sm:text-2xl font-serif font-bold text-white leading-relaxed max-w-xl mx-auto [&_b]:text-[#e9cd6d] [&_strong]:text-[#e9cd6d]"
                        dangerouslySetInnerHTML={{ __html: slideAtual.frente || '' }}
                      />
                    </div>

                    <div className="border-t border-white/10 pt-3 text-center">
                      <p className="text-[11px] sm:text-xs text-zinc-400 font-medium flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Teste sua memória antes de virar o cartão</span>
                      </p>
                    </div>
                  </div>

                  {/* FACE 2: VERSO DO FLASHCARD (FLIP DE 180 GRAUS) */}
                  <div className="flip-face flip-face-back absolute inset-0 w-full h-full rounded-3xl border border-emerald-500/45 bg-gradient-to-b from-[#0b2918]/60 via-[#140810]/95 to-[#120409] p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-emerald-950/40 hover:border-emerald-400/70 transition-colors">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                        VERSO · RESPOSTA
                      </span>
                      <span className="text-xs text-emerald-200/80 font-medium flex items-center gap-1.5 hover:text-emerald-300 transition">
                        <RotateCcw className="w-4 h-4 text-emerald-400" />
                        <span>Toque para voltar à frente</span>
                      </span>
                    </div>

                    <div className="my-auto py-6 flex items-center justify-center text-center overflow-y-auto max-h-[220px]">
                      <div 
                        className="text-base sm:text-xl font-serif text-white leading-relaxed max-w-xl mx-auto space-y-3 [&_b]:text-[#e9cd6d] [&_strong]:text-[#e9cd6d] [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: slideAtual.verso || '' }}
                      />
                    </div>

                    <div className="border-t border-white/10 pt-3 text-center">
                      <p className="text-[11px] sm:text-xs text-emerald-300 font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resposta revelada · Toque para virar novamente</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bloco de Karaokê Interativo: Frases Reais da Narração com Grifo Sincronizado */}
            {(slideAtual.tipo === 'Karaokê' || (!slideAtual.corpo && slideAtual.frases && slideAtual.frases.length > 0)) && (
              <div className="rounded-3xl border border-white/15 p-5 sm:p-6 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 shadow-2xl space-y-4 animate-in fade-in zoom-in-[0.98] duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span 
                    className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5"
                    style={{ color: tema.destaque }}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Recapitulação · Siga a Narração</span>
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400">
                    Toque em uma frase para ouvir
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {(slideAtual.frases || frasesNarr).map((frase, fi) => {
                    const isAtiva = tocando && karaIdx === fi;
                    return (
                      <div
                        key={fi}
                        onClick={() => {
                          haptic.selection();
                          if (audioRef.current && duracao > 0 && faixasKaraoke[fi]) {
                            audioRef.current.currentTime = faixasKaraoke[fi].start * duracao;
                            if (!tocando) {
                              audioRef.current.play().then(() => setTocando(true)).catch(() => {});
                            }
                          }
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-3.5 active:scale-[0.99] ${
                          isAtiva
                            ? 'border-amber-400/90 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/60 translate-x-1'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        <span 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 transition-colors ${
                            isAtiva ? 'bg-amber-400 text-black shadow-md shadow-amber-400/50' : 'bg-white/10 text-zinc-400'
                          }`}
                        >
                          {fi + 1}
                        </span>
                        <p className={`text-sm sm:text-base leading-relaxed transition-colors ${isAtiva ? 'text-amber-200 font-bold' : 'text-zinc-200'}`}>
                          {frase}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bloco de Ligar Termos Interativo */}
            {slideAtual.pares && slideAtual.pares.length > 0 && (
              <div className="rounded-3xl border border-white/15 p-5 sm:p-6 bg-gradient-to-b from-[#2e1219]/90 to-[#1d0810]/95 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
                    <Link2 className="w-4 h-4" />
                    <span>Ligue os Termos Corretos</span>
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400">
                    Toque no termo e depois na definição
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {slideAtual.pares.map(([termo, def], pi) => {
                    const isConectado = paresConectados[pi] !== undefined;
                    const isSelected = parSelecionadoL === pi;

                    return (
                      <div 
                        key={pi}
                        onClick={() => {
                          if (isConectado) return;
                          if (parSelecionadoL === null) {
                            setParSelecionadoL(pi);
                          } else if (parSelecionadoL === pi) {
                            setParSelecionadoL(null);
                          } else {
                            // Conectar
                            setParesConectados(prev => ({ ...prev, [parSelecionadoL]: pi }));
                            setParSelecionadoL(null);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isConectado
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                            : isSelected
                            ? 'border-amber-400 bg-amber-400/20 text-white ring-1 ring-amber-400 shadow-md'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200'
                        }`}
                      >
                        <span className="font-bold text-sm sm:text-base text-amber-300">{termo}</span>
                        <span className="text-xs sm:text-sm text-zinc-300 sm:text-right">{def}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bloco de Toque e Revele (Cartas com Perguntas e Respostas) */}
            {slideAtual.cartas && slideAtual.cartas.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    <span>Toque, Pense e Revele</span>
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400">
                    Toque em cada carta para virar
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slideAtual.cartas.map((carta: any, ci: number) => {
                    const revelada = Boolean(cartasReveladas[ci]);
                    return (
                      <div
                        key={ci}
                        onClick={() => setCartasReveladas(prev => ({ ...prev, [ci]: !prev[ci] }))}
                        className={`p-4 sm:p-5 rounded-2xl border min-h-[140px] flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
                          revelada
                            ? 'border-amber-400/50 bg-[#2e1219]'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
                          <span>Carta {ci + 1}</span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> {revelada ? 'Ocultar' : 'Revelar'}
                          </span>
                        </div>
                        {revelada ? (
                          <div 
                            className="text-xs sm:text-sm text-emerald-200 leading-relaxed font-serif my-auto [&_b]:text-[#e9cd6d]"
                            dangerouslySetInnerHTML={{ __html: carta.r }}
                          />
                        ) : (
                          <p className="text-xs sm:text-sm text-white font-bold leading-relaxed my-auto font-serif">
                            {carta.p}
                          </p>
                        )}
                        <span className="text-[10px] text-zinc-500 mt-2">
                          {revelada ? '✓ Resposta correta' : 'Toque para checar a resposta'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bloco de Explorar Hotspots na Imagem */}
            {slideAtual.pontos && slideAtual.pontos.length > 0 && (
              <div className="space-y-4 pt-1">
                <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-black/50 aspect-[16/9]">
                  {imagemUrl && (
                    <img 
                      src={imagemUrl} 
                      alt="Cena interativa" 
                      className="w-full h-full object-cover" 
                    />
                  )}
                  {slideAtual.pontos.map((ponto: any, pi: number) => {
                    const isAtivo = pontoAtivo === pi;
                    return (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => setPontoAtivo(pi)}
                        style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}
                        className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-xl ${
                          isAtivo
                            ? 'bg-amber-400 text-black ring-4 ring-amber-400/40 scale-125 z-10'
                            : 'bg-black/80 text-amber-400 border border-amber-400/60 hover:scale-110'
                        }`}
                      >
                        {pi + 1}
                      </button>
                    );
                  })}
                </div>

                {slideAtual.pontos[pontoAtivo] && (
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-[#250d14] space-y-2 animate-in fade-in duration-200 shadow-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black">
                        {pontoAtivo + 1}
                      </span>
                      <h4 className="font-bold text-white text-sm sm:text-base font-serif">
                        {slideAtual.pontos[pontoAtivo].titulo}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {slideAtual.pontos[pontoAtivo].texto}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo Rico da Aula: 100% Tipografia Autêntica do HTML com Grifo Leve por cima */}
            {(slideAtual.corpo || htmlComGrifo) && (
              <div 
                className="aula-html-tipografia pt-1"
                dangerouslySetInnerHTML={{ __html: htmlComGrifo }}
              />
            )}

            {/* Fallback de Conteúdo de Texto caso não haja corpo HTML e não seja interativo */}
            {!slideAtual.corpo && !htmlComGrifo && (slideAtual.texto || slideAtual.narr) && !isQuestao && !isFlashcard && slideAtual.tipo !== 'Karaokê' && !slideAtual.frases && !slideAtual.pares && !slideAtual.cartas && !slideAtual.pontos && (
              <div className="aula-html-tipografia pt-1 space-y-3">
                <p className="text-base sm:text-lg leading-relaxed text-zinc-200">
                  {slideAtual.texto || slideAtual.narr}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ NATIVO COMPLETO, ENCORPADO (ALTO) E 100% RESPONSIVO COM SAFE AREA INSET BOTTOM */}
      <footer 
        className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t border-white/10 px-3.5 sm:px-6 py-3.5 sm:py-4 shadow-2xl"
        style={{
          backgroundColor: tema.footerBg,
          paddingBottom: 'calc(0.95rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Botão Anterior: Alto e Ergonômico */}
          <button
            type="button"
            onClick={voltarEtapa}
            disabled={idx === 0}
            className={`min-w-[98px] sm:min-w-[124px] h-14 sm:h-[58px] px-3.5 sm:px-4 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 shrink-0 ${
              idx === 0 
                ? 'opacity-30 border-white/5 bg-white/5 text-zinc-500 cursor-not-allowed'
                : 'border-white/20 bg-white/5 hover:bg-white/10 text-zinc-100 shadow-md'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span>Anterior</span>
          </button>

          {/* Player Central: Apenas Botão Play/Pause e Seletor de Velocidade */}
          <div 
            onClick={toggleAudio}
            className="flex-1 min-w-0 h-14 sm:h-[58px] px-4 sm:px-6 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-between sm:justify-center sm:gap-8 cursor-pointer transition active:scale-[0.99] shadow-inner"
            title="Tocar ou pausar narração desta etapa"
          >
            <button
              type="button"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/50 transition active:scale-90"
              style={{ background: tema.accentGradient }}
              aria-label={tocando ? 'Pausar narração' : 'Tocar narração'}
            >
              {tocando ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Seletor de Velocidade da Narração (1x, 1.25x, 1.5x, 2x) */}
            <button
              type="button"
              onClick={alternarVelocidade}
              className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-amber-300 font-mono text-xs sm:text-sm font-black transition active:scale-90 shadow-sm"
              title="Alterar velocidade de reprodução"
            >
              {velocidade}x
            </button>
          </div>

          {/* Botão Próximo / Concluir: Alto, Destaque e Largura Segura */}
          <button
            type="button"
            onClick={avancarEtapa}
            className={`min-w-[100px] sm:min-w-[126px] h-14 sm:h-[58px] px-3.5 sm:px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-xl shrink-0 ${
              isUltimaEtapa
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/40'
                : 'text-white shadow-black/40'
            }`}
            style={{
              background: isUltimaEtapa 
                ? '#10b981' 
                : tema.accentGradient
            }}
          >
            <span>{isUltimaEtapa ? 'Concluir' : 'Próximo'}</span>
            {isUltimaEtapa ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

          
        </div>
      </footer>

      {/* DRAWER DO MINI-SUMÁRIO DE ETAPAS (BOTTOM SHEET FLUIDO E MODERNO) */}
      {drawerAberto && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDrawerAberto(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-x border-white/15 bg-[#18090f]/98 shadow-2xl flex flex-col max-h-[82vh] animate-in slide-in-from-bottom duration-300"
            style={{ backgroundColor: tema.bg }}
          >
            {/* Header do Drawer */}
            <div className="p-4 sm:p-5 border-b border-white/10 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Navegação Rápida · {disciplinaNome}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate font-serif">
                    {aula.titulo}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerAberto(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-zinc-300 transition active:scale-95"
                  aria-label="Fechar sumário"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progresso visual */}
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-bold">
                <span>Progresso da Aula</span>
                <span className="text-amber-300">{Math.round(((idx + 1) / total) * 100)}% ({idx + 1} de {total})</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((idx + 1) / total) * 100}%`,
                    background: tema.accentGradient
                  }}
                />
              </div>
            </div>

            {/* Lista rolável de todos os slides da aula */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {slides.map((s, si) => {
                const isAtual = si === idx;
                const isConcluido = si < idx;

                let tipoIcon = <BookOpen className="w-4 h-4 text-zinc-400" />;
                if (s.tipo === 'Questão' || s.tipo === 'Questão de banca' || s.opcoes) {
                  tipoIcon = <HelpCircle className="w-4 h-4 text-amber-400" />;
                } else if (s.tipo === 'Flashcard') {
                  tipoIcon = <RotateCcw className="w-4 h-4 text-emerald-400" />;
                } else if (s.tipo === 'Karaokê' || s.frases) {
                  tipoIcon = <Volume2 className="w-4 h-4 text-rose-400" />;
                } else if (s.tipo === 'Ligar termos') {
                  tipoIcon = <Link2 className="w-4 h-4 text-sky-400" />;
                }

                return (
                  <button
                    key={si}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setIdx(si);
                      setDrawerAberto(false);
                    }}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer ${
                      isAtual
                        ? 'border-amber-400 bg-amber-400/20 text-white font-bold ring-1 ring-amber-400/50 shadow-md scale-[1.01]'
                        : isConcluido
                        ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300'
                        : 'border-white/5 bg-transparent hover:bg-white/[0.03] text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                          isAtual
                            ? 'bg-amber-400 text-black'
                            : isConcluido
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/10 text-zinc-400'
                        }`}
                      >
                        {String(si + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2 truncate">
                        {tipoIcon}
                        <span className="text-xs sm:text-sm font-medium truncate text-white">
                          {s.titulo || s.kicker || `Etapa ${si + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {s.tipo}
                      </span>
                      {isConcluido && (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DO GRIFO DA NARRAÇÃO (2 OPÇÕES: ESTA AULA OU TODAS AS AULAS) */}
      {modalGrifoAberto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setModalGrifoAberto(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
            style={{ backgroundColor: tema.bg }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Highlighter className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white font-serif">Grifo da Narração</h3>
                <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                  Como deseja desativar o destaque sincronizado com a voz?
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setGrifoAulaAtivo(false);
                  setModalGrifoAberto(false);
                }}
                className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition flex items-center justify-between group active:scale-[0.99] cursor-pointer"
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                    Desligar para esta aula
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    O grifo será desativado apenas nesta aula atual
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setGrifoAulaAtivo(false);
                  setGrifoGlobalAtivo(false);
                  try {
                    localStorage.setItem('aulas_grifo_global_desativado', 'true');
                  } catch {}
                  setModalGrifoAberto(false);
                }}
                className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition flex items-center justify-between group active:scale-[0.99] cursor-pointer"
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                    Desligar para todas as aulas
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Nenhuma aula exibirá o grifo por padrão
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setModalGrifoAberto(false);
              }}
              className="w-full py-2.5 text-center text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Cancelar (manter ligado)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
