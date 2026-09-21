import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { TIPO_INFO, type VisualTipo } from '@/lib/visuaisJuridicos/types';
import { TIPOS, TIPO_ICON, TIPO_COR } from './visuaisConstants';

interface VisuaisPassoTiposProps {
  onSelectTipo: (tipo: VisualTipo) => void;
  onEscolherTipo?: (tipo: VisualTipo) => void;
}

export function VisuaisPassoTipos({ onSelectTipo, onEscolherTipo }: VisuaisPassoTiposProps) {
  return (
    <div className="space-y-2">
      {TIPOS.map((t, i) => {
        const Icon = TIPO_ICON[t];
        return (
          <motion.button
            key={t}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={() => {
              haptic.selection();
              if (onEscolherTipo) onEscolherTipo(t);
              else onSelectTipo(t);
            }}
            className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
          >
            <div className="relative overflow-hidden rounded-xl shrink-0">
              <Icon
                className="w-8 h-8 relative"
                style={{
                  color: TIPO_COR[t],
                  filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
                strokeWidth={1.3}
              />
              <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                {TIPO_INFO[t].label}
              </p>
              <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-2">
                {TIPO_INFO[t].desc}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
}
