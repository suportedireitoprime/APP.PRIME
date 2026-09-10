import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AprenderArea } from '@/types/aprender';

interface AprenderLeftSidebarProps {
  totalAreas: number;
  emAndamentoCount: number;
  filtro: 'todas' | 'andamento';
  onFiltroChange: (filtro: 'todas' | 'andamento') => void;
  onOpenLembretes: () => void;
}

export const AprenderLeftSidebar: React.FC<AprenderLeftSidebarProps> = memo(({
  totalAreas,
  emAndamentoCount,
  filtro,
  onFiltroChange,
  onOpenLembretes,
}) => {
  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="text-sm font-bold text-foreground">Filtrar Matérias</h2>
        <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
          {totalAreas} totais
        </span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onFiltroChange('todas')}
          className={cn(
            'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between',
            filtro === 'todas'
              ? 'border-primary/60 bg-primary/15 text-primary'
              : 'border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          <span>Todas as Matérias</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
            {totalAreas}
          </span>
        </button>

        <button
          onClick={() => onFiltroChange('andamento')}
          className={cn(
            'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between',
            filtro === 'andamento'
              ? 'border-primary/60 bg-primary/15 text-primary'
              : 'border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          <span>Em Andamento</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
            {emAndamentoCount}
          </span>
        </button>
      </div>

      <div className="pt-2 border-t border-border/60">
        <button
          onClick={onOpenLembretes}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
        >
          <Bell className="w-4 h-4" /> Configurar Lembretes
        </button>
      </div>
    </aside>
  );
});

AprenderLeftSidebar.displayName = 'AprenderLeftSidebar';

interface AprenderRightSidebarProps {
  pct: number;
  accentColor: string;
}

export const AprenderRightSidebar: React.FC<AprenderRightSidebarProps> = memo(({
  pct,
  accentColor,
}) => {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-4 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm">
      <h2 
        className="text-xs font-bold uppercase tracking-wider border-b border-border/60 pb-2.5 transition-colors duration-500"
        style={{ color: accentColor }}
      >
        Seu Desempenho
      </h2>

      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Meta de Estudo</span>
          <span 
            className="font-bold transition-colors duration-500"
            style={{ color: accentColor }}
          >
            {pct}% atingido
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => navigate('/aprender/desempenho')}
          className="w-full text-left p-3 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Estatísticas Detalhadas
              </p>
              <p className="text-[11px] text-muted-foreground">Ofensiva, precisão e horas</p>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
});

AprenderRightSidebar.displayName = 'AprenderRightSidebar';
