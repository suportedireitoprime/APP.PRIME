import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Route as RouteIcon, Video } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { CATALOGOS, simplificarNomeArea, type CatalogoId } from '@/lib/videoaulasCatalogos';
import {
  carregarResumoVideoaulas,
  RESUMO_VAZIO,
  type ResumoVideoaulas,
} from '@/lib/videoaulasResumo';
import { haptic } from '@/lib/nativeHaptics';

const VideoaulasTrilhas = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResumoVideoaulas>(RESUMO_VAZIO);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<CatalogoId | 'todas'>('todas');

  useEffect(() => {
    let alive = true;
    carregarResumoVideoaulas().then((r) => {
      if (!alive) return;
      setData(r);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const trilhas = useMemo(() => {
    const l = data.areas.filter((a) => (cat === 'todas' ? true : a.catalogo === cat));
    return l.sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      return b.total - a.total;
    });
  }, [data.areas, cat]);

  const iniciadas = data.areas.filter((a) => a.pct > 0).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Trilhas"
        subtitle={`${data.areas.length} trilhas · ${iniciadas} iniciadas`}
        onBack={() => navigate('/videoaulas')}
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        <div className="mb-3 flex items-center gap-1.5">
          <RouteIcon className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Assista em sequência
          </p>
        </div>

        {/* Filtro por categoria */}
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
          {(['todas', ...CATALOGOS.map((c) => c.id)] as const).map((id) => {
            const ativo = cat === id;
            const label = id === 'todas' ? 'Todas' : CATALOGOS.find((c) => c.id === id)!.titulo;
            return (
              <button
                key={id}
                onClick={() => setCat(id as CatalogoId | 'todas')}
                className={[
                  'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
                  ativo
                    ? 'bg-[hsl(var(--aprender-accent))] text-[hsl(var(--aprender-accent-foreground))]'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {loading && !trilhas.length
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-muted" />
              ))
            : trilhas.map((a) => {
                const { Icon, color } = areaIconFor(a.area);
                const catalogo = CATALOGOS.find((c) => c.id === a.catalogo)!;
                return (
                  <button
                    key={`${a.catalogo}-${a.slug}`}
                    onClick={() => {
                      haptic.selection();
                      navigate(`/videoaulas/${a.catalogo}/${a.slug}`);
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 active:scale-[0.995] sm:p-3.5"
                  >
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 aprender-icon-shine">
                      <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground"
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
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Video className="h-3 w-3" />
                        {a.total} aulas · {catalogo.titulo}
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

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasTrilhas;
