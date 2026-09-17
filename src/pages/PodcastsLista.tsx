import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';

const PodcastsLista = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      const { data, error } = await supabase
        .from('tv_justica_podcasts')
        .select('*')
        .order('published_at', { ascending: false });
        
      if (!error && data) {
        setPodcasts(data);
      }
      setLoading(false);
    };
    fetchPodcasts();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0A0A0A] pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-4 flex items-center gap-3 border-b border-white/5 shadow-md">
        <button 
          onClick={() => { haptic.selection(); navigate(-1); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-white leading-tight">Podcasts TV Justiça</h1>
          <p className="text-[12px] text-white/50">Todos os episódios</p>
        </div>
      </header>

      {/* Lista */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {loading ? (
          <div className="w-full py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="w-full py-12 text-center text-white/50">
            Nenhum podcast encontrado.
          </div>
        ) : (
          podcasts.map((podcast) => (
            <div 
              key={podcast.id}
              onClick={() => {
                haptic.selection();
                navigate(`/tres-poderes/stf/podcast/${podcast.youtube_video_id}`);
              }}
              className="flex gap-4 p-3 rounded-xl bg-[#1A1A1D] border border-white/5 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                <img 
                  src={podcast.thumbnail_url || `https://img.youtube.com/vi/${podcast.youtube_video_id}/mqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <h3 className="text-white text-[14px] font-semibold line-clamp-2 leading-snug mb-1.5">
                  {podcast.title}
                </h3>
                <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(podcast.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default PodcastsLista;
