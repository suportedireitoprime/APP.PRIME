import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { clearMediaSession } from '@/lib/mediaSession';
import { toast } from 'sonner';
import { useGatedFeature } from '@/hooks/useGatedFeature';

const INTRO_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/audio-intro-2.mp3';

export default function PilulasPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [livro, setLivro] = useState<LivroNormalizado | null>(null);
  const [loading, setLoading] = useState(true);

  const audioIntroRef = useRef<HTMLAudioElement>(null);
  const audioMainRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [introDuration, setIntroDuration] = useState(0);
  const [mainDuration, setMainDuration] = useState(0);
  
  const [phase, setPhase] = useState<'intro' | 'main'>('intro');
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  const activeRef = phase === 'intro' ? audioIntroRef : audioMainRef;
  const introOverlap = Math.max(0, introDuration - 0.5);
  const unifiedDuration = (introDuration > 0 && mainDuration > 0) ? (introOverlap + mainDuration) : (introDuration || mainDuration || 0);

  // Parar o player global se ele estiver tocando pílulas para não conflitar
  const { fechar: fecharPlayerGlobal } = useResumoLivroPlayer();

  const featurePilulas = useGatedFeature('pilulas', 'pilulas', { scope: id, refKey: id });

  useEffect(() => {
    // Ao abrir esta tela dedicada, paramos o mini player global de pílulas se estiver aberto
    fecharPlayerGlobal();
  }, [fecharPlayerGlobal]);

  useEffect(() => {
    async function fetchPilula() {
      if (!id) return;
      try {
        const classicosCol = COLECOES.find((c) => c.id === 'classicos');
        if (!classicosCol) return;

        const { data, error } = await supabase
          .from(classicosCol.table as any)
          .select(classicosCol.select)
          .eq('id', id)
          .single();

        if (error) throw error;

        const normalizado = normalizeLivro(data, classicosCol);
        setLivro(normalizado);

        if (!normalizado.audioResumoUrl) {
           toast.error('O áudio desta pílula ainda não está disponível.');
        }
      } catch (error) {
        console.error('Erro ao buscar pílula:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPilula();
  }, [id]);

  useEffect(() => {
    // Reset state when src changes
    setIsPlaying(false);
    setProgress(0);
    setIntroDuration(0);
    setMainDuration(0);
    setPhase('intro');
    setHasPlayedIntro(false);
    
    if (audioMainRef.current && livro?.audioResumoUrl) {
      audioMainRef.current.pause();
      audioMainRef.current.currentTime = 0;
      audioMainRef.current.load();
    }
    if (audioIntroRef.current) {
      audioIntroRef.current.pause();
      audioIntroRef.current.currentTime = 0;
      audioIntroRef.current.load();
    }
  }, [livro?.audioResumoUrl]);

  const skipToMain = () => {
    // Prevent multiple calls if already transitioning
    if (hasPlayedIntro) return;
    
    setPhase('main');
    setHasPlayedIntro(true);
    if (audioMainRef.current) {
      // Manually read duration since onLoadedMetadata may have already fired
      if (audioMainRef.current.duration && !isNaN(audioMainRef.current.duration)) {
        setMainDuration(audioMainRef.current.duration);
      }
      
      audioMainRef.current.volume = 0; // Prepare for fade-in
      audioMainRef.current.play().then(() => {
        setIsPlaying(true);
        // Fade in over 1 second
        let vol = 0;
        const fadeInterval = setInterval(() => {
          vol += 0.05;
          if (vol >= 1) {
            vol = 1;
            clearInterval(fadeInterval);
          }
          if (audioMainRef.current) {
            audioMainRef.current.volume = vol;
          }
        }, 50);
      }).catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    featurePilulas.run(() => {
      if (isPlaying) {
        // Pause whatever is active
        activeRef.current?.pause();
        setIsPlaying(false);
      } else {
        // First play ever? Try intro first
        if (phase === 'intro' && !hasPlayedIntro) {
          const introEl = audioIntroRef.current;
          if (introEl) {
            introEl.play().then(() => {
               setIsPlaying(true);
            }).catch((err) => {
              console.warn('Intro falhou, pulando para main:', err);
              skipToMain();
            });
          }
        } else {
          // Main phase: play main audio
          const mainEl = audioMainRef.current;
          if (mainEl) {
            mainEl.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
          }
        }
      }
    });
  };

  const handleTimeUpdate = () => {
    const el = activeRef.current;
    if (el) {
      if (phase === 'intro') {
        setProgress(el.currentTime);
      } else {
        setProgress(introOverlap + el.currentTime);
      }
      
      // Logic for Intro phase: start main audio 0.5s before intro ends
      if (phase === 'intro' && !hasPlayedIntro) {
        if (el.duration > 0 && el.currentTime >= el.duration - 0.5) {
          skipToMain();
        }
      }
      
      if (phase === 'main' && id && mainDuration > 0) {
        localStorage.setItem(`pilula_progress_${id}`, String(el.currentTime / mainDuration));
      }
    }
  };

  const handleSeek = (newUnifiedTime: number) => {
    const target = Math.max(0, Math.min(newUnifiedTime, unifiedDuration));
    
    if (target < introOverlap) {
      if (phase === 'main') {
        audioMainRef.current?.pause();
        setPhase('intro');
        setHasPlayedIntro(false);
      }
      if (audioIntroRef.current) {
        audioIntroRef.current.currentTime = target;
        setProgress(target);
        if (isPlaying) audioIntroRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (phase === 'intro') {
        audioIntroRef.current?.pause();
        setPhase('main');
        setHasPlayedIntro(true);
      }
      if (audioMainRef.current) {
        audioMainRef.current.currentTime = target - introOverlap;
        setProgress(target);
        if (isPlaying) {
          audioMainRef.current.volume = 1; // remove fade if scrubbing
          audioMainRef.current.play().catch(() => setIsPlaying(false));
        }
      }
    }
  };

  const handleMainLoadedMetadata = () => {
    if (audioMainRef.current && !isNaN(audioMainRef.current.duration)) {
      setMainDuration(audioMainRef.current.duration);
    }
  };

  const handleIntroEnded = () => {
    skipToMain();
  };

  const handleIntroError = () => {
    // Intro failed to load — skip directly to main audio
    skipToMain();
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Pílula não encontrada</h2>
        <p className="text-white/50 mb-6">O conteúdo solicitado não existe ou foi removido.</p>
        <button
          onClick={() => navigate('/pilulas')}
          className="px-6 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          Voltar para Acervo
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] text-white overflow-hidden flex flex-col">
      {/* Background Blur */}
      {livro.capa && (
        <div className="absolute inset-0 z-0">
          <img
            src={livro.capa}
            alt=""
            className="w-full h-full object-cover opacity-[0.15] blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/50 via-[#0D0D0D]/80 to-[#0D0D0D]" />
        </div>
      )}

      {/* Header Fixo */}
      <div className="relative z-10 pt-[calc(1.25rem+var(--sai-top))] px-4 pb-4 shrink-0 flex items-center">
        <button
          onClick={() => {
            clearMediaSession(audioMainRef.current);
            navigate(-1);
          }}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Pílulas de Áudio
          </span>
        </div>
      </div>

      {/* Main Content (Artwork + Controls) */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-4 pb-[calc(2rem+var(--safe-bottom))] no-scrollbar overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center w-full max-w-md mt-4 sm:mt-12 mb-8"
        >
          {/* Capa */}
          <div className="w-56 sm:w-72 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10 shrink-0 bg-black/40">
            {livro.capa ? (
              <img src={livro.capa} alt={livro.titulo} className="w-full h-auto block" />
            ) : (
              <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">
                <BookOpen className="w-16 h-16" />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 leading-tight">
            {livro.titulo}
          </h1>
          {livro.autor && (
            <p className="text-base text-white/50 text-center mb-8">{livro.autor}</p>
          )}

          {livro.sumarioAudio && livro.sumarioAudio.length > 0 && (
            <div className="w-full max-w-2xl mb-8">
              <div className="flex items-center gap-2 mb-3 px-2">
                <List className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">Capítulos</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
                {livro.sumarioAudio.map((cap, i) => {
                  const currentPercent = progress / (unifiedDuration || 1);
                  const isActive = currentPercent >= cap.percentage && 
                                   (i === livro.sumarioAudio!.length - 1 || currentPercent < livro.sumarioAudio![i + 1].percentage);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                         // As porcentagens do sumário são baseadas no áudio principal apenas (já que o backend as gerou assim).
                         // Então transformamos a porcentagem de volta pro tempo do áudio principal e depois para o tempo unificado.
                         const targetMainTime = cap.percentage * (mainDuration || 0);
                         handleSeek(introOverlap + targetMainTime);
                         if (!isPlaying) togglePlay();
                      }}
                      className={`shrink-0 snap-start px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isActive && phase === 'main'
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {cap.titulo}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audio Tag: Intro */}
          {phase === 'intro' && (
            <audio
              ref={audioIntroRef}
              src={INTRO_URL}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (audioIntroRef.current) {
                  setIntroDuration(audioIntroRef.current.duration);
                }
              }}
              onEnded={handleIntroEnded}
              onError={handleIntroError}
              preload="auto"
            />
          )}

          {/* Audio Tag: Main */}
          <audio
            ref={audioMainRef}
            src={livro.audioResumoUrl || ""}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMainLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />

          {/* Soundwave Animation */}
          <div className="flex items-center justify-center gap-1 h-12 mb-8">
            {[
              { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
              { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
              { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
              { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
              { anim: ["80%", "20%", "90%", "40%", "80%"], paused: "80%" },
              { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
              { anim: ["100%", "40%", "80%", "30%", "100%"], paused: "100%" },
              { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
              { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
              { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
              { anim: ["50%", "20%", "80%", "30%", "50%"], paused: "50%" },
            ].map((wave, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                animate={{ height: isPlaying ? wave.anim : wave.paused }}
                transition={{
                  duration: isPlaying ? 0.5 + (i % 3) * 0.1 : 0.3,
                  repeat: isPlaying ? Infinity : 0,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: isPlaying ? i * 0.05 : 0,
                }}
              />
            ))}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-10 w-full">
            <span className="text-[11px] font-medium text-white/50 w-10 text-right">
              {formatTime(progress)}
            </span>
            <div
              className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * unifiedDuration);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear group-hover:bg-primary/90"
                style={{ width: `${(progress / (unifiedDuration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-white/50 w-10">
              {formatTime(unifiedDuration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => handleSeek(progress - 15)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-bold">-15s</span>
            </button>

            <button
              onClick={togglePlay}
              disabled={!livro.audioResumoUrl}
              className={`w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 ${!livro.audioResumoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current ml-1.5" />
              )}
            </button>

            <button
              onClick={() => handleSeek(progress + 15)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-bold">+15s</span>
            </button>
          </div>
        </motion.div>
      </div>
      {featurePilulas.gateNode}
    </div>
  );
}
