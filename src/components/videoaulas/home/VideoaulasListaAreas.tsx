import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Video } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import { prefetchCatalogo } from '@/lib/videoaulasStore';

interface VideoaulasListaAreasProps {
  loading: boolean;
  lista: any[];
  emAndamentoCount: number;
  filtro: 'todas' | 'andamento';
  setFiltro: (v: 'todas' | 'andamento') => void;
}

export const VideoaulasListaAreas = React.memo(function VideoaulasListaAreas({
  loading,
  lista,
  emAndamentoCount,
  filtro,
  setFiltro
}: VideoaulasListaAreasProps) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground lg:text-[13px]">
          Áreas do Direito
        </p>
        {emAndamentoCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
            {(['todas', 'andamento'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  filtro === f
                    ? 'bg-[hsl(var(--aprender-accent))] text-[hsl(var(--aprender-accent-foreground))]'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {f === 'todas' ? 'Todas' : `Em andamento (${emAndamentoCount})`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 2xl:grid-cols-3">
        {loading && !lista.length
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-muted" />
            ))
          : lista.map((a) => {
              const { Icon, color } = areaIconFor(a.area);
              return (
                <button
                  key={`${a.catalogo}-${a.slug}`}
                  onPointerDown={() => prefetchCatalogo('areas')}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/videoaulas/areas/${a.slug}`);
                  }}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995] sm:p-3.5"
                >
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 aprender-icon-shine">
                    <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground sm:text-[16px]"
                        style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                      >
                        {simplificarNomeArea(a.area)}
                      </p>
                      <span
                        className={[
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                          a.pct > 0
                            ? 'bg-[hsl(var(--aprender-accent)/0.18)] text-[hsl(var(--aprender-accent))]'
                            : 'bg-muted text-muted-foreground',
                        ].join(' ')}
                      >
                        {a.pct}%
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground sm:text-[13px]">
                      <Video className="h-3 w-3" />
                      {a.total} {a.total === 1 ? 'aula' : 'aulas'}
                      {a.concluidas > 0 && ` · ${a.concluidas} assistida${a.concluidas === 1 ? '' : 's'}`}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
                        style={{ width: `${a.pct}%` }}
                      />
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
      </div>
    </div>
  );
});
