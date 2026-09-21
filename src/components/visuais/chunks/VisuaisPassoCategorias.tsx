import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { type VisualCategoria } from '@/lib/visuaisJuridicos/types';
import { CATEGORIA_INFO } from '@/lib/visuaisJuridicos/catalogo';
import { CATEGORIAS, CATEGORIA_ICON, CATEGORIA_COR } from './visuaisConstants';

interface VisuaisPassoCategoriasProps {
  onSelectCategoria: (categoria: VisualCategoria) => void;
}

export function VisuaisPassoCategorias({ onSelectCategoria }: VisuaisPassoCategoriasProps) {
  return (
    <div className="space-y-2">
      {CATEGORIAS.map((c, i) => {
        const Icon = CATEGORIA_ICON[c];
        return (
          <motion.button
            key={c}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={() => {
              haptic.selection();
              onSelectCategoria(c);
            }}
            className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
          >
            <div className="relative overflow-hidden rounded-xl shrink-0">
              <Icon
                className="w-8 h-8 relative"
                style={{
                  color: CATEGORIA_COR[c],
                  filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
                strokeWidth={1.3}
              />
              <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                {CATEGORIA_INFO[c].label}
              </p>
              <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-2">
                {CATEGORIA_INFO[c].desc}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
}
