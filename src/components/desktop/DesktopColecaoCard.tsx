import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Library } from 'lucide-react';
import { directImg } from '@/lib/cdnImg';
import type { ColecaoConfig } from '@/lib/bibliotecaColecoes';

interface DesktopColecaoCardProps {
  c: ColecaoConfig;
  onClick: () => void;
}

export const DesktopColecaoCard = memo(function DesktopColecaoCard({
  c,
  onClick,
}: DesktopColecaoCardProps) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
      }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col text-left rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative min-h-[140px] will-change-transform focus-visible:outline-none"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500 will-change-transform" />

      <div className="p-5 flex items-start gap-4 flex-1">
        <div className="w-16 h-20 shrink-0 bg-muted rounded border border-border shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10 mix-blend-overlay" />
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/20 z-20" />
          <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-black/10 z-20" />
          {c.cover ? (
            <img
              src={directImg(c.cover, 200)}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover relative z-0"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Library className="w-6 h-6 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
            {c.eyebrow || 'Coleção'}
          </div>
          <h3 className="font-display font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
            {c.label}
          </h3>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-border/50 bg-secondary/30 flex items-center justify-between w-full">
        <span className="text-xs text-muted-foreground font-medium">Ver coleção</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 will-change-transform" />
      </div>
    </motion.button>
  );
});
