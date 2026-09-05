import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { DESKTOP_TOOLS_FLAT } from '@/config/desktopTools';
import { PRIMARY_TOOL_IDS } from './FerramentasPrimaryGrid';

interface FerramentasSecondaryListProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasSecondaryList: React.FC<FerramentasSecondaryListProps> = ({ onToolClick }) => {
  const secondaryTools = DESKTOP_TOOLS_FLAT.filter((t) => !PRIMARY_TOOL_IDS.includes(t.id));

  return (
    <section className="space-y-3 mt-4">
      <div className="flex items-baseline gap-2 pb-1 border-b border-border/40 px-1">
        <h2 className="font-display text-lg font-bold text-foreground">Outros destaques</h2>
      </div>
      <div className="space-y-3">
        {secondaryTools.map((tool, i) => {
          const Icon = tool.icon;
          const isMuted = tool.id === 'caca-palavras' || tool.id === 'palavras-cruzadas';
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 4) * 0.04 }}
              onClick={() => onToolClick(tool.id, tool.route)}
              data-track="ferramenta_abrir"
              data-ferramenta-id={tool.id}
              data-ferramenta-nome={tool.label}
              className="flex items-center gap-3 px-4 h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 active:scale-[0.99] transition-all group w-full"
            >
              <Icon
                className="w-8 h-8 shrink-0"
                style={{
                  color: tool.color,
                  filter: isMuted
                    ? 'grayscale(1)'
                    : 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                }}
                strokeWidth={1.15}
              />
              <div className="flex-1 min-w-0 text-left">
                <p
                  className={`font-display text-[15.5px] font-bold leading-tight truncate ${
                    isMuted ? 'text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {tool.label}
                </p>
                <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                  {tool.desc}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
