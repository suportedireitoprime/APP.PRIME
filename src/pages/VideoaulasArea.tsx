import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { CheckCircle2, History, Mic, Play, Search, Star, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { formatDuracao, getCatalogo, limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import {
  getCachedAulasDaArea,
  getCachedFavoritos,
  getCachedProgresso,
  loadAulasDaArea,
  loadFavoritos,
  loadProgresso,
  subscribeVideoaulas,
  type ProgressoRow,
} from '@/lib/videoaulasStore';


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

/** Aulas de uma área do catálogo. */
const VideoaulasArea = () => {
  const { catalogo: catalogoId, area: areaSlug } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);
  // Cache em memória → a lista aparece no mesmo frame da navegação.
  const [aulas, setAulas] = useState<Aula[]>(
    () => (catalogo ? (getCachedAulasDaArea(catalogo.id, areaSlug) as Aula[] | null) : null) ?? [],
  );
  const [progresso, setProgresso] = useState<ProgressoMap>(() =>
    catalogo ? mapearProgresso(getCachedProgresso(), catalogo.tabela) : {},
  );
  const [favoritos, setFavoritos] = useState<Set<string>>(
    () => new Set((getCachedFavoritos() ?? []).map((f) => f.video_id)),
  );
  const [aba, setAba] = useState<'videos' | 'favoritos' | 'recentes'>('videos');
  const [busca, setBusca] = useState('');
  const { listening, partial, toggle } = useVoiceInput((t) => setBusca(t));
  const [loading, setLoading] = useState(
    () => !(catalogo && getCachedAulasDaArea(catalogo.id, areaSlug)?.length),
  );

  useEffect(() => {
    if (!catalogo) return;
    let alive = true;

    const doCache = getCachedAulasDaArea(catalogo.id, areaSlug) as Aula[] | null;
    if (doCache?.length) {
      setAulas(doCache);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setProgresso(mapearProgresso(getCachedProgresso(), catalogo.tabela));

    void (async () => {
      const [rows, prog, favs] = await Promise.all([
        loadAulasDaArea(catalogo.id, areaSlug),
        loadProgresso(),
        loadFavoritos(),
      ]);
      if (!alive) return;
      setAulas(rows as Aula[]);
      setProgresso(mapearProgresso(prog, catalogo.tabela));
      setFavoritos(new Set((favs ?? []).map((f) => f.video_id)));
      setLoading(false);
    })();

    const off = subscribeVideoaulas(() => {
      if (!alive) return;
      const novas = getCachedAulasDaArea(catalogo.id, areaSlug) as Aula[] | null;
      if (novas?.length) setAulas(novas);
      setProgresso(mapearProgresso(getCachedProgresso(), catalogo.tabela));
      setFavoritos(new Set((getCachedFavoritos() ?? []).map((f) => f.video_id)));
    });

    return () => {
      alive = false;
      off();
    };
  }, [catalogo, areaSlug]);

  const nomeArea = useMemo(
    () => aulas[0]?.area || (catalogo?.temAreas ? 'Área' : catalogo?.titulo) || 'Aulas',
    [aulas, catalogo],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let base = aulas;
    if (aba === 'favoritos') base = base.filter((a) => favoritos.has(a.video_id));
    if (aba === 'recentes') {
      base = base.filter((a) => (progresso[a.video_id]?.percentual ?? 0) > 0);
    }
    if (termo) base = base.filter((a) => limparTitulo(a.titulo).toLowerCase().includes(termo));
    return base;
  }, [aulas, aba, busca, favoritos, progresso]);

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Catálogo não encontrado.</p>
      </div>
    );
  }

  const ABAS = [
    { id: 'videos', label: 'Vídeos', icon: Video },
    { id: 'favoritos', label: 'Favoritos', icon: Star },
    { id: 'recentes', label: 'Recentes', icon: History },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader
        title={nomeArea}
        subtitle={loading ? 'Carregando…' : `${aulas.length} aulas`}
        onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
      />

      <div className="mx-auto max-w-md px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={listening ? partial : busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={listening ? 'Ouvindo…' : 'Buscar aula…'}
            aria-label="Buscar aula"
            className="rounded-full bg-card pl-9 pr-11"
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={listening ? 'Parar busca por voz' : 'Buscar por voz'}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full transition-colors ${
              listening ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

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
              aria-pressed={aba === id}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>



      <div className="px-4 pt-3 space-y-3">
        {lista.map((a, i) => {
          const p = progresso[a.video_id];
          const pct = p?.concluida ? 100 : Math.min(100, Math.round(p?.percentual ?? 0));
          return (
            <button
              key={String(a.id)}
              onClick={() => navigate(`/videoaulas/${catalogo.id}/${areaSlug}/${a.video_id}`)}
              className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors overflow-hidden flex gap-3 p-3"
            >
              <div className="relative w-32 shrink-0 aspect-video rounded-xl overflow-hidden bg-muted self-start">
                <img
                  src={a.thumb || a.thumbnail || ytThumb(a.video_id, 'mq')}
                  alt={`Capa da aula ${limparTitulo(a.titulo)}`}
                  width={320}
                  height={180}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  // @ts-expect-error atributo nativo
                  fetchpriority={i < 4 ? 'high' : 'low'}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/20">
                  {p?.concluida ? (
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Play className="h-6 w-6 text-white" />
                  )}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-muted-foreground">Aula {a.ordem ?? i + 1}</p>
                  {favoritos.has(a.video_id) && (
                    <Star className="h-3 w-3 text-primary" fill="currentColor" />
                  )}
                  {a.duracao_segundos ? (
                    <p className="text-[11px] text-muted-foreground">
                      • {formatDuracao(a.duracao_segundos)}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm font-normal leading-snug break-words">
                  {limparTitulo(a.titulo)}
                </p>

                <div className="mt-auto pt-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {p?.concluida ? 'Assistida' : pct > 0 ? `${pct}% assistido` : 'Não assistida'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {!loading && lista.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            {aba === 'favoritos'
              ? 'Nenhuma aula favorita nesta área.'
              : aba === 'recentes'
                ? 'Nenhuma aula iniciada nesta área.'
                : 'Nenhuma aula nesta área.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoaulasArea;

