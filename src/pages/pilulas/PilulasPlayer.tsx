import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Volume2, BookOpen, AlertCircle, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import ReactMarkdown from 'react-markdown';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { clearMediaSession } from '@/lib/mediaSession';
import { toast } from 'sonner';

export default function PilulasPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [livro, setLivro] = useState<LivroNormalizado | null>(null);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const textoPuro = livro?.analiseDetalhada || livro?.sobre || '';
  const paragraphs = useMemo(() => {
    const parts = textoPuro.split(/\n+/).filter(p => p.trim().length > 0);
    let accumulated = 0;
    const totalChars = parts.reduce((acc, p) => acc + p.length, 0);
    
    return parts.map(p => {
      const start = accumulated / Math.max(1, totalChars);
      accumulated += p.length;
      const end = accumulated / Math.max(1, totalChars);
      return { text: p, start, end };
    });
  }, [textoPuro]);

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
    if (audioRef.current && livro?.audioResumoUrl) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [livro?.audioResumoUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setProgress(cur);
      if (id && dur > 0) {
        localStorage.setItem(`pilula_progress_${id}`, String(cur / dur));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
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
            clearMediaSession(audioRef.current);
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

      {/* Main Content (Artwork + Text) */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center mt-6"
        >
          {/* Capa */}
          <div className="w-48 h-72 sm:w-64 sm:h-96 rounded-xl bg-white/5 overflow-hidden shadow-2xl mb-8 border border-white/10">
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
            <p className="text-sm text-white/50 text-center mb-6">{livro.autor}</p>
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
                         if (audioRef.current && duration > 0) {
                            audioRef.current.currentTime = cap.percentage * duration;
                            audioRef.current.play().catch(()=>setIsPlaying(false));
                            setIsPlaying(true);
                         }
                      }}
                      className={`shrink-0 snap-start px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isActive 
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

          {/* Teleprompter Text Area */}
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-wider uppercase text-white/70">
                  Acompanhe a Narração
                </h3>
              </div>
            </div>
            
            <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-lg max-w-none space-y-6">
              {paragraphs.length > 0 ? paragraphs.map((p, i) => {
                const progressRatio = duration > 0 ? progress / duration : 0;
                // Ajuste leve nos limites para considerar a transição natural da fala
                const isActive = progressRatio >= Math.max(0, p.start - 0.02) && progressRatio <= (p.end + 0.02);
                const isPast = progressRatio > (p.end + 0.02);
                
                return (
                  <div 
                    key={i} 
                    className={`transition-all duration-500 ease-out ${
                      isActive 
                        ? 'text-white scale-[1.02] transform origin-left drop-shadow-md' 
                        : isPast 
                          ? 'text-white/40' 
                          : 'text-white/20'
                    }`}
                  >
                    <ReactMarkdown>{p.text}</ReactMarkdown>
                  </div>
                );
              }) : "O texto desta pílula ainda não está disponível."}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Player Controls (Fixed Bottom) */}
      <div className="relative z-20 shrink-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/10 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-4 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Audio Tag */}
          <audio
            ref={audioRef}
            src={livro.audioResumoUrl || ""}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />

          {/* Progress */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[11px] font-medium text-white/50 w-8 text-right">
              {formatTime(progress)}
            </span>
            <div
              className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (audioRef.current) {
                  audioRef.current.currentTime = percent * duration;
                  setProgress(audioRef.current.currentTime);
                }
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear group-hover:bg-primary/90"
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-white/50 w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-bold">-15s</span>
            </button>

            <button
              onClick={togglePlay}
              disabled={!livro.audioResumoUrl}
              className={`w-16 h-16 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 ${!livro.audioResumoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-bold">+15s</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
