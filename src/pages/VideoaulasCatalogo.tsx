import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Input } from '@/components/ui/input';
import { ChevronRight, History, Mic, Play, Search, Star, Video } from 'lucide-react';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import {
  formatDuracao,
  getCatalogo,
  limparTitulo,
  simplificarNomeArea,
  slugify,
  ytThumb,
} from '@/lib/videoaulasCatalogos';
import {
  getCachedCatalogo,
  getCachedFavoritos,
  getCachedProgresso,
  loadCatalogo,
  loadFavoritos,
  loadProgresso,
  subscribeVideoaulas,
} from '@/lib/videoaulasStore';
import { useVoiceInput } from '@/hooks/useVoiceInput';


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

type Aba = 'videos' | 'favoritos' | 'historico';

const ABAS: { id: Aba; label: string; icon: typeof Video }[] = [
  { id: 'videos', label: 'Vídeos', icon: Video },
  { id: 'favoritos', label: 'Favoritos', icon: Star },
  { id: 'historico', label: 'Histórico', icon: History },
];


/** Catálogo: lista de áreas (ou de aulas) + abas de favoritos e histórico. */
const VideoaulasCatalogo = () => {
  const { catalogo: catalogoId } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);
  const [aulas, setAulas] = useState<Aula[]>(
    () => (catalogo ? ((getCachedCatalogo(catalogo.id) as Aula[] | null) ?? []) : []),
  );
  const [busca, setBusca] = useState('');
  const { listening, partial, toggle } = useVoiceInput((t) => setBusca(t));
  const [aba, setAba] = useState<Aba>('videos');
  const [favoritos, setFavoritos] = useState<Aula[]>([]);
  const [historico, setHistorico] = useState<(Aula & { percentual?: number })[]>([]);
  const [loading, setLoading] = useState(
    () => !(catalogo && getCachedCatalogo(catalogo.id)?.length),
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
      const rows = await loadCatalogo(catalogo.id);
      if (!alive) return;
      setAulas(rows as Aula[]);
      setLoading(false);
    })();
    const off = subscribeVideoaulas(() => {
      if (!alive) return;
      const novas = getCachedCatalogo(catalogo.id) as Aula[] | null;
      if (novas?.length) {
        setAulas(novas);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, [catalogo]);

  useEffect(() => {
    if (!catalogo) return;
    let alive = true;
    (async () => {
      if (aba === 'favoritos') {
        const cacheFav = getCachedFavoritos();
        if (cacheFav && alive) {
          setFavoritos(cacheFav.filter((f) => f.tabela === catalogo.tabela) as unknown as Aula[]);
        }
        const favs = await loadFavoritos();
        if (alive) {
          setFavoritos(
            favs.filter((f) => f.tabela === catalogo.tabela) as unknown as Aula[],
          );
        }
      } else if (aba === 'historico') {
        const prog = getCachedProgresso() ?? (await loadProgresso());
        if (alive) {
          setHistorico(
            prog
              .filter((p) => p.tabela === catalogo.tabela)
              .slice(0, 80)
              .map((p) => ({
                video_id: p.video_id,
                percentual: p.percentual ?? 0,
              })) as any,
          );
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [aba, catalogo]);


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

  const cardAula = (a: Aula & { percentual?: number }, i: number) => (
    <button
      key={`${a.video_id}-${i}`}
      onClick={() => navigate(rotaAula(a))}
      className="w-full flex gap-3 overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary/50 active:scale-[0.99]"
    >
      <div className="relative aspect-video w-32 shrink-0 bg-muted">
        <ThumbImg
          src={a.thumb || a.thumbnail || ytThumb(a.video_id)}
          alt={`Capa da aula ${limparTitulo(a.titulo || 'videoaula')}`}
          fallback={<Play className="h-6 w-6 text-primary/50" />}
        />
        <span className="absolute inset-0 grid place-items-center bg-black/15">
          <Play className="h-6 w-6 fill-current text-white" />
        </span>
        {typeof a.percentual === 'number' && a.percentual > 0 && (
          <span
            className="absolute bottom-0 left-0 h-1 bg-primary"
            style={{ width: `${Math.min(100, a.percentual)}%` }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1 py-2 pr-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">
          {limparTitulo(a.titulo || 'Videoaula')}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {a.area ? simplificarNomeArea(a.area) : catalogo.titulo}
          {a.duracao_segundos ? ` · ${formatDuracao(a.duracao_segundos)}` : ''}
        </p>
      </div>
    </button>
  );

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <div className="relative z-10">
        <PageHeader
          title={catalogo.titulo}
          subtitle={loading ? 'Carregando…' : `${aulas.length.toLocaleString('pt-BR')} aulas`}
          onBack={() => navigate('/videoaulas')}
        />

        <div className="mx-auto max-w-md px-4 pt-4 space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={listening ? partial : busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={
                listening
                  ? 'Ouvindo…'
                  : aba !== 'videos'
                    ? 'Buscar aula…'
                    : catalogo.temAreas
                      ? 'Buscar área…'
                      : 'Buscar aula…'
              }
              className="rounded-full bg-card pl-9 pr-11"
            />
            <button
              type="button"
              onClick={toggle}
              aria-label={listening ? 'Parar busca por voz' : 'Buscar por voz'}
              className={`absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition-colors ${
                listening ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Abas */}
          <div className="grid grid-cols-3 gap-2">
            {ABAS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-[12px] font-semibold transition-colors ${
                  aba === id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>


          {/* Conteúdo */}
          {aba === 'videos' &&
            (catalogo.temAreas
              ? areas.map((area) => (
                  <button
                    key={area.nome}
                    onClick={() => navigate(`/videoaulas/${catalogo.id}/${slugify(area.nome)}`)}
                    className="group flex w-full items-stretch overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/50 active:scale-[0.98]"
                    style={{ minHeight: 96 }}
                  >
                    <div className="relative w-[110px] shrink-0 overflow-hidden">
                      <ThumbImg
                        src={area.thumb}
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
              : aulasFiltradas.map(cardAula))}

          {aba === 'favoritos' &&
            (favoritos.length > 0 ? (
              favoritos
                .filter(
                  (f) =>
                    !busca.trim() ||
                    limparTitulo(f.titulo || '')
                      .toLowerCase()
                      .includes(busca.trim().toLowerCase()),
                )
                .map(cardAula)
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Você ainda não favoritou aulas desta trilha.
              </p>
            ))}

          {aba === 'historico' &&
            (historico.length > 0 ? (
              historico.map((h, i) => {
                const original = aulas.find((a) => a.video_id === h.video_id);
                return cardAula(
                  {
                    ...h,
                    titulo: original?.titulo ?? 'Videoaula',
                    area: original?.area,
                    thumb: original?.thumb ?? original?.thumbnail,
                    percentual: Number(h.percentual) || 0,
                  } as any,
                  i,
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma aula assistida nesta trilha.
              </p>
            ))}

          {aba === 'videos' && !loading && aulas.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma aula disponível.
            </p>
          )}
        </div>
      </div>

    </div>
  );

};

export default VideoaulasCatalogo;
