import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from '@/components/ui/input';
import { ChevronRight, History, Mic, Play, Search, Star, Video } from 'lucide-react';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { haptic } from '@/lib/nativeHaptics';
import {
  formatDuracao,
  getCatalogo,
  limparTitulo,
  simplificarNomeArea,
  slugify,
  ytThumb,
  getCapaDaArea
} from '@/lib/videoaulasCatalogos';
import {
  getCachedCatalogo,
  getCachedFavoritos,
  getCachedProgresso,
  loadCatalogo,
  loadProgresso,
  subscribeVideoaulas,
  type ProgressoRow,
} from '@/lib/videoaulasStore';
import { useVoiceInput } from '@/hooks/useVoiceInput';

type ProgressoMap = Record<string, { percentual: number; concluida: boolean }>;

function mapearProgresso(rows: ProgressoRow[] | null, tabela: string): ProgressoMap {
  const map: ProgressoMap = {};
  (rows ?? [])
    .filter((p) => p.tabela === tabela)
    .forEach((p) => {
      map[p.video_id] = { percentual: p.percentual ?? 0, concluida: !!p.concluida };
    });
  return map;
}


type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  ordem?: number | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

/** Catálogo: lista de áreas (ou de aulas). */
const VideoaulasCatalogo = () => {
  const { catalogo: catalogoId } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);
  const [aulas, setAulas] = useState<Aula[]>(
    () => (catalogo ? ((getCachedCatalogo(catalogo.id) as Aula[] | null) ?? []) : []),
  );
  const [busca, setBusca] = useState('');
  const { listening, partial, toggle } = useVoiceInput((t) => setBusca(t));
  const [loading, setLoading] = useState(
    () => !(catalogo && getCachedCatalogo(catalogo.id)?.length),
  );
  const [progresso, setProgresso] = useState<ProgressoMap>(() =>
    catalogo ? mapearProgresso(getCachedProgresso(), catalogo.tabela) : {}
  );

  useEffect(() => {
    if (!catalogo) return;
    let alive = true;
    // Render instantâneo a partir do cache em memória; rede só revalida.
    const cache = getCachedCatalogo(catalogo.id) as Aula[] | null;
    if (cache?.length) {
      setAulas(cache);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      try {
        const [rows, prog] = await Promise.all([
          loadCatalogo(catalogo.id),
          loadProgresso()
        ]);
        if (alive) {
          setAulas(rows as Aula[]);
          setProgresso(mapearProgresso(prog, catalogo.tabela));
        }
      } catch (err) {
        console.error("Erro ao carregar catálogo", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const off = subscribeVideoaulas(() => {
      if (!alive) return;
      const novas = getCachedCatalogo(catalogo.id) as Aula[] | null;
      if (novas?.length) {
        setAulas(novas);
        setLoading(false);
      }
      setProgresso(mapearProgresso(getCachedProgresso(), catalogo.tabela));
    });
    return () => {
      alive = false;
      off();
    };
  }, [catalogo]);


  const areas = useMemo(() => {
    if (!catalogo?.temAreas) return [];
    const map = new Map<string, { nome: string; total: number; concluidas: number }>();
    aulas.forEach((a) => {
      const nome = (a.area || 'Outros').trim();
      const p = progresso[a.video_id];
      const isDone = p?.concluida || (p?.percentual ?? 0) >= 90;
      const atual = map.get(nome);
      if (atual) {
        atual.total += 1;
        if (isDone) atual.concluidas += 1;
      } else {
        map.set(nome, {
          nome,
          total: 1,
          concluidas: isDone ? 1 : 0,
        });
      }
    });
    const q = busca.trim().toLowerCase();
    return [...map.values()]
      .filter((a) => !q || a.nome.toLowerCase().includes(q) || simplificarNomeArea(a.nome).toLowerCase().includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [aulas, busca, catalogo, progresso]);

  const aulasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return aulas.filter((a) => !q || limparTitulo(a.titulo).toLowerCase().includes(q));
  }, [aulas, busca]);

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Catálogo não encontrado.</p>
      </div>
    );
  }

  const rotaAula = (a: Aula) =>
    catalogo.temAreas
      ? `/videoaulas/${catalogo.id}/${slugify(a.area || 'Outros')}/${a.video_id}`
      : `/videoaulas/${catalogo.id}/todas/${a.video_id}`;

  const cardArea = (area: { nome: string; total: number; concluidas: number }) => {
    const { Icon, color } = areaIconFor(area.nome);
    const pct = area.total > 0 ? Math.round((area.concluidas / area.total) * 100) : 0;

    return (
      <button
        key={area.nome}
        onClick={() => {
          haptic.selection();
          navigate(`/videoaulas/${catalogo.id}/${slugify(area.nome)}`);
        }}
        className="group flex w-full items-center gap-3.5 rounded-2xl border border-border/80 bg-card/75 p-3.5 text-left transition-all backdrop-blur-md hover:bg-card hover:border-primary/40 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none"
      >
        <div
          className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${color}18`,
            borderColor: `${color}35`,
          }}
        >
          <Icon
            className="h-6 w-6 sm:h-7 sm:w-7"
            strokeWidth={1.8}
            style={{ color }}
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h3
            className="truncate text-[14px] sm:text-[15px] font-bold text-foreground uppercase tracking-wide leading-tight"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            {simplificarNomeArea(area.nome)}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[12px] font-semibold text-muted-foreground">
              {area.total} {area.total === 1 ? 'aula' : 'aulas'}
            </p>
            {pct > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                · {pct}% concluído
              </span>
            )}
          </div>
          {pct > 0 && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </button>
    );
  };

  const cardAula = (a: Aula, i: number) => {
    const p = progresso[a.video_id];
    const pct = p?.concluida ? 100 : Math.min(100, Math.round(p?.percentual ?? 0));
    
    return (
      <button
        key={`${a.video_id}-${i}`}
        onClick={() => {
          haptic.selection();
          navigate(rotaAula(a));
        }}
        className="w-full flex gap-3 overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary/50 active:scale-[0.99]"
      >
        <div className="relative aspect-video w-32 shrink-0 bg-muted">
          <ThumbImg
            src={getCapaDaArea(a.area) || a.thumb || a.thumbnail || ytThumb(a.video_id)}
            alt={`Capa da aula ${limparTitulo(a.titulo || 'videoaula')}`}
            fallback={<Play className="h-6 w-6 text-primary/50" />}
          />
          <span className="absolute inset-0 grid place-items-center bg-black/15">
            <Play className="h-6 w-6 fill-current text-white" />
          </span>
          {pct > 0 && (
            <span
              className="absolute bottom-0 left-0 h-1 bg-primary z-10"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1 py-2 pr-3 flex flex-col justify-center">
          <p className="text-sm font-medium leading-snug text-foreground">
            {limparTitulo(a.titulo || 'Videoaula')}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {a.area ? simplificarNomeArea(a.area) : catalogo.titulo}
              {a.duracao_segundos ? ` · ${formatDuracao(a.duracao_segundos)}` : ''}
            </p>
            {pct > 0 && (
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-2">
                {p?.concluida ? 'Concluída' : `${pct}%`}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative min-h-screen bg-background pb-32 overflow-x-hidden">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={catalogo.titulo}
          subtitle={loading ? 'Carregando…' : `${aulas.length.toLocaleString('pt-BR')} aulas`}
          onBack={() => navigate('/videoaulas')}
        />

        <div className="mx-auto max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl px-4 pt-4">
          <div className="flex gap-2 items-center">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={listening ? partial : busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={
                  listening
                    ? 'Ouvindo…'
                    : catalogo.temAreas
                      ? 'Buscar área…'
                      : 'Buscar aula…'
                }
                className="rounded-full bg-card/80 pl-9 pr-4"
              />
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={listening ? 'Parar busca por voz' : 'Buscar por voz'}
              className={`shrink-0 grid h-12 w-12 place-items-center rounded-full transition-colors ${
                listening ? 'bg-red-500/20 text-red-500' : 'bg-[#E3262F] text-white hover:bg-red-600'
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className={catalogo.temAreas ? "pt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" : "pt-4 flex flex-col gap-3"}>
            {catalogo.temAreas
              ? areas.map(cardArea)
              : aulasFiltradas.map(cardAula)}

            {!loading && (catalogo.temAreas ? areas.length === 0 : aulasFiltradas.length === 0) && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                {busca.trim() ? 'Nenhum resultado encontrado para esta busca.' : 'Nenhuma aula disponível.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <VideoaulasBottomNav />
    </div>
  );

};

export default VideoaulasCatalogo;
