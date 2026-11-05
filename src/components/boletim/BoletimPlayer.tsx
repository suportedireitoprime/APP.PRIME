// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Clock,
  Heart,
  MessageCircle,
  ExternalLink,
  Send,
  Loader2,
  User,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import brasaoImg from '@/assets/brasao-republica.webp';
import swooshAsset from '@/assets/swoosh.mp3.asset.json';
import swooshBundled from '@/assets/swoosh.mp3';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import { haptic } from '@/lib/nativeHaptics';

const swooshSrc = pickAsset(swooshBundled, srcOf(swooshAsset));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { abrirLink } from '@/lib/nativo';

export type BoletimScene = {
  kind: 'intro' | 'norma' | 'outro';
  tipo: string;
  tipo_label?: string;
  titulo: string;
  texto: string;
  audio_url: string;
  imagem_url: string;
  cor_hex?: string;
  duracao_s?: number;
  url_fonte?: string;
  imagem_fonte?: 'openverse' | 'tipo_padrao';
  imagem_credito?: {
    autor?: string;
    autor_url?: string;
    licenca?: string;
    licenca_url?: string;
    fonte_url?: string;
    titulo?: string;
  } | null;
};

interface Props {
  boletimId?: string;
  scenes: BoletimScene[];
  youtubeUrl?: string;
  dataRef?: string;
  onClose?: () => void;
}

type Comentario = {
  id: string;
  autor_nome: string | null;
  texto: string;
  created_at: string;
  user_id: string;
};

/**
 * Player nativo: reproduz o áudio TTS de cada cena com Ken Burns + texto animado.
 * Sincronia por evento `ended` do <audio>; próximo áudio pré-carregado.
 */
export default function BoletimPlayer({ boletimId, scenes, youtubeUrl, dataRef, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<number, { count: number; mine: boolean }>>({});
  const [comentariosOpen, setComentariosOpen] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [countComentarios, setCountComentarios] = useState<Record<number, number>>({});
  
  // Transições direcionais & progresso contínuo
  const [direction, setDirection] = useState<1 | -1>(1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [bgMuted, setBgMuted] = useState(false);

  // GA4: abrir_boletim + play_narracao (uma vez por mount)
  useEffect(() => {
    import('@/lib/appEvents').then(({ appEvents }) => {
      appEvents.abrirBoletim({ boletim_id: boletimId });
      appEvents.playNarracao({ kind: 'boletim', id: boletimId });
    }).catch(() => {});
  }, [boletimId]);

  const scene = scenes[idx];
  const next = scenes[idx + 1];

  // Atualização de cena & áudio narrativo
  useEffect(() => {
    if (!audioRef.current || !scene) return;
    // Efeito sonoro sutil de transição (exceto capa)
    if (idx > 0 && scene.kind !== 'intro') {
      try {
        const s = new Audio(swooshSrc);
        s.volume = 0.22;
        s.play().catch(() => {});
      } catch {}
    }
    setAudioProgress(0);
    audioRef.current.src = scene.audio_url;
    audioRef.current.load();
    if (playing) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [idx]);

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (a && a.duration && !isNaN(a.duration) && a.duration > 0) {
      setAudioProgress((a.currentTime / a.duration) * 100);
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing]);

  // Trilha de fundo com controle de mudo
  useEffect(() => {
    const bg = bgAudioRef.current;
    if (!bg) return;
    bg.volume = bgMuted ? 0 : 0.16;
    bg.loop = true;
    if (playing && !bgMuted) bg.play().catch(() => {});
    else if (!playing) bg.pause();
  }, [playing, bgMuted]);


  // Sessão do usuário
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Carrega contadores de likes/comentários por cena
  useEffect(() => {
    if (!boletimId) return;
    (async () => {
      const [{ data: ls }, { data: cs }] = await Promise.all([
        supabase.from('boletim_likes').select('scene_index,user_id').eq('boletim_id', boletimId),
        supabase.from('boletim_comentarios').select('scene_index').eq('boletim_id', boletimId),
      ]);
      const l: Record<number, { count: number; mine: boolean }> = {};
      (ls || []).forEach((r: any) => {
        const cur = l[r.scene_index] || { count: 0, mine: false };
        cur.count += 1;
        if (userId && r.user_id === userId) cur.mine = true;
        l[r.scene_index] = cur;
      });
      setLikes(l);
      const c: Record<number, number> = {};
      (cs || []).forEach((r: any) => {
        c[r.scene_index] = (c[r.scene_index] || 0) + 1;
      });
      setCountComentarios(c);
    })();
  }, [boletimId, userId]);

  // Carrega comentários da cena atual quando abre a sheet
  useEffect(() => {
    if (!boletimId || !comentariosOpen) return;
    (async () => {
      const { data } = await supabase
        .from('boletim_comentarios')
        .select('id,autor_nome,texto,created_at,user_id')
        .eq('boletim_id', boletimId)
        .eq('scene_index', idx)
        .order('created_at', { ascending: false });
      setComentarios((data as any) || []);
    })();
  }, [boletimId, comentariosOpen, idx]);

  if (!scene && !youtubeUrl) return null;

  // Player do YouTube (prioridade quando houver link)
  if (youtubeUrl) {
    const videoId = youtubeUrl.replace(/.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/, '$1');
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col pt-[var(--sai-top)] pb-[var(--sai-bottom)]">
        <div className="relative z-10 flex items-center justify-end p-4 pt-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 pb-12">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Boletim Jurídico"
            className="w-full max-w-5xl aspect-video rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const goTo = (n: number) => {
    const clamped = Math.max(0, Math.min(scenes.length - 1, n));
    if (clamped === idx) return;
    setDirection(clamped > idx ? 1 : -1);
    setAudioProgress(0);
    setIdx(clamped);
    haptic.selection();
  };

  // Navegação por teclado no desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (comentariosOpen) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (idx + 1 < scenes.length) goTo(idx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (idx > 0) goTo(idx - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, scenes.length, comentariosOpen, onClose]);

  // Compartilhamento nativo ou cópia de link
  const compartilhar = async () => {
    haptic.selection();
    const texto = `${scene.titulo}\n\nVia Boletim Jurídico no Estudos Jurídicos.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: scene.titulo,
          text: texto,
          url: scene.url_fonte || window.location.href,
        });
        toast.success('Compartilhado com sucesso!');
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${scene.titulo}\n${scene.url_fonte || window.location.href}`);
        toast.success('Link copiado para a área de transferência!');
      } catch {
        toast.error('Não foi possível compartilhar');
      }
    }
  };

  // Variantes de transição fluida direcional com física spring
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 36 : -36,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.22 },
        scale: { duration: 0.22 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -36 : 36,
      opacity: 0,
      scale: 0.985,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.18 },
      },
    }),
  };

  const onEnded = () => {
    if (idx + 1 < scenes.length) {
      setDirection(1);
      setAudioProgress(0);
      setIdx(idx + 1);
    } else {
      setPlaying(false);
      import('@/lib/appEvents').then(({ appEvents }) =>
        appEvents.completeNarracao({ kind: 'boletim', id: boletimId })
      ).catch(() => {});
    }
  };

  const cor = scene.cor_hex || '#3B82F6';
  const progresso = ((idx + 1) / scenes.length) * 100;
  const duracaoTotalS = scenes.reduce((acc, s) => acc + (s.duracao_s || 8), 0);
  const totalMin = Math.floor(duracaoTotalS / 60);
  const totalSec = Math.round(duracaoTotalS % 60);
  const dataRefDate = dataRef ? new Date(`${dataRef}T12:00:00`) : new Date();
  const hoje = dataRefDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const likeAtual = likes[idx] || { count: 0, mine: false };
  const commentsCount = countComentarios[idx] || 0;

  const toggleLike = async () => {
    if (!boletimId) return;
    if (!userId) {
      toast.error('Entre para curtir');
      return;
    }
    // otimista
    setLikes((prev) => {
      const cur = prev[idx] || { count: 0, mine: false };
      return {
        ...prev,
        [idx]: { count: cur.mine ? cur.count - 1 : cur.count + 1, mine: !cur.mine },
      };
    });
    if (likeAtual.mine) {
      await supabase
        .from('boletim_likes')
        .delete()
        .eq('boletim_id', boletimId)
        .eq('scene_index', idx)
        .eq('user_id', userId);
    } else {
      const { error } = await supabase
        .from('boletim_likes')
        .insert({ boletim_id: boletimId, scene_index: idx, user_id: userId });
      if (error && !error.message.includes('duplicate')) toast.error('Erro ao curtir');
    }
  };

  const enviarComentario = async () => {
    if (!boletimId || !userId) {
      toast.error('Entre para comentar');
      return;
    }
    const texto = novoComentario.trim();
    if (!texto) return;
    setEnviandoComentario(true);
    const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
    const { data, error } = await supabase
      .from('boletim_comentarios')
      .insert({
        boletim_id: boletimId,
        scene_index: idx,
        user_id: userId,
        autor_nome: prof?.display_name || 'Usuário',
        texto,
      })
      .select('id,autor_nome,texto,created_at,user_id')
      .single();
    setEnviandoComentario(false);
    if (error) {
      toast.error('Erro ao comentar');
      return;
    }
    setComentarios((prev) => [data as any, ...prev]);
    setCountComentarios((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
    setNovoComentario('');
  };

  const abrirFonte = () => {
    if (scene.url_fonte) void abrirLink(scene.url_fonte);
    else toast.info('Fonte não disponível para esta cena');
  };


  const isNorma = scene.kind === 'norma';
  const isIntro = scene.kind === 'intro';
  const fonteLabel = (() => {
    if (!scene.url_fonte) return null;
    try {
      const host = new URL(scene.url_fonte).hostname.replace(/^www\./, '');
      const base = host.split('.')[0];
      if (!base) return null;
      return base.charAt(0).toUpperCase() + base.slice(1);
    } catch {
      return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0C] overflow-hidden flex flex-col">
      {/* Background Image: 100% Fullscreen APENAS na capa/intro */}
      {isIntro && (
        <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
          <motion.img
            key={`bg-img-${idx}`}
            src={scene.imagem_url || brasaoImg}
            alt=""
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: scene.duracao_s || 8, ease: 'linear' }}
            className="w-full h-full object-cover object-center"
          />
          {/* Scrim sutil para contraste mantendo a visibilidade do jornal */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/85 pointer-events-none" />
        </div>
      )}

      {/* Top bar com segmentos interativos de progresso e controles */}
      <div className="relative z-20 flex items-center gap-2.5 px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex-1 flex gap-1 items-center">
          {scenes.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="flex-1 h-3 -my-1 py-1 flex items-center group cursor-pointer"
              title={`Ir para notícia ${i + 1}`}
            >
              <div className="w-full h-1 rounded-full bg-white/20 group-hover:bg-white/35 transition overflow-hidden">
                <div
                  className={`h-full bg-white rounded-full ${
                    i === idx ? 'transition-[width] duration-150 ease-linear' : 'transition-all duration-200'
                  }`}
                  style={{
                    width:
                      i < idx
                        ? '100%'
                        : i === idx
                        ? `${Math.min(100, Math.max(3, audioProgress))}%`
                        : '0%',
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Som ambiente da trilha */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic.selection();
            setBgMuted((m) => !m);
          }}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-black/70 transition cursor-pointer text-white/80 hover:text-white"
          title={bgMuted ? 'Ativar música de fundo' : 'Silenciar música de fundo'}
        >
          {bgMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-white" />}
        </motion.button>

        {/* Fechar */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* Main content area com suporte a gestos de swipe e transições direcionais */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={idx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45 && idx < scenes.length - 1) {
                goTo(idx + 1);
              } else if (info.offset.x > 45 && idx > 0) {
                goTo(idx - 1);
              }
            }}
            className={`flex flex-col px-4 sm:px-6 pt-2 pb-36 touch-pan-y cursor-grab active:cursor-grabbing select-none ${
              isIntro ? 'justify-center min-h-full my-auto' : 'justify-start my-auto'
            }`}
          >
            {isIntro ? (
              /* Capa / Apresentação do Boletim */
              <div className="flex flex-col items-center text-center max-w-xl mx-auto select-none py-6">
                <img
                  src={brasaoImg}
                  alt="Brasão da República"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                />
                <span className="inline-block text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full mb-2 bg-black/50 backdrop-blur-md border border-white/15 text-white drop-shadow">
                  Boletim Jurídico
                </span>
                <h1 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-4">
                  {hoje}
                </h1>
                <p className="text-base sm:text-lg text-white font-body leading-relaxed max-w-lg mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  {scene.texto}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-white/90 text-xs bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    {totalMin > 0 ? `${totalMin}m ${totalSec.toString().padStart(2, '0')}s` : `${totalSec}s`}
                  </span>
                  <span className="text-white/40">·</span>
                  <span>{scenes.filter((s) => s.kind === 'norma').length} normas</span>
                </div>
              </div>
            ) : (
              /* Notícias / Normas: Imagem em formato deitado 16:9 no topo com botões embutidos na capa */
              <div className="w-full max-w-xl mx-auto flex flex-col">
                {scene.imagem_url && (
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl mb-4 shrink-0">
                    <motion.img
                      key={`news-img-${idx}`}
                      src={scene.imagem_url}
                      alt={scene.titulo || ''}
                      initial={{ scale: 1 }}
                      animate={{ scale: 1.05 }}
                      transition={{ duration: scene.duracao_s || 8, ease: 'linear' }}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Gradiente sutil para legibilidade dos badges no topo e botões na parte de baixo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/50 pointer-events-none" />

                    {/* Topo da capa: Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      {scene.tipo_label ? (
                        <span
                          className="text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md pointer-events-auto"
                          style={{ backgroundColor: cor, color: '#fff' }}
                        >
                          {scene.tipo_label}
                        </span>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {scene.imagem_credito?.autor && (
                          <span className="text-[9px] text-white/70 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 hidden sm:inline-block">
                            📷 {scene.imagem_credito.autor}
                          </span>
                        )}
                        {fonteLabel && (
                          <button
                            type="button"
                            onClick={abrirFonte}
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition shadow-lg cursor-pointer active:scale-95"
                          >
                            VIA {fonteLabel}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Parte de baixo da capa: Curtir, Comentar, Compartilhar e Ver norma */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={toggleLike}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition border text-white cursor-pointer shadow-lg ${
                            likeAtual.mine
                              ? 'bg-red-500/30 border-red-500/50 text-red-200'
                              : 'bg-black/65 hover:bg-black/85 border-white/20'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              likeAtual.mine ? 'text-red-500 fill-red-500 scale-110' : 'text-white/80'
                            }`}
                          />
                          <span className="text-xs font-semibold">{likeAtual.count}</span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            haptic.selection();
                            setComentariosOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md hover:bg-black/85 transition border border-white/20 text-white cursor-pointer shadow-lg"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white/80" />
                          <span className="text-xs font-semibold">{commentsCount}</span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={compartilhar}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-black/65 backdrop-blur-md hover:bg-black/85 transition border border-white/20 text-white/85 cursor-pointer shadow-lg"
                          title="Compartilhar notícia"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {scene.kind === 'norma' && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={abrirFonte}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary hover:brightness-110 transition shadow-lg shadow-primary/30 text-primary-foreground font-semibold text-xs cursor-pointer pointer-events-auto"
                        >
                          <span>Ver norma</span>
                          <ExternalLink className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback caso não haja imagem */}
                {!scene.imagem_url && (
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {scene.tipo_label && (
                        <span
                          className="text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1 rounded-full shadow"
                          style={{ backgroundColor: cor, color: '#fff' }}
                        >
                          {scene.tipo_label}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={toggleLike}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-white text-xs border border-white/10"
                      >
                        <Heart className={`w-3 h-3 ${likeAtual.mine ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                        <span>{likeAtual.count}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setComentariosOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-white text-xs border border-white/10"
                      >
                        <MessageCircle className="w-3 h-3 text-white/70" />
                        <span>{commentsCount}</span>
                      </button>
                      <button
                        type="button"
                        onClick={compartilhar}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-white/80 border border-white/10"
                        title="Compartilhar"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {fonteLabel && (
                        <button
                          type="button"
                          onClick={abrirFonte}
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-neutral-800 border border-white/15 text-white text-xs cursor-pointer"
                        >
                          VIA {fonteLabel}
                        </button>
                      )}
                      {scene.kind === 'norma' && (
                        <button
                          type="button"
                          onClick={abrirFonte}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer active:scale-95"
                        >
                          <span>Ver norma</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Título da Notícia */}
                <h1 className="font-display text-lg sm:text-2xl font-bold text-white leading-snug mb-2">
                  {scene.titulo}
                </h1>

                {/* Autor se houver */}
                {scene.autor_nome && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <User className="w-3 h-3 text-red-400" />
                    </div>
                    <span className="text-xs font-semibold text-red-400 tracking-wide uppercase">
                      {scene.autor_nome}
                    </span>
                  </div>
                )}

                {/* Texto da Notícia */}
                <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-body whitespace-pre-wrap">
                  {scene.texto}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black via-black/85 to-transparent pt-12 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] px-6 pointer-events-none">
        <div className="flex items-center justify-center gap-6 md:gap-8 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition cursor-pointer"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              haptic.selection();
              setPlaying((p) => !p);
            }}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
          >
            {playing ? <Pause className="w-7 h-7 text-black fill-black" /> : <Play className="w-7 h-7 text-black ml-1 fill-black" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => goTo(idx + 1)}
            disabled={idx === scenes.length - 1}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition cursor-pointer"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        <p className="text-center text-white/70 text-xs mt-3 font-medium pointer-events-auto drop-shadow">
          {idx + 1} de {scenes.length} · {Math.round(progresso)}%
        </p>
        {isIntro && scene.imagem_credito?.autor && (
          <p className="text-center text-white/50 text-[10px] mt-1.5 pointer-events-auto max-w-[280px] mx-auto truncate drop-shadow">
            📷 {scene.imagem_credito.autor}
            {scene.imagem_credito.licenca && ` · ${scene.imagem_credito.licenca}`}
            {' · Openverse'}
          </p>
        )}
      </div>

      {/* Bottom sheet de comentários */}
      <AnimatePresence>
        {comentariosOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComentariosOpen(false)}
              className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 right-0 bottom-0 z-[70] h-[75vh] bg-neutral-900 rounded-t-3xl flex flex-col border-t border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-semibold text-white ml-2">Comentários</h3>
                <button
                  onClick={() => setComentariosOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {comentarios.length === 0 && (
                  <div className="text-center text-white/40 text-sm py-12 flex flex-col items-center">
                    <MessageCircle className="w-8 h-8 mb-3 opacity-50" />
                    <p>Seja o primeiro a comentar.</p>
                  </div>
                )}
                {comentarios.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/30">
                      {(c.autor_nome || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{c.autor_nome || 'Usuário'}</span>
                        <span className="text-white/40 text-[11px]">• {new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-white/90 text-[15px] font-body leading-relaxed">{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5 flex gap-3 items-center bg-black/20">
                <input
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
                  placeholder={userId ? 'Escreva um comentário…' : 'Entre para comentar'}
                  disabled={!userId || enviandoComentario}
                  className="flex-1 bg-white/10 text-white placeholder:text-white/50 rounded-full px-5 py-3 text-sm outline-none disabled:opacity-50 border border-transparent focus:border-white/20 transition"
                />
                <button
                  onClick={enviarComentario}
                  disabled={!userId || enviandoComentario || !novoComentario.trim()}
                  className="w-12 h-12 shrink-0 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 disabled:grayscale transition"
                >
                  {enviandoComentario ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <audio ref={audioRef} onEnded={onEnded} onTimeUpdate={handleTimeUpdate} preload="auto" playsInline />
      <audio ref={bgAudioRef} src="/news-bg.mp3" preload="auto" loop playsInline />
    </div>
  );
}