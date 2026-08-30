import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { clearMediaSession } from '@/lib/mediaSession';
import { toast } from 'sonner';

const INTRO_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/audio-intro.mp3';

export default function PilulasPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [livro, setLivro] = useState<LivroNormalizado | null>(null);
  const [loading, setLoading] = useState(true);

  const audioIntroRef = useRef<HTMLAudioElement>(null);
  const audioMainRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [phase, setPhase] = useState<'intro' | 'main'>('intro');
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  const activeRef = phase === 'intro' ? audioIntroRef : audioMainRef;

  // Parar o player global se ele estiver tocando pílulas para não conflitar
  const { fechar: fecharPlayerGlobal } = useResumoLivroPlayer();

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
    setDuration(0);
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

  const togglePlay = () => {
    const el = activeRef.current;
    if (el) {
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        el.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    const el = activeRef.current;
    if (el) {
      setProgress(el.currentTime);
      if (phase === 'main' && id && el.duration > 0) {
        localStorage.setItem(`pilula_progress_${id}`, String(el.currentTime / el.duration));
      }
    }
  };

  const handleLoadedMetadata = () => {
    const el = activeRef.current;
    if (el) {
      setDuration(el.duration);
    }
  };

  const handleIntroEnded = () => {
    setPhase('main');
    setHasPlayedIntro(true);
    setProgress(0);
    setDuration(0);
    // Timeout para garantir que o react renderizou o ref do main
    setTimeout(() => {
       if (audioMainRef.current) {
          audioMainRef.current.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
       }
    }, 50);
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
      <div className="relative z-10 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-4 shrink-0 flex items-center">
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] no-scrollbar overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center w-full max-w-md"
        >
          {/* Capa */}
          <div className="w-56 h-80 sm:w-72 sm:h-[400px] rounded-2xl bg-white/5 overflow-hidden shadow-2xl mb-8 border border-white/10">
            {livro.capa ? (
              <img src={livro.capa} alt={livro.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
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
                  const isActive = (progress / (duration || 1)) >= cap.percentage && 
                                   (i === livro.sumarioAudio!.length - 1 || (progress / (duration || 1)) < livro.sumarioAudio![i + 1].percentage);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                         const el = activeRef.current;
                         // Apenas navega se já estiver tocando o áudio principal
                         if (phase === 'main' && el && duration > 0) {
                            el.currentTime = cap.percentage * duration;
                            el.play().catch(()=>setIsPlaying(false));
                            setIsPlaying(true);
                         }
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
          {!hasPlayedIntro && (
            <audio
              ref={audioIntroRef}
              src={INTRO_URL}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleIntroEnded}
              preload="metadata"
            />
          )}

          {/* Audio Tag: Main */}
          <audio
            ref={audioMainRef}
            src={livro.audioResumoUrl || ""}
            onTimeUpdate={phase === 'main' ? handleTimeUpdate : undefined}
            onLoadedMetadata={phase === 'main' ? handleLoadedMetadata : undefined}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />

          {/* Soundwave Animation */}
          <div className="flex items-center justify-center gap-1.5 h-12 mb-8">
            {[
              ["20%", "60%", "30%", "80%", "20%"],
              ["30%", "80%", "20%", "100%", "30%"],
              ["40%", "100%", "50%", "60%", "40%"],
              ["20%", "70%", "40%", "90%", "20%"],
              ["50%", "30%", "100%", "50%", "50%"],
              ["20%", "70%", "40%", "90%", "20%"],
              ["40%", "100%", "50%", "60%", "40%"],
              ["30%", "80%", "20%", "100%", "30%"],
              ["20%", "60%", "30%", "80%", "20%"],
            ].map((heights, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                animate={
                  isPlaying 
                    ? { height: heights }
                    : { height: "15%" }
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.1,
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
                const el = activeRef.current;
                if (el) {
                  el.currentTime = percent * duration;
                  setProgress(el.currentTime);
                }
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear group-hover:bg-primary/90"
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-white/50 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => {
                const el = activeRef.current;
                if (el) {
                  el.currentTime = Math.max(0, el.currentTime - 15);
                }
              }}
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
              onClick={() => {
                const el = activeRef.current;
                if (el) {
                  el.currentTime = Math.min(duration, el.currentTime + 15);
                }
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-bold">+15s</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
