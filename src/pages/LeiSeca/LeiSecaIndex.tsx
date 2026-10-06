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
import ShapeGrid from "@/components/ui/ShapeGrid";
import { BookOpen, Scale, Sparkles, AlertCircle } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";

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
      />

      {/* Botão Premium: Continuar Estudo (movido para fora do Hero) */}
      {recentePrincipal && (
        <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 -mt-4 relative z-30 mb-6">
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

      {/* Conteúdo: Listas de Leis agrupadas */}
      <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 py-3 pb-[calc(4rem+var(--sai-bottom))] space-y-10">
        
        {/* Seção Códigos */}
        {codigos.length > 0 && (
          <section className="animate-ls-enter" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-3.5 pl-1">
              <Scale className="h-4 w-4 text-emerald-500" />
              <h2 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white">
                Códigos
              </h2>
            </div>
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
          </section>
        )}

        {/* Seção Estatutos */}
        {estatutos.length > 0 && (
          <section className="animate-ls-enter" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-3.5 pl-1">
              <BookOpen className="h-4 w-4 text-fuchsia-500" />
              <h2 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white">
                Estatutos
              </h2>
            </div>
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
          </section>
        )}

        {/* Seção Leis Especiais */}
        {leisEspeciais.length > 0 && (
          <section className="animate-ls-enter" style={{ animationDelay: '150ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1.5 sm:gap-3 mb-3.5 pl-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white">
                  Leis Especiais
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-400/80 uppercase tracking-widest sm:pb-0.5 ml-6 sm:ml-0">
                <AlertCircle className="h-3 w-3" /> 
                Mais cobradas em provas
              </div>
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
          </section>
        )}
      </div>
      </div>
    </div>
  );
}
