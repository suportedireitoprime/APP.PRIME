import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Input } from '@/components/ui/input';
import { ChevronRight, History, Mic, Play, Search, Star, Video } from 'lucide-react';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
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
    const map = new Map<string, { nome: string; total: number; thumb?: string | null }>();
    aulas.forEach((a) => {
      const nome = (a.area || 'Outros').trim();
      const atual = map.get(nome);
      if (atual) atual.total += 1;
      else
        map.set(nome, {
          nome,
          total: 1,
          thumb: a.thumb || a.thumbnail || ytThumb(a.video_id),
        });
    });
    const q = busca.trim().toLowerCase();
    return [...map.values()]
      .filter((a) => !q || a.nome.toLowerCase().includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [aulas, busca, catalogo]);

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

  const cardAula = (a: Aula, i: number) => {
    const p = progresso[a.video_id];
    const pct = p?.concluida ? 100 : Math.min(100, Math.round(p?.percentual ?? 0));
    
    return (
      <button
        key={`${a.video_id}-${i}`}
        onClick={() => navigate(rotaAula(a))}
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
    <div className="relative min-h-screen bg-background pb-24">
      <div className="relative z-10">
        <PageHeader
          title={catalogo.titulo}
          subtitle={loading ? 'Carregando…' : `${aulas.length.toLocaleString('pt-BR')} aulas`}
          onBack={() => navigate('/videoaulas')}
        />

        <div className="mx-auto max-w-md px-4 pt-4">
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
                className="rounded-full bg-card pl-9 pr-4"
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
          <div className="pt-4 flex flex-col gap-3">
            {catalogo.temAreas
              ? areas.map((area) => (
                  <button
                    key={area.nome}
                    onClick={() => navigate(`/videoaulas/${catalogo.id}/${slugify(area.nome)}`)}
                    className="group flex w-full items-stretch overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/50 active:scale-[0.98]"
                    style={{ minHeight: 96 }}
                  >
                    <div className="relative w-[110px] shrink-0 overflow-hidden">
                        <ThumbImg
                          src={getCapaDaArea(area.nome) || area.thumb}
                          alt={area.nome}
                          fallback={<Play className="h-8 w-8 text-primary/40" />}
                        />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-2.5">
                      <h3 className="truncate text-[15px] font-bold leading-tight">
                        {simplificarNomeArea(area.nome)}
                      </h3>
                      <p className="mt-1 text-[12px] font-semibold text-primary">
                        {area.total} {area.total === 1 ? 'aula' : 'aulas'}
                      </p>
                    </div>
                    <div className="flex items-center pr-3">
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </button>
                ))
              : aulasFiltradas.map(cardAula)}

            {!loading && aulas.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma aula disponível.
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
