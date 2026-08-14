import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, Search, Star, Trophy, Heart, ListVideo, CalendarHeart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import ObraDetailSheet, { type Obra } from "@/components/tematica/ObraDetailSheet";
import CinemaPanel from "@/components/tematica/CinemaPanel";
import ObrasCarousel from "@/components/tematica/ObrasCarousel";
import RecomendadosAutoCarousel from "@/components/tematica/RecomendadosAutoCarousel";
import TematicaBottomNav from "@/components/tematica/TematicaBottomNav";
import HabilidadeHero from "@/components/tematica/HabilidadeHero";
import EmAltaFaixa from "@/components/tematica/EmAltaFaixa";
import VerTodosSheet from "@/components/tematica/VerTodosSheet";
import TematicaMaratonaView from "@/components/tematica/TematicaMaratonaView";
import TematicaRecomendacoesView from "@/components/tematica/TematicaRecomendacoesView";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buscarRankingEngajamento, type RankingRow } from "@/lib/tematicaMetricas";
import { HABILIDADES, HABILIDADES_MAP, type HabilidadeId, isHabilidadeId } from "@/lib/tematicaHabilidades";
import { useGoBack } from '@/hooks/useGoBack';

import {
  getCachedObras,
  getCachedRanking,
  getCachedFavoritosTematica,
  loadObras,
  loadRanking,
  loadFavoritosTematica,
  subscribeTematica,
} from "@/lib/tematicaStore";

type Atalho = "todos" | "ranking" | "favoritos" | "maratona" | "recomendacoes";

const ATALHOS: { id: Atalho; label: string; icon: any }[] = [
  { id: "todos", label: "Todos", icon: Film },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "maratona", label: "Maratona", icon: ListVideo },
  { id: "recomendacoes", label: "Recomendações", icon: CalendarHeart },
];

export default function TematicaJuridica() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const cacheInicial = getCachedObras();
  const rankingInicial = getCachedRanking();
  const favoritosIniciais = getCachedFavoritosTematica();
  const [obras, setObras] = useState<Obra[]>((cacheInicial ?? []) as Obra[]);
  const [destaques, setDestaques] = useState<Set<string>>(
    new Set((cacheInicial ?? []).filter((o: any) => o.destaque).map((o: any) => o.id)),
  );
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciais ?? []));
  const [ranking, setRanking] = useState<Map<string, RankingRow>>(
    new Map((rankingInicial ?? []).map((r: any) => [r.obra_id, r as RankingRow])),
  );
  const [loading, setLoading] = useState(!cacheInicial?.length);
  const [atalho, setAtalho] = useState<Atalho>(() => {
    const search = new URLSearchParams(window.location.search);
    const tab = search.get("tab") as Atalho;
    return ATALHOS.some((a) => a.id === tab) ? tab : "todos";
  });
  const [busca, setBusca] = useState("");
  const [habilidade, setHabilidade] = useState<HabilidadeId | null>(null);
  const [selecionada, setSelecionada] = useState<Obra | null>(null);
  const [verTodos, setVerTodos] = useState<null | "filmes" | "series" | "documentarios">(null);

  // Mantém a tela em sincronia quando a revalidação em segundo plano termina.
  useEffect(() => subscribeTematica(() => {
    const lista = getCachedObras();
    if (lista?.length) {
      setObras(lista as Obra[]);
      setDestaques(new Set(lista.filter((o: any) => o.destaque).map((o: any) => o.id)));
      setLoading(false);
    }
    const rk = getCachedRanking();
    if (rk) setRanking(new Map(rk.map((r: any) => [r.obra_id, r as RankingRow])));
    const fav = getCachedFavoritosTematica();
    if (fav) setFavoritos(new Set(fav));
  }), []);

  useEffect(() => {
    (async () => {
      const list = await loadObras();
      if (list.length) {
        setDestaques(new Set(list.filter((o: any) => o.destaque).map((o) => o.id)));
        setObras(list as unknown as Obra[]);
      }
      setLoading(false);

      void loadRanking(buscarRankingEngajamento as any).then((rows) => {
        setRanking(new Map(rows.map((r: any) => [r.obra_id, r as RankingRow])));
      });
      void loadFavoritosTematica().then((ids) => setFavoritos(new Set(ids)));
    })();
  }, []);

  // Contagem de obras por habilidade (calculada sobre acervo completo, ignorando o filtro atual)
  const contagensHab = useMemo(() => {
    const map: Partial<Record<HabilidadeId, number>> = {};
    for (const o of obras) {
      const hs = ((o as any).habilidades ?? []) as string[];
      for (const h of hs) {
        if (isHabilidadeId(h)) map[h] = (map[h] ?? 0) + 1;
      }
    }
    return map;
  }, [obras]);

  const buscadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let base = obras;
    if (habilidade) {
      base = base.filter((o) =>
        (((o as any).habilidades ?? []) as string[]).includes(habilidade),
      );
    }
    if (!termo) return base;
    return base.filter((o) => {
      const alvo = `${o.titulo} ${o.titulo_original ?? ""}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [obras, busca, habilidade]);

  const filmes = useMemo(
    () => buscadas.filter((o) => o.tipo === "movie" && !(o.categorias_juridicas ?? []).includes("Documentário")),
    [buscadas]
  );
  const series = useMemo(
    () => buscadas.filter((o) => o.tipo === "tv" && !(o.categorias_juridicas ?? []).includes("Documentário")),
    [buscadas]
  );
  const documentarios = useMemo(
    () => buscadas.filter((o) => (o.categorias_juridicas ?? []).includes("Documentário")),
    [buscadas]
  );

  // Recomendados: mix aleatório 60% filmes, 30% séries, 10% docs. Prioriza destaques.
  const recomendados = useMemo(() => {
    const TOTAL = 18;
    const shuffle = <T,>(arr: T[]) => {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    };
    const rankPool = (pool: Obra[]) => {
      const dest = shuffle(pool.filter((o) => destaques.has(o.id)));
      const rest = shuffle(pool.filter((o) => !destaques.has(o.id)));
      return [...dest, ...rest];
    };
    const pf = rankPool(filmes);
    const ps = rankPool(series);
    const pd = rankPool(documentarios);
    const nf = Math.round(TOTAL * 0.6);
    const ns = Math.round(TOTAL * 0.3);
    const nd = TOTAL - nf - ns;
    const pick: Obra[] = [
      ...pf.slice(0, nf),
      ...ps.slice(0, ns),
      ...pd.slice(0, nd),
    ];
    // se algum grupo não tiver o suficiente, completa com os outros pools
    const seen = new Set(pick.map((o) => o.id));
    if (pick.length < TOTAL) {
      const extras = shuffle([...pf, ...ps, ...pd]).filter((o) => !seen.has(o.id));
      pick.push(...extras.slice(0, TOTAL - pick.length));
    }
    return shuffle(pick);
  }, [filmes, series, documentarios, destaques]);

  // Modo "atalho" filtrado (mostra em grade)
  const listaAtalho = useMemo(() => {
    if (atalho === "todos") return null;
    if (atalho === "ranking") {
      return [...buscadas].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
    }
    if (atalho === "favoritos") {
      return buscadas.filter((o) => favoritos.has(o.id));
    }
    return null;
  }, [atalho, buscadas, favoritos, ranking]);

  // Top "Em alta" para faixa horizontal do topo (ranking real de engajamento; fallback: nota)
  const topEmAlta = useMemo(() => {
    const scored = buscadas
      .map((o) => ({ o, s: ranking.get(o.id)?.score ?? 0 }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.o);
    if (scored.length >= 4) return scored.slice(0, 12);
    // fallback quando ainda não há engajamento suficiente
    return [...buscadas]
      .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0))
      .slice(0, 12);
  }, [buscadas, ranking]);


  const mobileHeader = (
    <PageHeader
      title="Temática Jurídica"
      subtitle="Filmes, séries e documentários para juristas"
      onBack={() => goBack()}
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="ferramentas"
      title="Temática Jurídica"
      subtitle="Filmes, séries e documentários para juristas"
      mobileHeader={mobileHeader}
    >
      <main className="min-h-dvh bg-background pb-[calc(96px+var(--sai-bottom,0px))]">
        <div className="max-w-3xl mx-auto w-full">
          {/* Painel cinema vermelho */}
          <CinemaPanel>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-200/70 z-10" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título..."
                className="pl-9 h-11 rounded-xl bg-black/30 border-red-200/20 text-red-50 placeholder:text-red-200/50 backdrop-blur"
              />
            </div>
          </CinemaPanel>

          {/* Menu de alternância por temas (habilidades) */}
          <div className="mt-5 mb-2 px-4 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setHabilidade(null)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                !habilidade
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
              Todos
            </button>
            {HABILIDADES.map((h) => {
              const Icon = h.icon;
              const active = habilidade === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setHabilidade(active ? null : h.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {h.short}
                </button>
              );
            })}
          </div>


          {atalho === "maratona" ? (
            <TematicaMaratonaView obras={obras} onAbrirObra={setSelecionada} />
          ) : atalho === "recomendacoes" ? (
            <TematicaRecomendacoesView obras={obras} onAbrirObra={setSelecionada} />
          ) : loading ? (
            <div className="px-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : listaAtalho ? (
            <>
              <div className="px-4 mt-5 mb-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
                  {atalho === "ranking" && "TOP AVALIADOS"}
                  {atalho === "favoritos" && "SEUS FAVORITOS"}

                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1 h-6 rounded-full bg-red-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                    {ATALHOS.find((a) => a.id === atalho)?.label}
                  </h2>
                </div>
              </div>

              {listaAtalho.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {atalho === "favoritos"
                      ? "Você ainda não favoritou nenhuma obra."
                      : "Nada por aqui ainda."}
                  </p>
                </div>
              ) : (
                <div className="px-4 flex flex-col gap-2.5">
                  {listaAtalho.map((obra, i) => {
                    const isDoc = (obra.categorias_juridicas ?? []).includes("Documentário");
                    const tipoLabel = isDoc ? "Doc" : obra.tipo === "movie" ? "Filme" : "Série";
                    return (
                      <motion.button
                        key={obra.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.025, 0.35) }}
                        onClick={() => setSelecionada(obra)}
                        className="group relative flex items-stretch gap-3 rounded-xl overflow-hidden bg-card border border-border/50 text-left hover:border-red-500/40 transition-colors"
                      >
                        {/* Posição no ranking */}
                        {atalho === "ranking" && (
                          <div className="shrink-0 w-8 flex items-center justify-center bg-gradient-to-b from-red-600/20 to-red-900/10">
                            <span className="text-lg font-black text-red-500/90 tabular-nums">
                              {i + 1}
                            </span>
                          </div>
                        )}

                        {/* Poster */}
                        <div className="shrink-0 w-16 aspect-[2/3] overflow-hidden bg-muted">
                          {obra.poster_url ? (
                            <img
                              src={obra.poster_url}
                              alt={obra.titulo}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center p-1"
                              style={{ background: "linear-gradient(135deg, hsl(0 55% 22%), hsl(05 65% 14%))" }}
                            >
                              <Film className="w-5 h-5 text-red-200/60" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 py-2.5 pr-3 flex flex-col justify-center gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-red-600/15 text-red-500 text-[9px] font-bold uppercase tracking-wider">
                              {tipoLabel}
                            </span>
                            {obra.ano ? (
                              <span className="text-[11px] text-muted-foreground">{obra.ano}</span>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                            {obra.titulo}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                            {obra.nota ? (
                              <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                <Star className="w-3 h-3 fill-amber-500" strokeWidth={0} />
                                {obra.nota.toFixed(1)}
                              </span>
                            ) : null}

                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Faixa "Em alta" no topo, só quando não há filtros ativos */}
              {!habilidade && !busca.trim() && <EmAltaFaixa obras={topEmAlta} onAbrir={setSelecionada} />}

              {/* Hero de habilidade selecionada */}
              {habilidade && (
                <HabilidadeHero
                  habilidade={HABILIDADES_MAP[habilidade]}
                  total={buscadas.length}
                  onLimpar={() => setHabilidade(null)}
                />
              )}

              {habilidade ? (
                buscadas.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Ainda não temos obras para essa habilidade.</p>
                  </div>
                ) : (
                  <div className="px-4 mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 pb-6">
                    {buscadas.map((obra, i) => (
                      <motion.button
                        key={obra.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        onClick={() => setSelecionada(obra)}
                        className="group text-left"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border/50 group-hover:border-red-500/40 shadow-lg shadow-black/20 transition-colors">
                          {obra.poster_url ? (
                            <img
                              src={obra.poster_url}
                              alt={obra.titulo}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, hsl(0 55% 22%), hsl(05 65% 14%))" }}
                            >
                              <Film className="w-7 h-7 text-red-200/60" strokeWidth={1.5} />
                            </div>
                          )}
                          {obra.nota ? (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur text-amber-300 text-[10px] font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400" strokeWidth={0} />
                              {obra.nota.toFixed(1)}
                            </div>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[12px] font-semibold text-foreground leading-tight line-clamp-2">
                          {obra.titulo}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )
              ) : (
                <>
                  <RecomendadosAutoCarousel obras={recomendados} onAbrir={setSelecionada} />
                  <ObrasCarousel
                    titulo="Filmes"
                    eyebrow="LONGAS-METRAGENS"
                    subtitulo="Clássicos e contemporâneos com temática jurídica"
                    obras={filmes}
                    onAbrir={setSelecionada}
                    onVerTodos={() => setVerTodos("filmes")}
                  />
                  <ObrasCarousel
                    titulo="Séries"
                    eyebrow="SEASONS"
                    subtitulo="Séries que exploram o universo do Direito"
                    obras={series}
                    onAbrir={setSelecionada}
                    onVerTodos={() => setVerTodos("series")}
                  />
                  <ObrasCarousel
                    titulo="Documentários"
                    eyebrow="REAL · INVESTIGATIVO"
                    subtitulo="Casos verdadeiros que marcaram a Justiça"
                    obras={documentarios}
                    onAbrir={setSelecionada}
                    onVerTodos={() => setVerTodos("documentarios")}
                  />
                  <div className="h-8" />
                </>
              )}
            </>
          )}
        </div>

        <VerTodosSheet
          open={!!verTodos}
          titulo={verTodos === "series" ? "Séries" : verTodos === "documentarios" ? "Documentários" : "Filmes"}
          eyebrow={verTodos === "series" ? "SEASONS" : verTodos === "documentarios" ? "REAL · INVESTIGATIVO" : "LONGAS-METRAGENS"}
          obras={verTodos === "series" ? series : verTodos === "documentarios" ? documentarios : filmes}
          onAbrir={(o) => setSelecionada(o)}
          onClose={() => setVerTodos(null)}
        />

        <ObraDetailSheet
          obra={selecionada}
          open={!!selecionada}
          onClose={() => setSelecionada(null)}
        />

        {/* Menu de rodapé com as funções */}
        <TematicaBottomNav active={atalho} onChange={setAtalho} hidden={!!selecionada} />

      </main>
    </DesktopPageLayout>
  );
}
