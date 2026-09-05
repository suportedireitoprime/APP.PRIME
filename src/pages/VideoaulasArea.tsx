import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, BookOpenText } from 'lucide-react';

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from '@/components/ui/input';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { getCatalogo, limparTitulo } from '@/lib/videoaulasCatalogos';
import {
  getCachedAulasDaArea,
  getCachedFavoritos,
  getCachedProgresso,
  loadAulasDaArea,
  loadFavoritos,
  loadProgresso,
  subscribeVideoaulas,
} from '@/lib/videoaulasStore';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';

import {
  Aula,
  ProgressoMap,
  normalizeText,
  mapearProgresso,
  AreaTrilhaSetup,
  AreaTrilhaMap,
  AreaAulaCard,
  AreaBottomNav,
  type AreaTab,
} from '@/components/videoaulas/area';

/** Aulas de uma área do catálogo. */
const VideoaulasArea = () => {
  const { catalogo: catalogoId, area: areaSlug } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);

  const [aulas, setAulas] = useState<Aula[]>(
    () => (catalogo ? (getCachedAulasDaArea(catalogo.id, areaSlug!) as Aula[] | null) : null) ?? [],
  );
  const [progresso, setProgresso] = useState<ProgressoMap>(() =>
    catalogo ? mapearProgresso(getCachedProgresso(), catalogo.tabela) : {},
  );
  const [favoritos, setFavoritos] = useState<Set<string>>(
    () => new Set((getCachedFavoritos() ?? []).map((f) => f.video_id)),
  );

  const location = useLocation();
  const [aba, setAba] = useState<AreaTab>(
    (location.state as any)?.tab || 'videos',
  );
  const [busca, setBusca] = useState('');
  const { listening, partial, toggle } = useVoiceInput((t) => setBusca(t));
  const [loading, setLoading] = useState(
    () => !(catalogo && getCachedAulasDaArea(catalogo.id, areaSlug!)?.length),
  );

  const { trilhasAtivas, setAreaTrilhaAtiva } = useAreaTrilhaStore();

  useEffect(() => {
    if (!catalogo || !areaSlug) return;
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
    const termo = normalizeText(busca.trim());
    let base = aulas;
    if (aba === 'favoritos') base = base.filter((a) => favoritos.has(a.video_id));
    if (aba === 'recentes') {
      base = base.filter((a) => (progresso[a.video_id]?.percentual ?? 0) > 0);
    }
    if (termo) base = base.filter((a) => normalizeText(limparTitulo(a.titulo)).includes(termo));
    return base;
  }, [aulas, aba, busca, favoritos, progresso]);

  if (!catalogo || !areaSlug) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Catálogo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-[calc(1.25rem+var(--sai-bottom)+80px)]">
      <PageHeader
        title={nomeArea}
        subtitle={loading ? 'Carregando…' : `${aulas.length} aulas`}
        onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
      />

      <AnimatePresence mode="wait">
        {(aba === 'videos' || aba === 'favoritos' || aba === 'recentes') && (
          <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mx-auto max-w-md lg:max-w-5xl px-4 pt-4 space-y-3">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={listening ? partial : busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder={listening ? 'Ouvindo…' : 'Buscar aula…'}
                    aria-label="Buscar aula"
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
            </div>

            <motion.div
              className="max-w-md lg:max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
              }}
              initial="hidden"
              animate="show"
            >
              {lista.map((a, i) => (
                <AreaAulaCard
                  key={String(a.id)}
                  aula={a}
                  index={i}
                  nomeArea={nomeArea}
                  isFavorito={favoritos.has(a.video_id)}
                  progresso={progresso[a.video_id]}
                  onClick={() => navigate(`/videoaulas/${catalogo.id}/${areaSlug}/${a.video_id}`)}
                />
              ))}

              {!loading && lista.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhuma aula encontrada.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {aba === 'trilhas' && (
          <motion.div key="trilhas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!trilhasAtivas[areaSlug] ? (
              <AreaTrilhaSetup
                areaSlug={areaSlug}
                onFinish={(dias) => {
                  setAreaTrilhaAtiva(areaSlug, {
                    areaSlug,
                    areaName: nomeArea,
                    catalogoId: catalogo.id,
                    diasMeta: dias,
                    diasConcluidos: [],
                    dataInicio: new Date().toISOString(),
                  });
                }}
              />
            ) : (
              <AreaTrilhaMap areaSlug={areaSlug} catalogoId={catalogo.id} aulas={aulas} />
            )}
          </motion.div>
        )}

        {aba === 'anotacoes' && (
          <motion.div
            key="anotacoes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center pt-24 px-6 text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpenText className="w-10 h-10 text-primary opacity-80" />
            </div>
            <h2 className="text-xl font-bold mb-2">Anotações da Disciplina</h2>
            <p className="text-sm text-muted-foreground">
              Em breve, seus cadernos e resumos de <strong>{nomeArea}</strong> aparecerão listados aqui.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu de Rodapé Exclusivo da Área */}
      <AreaBottomNav currentTab={aba} onSelectTab={setAba} />
    </div>
  );
};

export default VideoaulasArea;
