import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LayoutGrid, Play, Video } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { CATALOGOS } from '@/lib/videoaulasCatalogos';
import {
  carregarResumoVideoaulas,
  RESUMO_VAZIO,
  type ResumoVideoaulas,
} from '@/lib/videoaulasResumo';
import { haptic } from '@/lib/nativeHaptics';
import { prefetchCatalogo } from '@/lib/videoaulasStore';

const VideoaulasCategorias = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResumoVideoaulas>(RESUMO_VAZIO);

  useEffect(() => {
    let alive = true;
    carregarResumoVideoaulas().then((r) => alive && setData(r));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Categorias"
        subtitle="Escolha por onde estudar"
        onBack={() => navigate('/videoaulas')}
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        <div className="mb-3 flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Categorias de videoaulas
          </p>
        </div>

        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {CATALOGOS.map((c) => {
            const info = data.porCatalogo[c.id];
            return (
              <button
                key={c.id}
                onPointerDown={() => prefetchCatalogo(c.id)}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${c.id}`);
                }}
                className="group flex w-full items-stretch overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_4px_18px_-6px_rgba(0,0,0,0.35)] transition-all hover:border-primary/50 active:scale-[0.98]"
                style={{ minHeight: 104 }}
              >
                <div className="relative w-[116px] shrink-0 overflow-hidden">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<Play className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/20">
                    <div className="rounded-full border border-white/25 bg-black/40 p-2 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="h-4 w-4 fill-current text-primary-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-2.5">
                  <h3 className="truncate text-[15px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                    {c.descricao}
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-primary">
                    <Video className="h-3 w-3" />
                    {info?.total ? `${info.total.toLocaleString('pt-BR')} aulas` : '—'}
                    {info?.concluidas ? ` · ${info.pct}% assistido` : ''}
                  </span>
                  {info?.total ? (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--aprender-accent))]"
                        style={{ width: `${info.pct}%` }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center pr-3">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasCategorias;
