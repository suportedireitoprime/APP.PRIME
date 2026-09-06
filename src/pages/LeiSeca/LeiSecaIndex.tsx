import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { listarTrilhas } from "@/lib/leiSeca";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { prefetchHandlers, prefetchTrilha } from "@/lib/leiSecaPrefetch";
import { BookOpen, Clock, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { useLeiSecaFavoritos } from "@/hooks/useLeiSecaFavoritos";
import { useLeiSecaRecentes } from "@/hooks/useLeiSecaRecentes";
import { LEI_SECA_MATERIAS, type LeiSecaMateria } from "@/lib/leiSecaMaterias";
import { LeiSecaMateriaSheet } from "@/components/lei-seca/LeiSecaMateriaSheet";
import LeiSecaBottomNav from "@/components/lei-seca/LeiSecaBottomNav";
import {
  LeiSecaHero,
  LeiSecaFiltroTabs,
  LeiSecaMateriaCard,
  LeiSecaTrilhaCard,
  LeiSecaEmptyState,
  type LeiSecaFiltro,
} from "@/components/lei-seca/chunks";

export default function LeiSecaIndex({ modo = "todos" }: { modo?: LeiSecaFiltro }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["lei-seca-trilhas"],
    queryFn: listarTrilhas,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    ...persistedInitial<Awaited<ReturnType<typeof listarTrilhas>>>("lei-seca-trilhas"),
  });

  useEffect(() => {
    if (trilhas) savePersisted("lei-seca-trilhas", trilhas);
  }, [trilhas]);

  const { data: resumo } = useLeiSecaResumoGlobal();
  const { favoritos, isFav, toggle } = useLeiSecaFavoritos();
  const { data: recentes } = useLeiSecaRecentes();
  const [materiaAberta, setMateriaAberta] = useState<LeiSecaMateria | null>(null);

  const pctGlobal = resumo?.pctGlobal ?? 0;

  // Trilhas indexadas por slug
  const trilhasMap = useMemo(() => new Map((trilhas ?? []).map((t) => [t.slug, t])), [trilhas]);

  // Listas de recentes e favoritos
  const listaRecentes = useMemo(
    () =>
      (recentes ?? [])
        .map((s) => trilhasMap.get(s))
        .filter(Boolean) as NonNullable<ReturnType<typeof trilhasMap.get>>[],
    [recentes, trilhasMap]
  );

  const listaFavoritos = useMemo(
    () =>
      Array.from(favoritos)
        .map((s) => trilhasMap.get(s))
        .filter(Boolean) as NonNullable<ReturnType<typeof trilhasMap.get>>[],
    [favoritos, trilhasMap]
  );

  // Matérias disponíveis
  const materias = useMemo(
    () =>
      LEI_SECA_MATERIAS.map((m) => ({
        ...m,
        disponiveis: m.trilhas.filter((s) => trilhasMap.has(s)).length,
      })).filter((m) => m.disponiveis > 0),
    [trilhasMap]
  );

  const handleMudarFiltro = (novoFiltro: LeiSecaFiltro) => {
    if (novoFiltro === "todos") navigate("/lei-seca");
    else if (novoFiltro === "recentes") navigate("/lei-seca/recentes");
    else if (novoFiltro === "favoritos") navigate("/lei-seca/favoritos");
  };

  return (
    <div className="min-h-screen bg-background animate-ls-enter">
      {/* Chunk 1: Hero com Progresso e Estatísticas */}
      <LeiSecaHero
        pctGlobal={pctGlobal}
        totalMaterias={materias.length}
        totalTrilhas={trilhas?.length ?? 0}
        resumo={resumo}
        recentePrincipal={listaRecentes[0]}
        onBack={() => navigate("/", { replace: true })}
      />

      {/* Introdução Didática */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <p className="text-center text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          A Lei Seca transforma cada artigo em desafios rápidos. Escolha uma matéria, abra as leis e ganhe estrelas a cada acerto.
        </p>
      </div>

      {/* Conteúdo e Navegação por Abas */}
      <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 py-3 pb-[calc(7rem+var(--sai-bottom))]">
        {/* Chunk 2: Abas de Filtro */}
        <LeiSecaFiltroTabs
          filtroAtual={modo}
          onChangeFiltro={handleMudarFiltro}
          totalRecentes={listaRecentes.length}
          totalFavoritos={listaFavoritos.length}
        />

        {modo === "todos" && (
          <>
            <div className="flex items-center gap-2 mb-3 mt-1">
              <BookOpen className="h-4 w-4 text-violet-500" />
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Matérias
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[78px] rounded-2xl" />
                ))}
              {!isLoading &&
                materias.map((m, idx) => (
                  <LeiSecaMateriaCard
                    key={m.slug}
                    materia={m}
                    index={idx}
                    onSelect={(materia) => setMateriaAberta(materia)}
                    onPrefetch={() => {
                      m.trilhas
                        .slice(0, 4)
                        .forEach((s) => trilhasMap.has(s) && prefetchTrilha(qc, s));
                    }}
                  />
                ))}
            </div>
          </>
        )}

        {modo === "recentes" && (
          <>
            <div className="flex items-center gap-2 mb-3 mt-1">
              <Clock className="h-4 w-4 text-violet-500" />
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Recentes
              </h2>
            </div>
            {listaRecentes.length === 0 ? (
              <LeiSecaEmptyState
                icon={<Clock className="h-7 w-7 text-violet-500/70" />}
                titulo="Sem atividades ainda"
                texto="Comece uma trilha para ela aparecer aqui."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listaRecentes.map((t) => (
                  <LeiSecaTrilhaCard
                    key={t.id}
                    trilha={t}
                    resumo={resumo}
                    isFav={isFav(t.slug)}
                    onToggleFav={toggle}
                    onOpen={(slug) => navigate(`/lei-seca/${slug}`)}
                    prefetchHandlers={prefetchHandlers(qc, t.slug)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {modo === "favoritos" && (
          <>
            <div className="flex items-center gap-2 mb-3 mt-1">
              <Heart className="h-4 w-4 text-rose-500" />
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Favoritos
              </h2>
            </div>
            {listaFavoritos.length === 0 ? (
              <LeiSecaEmptyState
                icon={<Heart className="h-7 w-7 text-rose-500/70" />}
                titulo="Nenhum favorito"
                texto="Toque no ♡ ao lado de qualquer lei para favoritar."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listaFavoritos.map((t) => (
                  <LeiSecaTrilhaCard
                    key={t.id}
                    trilha={t}
                    resumo={resumo}
                    isFav={isFav(t.slug)}
                    onToggleFav={toggle}
                    onOpen={(slug) => navigate(`/lei-seca/${slug}`)}
                    prefetchHandlers={prefetchHandlers(qc, t.slug)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sheet de detalhes da matéria */}
      <LeiSecaMateriaSheet
        open={!!materiaAberta}
        onOpenChange={(v) => !v && setMateriaAberta(null)}
        materia={materiaAberta}
        trilhas={trilhas ?? []}
        resumo={resumo}
      />

      {/* Menu de rodapé dedicado de Lei Seca */}
      <LeiSecaBottomNav />
    </div>
  );
}
