import React, { memo } from 'react';
import { Video } from 'lucide-react';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import { prefetchCatalogo } from '@/lib/videoaulasStore';

interface VideoaulasDesktopAreaCardProps {
  a: {
    area: string;
    slug: string;
    total: number;
    pct: number;
    catalogo?: string;
  };
  handleAreaClick: (slug: string) => void;
}

export const VideoaulasDesktopAreaCard = memo(function VideoaulasDesktopAreaCard({
  a,
  handleAreaClick,
}: VideoaulasDesktopAreaCardProps) {
  const { Icon, color } = areaIconFor(a.area);

  return (
    <button
      onPointerDown={() => prefetchCatalogo('areas')}
      onClick={() => handleAreaClick(a.slug)}
      className="group flex flex-col items-start gap-4 rounded-3xl border border-border/80 bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1 will-change-transform"
    >
      <div className="flex w-full items-center justify-between">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/30 group-hover:bg-primary/10 transition-colors">
          <Icon
            className="h-8 w-8 transition-transform group-hover:scale-110 will-change-transform"
            strokeWidth={1.9}
            style={{ color }}
          />
        </div>
        {a.pct > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-primary">{a.pct}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-base font-bold text-foreground leading-tight">
          {simplificarNomeArea(a.area)}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
          <Video className="h-3.5 w-3.5" />
          <span>{a.total} aulas</span>
        </p>
      </div>

      {a.pct > 0 && (
        <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${a.pct}%` }}
          />
        </div>
      )}
    </button>
  );
});
