import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Pill, Headphones, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { directImg } from '@/lib/cdnImg';
import ShapeGrid from '@/components/ui/ShapeGrid';


function formatTime(timeInSeconds: number) {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function PilulaItem({ 
  artigo, 
  navigate,
  config
}: { 
  artigo: any, 
  navigate: (path: string) => void,
  config: any
}) {
  const [duration, setDuration] = useState<number | null>(null);
  const temAudio = !!artigo.audio_pilula_url;
  
  const wordCount = (artigo.texto || '').split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));
  const savedProgress = localStorage.getItem(`pilula_progress_${artigo.id}`);
  const progressRatio = savedProgress ? parseFloat(savedProgress) : 0;
  
  const displayTime = duration 
    ? (progressRatio > 0 ? `${formatTime(progressRatio * duration)} / ${formatTime(duration)}` : `${Math.ceil(duration / 60)} min`)
    : `~${estimatedMinutes} min`;

  return (
    <motion.button
      whileHover={temAudio ? { scale: 1.015 } : {}}
      whileTap={temAudio ? { scale: 0.98 } : {}}
      onClick={() => {
        if (!temAudio) {
          toast('Pílula em produção', {
            description: 'O áudio para este artigo estará disponível em breve.',
            icon: <AlertCircle className="w-4 h-4 text-orange-500" />
          });
          return;
        }
        navigate(`/pilulas/${artigo.id}?type=${config.slug}`);
      }}
      className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border text-left overflow-hidden transition-all ${
        temAudio
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed grayscale-[0.5]'
      }`}
    >
      {temAudio && (
        <audio 
          src={artigo.audio_pilula_url} 
          preload="metadata" 
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} 
          className="hidden" 
        />
      )}
      {/* Capa */}
      <div className="w-16 h-24 rounded-lg bg-white/5 shrink-0 overflow-hidden shadow-md">
        <img 
          src={config.cover} 
          alt={config.title} 
          className="w-full h-full object-cover" 
          loading="eager" 
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop' }} 
        />
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-1">
        <h3 className={`font-semibold text-base leading-tight truncate ${temAudio ? 'text-white' : 'text-white/60'}`}>
          Artigo {artigo.numero}
        </h3>
        <p className="text-xs text-white/50 mt-1 truncate">{config.title}</p>

        <div className="mt-auto pt-3">
          {temAudio ? (
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${config.colorClasses} group-hover:bg-white/10`}>
                  <Headphones className="w-3 h-3" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${config.textColorClass}`}>
                  {progressRatio > 0.95 ? 'Concluída' : progressRatio > 0 ? 'Continuar' : 'Ouvir Pílula'}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-medium text-white/40">
                  {displayTime}
                </span>
                {progressRatio > 0 && (
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${config.progressColorClass} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }} />
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

const CONFIG_MAP = {
  cp: {
    slug: 'cp',
    title: 'Código Penal',
    subtitle: 'Ouça a explicação dos artigos',
    cover: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'),
    colorClasses: 'bg-[#FF3B30]/15 text-[#FF3B30]',
    textColorClass: 'text-[#FF3B30]',
    progressColorClass: 'bg-[#FF3B30]',
    iconColor: 'text-[#FF3B30]',
    inputFocusClass: 'focus:border-[#FF3B30]/50'
  },
  cf: {
    slug: 'cf',
    title: 'Constituição Federal',
    subtitle: 'Aprenda a base do Estado',
    cover: '/pilulas/cf_portrait.jpg',
    colorClasses: 'bg-blue-500/15 text-blue-400',
    textColorClass: 'text-blue-400',
    progressColorClass: 'bg-blue-500',
    iconColor: 'text-blue-500',
    inputFocusClass: 'focus:border-blue-500/50'
  },
  cc: {
    slug: 'cc',
    title: 'Código Civil',
    subtitle: 'Entenda os direitos civis',
    cover: '/pilulas/cc_portrait.png',
    colorClasses: 'bg-amber-500/15 text-amber-400',
    textColorClass: 'text-amber-400',
    progressColorClass: 'bg-amber-500',
    iconColor: 'text-amber-500',
    inputFocusClass: 'focus:border-amber-500/50'
  }
};

export default function PilulasLeiSeca({ slug }: { slug: 'cp' | 'cf' | 'cc' }) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const config = CONFIG_MAP[slug];



  const { data: artigos = [], isLoading: loading } = useQuery({
    queryKey: ['pilulas', 'lei', slug],
    queryFn: async () => {
      const { data: leiData, error: leiError } = await supabase
        .from('vade_mecum_leis')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (leiError || !leiData) {
        throw new Error(`Erro ao buscar ID do ${slug}`);
      }
      
      const { data, error } = await supabase
        .from('vade_mecum_artigos')
        .select('id, numero, texto, audio_pilula_url, ordem')
        .eq('lei_id', leiData.id)
        .ilike('texto', 'Art.%')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24 // 24 hours
  });

  const artigosFiltrados = busca
    ? artigos.filter(
        (a) =>
          a.numero.toLowerCase().includes(busca.toLowerCase()) ||
          (a.texto && a.texto.toLowerCase().includes(busca.toLowerCase()))
      )
    : artigos;

  const artigosVirtualizer = useWindowVirtualizer({
    count: artigosFiltrados.length,
    estimateSize: () => 130, // Estimate for the Pill card + gap
    overscan: 5,
  });



  return (
    <div className="min-h-dvh bg-zinc-950 text-white pb-32 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Pill className={`w-5 h-5 ${config.iconColor}`} />
              {config.title}
            </h1>
            <p className="text-xs text-white/50">{config.subtitle}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por artigo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none transition-colors ${config.inputFocusClass}`}
          />
        </div>
      </div>

      {/* Lista de Artigos */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse">
                <div className="w-16 h-24 rounded-lg bg-white/10 shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  <div className="pt-3 flex items-center justify-between">
                    <div className="h-6 w-24 bg-white/10 rounded-full"></div>
                    <div className="h-8 w-8 bg-white/10 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : artigosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <BookOpen className="w-12 h-12 opacity-20 mb-4" />
            <p>Nenhuma pílula encontrada.</p>
          </div>
        ) : (
          <div
            className="w-full relative"
            style={{ height: `${artigosVirtualizer.getTotalSize()}px` }}
          >
            {artigosVirtualizer.getVirtualItems().map((virtualItem) => {
              const artigo = artigosFiltrados[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={artigosVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="pb-3">
                    <PilulaItem 
                      artigo={artigo} 
                      navigate={navigate}
                      config={config}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
