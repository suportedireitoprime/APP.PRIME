import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, PlayCircle } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useNavigate } from 'react-router-dom';
import { fetchAoVivo, YoutubeVideo } from '@/lib/youtubeApi';

interface LiveChannel {
  id: string;
  video: YoutubeVideo;
}

const CANAL_COLORS: Record<string, string> = {
  stf: 'rgba(225, 29, 72, 0.45)', // Rose-600
  senado: 'rgba(16, 185, 129, 0.45)', // Emerald-500
  camara: 'rgba(14, 165, 233, 0.45)' // Sky-500
};

export const VideoaulasAoVivoBar = React.memo(function VideoaulasAoVivoBar() {
  const navigate = useNavigate();
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLives() {
      try {
        const lives = await fetchAoVivo();
        setLiveChannels(lives);
      } catch (error) {
        console.error("Erro ao carregar vídeos ao vivo:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLives();
  }, []);

  if (loading) {
    return (
      <div className="mb-6 pl-4 sm:pl-6 lg:pl-0 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-3 rounded-full bg-red-600/50"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pr-4">
          <div className="w-[280px] sm:w-[320px] h-[220px] bg-muted rounded-2xl shrink-0"></div>
          <div className="w-[280px] sm:w-[320px] h-[220px] bg-muted rounded-2xl shrink-0"></div>
        </div>
      </div>
    );
  }

  if (liveChannels.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6 pl-4 sm:pl-6 lg:pl-0"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <h2 className="text-sm font-extrabold leading-tight text-foreground uppercase tracking-widest">
            Ao Vivo Agora
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide pr-4 sm:pr-6 lg:pr-0">
          {liveChannels.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic.selection();
                navigate(`/videoaulas/canal/${item.id}`);
              }}
              className="snap-start shrink-0 cursor-pointer w-[280px] sm:w-[320px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:border-red-500/50 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="relative h-[140px] sm:h-[160px] w-full bg-muted overflow-hidden shrink-0">
                <img 
                  src={item.video.thumbnail} 
                  alt={item.video.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div 
                  className="absolute inset-0 mix-blend-overlay transition-opacity"
                  style={{ backgroundColor: CANAL_COLORS[item.id] || 'rgba(0,0,0,0.3)' }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-xl" strokeWidth={1.5} />
                </div>
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
                  <Radio className="w-3 h-3" />
                  AO VIVO
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center bg-card">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{item.video.channelTitle}</p>
                <p className="font-sans text-[15px] sm:text-base font-semibold text-foreground line-clamp-2 leading-snug">
                  {item.video.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
