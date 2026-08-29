import React from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import { cn } from '@/lib/utils';
import { Aula } from '@/types/videoaula';

interface VideoaulaSidebarDesktopProps {
  aulasDaArea: Aula[];
  videoId: string | undefined;
  catalogoId: string;
  areaSlug: string | undefined;
}

export const VideoaulaSidebarDesktop = React.memo(function VideoaulaSidebarDesktop({
  aulasDaArea,
  videoId,
  catalogoId,
  areaSlug
}: VideoaulaSidebarDesktopProps) {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:block space-y-3 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h2 className="text-sm font-bold text-foreground">Aulas da Matéria</h2>
        <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
          {aulasDaArea.length} aulas
        </span>
      </div>
      <div className="space-y-2">
        {aulasDaArea.map((item) => {
          const eAtivo = item.video_id === videoId;
          const tLimpo = limparTitulo(item.titulo);
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.selection();
                navigate(`/videoaulas/${catalogoId}/${areaSlug ?? 'todas'}/${item.video_id}`);
              }}
              className={cn(
                'w-full text-left flex items-start gap-2.5 p-2 rounded-xl border transition-colors group',
                eAtivo
                  ? 'border-primary/60 bg-primary/15'
                  : 'border-border/40 hover:border-border hover:bg-muted/50',
              )}
            >
              <div className="relative w-16 h-10 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-white/10">
                <img
                  src={item.thumb ?? item.thumbnail ?? ytThumb(item.video_id, 'mq')}
                  alt=""
                  loading="eager"
                  decoding="async"
                  {...({ fetchpriority: 'high' } as React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>)}
                  className="w-full h-full object-cover"
                />
                {eAtivo && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium line-clamp-2 leading-tight', eAtivo ? 'text-primary font-bold' : 'text-foreground group-hover:text-primary')}>
                  {tLimpo}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
});
