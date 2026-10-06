import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { listarTrilhas } from "@/lib/leiSeca";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { prefetchHandlers, prefetchTrilha } from "@/lib/leiSecaPrefetch";
import { prefetchImages } from '@/lib/coverLoader';
import fallbackTrilhas from "@/data/lei-seca-trilhas.json";

import { Skeleton } from "@/components/ui/skeleton";
import { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { useLeiSecaFavoritos } from "@/hooks/useLeiSecaFavoritos";
import { useLeiSecaRecentes } from "@/hooks/useLeiSecaRecentes";
import { LEI_SECA_MATERIAS, type LeiSecaMateria } from "@/lib/leiSecaMaterias";
import { LeiSecaMateriaSheet } from "@/components/lei-seca/LeiSecaMateriaSheet";
import LeiSecaBottomNav from "@/components/lei-seca/LeiSecaBottomNav";
import {
  LeiSecaHero,
  LeiSecaTrilhaCard,
} from "@/components/lei-seca/chunks";
import { LeiSecaRankingSheet } from "@/components/lei-seca/chunks/LeiSecaRankingSheet";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { BookOpen, Scale, Sparkles, AlertCircle, Landmark, Library, FileBadge } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function LeiSecaIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trilhas = fallbackTrilhas as any[], isLoading } = useQuery({
    queryKey: ["lei-seca-trilhas"],
    queryFn: listarTrilhas,
    initialData: fallbackTrilhas as any[],
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
  const [rankingOpen, setRankingOpen] = useState(false);

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

  // Agrupamento por Categorias
  const codigos = useMemo(() => {
    return trilhas.filter((t) => {
      const n = (t.nome || '').toLowerCase();
      return n.includes('código') || n.includes('constituição') || n.includes('clt');
    });
  }, [trilhas]);

  const estatutos = useMemo(() => {
    return trilhas.filter((t) => {
      const n = (t.nome || '').toLowerCase();
      return n.includes('estatuto') || t.slug === 'eca';
    });
  }, [trilhas]);

  const leisEspeciais = useMemo(() => {
    return trilhas.filter((t) => {
      const isCodigo = (t.nome || '').toLowerCase().includes('código') || (t.nome || '').toLowerCase().includes('constituição') || (t.nome || '').toLowerCase().includes('clt');
      const isEstatuto = (t.nome || '').toLowerCase().includes('estatuto') || t.slug === 'eca';
      return !isCodigo && !isEstatuto;
    });
  }, [trilhas]);

  const recentePrincipal = listaRecentes[0];

  return (
    <div className="min-h-screen bg-background text-white relative overflow-x-hidden animate-ls-enter" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Fundo ShapeGrid animado (padrão oficial do app) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
        {/* Chunk 1: Hero com Progresso e Estatísticas */}
        <LeiSecaHero
        pctGlobal={pctGlobal}
        totalMaterias={trilhas?.length ?? 0}
        totalTrilhas={trilhas?.length ?? 0}
        resumo={resumo}
        onBack={() => navigate("/", { replace: true })}
        onOpenRanking={() => setRankingOpen(true)}
      />

      {/* Botão Premium: Continuar Estudo (movido para fora do Hero com margem segura) */}
      {recentePrincipal && (
        <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 mt-8 relative z-30 mb-2">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              navigate(`/lei-seca/${recentePrincipal.slug}`);
            }}
            className="w-full sm:max-w-md mx-auto flex items-center justify-between gap-4 p-4 min-h-[64px] rounded-2xl bg-[#1a0510] hover:bg-[#250818] border border-rose-500/30 shadow-[0_8px_32px_-12px_rgba(244,63,94,0.3)] active:scale-[0.99] transition-all text-left touch-manipulation group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-12 w-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-300 font-bold shrink-0 ring-1 ring-rose-500/40">
                <BookOpen className="h-6 w-6 text-rose-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">
                  Continuar estudando
                </span>
                <p className="font-bold text-[15px] sm:text-base text-white truncate">{recentePrincipal.nome}</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/40 transition-colors shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-rose-300 ml-0.5"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      )}

      {/* Introdução Didática */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <p className="text-center text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          A Lei Seca transforma cada artigo em desafios rápidos. Escolha uma matéria, abra as leis e ganhe estrelas a cada acerto.
        </p>
      </div>

      {/* Conteúdo: Menu de Alternância (Tabs) */}
      <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 py-4 pb-[calc(4rem+var(--sai-bottom))]">
        <Tabs defaultValue="codigos" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-black/40 border border-white/5 rounded-2xl mb-6 overflow-x-auto overflow-y-hidden snap-x touch-pan-x flex-nowrap scrollbar-hide">
            <TabsTrigger value="codigos" className="flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground whitespace-nowrap snap-start">
              <Scale className="h-3.5 w-3.5" /> Códigos
            </TabsTrigger>
            <TabsTrigger value="estatutos" className="flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground whitespace-nowrap snap-start">
              <BookOpen className="h-3.5 w-3.5" /> Estatutos
            </TabsTrigger>
            <TabsTrigger value="leis-especiais" className="flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground whitespace-nowrap snap-start">
              <Sparkles className="h-3.5 w-3.5" /> Leis Especiais
            </TabsTrigger>
            <TabsTrigger value="sumulas" className="flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground whitespace-nowrap snap-start">
              <FileBadge className="h-3.5 w-3.5" /> Súmulas
            </TabsTrigger>
          </TabsList>

          {/* Seção Códigos */}
          <TabsContent value="codigos" className="mt-0 outline-none animate-ls-enter space-y-4">
            {codigos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-2xl" />)}
                {!isLoading && codigos.map((t) => (
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
          </TabsContent>

          {/* Seção Estatutos */}
          <TabsContent value="estatutos" className="mt-0 outline-none animate-ls-enter space-y-4">
            {estatutos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-2xl" />)}
                {!isLoading && estatutos.map((t) => (
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
          </TabsContent>

          {/* Seção Leis Especiais */}
          <TabsContent value="leis-especiais" className="mt-0 outline-none animate-ls-enter space-y-4">
            {leisEspeciais.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-400/80 uppercase tracking-widest pl-1 mb-2">
                  <AlertCircle className="h-3 w-3" /> 
                  Mais cobradas em provas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-2xl" />)}
                  {!isLoading && leisEspeciais.map((t) => (
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
              </>
            )}
          </TabsContent>

          {/* Seção Súmulas */}
          <TabsContent value="sumulas" className="mt-0 outline-none animate-ls-enter space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[
                { slug: 'sumulas-vinculantes', nome: 'Súmulas Vinculantes', sigla: 'SV', icon: <Landmark className="h-6 w-6 text-orange-500" /> },
                { slug: 'sumulas-stf', nome: 'Súmulas do STF', sigla: 'STF', icon: <Scale className="h-6 w-6 text-orange-500" /> },
                { slug: 'sumulas-stj', nome: 'Súmulas do STJ', sigla: 'STJ', icon: <Library className="h-6 w-6 text-orange-500" /> },
              ].map(s => (
                <button
                  key={s.slug}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/jurisprudencia/${s.slug}`);
                  }}
                  className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#141414] p-3 text-left transition-all hover:bg-[#1a1a1a] w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-black/40 border border-white/5 shadow-inner">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{s.sigla}</p>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{s.nome}</h3>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      
      <LeiSecaRankingSheet 
        open={rankingOpen} 
        onOpenChange={setRankingOpen} 
      />
    </div>
  );
}
