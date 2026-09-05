import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, FolderOpen, Monitor, Newspaper, Radar, type LucideIcon } from 'lucide-react';

export interface PrimaryToolItem {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  route: string;
  color: string;
}

export const PRIMARY_TOOLS: PrimaryToolItem[] = [
  { id: 'documentos', label: 'Documentos Prontos', desc: 'Petições, Contratos e mais', icon: FolderOpen, route: '/documentos', color: '#F59E0B' },
  { id: 'desktop', label: 'Modo Desktop', desc: 'Interface completa', icon: Monitor, route: '/desktop', color: '#10B981' },
  { id: 'noticias', label: 'Notícias', desc: 'Notícias e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
  { id: 'radares', label: 'Radares de Leis', desc: 'Projetos de Lei', icon: Radar, route: '/radares', color: '#0EA5E9' },
];

export const PRIMARY_TOOL_IDS = PRIMARY_TOOLS.map((t) => t.id);

interface FerramentasPrimaryGridProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasPrimaryGrid: React.FC<FerramentasPrimaryGridProps> = ({ onToolClick }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2 pb-1 border-b border-border/40 px-1">
        <h2 className="font-display text-lg font-bold text-foreground">Destaques</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onToolClick(tool.id, tool.route)}
              data-track="ferramenta_abrir"
              data-ferramenta-id={tool.id}
              data-ferramenta-nome={tool.label}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 active:scale-[0.99] transition-all group text-left gap-3 relative"
            >
              <div className="flex justify-between items-start w-full">
                <Icon
                  className="w-8 h-8"
                  style={{
                    color: tool.color,
                    filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                  }}
                  strokeWidth={1.15}
                />
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </div>
              <div className="flex flex-col items-start w-full mt-auto gap-0.5">
                <span className="font-display text-[14px] font-bold leading-tight text-foreground line-clamp-1 w-full">
                  {tool.label}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground line-clamp-1 w-full text-left">
                  {tool.desc}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
