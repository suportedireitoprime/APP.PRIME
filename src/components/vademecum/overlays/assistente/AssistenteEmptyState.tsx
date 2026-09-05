import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { SphereCloud } from '@/components/vademecum/ui_elements/SphereCloud';

interface AssistenteEmptyStateProps {
  suggestions: string[];
  onSelectSuggestion: (q: string) => void;
}

export const AssistenteEmptyState: React.FC<AssistenteEmptyStateProps> = ({
  suggestions,
  onSelectSuggestion,
}) => {
  return (
    <div className="flex flex-col h-full pb-2">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-4">
        <div className="relative w-full max-w-[320px] h-48 flex items-center justify-center mt-4">
          {/* Cérebro central animado */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 20px -5px rgba(var(--accent-rgb), 0.2)',
                '0 0 40px -5px rgba(var(--accent-rgb), 0.5)',
                '0 0 20px -5px rgba(var(--accent-rgb), 0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-gradient-to-b from-accent/20 to-accent/5 flex items-center justify-center z-10 border border-accent/20 backdrop-blur-sm shadow-lg"
          >
            <Brain className="w-9 h-9 text-accent/90" strokeWidth={1.5} />
          </motion.div>

          {/* Palavras flutuantes (Badges) alimentando o cérebro */}
          {[
            { text: 'Jurisprudência', delay: 0, x: -100, y: -55 },
            { text: 'Leis Secas', delay: 1.5, x: 90, y: -45 },
            { text: 'Tempo real', delay: 0.7, x: -90, y: 65 },
            { text: 'Resumos', delay: 2.2, x: 100, y: 50 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: item.x * 1.5, y: item.y * 1.5, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [item.x * 1.5, item.x, item.x * 0.4, 0],
                y: [item.y * 1.5, item.y, item.y * 0.4, 0],
                scale: [0.5, 1, 1, 0.3],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                delay: item.delay,
                times: [0, 0.2, 0.7, 1],
                ease: 'easeInOut',
              }}
              className="absolute px-3 py-1.5 rounded-full bg-card/90 border border-white/10 text-[11px] font-medium text-foreground/80 backdrop-blur-md shadow-xl whitespace-nowrap z-20"
            >
              {item.text}
            </motion.div>
          ))}

          {/* Pulsos conectores sutis */}
          <motion.div
            animate={{ opacity: [0, 0.5, 0], scale: [0.8, 2, 2.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-20 h-20 rounded-full border border-accent/30 z-0"
          />
          <motion.div
            animate={{ opacity: [0, 0.3, 0], scale: [0.8, 3, 4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
            className="absolute w-20 h-20 rounded-full border border-accent/20 z-0"
          />
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground text-center tracking-tight">
          Como posso ajudar?
        </h2>
      </div>

      {/* Sugestões no final da área de scroll */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center mt-auto px-4 pb-2">
        <SphereCloud
          tags={suggestions}
          onSelect={onSelectSuggestion}
          radius={120}
        />
      </div>
    </div>
  );
};
