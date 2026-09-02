import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Pill, Headphones, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { NativePilulasPlugin } from '@/plugins/NativePilulasPlugin';

function formatTime(timeInSeconds: number) {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function PilulaItem({ 
  livro, 
  itemVariants, 
  navigate 
}: { 
  livro: LivroNormalizado, 
  itemVariants: any, 
  navigate: (path: string) => void 
}) {
  const [duration, setDuration] = useState<number | null>(null);
  const temAudio = !!livro.audioResumoUrl;
  
  const wordCount = (livro.analiseDetalhada || livro.sobre || '').split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));
  const savedProgress = localStorage.getItem(`pilula_progress_${livro.id}`);
  const progressRatio = savedProgress ? parseFloat(savedProgress) : 0;
  
  const displayTime = duration 
    ? (progressRatio > 0 ? `${formatTime(progressRatio * duration)} / ${formatTime(duration)}` : `${Math.ceil(duration / 60)} min`)
    : `~${estimatedMinutes} min`;

  return (
    <motion.button
      variants={itemVariants}
      whileHover={temAudio ? { scale: 1.015 } : {}}
      whileTap={temAudio ? { scale: 0.98 } : {}}
      onClick={() => {
        if (!temAudio) {
          toast('Pílula em produção', {
            description: 'O áudio para este clássico estará disponível em breve.',
            icon: <AlertCircle className="w-4 h-4 text-orange-500" />
          });
          return;
        }
        navigate(`/pilulas/${livro.id}`);
      }}
      className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border text-left overflow-hidden transition-all ${
        temAudio
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed grayscale-[0.5]'
      }`}
    >
      {temAudio && (
        <audio 
          src={livro.audioResumoUrl} 
          preload="metadata" 
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} 
          className="hidden" 
        />
      )}
      {/* Capa */}
      <div className="w-16 h-24 rounded-lg bg-white/5 shrink-0 overflow-hidden shadow-md">
        {livro.capa ? (
          <img src={livro.capa} alt={livro.titulo} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-[10px] uppercase text-center p-1">
            Sem<br/>Capa
          </div>
        )}
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-1">
        <h3 className={`font-semibold text-base leading-tight truncate ${temAudio ? 'text-white' : 'text-white/60'}`}>
          {livro.titulo}
        </h3>
        {livro.autor && (
          <p className="text-xs text-white/50 mt-1 truncate">{livro.autor}</p>
        )}

        <div className="mt-auto pt-3">
          {temAudio ? (
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors bg-primary/15 text-primary group-hover:bg-primary/20`}>
                  <Headphones className="w-3 h-3" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold text-primary`}>
                  {progressRatio > 0.95 ? 'Concluída' : progressRatio > 0 ? 'Continuar' : 'Ouvir Pílula'}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-medium text-white/40">
                  {displayTime}
                </span>
                {progressRatio > 0 && (
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                Em breve
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function Pilulas() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const { tocar, livroAtual, tocando, togglePlay } = useResumoLivroPlayer();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const launch = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          await NativePilulasPlugin.openPilulasDashboard({
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token
          });
          navigate(-1);
        } catch (e) {
          console.error(e);
          navigate(-1);
        }
      };
      launch();
    }
  }, [navigate]);

  const { data: livros = [], isLoading: loading } = useQuery({
    queryKey: ['pilulas', 'classicos'],
    queryFn: async () => {
      const classicosCol = COLECOES.find((c) => c.id === 'classicos');
      if (!classicosCol) return [];

      const { data, error } = await supabase
        .from(classicosCol.table as any)
        .select(classicosCol.select)
        .order('id');

      if (error) throw error;
      return (data || []).map((row) => normalizeLivro(row, classicosCol));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24 // 24 hours
  });

  const livrosFiltrados = busca
    ? livros.filter(
        (l) =>
          l.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          (l.autor && l.autor.toLowerCase().includes(busca.toLowerCase()))
      )
    : livros;

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  if (Capacitor.isNativePlatform()) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-primary animate-spin mb-4" />
        <h2 className="text-lg font-bold font-display text-white">Iniciando Ambiente Nativo...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-32">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top))] px-4 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Pílulas de Áudio
            </h1>
            <p className="text-xs text-white/50">Aprenda a essência dos clássicos em minutos</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar clássicos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Lista de Livros */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
            <p className="text-sm">Carregando acervo...</p>
          </div>
        ) : livrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <BookOpen className="w-12 h-12 opacity-20 mb-4" />
            <p>Nenhuma pílula encontrada.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            {livrosFiltrados.map((livro) => {
              return (
                <PilulaItem 
                  key={livro.id} 
                  livro={livro} 
                  itemVariants={itemVariants} 
                  navigate={navigate} 
                />
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
