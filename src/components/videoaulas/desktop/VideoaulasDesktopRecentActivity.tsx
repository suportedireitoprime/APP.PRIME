import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';

export const VideoaulasDesktopRecentActivity = memo(function VideoaulasDesktopRecentActivity() {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-6 pt-3 lg:pt-0">
      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Atividade Recente</h2>
        </div>

        <button
          onClick={() => navigate('/videoaulas/recentes')}
          className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-bold text-foreground">Histórico de Visualização</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Veja todas as aulas que você já começou.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </aside>
  );
});
