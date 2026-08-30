import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ListVideo, BarChart3, Scale } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { motion } from 'framer-motion';

export const VideoaulasAtalhos = React.memo(function VideoaulasAtalhos() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-3 px-1 mt-6">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-extrabold leading-tight text-foreground uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Atalhos</h2>
        </div>
        <p className="ml-3 mt-1 text-xs text-muted-foreground">
          Ações rápidas para continuar, playlists e histórico.
        </p>
      </div>

      <motion.section 
        className="grid grid-cols-4 gap-2.5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
      >
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { haptic.selection(); navigate('/videoaulas/recentes'); }}
          className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-colors gap-2 text-center focus-visible:outline-none"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Continuar</p>
          </div>
        </motion.button>

        <motion.button
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { haptic.selection(); navigate('/videoaulas/playlist'); }}
          className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-colors gap-2 text-center focus-visible:outline-none"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <ListVideo className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Playlist</p>
          </div>
        </motion.button>

        <motion.button
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { haptic.selection(); navigate('/videoaulas/desempenho'); }}
          className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-colors gap-2 text-center focus-visible:outline-none"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Desempenho</p>
          </div>
        </motion.button>

        <motion.button
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { haptic.selection(); navigate('/videoaulas/lei-seca'); }}
          className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-colors gap-2 text-center focus-visible:outline-none"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <Scale className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Lei Seca</p>
          </div>
        </motion.button>
      </motion.section>
    </>
  );
});
