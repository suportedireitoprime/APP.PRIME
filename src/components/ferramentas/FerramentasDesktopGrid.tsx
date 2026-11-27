import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';
import FerramentasLivrosCarrossel from './FerramentasLivrosCarrossel';

interface FerramentasDesktopGridProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasDesktopGrid: React.FC<FerramentasDesktopGridProps> = ({ onToolClick }) => {
  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-10">
      {/* Carrossel exclusivo de Livros */}
      <FerramentasLivrosCarrossel />

      {DESKTOP_TOOL_GROUPS.map((group) => (
        <section key={group.id}>
          <div className="mb-3.5 flex items-baseline gap-3 border-b border-white/[0.06] pb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{group.label}</h2>
            <p className="text-xs text-zinc-500">{group.hint}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onToolClick(tool.id, tool.route)}
                  data-track="ferramenta_abrir"
                  data-ferramenta-id={tool.id}
                  data-ferramenta-nome={tool.label}
                  className="group flex items-start gap-3.5 rounded-xl border border-white/[0.06] bg-[#111114] hover:bg-[#151519] hover:border-white/[0.16] p-4 text-left transition-all"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-rose-500/30 group-hover:bg-rose-500/10 transition-colors">
                    <Icon className="h-4 w-4 text-zinc-300 group-hover:text-rose-400 transition-colors" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-semibold text-white transition-colors">
                      {tool.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-500 line-clamp-1">
                      {tool.desc}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
