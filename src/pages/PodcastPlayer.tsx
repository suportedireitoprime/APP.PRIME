import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';

const PodcastPlayer = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [podcast, setPodcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcast = async () => {
      if (!videoId) return;
      const { data, error } = await supabase
        .from('tv_justica_podcasts')
        .select('*')
        .eq('youtube_video_id', videoId)
        .single();
        
      if (!error && data) {
        setPodcast(data);
      }
      setLoading(false);
    };
    void fetchPodcast().catch(console.error);
  }, [videoId]);

  const handleShare = async () => {
    haptic.selection();
    if (navigator.share && podcast) {
      try {
        await navigator.share({
          title: podcast.title,
          text: 'Ouça este podcast da TV Justiça no aplicativo!',
          url: `https://youtube.com/watch?v=${podcast.youtube_video_id}`,
        });
      } catch (e) {
        console.log('Error sharing', e);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex min-h-screen bg-[#0A0A0A] items-center justify-center pb-safe">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#0A0A0A] items-center justify-center pb-safe text-center px-6">
        <p className="text-white/60 mb-4">Podcast não encontrado ou indisponível.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-white/10 text-white rounded-full font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Converter links na descrição
  const formatDescription = (text: string) => {
    if (!text) return '';
    // Linkify básico
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline break-all">{part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0A0A0A] pb-safe">
      {/* Header Sticky Minimalista */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-md pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-3 flex items-center justify-between border-b border-white/5">
        <button 
          onClick={() => { haptic.selection(); navigate(-1); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 text-center truncate px-4">
          <span className="text-[13px] font-semibold text-white/90 uppercase tracking-widest">
            Podcast
          </span>
        </div>
        <button 
          onClick={handleShare}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform"
        >
          <Share2 className="w-4 h-4 text-white" />
        </button>
      </header>

      {/* YouTube Player Wrapper */}
      <div className="w-full aspect-video bg-black sticky top-[calc(60px+var(--sai-top,env(safe-area-inset-top,0px)))] z-30 shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${podcast.youtube_video_id}?autoplay=1&modestbranding=1&rel=0`}
          title={podcast.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* Metadados e Descrição */}
      <main className="flex-1 px-5 pt-6 pb-12 flex flex-col gap-4">
        <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-white leading-tight">
          {podcast.title}
        </h1>
        
        <div className="flex items-center gap-3 text-[13px] text-white/50 font-medium pb-4 border-b border-white/10">
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(podcast.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Rádio e TV Justiça</span>
          </div>
        </div>

        <div className="mt-2 text-[15px] leading-relaxed text-white/70 whitespace-pre-wrap font-body">
          {formatDescription(podcast.description)}
        </div>
      </main>
    </div>
  );
};

export default PodcastPlayer;
