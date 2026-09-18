import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

import { useNavigate } from 'react-router-dom';

// Simularemos os dados por enquanto, já que não temos a API Key real
const AO_VIVO_CHANNELS = [
  {
    id: 'senado',
    title: 'Sessão Plenária - Senado Federal',
    channel: 'TV Senado',
    thumbnail: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&h=400&fit=crop',
    url: '/videoaulas/canal/senado'
  },
  {
    id: 'camara',
    title: 'Sessão Deliberativa - Plenário',
    channel: 'Câmara dos Deputados',
    thumbnail: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&h=400&fit=crop',
    url: '/videoaulas/canal/camara'
  },
  {
    id: 'stf',
    title: 'Sessão Plenária - STF',
    channel: 'STF',
    thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&h=400&fit=crop',
    url: '/videoaulas/canal/stf'
  }
];

export const VideoaulasAoVivoBar = React.memo(function VideoaulasAoVivoBar() {
  const navigate = useNavigate();

  if (AO_VIVO_CHANNELS.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6 px-4 sm:px-6 lg:px-0"
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

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {AO_VIVO_CHANNELS.map((live) => (
            <motion.div
              key={live.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic.selection();
                navigate(live.url);
              }}
              className="snap-start shrink-0 cursor-pointer w-[280px] sm:w-[320px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:border-red-500/50 hover:shadow-md transition-all group"
            >
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                <img 
                  src={live.thumbnail} 
                  alt={live.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  AO VIVO
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{live.channel}</p>
                <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                  {live.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
