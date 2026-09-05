import React from 'react';
import { Search, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';

interface VideoaulasSearchCardProps {
  onOpenBusca: () => void;
}

export const VideoaulasSearchCard: React.FC<VideoaulasSearchCardProps> = ({ onOpenBusca }) => {
  return (
    <div className="bg-card border border-border/80 p-5 rounded-3xl shadow-xl">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-amber-500" />
        <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">
          Procurar Aula
        </h2>
      </div>
      <p className="ml-3 mt-1 mb-4 text-xs text-muted-foreground">
        Encontre videoaulas por disciplina, assunto ou termo.
      </p>

      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptic.selection();
          onOpenBusca();
        }}
        className="relative w-full group text-left transition-all focus-visible:outline-none"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="w-full h-14 sm:h-16 bg-black/80 border border-white/10 rounded-2xl pl-12 pr-12 text-muted-foreground flex items-center group-hover:border-primary/50 transition-all text-base font-medium shadow-inner shadow-black/50">
          Pesquisar no catálogo...
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors pointer-events-none">
          <Mic className="h-5 w-5 text-muted-foreground" />
        </div>
      </motion.button>
    </div>
  );
};
