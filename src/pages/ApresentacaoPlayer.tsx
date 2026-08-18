import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Heart, Star, Share2, MessageCircle, RotateCw, Loader2, Send, Grid, Subtitles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { srcOf } from '@/lib/assetUrl';
import { useGoBack } from '@/hooks/useGoBack';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import { copiarTexto } from '@/lib/nativo/copiar';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

type Slide = { slide_index: number; imagem_url: string | null; audio_url: string | null; roteiro: string | null };
type Apres = { id: string; titulo: string; descricao: string | null; total_slides: number; livro_tabela: string; livro_id: string };

const formatarTempo = (seg: number): string => {
  if (!Number.isFinite(seg) || seg < 0) return '--:--';
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const playHaptic = () => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

// Componente isolado para a barra de progresso do áudio (Performance/Smooth Seek)
const AudioProgressBar = ({ 
  audioRef, 
  duration,
  onSeek
}: { 
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  duration: number;
  onSeek: (time: number) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      if (audioRef.current && duration > 0 && !isDragging.current) {
        const ct = audioRef.current.currentTime;
        const pct = Math.min(100, (ct / duration) * 100);
        if (barRef.current) barRef.current.style.width = `${pct}%`;
        if (timeRef.current) timeRef.current.textContent = formatarTempo(ct);
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [audioRef, duration]);

  const handleSeek = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = offsetX / rect.width;
    const newTime = pct * duration;
    
    if (barRef.current) barRef.current.style.width = `${pct * 100}%`;
    if (timeRef.current) timeRef.current.textContent = formatarTempo(newTime);
    onSeek(newTime);
  };

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        className="h-8 -my-3 flex items-center cursor-pointer"
        onMouseDown={(e) => { isDragging.current = true; handleSeek(e); }}
        onMouseMove={(e) => { if (isDragging.current) handleSeek(e); }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
        onTouchStart={(e) => { isDragging.current = true; handleSeek(e); }}
        onTouchMove={(e) => { if (isDragging.current) handleSeek(e); }}
        onTouchEnd={() => { isDragging.current = false; }}
      >
        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
          <div ref={barRef} className="h-full bg-primary relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full scale-150 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/50 font-body tabular-nums">
        <span ref={timeRef}>0:00</span>
        <span>{duration > 0 ? formatarTempo(duration) : '--:--'}</span>
      </div>
    </div>
  );
};

const ApresentacaoPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const [usaA, setUsaA] = useState(true);
  const usaARef = useRef(true);
  usaARef.current = usaA;
  
  const [apres, setApres] = useState<Apres | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [preparando, setPreparando] = useState(false);
  const [duracoes, setDuracoes] = useState<number[]>([]);
  const [deitado, setDeitado] = useState(false);
  const [midiaPronta, setMidiaPronta] = useState(false);
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const [curtido, setCurtido] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comentarios, setComentarios] = useState<{ id: string; texto: string; created_at: string }[]>([]);
  const [abrirComentarios, setAbrirComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Novos Estados (UX 360)
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const timeoutControlesRef = useRef<NodeJS.Timeout | null>(null);
  const [abrirSumario, setAbrirSumario] = useState(false);
  const [abrirRoteiro, setAbrirRoteiro] = useState(false);
  const [velocidade, setVelocidade] = useState(1); // 1x, 1.5x, 2x

  const elAtivo = useCallback(() => (usaARef.current ? audioARef.current : audioBRef.current), []);
  const elReserva = useCallback(() => (usaARef.current ? audioBRef.current : audioARef.current), []);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const [{ data: a }, { data: s }, { count }, { data: cs }] = await Promise.all([
        supabase.from('apresentacoes_narradas').select('id, titulo, descricao, total_slides, livro_tabela, livro_id').eq('id', id).maybeSingle(),
        supabase.from('apresentacao_slides').select('slide_index, imagem_url, audio_url, roteiro').eq('apresentacao_id', id).order('slide_index'),
        supabase.from('apresentacao_likes').select('id', { count: 'exact', head: true }).eq('apresentacao_id', id),
        supabase.from('apresentacao_comentarios').select('id, texto, created_at').eq('apresentacao_id', id).order('created_at', { ascending: false }),
      ]);
      setApres(a as Apres | null);
      
      const resSlides = (s ?? []) as Slide[];
      setSlides(resSlides);
      setLikes(count ?? 0);
      setComentarios((cs ?? []) as { id: string; texto: string; created_at: string }[]);
      
      if (user) {
        const [{ data: l }, { data: f }] = await Promise.all([
          supabase.from('apresentacao_likes').select('id').eq('apresentacao_id', id).eq('user_id', user.id).maybeSingle(),
          supabase.from('apresentacao_favoritos').select('id').eq('apresentacao_id', id).eq('user_id', user.id).maybeSingle(),
        ]);
        setCurtido(!!l); setFavorito(!!f);
      }

      // Resume Capability
      const lastIdxStr = localStorage.getItem(`apresentacao_resume_${id}`);
      if (lastIdxStr) {
        const lastIdx = parseInt(lastIdxStr, 10);
        if (!isNaN(lastIdx) && lastIdx >= 0 && lastIdx < resSlides.length) {
          setIdx(lastIdx);
        }
      }

      setCarregando(false);
    })();
  }, [id]);

  const slide = slides[idx];

  // Immersive Mode
  const resetarOcultacao = useCallback(() => {
    setControlesVisiveis(true);
    if (timeoutControlesRef.current) clearTimeout(timeoutControlesRef.current);
    if (tocando) {
      timeoutControlesRef.current = setTimeout(() => setControlesVisiveis(false), 3500);
    }
  }, [tocando]);

  useEffect(() => {
    resetarOcultacao();
    return () => { if (timeoutControlesRef.current) clearTimeout(timeoutControlesRef.current); };
  }, [tocando, idx, resetarOcultacao]);

  // Atualiza velocidade
  useEffect(() => {
    if (audioARef.current) audioARef.current.playbackRate = velocidade;
    if (audioBRef.current) audioBRef.current.playbackRate = velocidade;
  }, [velocidade]);

  useEffect(() => {
    if (!slides.length) return;
    let vivo = true;
    const urls = slides.map((s) => s.imagem_url).filter(Boolean) as string[];
    if (!urls.length) { setMidiaPronta(true); return; }

    const tm = setTimeout(() => { if (vivo) setMidiaPronta(true); }, 3000);

    Promise.all(
      urls.map((u) => new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = u;
      }))
    ).then(() => {
      if (vivo) { clearTimeout(tm); setMidiaPronta(true); }
    });

    return () => { vivo = false; clearTimeout(tm); };
  }, [slides]);

  // Pre-fetch áudio
  useEffect(() => {
    if (!midiaPronta || !slides.length) return;
    const ativo = elAtivo();
    const reserva = elReserva();
    if (!ativo || !reserva) return;

    const url = slide?.audio_url ? srcOf(slide.audio_url) : '';
    if (ativo.src !== url) {
      ativo.src = url;
      ativo.load();
    }
    ativo.playbackRate = velocidade;

    // Prefetch next
    const nextUrl = slides[idx + 1]?.audio_url ? srcOf(slides[idx + 1].audio_url) : '';
    if (nextUrl && reserva.src !== nextUrl) {
      reserva.src = nextUrl;
      reserva.load();
    }

    // MediaSession do navegador/sistema
    if ('mediaSession' in navigator && apres) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Slide ${idx + 1}`,
        artist: apres.titulo,
        artwork: slide?.imagem_url ? [{ src: slide.imagem_url, sizes: '512x512', type: 'image/png' }] : [],
      });
    }
  }, [idx, midiaPronta, slides, elAtivo, elReserva, apres, slide, velocidade]);

  const carregarDuracoes = useCallback(async () => {
    if (!slides.length) return;
    const map = new Map<number, number>();
    await Promise.all(
      slides.map((s, i) => new Promise<void>((resolve) => {
        if (!s.audio_url) { map.set(i, 0); resolve(); return; }
        const a = new Audio(srcOf(s.audio_url));
        a.onloadedmetadata = () => { map.set(i, a.duration || 0); resolve(); };
        a.onerror = () => { map.set(i, 0); resolve(); };
      }))
    );
    const arr = slides.map((_, i) => map.get(i) || 0);
    setDuracoes(arr);
  }, [slides]);

  useEffect(() => {
    carregarDuracoes();
  }, [carregarDuracoes]);

  const irPara = async (novoIdx: number) => {
    if (novoIdx < 0) return;
    if (novoIdx >= slides.length) {
      // Tela de fim de aula
      toast.success('Apresentação concluída!');
      goBack();
      return;
    }
    playHaptic();
    setDirecao(novoIdx > idx ? 1 : -1);
    setPreparando(true);
    const a = elAtivo();
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setIdx(novoIdx);
    localStorage.setItem(`apresentacao_resume_${id}`, novoIdx.toString());

    // Switch tag de audio
    setUsaA((v) => !v);
    const proximoAtivo = elReserva();
    
    // Pequeno atraso para a animação do slide acontecer
    setTimeout(async () => {
      try {
        if (tocando && proximoAtivo) {
          proximoAtivo.playbackRate = velocidade;
          await proximoAtivo.play();
        }
      } catch (e) {
        console.error(e);
        setTocando(false);
      } finally {
        setPreparando(false);
      }
    }, 400);
  };

  const continuarProximo = () => {
    irPara(idx + 1);
  };

  const alternarPlay = async () => {
    playHaptic();
    const a = elAtivo();
    if (!a) return;
    if (tocando) {
      a.pause();
      setTocando(false);
    } else {
      try {
        a.playbackRate = velocidade;
        await a.play();
        setTocando(true);
      } catch (e) {
        toast.error('Erro ao reproduzir áudio.');
      }
    }
  };

  const doubleTapSeek = (lado: 'esq' | 'dir') => {
    playHaptic();
    const a = elAtivo();
    if (!a) return;
    const novo = a.currentTime + (lado === 'dir' ? 10 : -10);
    a.currentTime = Math.max(0, Math.min(novo, a.duration || 0));
    resetarOcultacao();
  };

  const toggleVelocidade = () => {
    playHaptic();
    setVelocidade(v => v === 1 ? 1.5 : v === 1.5 ? 2 : 1);
  };

  const curtir = async () => {
    if (!userId || !id) return;
    playHaptic();
    setCurtido((v) => !v);
    setLikes((l) => (curtido ? l - 1 : l + 1));
    if (curtido) {
      await supabase.from('apresentacao_likes').delete().eq('apresentacao_id', id).eq('user_id', userId);
    } else {
      await supabase.from('apresentacao_likes').insert({ apresentacao_id: id, user_id: userId });
    }
  };

  const favoritar = async () => {
    if (!userId || !id) return;
    playHaptic();
    setFavorito((v) => !v);
    toast.success(favorito ? 'Removido dos salvos' : 'Salvo na sua coleção!');
    if (favorito) {
      await supabase.from('apresentacao_favoritos').delete().eq('apresentacao_id', id).eq('user_id', userId);
    } else {
      await supabase.from('apresentacao_favoritos').insert({ apresentacao_id: id, user_id: userId });
    }
  };

  const enviarComentario = async () => {
    if (!userId || !id || !novoComentario.trim()) return;
    playHaptic();
    const txt = novoComentario.trim();
    setNovoComentario('');
    const resp = await supabase.from('apresentacao_comentarios').insert({ apresentacao_id: id, user_id: userId, texto: txt }).select('id, texto, created_at').single();
    if (resp.data) {
      setComentarios((c) => [resp.data as { id: string; texto: string; created_at: string }, ...c]);
    }
  };

  const compartilhar = async () => {
    playHaptic();
    const url = `${window.location.origin}/apresentacao/${id}`;
    const txt = `Confira a apresentação "${apres?.titulo}" no app!`;
    if (podeCompartilhar()) {
      await compartilharNativo(apres?.titulo || 'Apresentação', txt, url);
    } else {
      await copiarTexto(url);
      toast.success('Link da apresentação copiado!');
    }
  };

  if (carregando) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="font-heading font-medium">Carregando apresentação...</p>
      </div>
    );
  }

  if (!apres) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="font-body text-white/80">Apresentação indisponível.</p>
        <button onClick={() => goBack()} className="mt-4 rounded-xl bg-white/10 px-6 py-3 text-sm">Voltar</button>
      </div>
    );
  }

  const duracaoSlide = duracoes[idx] ?? 0;

  return (
    <div 
      className="min-h-dvh bg-black text-white flex flex-col relative overflow-hidden"
      onClick={resetarOcultacao}
      onTouchStart={resetarOcultacao}
    >
      {/* Ambient Background Blur */}
      {slide?.imagem_url && (
        <div 
          className="absolute inset-0 z-0 opacity-30 transition-all duration-1000 bg-cover bg-center blur-[100px] scale-150"
          style={{ backgroundImage: `url(${slide.imagem_url})` }}
        />
      )}
      
      <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none" />

      <audio ref={audioARef} onEnded={() => { if (usaA) continuarProximo(); }} onPlay={() => { if (usaA) setTocando(true); }} preload="auto" className="hidden" />
      <audio ref={audioBRef} onEnded={() => { if (!usaA) continuarProximo(); }} onPlay={() => { if (!usaA) setTocando(true); }} preload="auto" className="hidden" />

      {/* Header com Instagram-style bars e Immersive Mode */}
      <AnimatePresence>
        {controlesVisiveis && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-3 pb-3 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] bg-gradient-to-b from-black/80 to-transparent"
          >
            {/* Barrinhas do topo estilo Stories */}
            <div className="flex gap-1 mb-4">
              {slides.map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div className={`h-full bg-primary transition-all duration-300 ${i < idx ? 'w-full' : i === idx ? 'w-full animate-pulse' : 'w-0'}`} />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => goBack()} className="w-10 h-10 flex items-center justify-center active:scale-95"><ArrowLeft className="w-6 h-6" /></button>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-sm truncate">{apres.titulo}</p>
                <p className="text-[11px] text-white/60 font-body truncate">
                  Slide {idx + 1} de {slides.length}
                  {duracoes.length > 0 && duracoes.reduce((a, b) => a + b, 0) > 0 && ` · Total: ${formatarTempo(duracoes.reduce((a, b) => a + b, 0))}`}
                </p>
              </div>
              <button onClick={() => setDeitado((v) => !v)} className="w-10 h-10 flex items-center justify-center" aria-label="Girar tela">
                <RotateCw className="w-5 h-5" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Slide Central com Swipe e Double Tap */}
      <div className="flex-1 relative z-10 flex items-center justify-center overflow-hidden w-full">
        {/* Lado esquerdo Double Tap */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-20" onDoubleClick={() => doubleTapSeek('esq')} />
        {/* Lado direito Double Tap */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-20" onDoubleClick={() => doubleTapSeek('dir')} />
        
        <div className={`w-full transition-transform duration-500 ${deitado ? 'rotate-90 scale-[0.72]' : ''}`}>
          <AnimatePresence mode="popLayout" custom={direcao}>
            <motion.div
              key={idx}
              custom={direcao}
              initial={{ opacity: 0, x: direcao * 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direcao * -50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -50 || velocity.x < -500) irPara(idx + 1);
                else if (swipe > 50 || velocity.x > 500) irPara(idx - 1);
              }}
              className="relative z-10"
            >
              {slide?.imagem_url ? (
                <img
                  src={slide.imagem_url}
                  alt={`Slide ${idx + 1}`}
                  decoding="sync"
                  className="w-full h-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-y border-white/5"
                />
              ) : (
                <div className="aspect-video w-full bg-white/5 shadow-2xl border-y border-white/5 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caches */}
        <div className="hidden" aria-hidden>
          {slides.map((s) => (s.imagem_url ? <img key={s.slide_index} src={s.imagem_url} alt="" /> : null))}
        </div>
      </div>

      {/* Controles Inferiores (Ocultáveis) */}
      <AnimatePresence>
        {controlesVisiveis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-6 bg-gradient-to-t from-black/90 to-transparent space-y-6"
          >
            {/* Barra de Progresso Isolada */}
            <AudioProgressBar 
              audioRef={usaARef.current ? audioARef : audioBRef} 
              duration={duracaoSlide} 
              onSeek={(t) => {
                const a = elAtivo();
                if (a) a.currentTime = t;
              }}
            />

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              {/* Opções à esquerda */}
              <div className="flex items-center gap-4">
                <button onClick={() => setAbrirSumario(true)} className="text-white/70 hover:text-white p-2">
                  <Grid className="w-5 h-5" />
                </button>
                <button onClick={() => setAbrirRoteiro(true)} className="text-white/70 hover:text-white p-2">
                  <Subtitles className="w-5 h-5" />
                </button>
              </div>

              {/* Centro de Playback */}
              <div className="flex items-center gap-5">
                <button onClick={() => irPara(idx - 1)} disabled={idx === 0} className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"><ChevronLeft className="w-6 h-6" /></button>
                <button onClick={alternarPlay} aria-label={tocando ? 'Pausar' : 'Reproduzir'} className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(233,30,99,0.3)]">
                  {preparando ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <AnimatePresence mode="wait">
                      {tocando ? (
                        <motion.div key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Pause className="w-7 h-7" /></motion.div>
                      ) : (
                        <motion.div key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Play className="w-7 h-7 ml-1" /></motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </button>
                <button onClick={() => irPara(idx + 1)} disabled={idx === slides.length - 1} className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"><ChevronRight className="w-6 h-6" /></button>
              </div>

              {/* Opções à direita */}
              <div className="flex items-center gap-4">
                <button onClick={toggleVelocidade} className="text-white/80 font-bold text-sm bg-white/10 px-2 py-1 rounded">
                  {velocidade}x
                </button>
              </div>
            </div>

            {/* Ações Sociais */}
            <div className="flex items-center justify-around pt-2">
              <button onClick={curtir} className="flex flex-col items-center gap-1.5 text-[11px] font-body text-white/70 p-2">
                <motion.div animate={curtido ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart className={`w-6 h-6 ${curtido ? 'fill-primary text-primary' : ''}`} />
                </motion.div>
                {likes}
              </button>
              <button onClick={() => setAbrirComentarios(true)} className="flex flex-col items-center gap-1.5 text-[11px] font-body text-white/70 p-2">
                <MessageCircle className="w-6 h-6" /> {comentarios.length}
              </button>
              <button onClick={compartilhar} className="flex flex-col items-center gap-1.5 text-[11px] font-body text-white/70 p-2">
                <Share2 className="w-6 h-6" /> Compartilhar
              </button>
              <button onClick={favoritar} className="flex flex-col items-center gap-1.5 text-[11px] font-body text-white/70 p-2">
                <Star className={`w-6 h-6 ${favorito ? 'fill-primary text-primary' : ''}`} /> Salvar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais */}
      <Sheet open={abrirComentarios} onOpenChange={setAbrirComentarios}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Comentários</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {comentarios.length === 0 && <p className="text-sm text-white/50 font-body">Seja o primeiro a comentar.</p>}
            {comentarios.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-body text-white/90">{c.texto}</p>
                <p className="text-[11px] text-white/40 mt-1">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <input
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário…"
              className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-body text-white outline-none focus:bg-white/15 transition-colors"
            />
            <button onClick={enviarComentario} className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Send className="w-5 h-5" /></button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirSumario} onOpenChange={setAbrirSumario}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Todos os Slides</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] grid grid-cols-2 gap-3">
            {slides.map((s, i) => (
              <button 
                key={s.slide_index} 
                onClick={() => { irPara(i); setAbrirSumario(false); }}
                className={`text-left rounded-xl overflow-hidden bg-white/5 border-2 ${i === idx ? 'border-primary' : 'border-transparent'}`}
              >
                {s.imagem_url ? <img src={s.imagem_url} alt="" className="w-full aspect-video object-cover" /> : <div className="w-full aspect-video bg-white/10" />}
                <div className="p-2 text-xs font-medium text-white/80">Slide {i + 1}</div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirRoteiro} onOpenChange={setAbrirRoteiro}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Roteiro da Narração</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-white/5 rounded-xl text-sm leading-relaxed text-white/90 font-body">
            {slide?.roteiro || <span className="text-white/40 italic">Nenhum roteiro disponível para este slide.</span>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ApresentacaoPlayer;
