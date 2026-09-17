import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PodcastsCarousel = () => {
  const navigate = useNavigate();

  const { data: podcasts, isLoading, error } = useQuery({
    queryKey: ['tv_justica_podcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_justica_podcasts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !podcasts || podcasts.length === 0) {
    return null; // Se não tiver podcast, esconde silenciosamente
  }

  return (
    <div className="w-full mt-8 mb-4">
      <div className="px-4 mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-sans text-white text-[16px] font-bold flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-red-500" />
            Podcasts TV Justiça
          </h3>
          <p className="font-body text-white/50 text-[12.5px] leading-snug ml-3 mt-0.5">
            Episódios completos e atualizados
          </p>
        </div>
        <button 
          onClick={() => navigate('/tres-poderes/stf/podcasts')}
          className="text-[12px] font-semibold text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform mt-0.5"
        >
          Ver todos
        </button>
      </div>
      
      {/* Carrossel Horizontal Nativo com Snap */}
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pl-4 pr-4 gap-4 pb-4">
        {podcasts.map((podcast) => (
          <div 
            key={podcast.id}
            onClick={() => navigate(`/tres-poderes/stf/podcast/${podcast.youtube_video_id}`)}
            className="snap-start flex-none w-[240px] sm:w-[280px] rounded-xl overflow-hidden bg-[#1A1A1D] border border-white/5 relative group cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video w-full bg-black/50 overflow-hidden">
              <img 
                src={podcast.thumbnail_url || `https://img.youtube.com/vi/${podcast.youtube_video_id}/mqdefault.jpg`} 
                alt={podcast.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" strokeWidth={1.5} />
              </div>
            </div>
            
            {/* Info Box */}
            <div className="p-3">
              <h4 className="font-body text-white/90 text-[13px] font-medium line-clamp-2 leading-snug mb-1">
                {podcast.title}
              </h4>
              <p className="font-sans text-white/40 text-[11px]">
                {new Date(podcast.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastsCarousel;
