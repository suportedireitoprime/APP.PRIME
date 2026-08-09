import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Play, Star } from 'lucide-react';
import { CATALOGOS, limparTitulo, slugify, ytThumb } from '@/lib/videoaulasCatalogos';
import { loadFavoritos, loadProgresso } from '@/lib/videoaulasStore';

type Row = {
  video_id: string;
  tabela: string;
  titulo?: string | null;
  area?: string | null;
  thumb?: string | null;
  percentual?: number | null;
};

function rotaDaAula(r: Row) {
  const cat = CATALOGOS.find((c) => c.tabela === r.tabela) ?? CATALOGOS[0];
  const area = cat.temAreas ? slugify(r.area || 'Outros') : 'todas';
  return `/videoaulas/${cat.id}/${area}/${r.video_id}`;
}

/** Lista de favoritos ou de aulas em andamento. */
const VideoaulasLista = ({ modo }: { modo: 'favoritos' | 'recentes' }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (modo === 'favoritos') {
        const favs = await loadFavoritos();
        if (alive) setRows(favs as Row[]);
      } else {
        const prog = await loadProgresso();
        if (alive) setRows(prog.slice(0, 60) as unknown as Row[]);
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [modo]);


  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title={modo === 'favoritos' ? 'Videoaulas favoritas' : 'Continuar assistindo'}
        subtitle={loading ? 'Carregando…' : `${rows.length} aulas`}
      />

      <div className="px-4 pt-4 space-y-3">
        {rows.map((r) => (
          <button
            key={`${r.tabela}-${r.video_id}`}
            onClick={() => navigate(rotaDaAula(r))}
            className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors overflow-hidden flex gap-3"
          >
            <div className="relative w-32 shrink-0 aspect-video bg-muted">
              <img
                src={r.thumb || ytThumb(r.video_id)}
                alt={`Capa da aula ${limparTitulo(r.titulo || 'videoaula')}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/20">
                {modo === 'favoritos' ? (
                  <Star className="h-6 w-6 text-white fill-current" />
                ) : (
                  <Play className="h-6 w-6 text-white" />
                )}
              </span>
              {typeof r.percentual === 'number' && r.percentual > 0 && (
                <span
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                  style={{ width: `${Math.min(100, r.percentual)}%` }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 py-2 pr-3">
              <p className="text-sm font-semibold leading-snug line-clamp-2">
                {limparTitulo(r.titulo || 'Videoaula')}
              </p>
              {r.area && <p className="text-[11px] text-muted-foreground mt-1">{r.area}</p>}
              {typeof r.percentual === 'number' && (
                <p className="text-[11px] text-primary mt-1">{r.percentual}% assistido</p>
              )}
            </div>
          </button>
        ))}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            {modo === 'favoritos' ? 'Você ainda não favoritou aulas.' : 'Nenhuma aula em andamento.'}
          </p>
        )}
      </div>

      <VideoaulasBottomNav />
    </div>
  );

};

export default VideoaulasLista;
