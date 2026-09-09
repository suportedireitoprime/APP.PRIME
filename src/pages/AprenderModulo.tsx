import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Footprints, Home,
  GraduationCap, Play, Layers, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { shortenAreaName } from '@/lib/areaNameShortener';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import type { FlashcardCard } from '@/lib/flashcardsQueries';

export type ModuloDetalhe = {
  id: string;
  titulo: string;
  resumo: string | null;
  ordem: number;
  areaId: string;
  areaNome: string;
  areaSlug: string;
};

export type AulaItem = {
  id: string;
  titulo: string;
  objetivo: string | null;
  duracaoMin: number;
  ordem: number;
  status: string;
  concluida?: boolean;
  pct?: number;
};

const AprenderModulo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { moduloId } = useParams<{ moduloId: string }>();
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const tabParam = searchParams.get('tab') || (location.state as any)?.tab;
  const [activeTab, setActiveTab] = useState<'aulas' | 'flashcards'>(tabParam === 'flashcards' ? 'flashcards' : 'aulas');
  const [expandedSubtema, setExpandedSubtema] = useState<string | null>(null);

  const routeState = location.state as {
    modulo?: { id: string; titulo: string; resumo: string | null; ordem: number; area_id?: string };
    area?: { id: string; nome: string; slug: string };
    tab?: 'aulas' | 'flashcards';
  } | undefined;

  const [modulo, setModulo] = useState<ModuloDetalhe | null>(() => {
    if (routeState?.modulo) {
      return {
        id: routeState.modulo.id,
        titulo: routeState.modulo.titulo,
        resumo: routeState.modulo.resumo,
        ordem: routeState.modulo.ordem,
        areaId: routeState.area?.id ?? routeState.modulo.area_id ?? '',
        areaNome: routeState.area?.nome ?? 'Direito',
        areaSlug: routeState.area?.slug ?? 'geral',
      };
    }
    return null;
  });
  const [aulas, setAulas] = useState<AulaItem[]>([]);
  const [loading, setLoading] = useState(!routeState?.modulo);

  useEffect(() => {
    if (!moduloId) return;
    let cancelled = false;

    (async () => {
      try {
        if (!modulo) setLoading(true);

        // 1. Fetch modulo + area info com fallback robusto
        let rawMod: any = null;
        let areaData: any = null;

        const { data: joinData } = await supabase
          .from('aprender_modulos')
          .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
          .eq('id', moduloId)
          .maybeSingle();

        if (joinData) {
          rawMod = joinData;
          const relArea = (joinData as any).aprender_areas;
          areaData = Array.isArray(relArea) ? relArea[0] : relArea;
        } else {
          const { data: simpleMod } = await supabase
            .from('aprender_modulos')
            .select('id, titulo, resumo, ordem, area_id')
            .eq('id', moduloId)
            .maybeSingle();
          if (simpleMod) rawMod = simpleMod;
        }

        if (!areaData && rawMod?.area_id) {
          const { data: a } = await supabase
            .from('aprender_areas')
            .select('id, nome, slug')
            .eq('id', rawMod.area_id)
            .maybeSingle();
          if (a) areaData = a;
        }

        if (cancelled) return;

        if (rawMod) {
          const modInfo: ModuloDetalhe = {
            id: rawMod.id,
            titulo: rawMod.titulo,
            resumo: rawMod.resumo,
            ordem: rawMod.ordem,
            areaId: rawMod.area_id,
            areaNome: areaData?.nome ?? routeState?.area?.nome ?? 'Direito',
            areaSlug: areaData?.slug ?? routeState?.area?.slug ?? 'geral',
          };
          setModulo(modInfo);
        }

        // 2. Fetch aulas for this modulo
        const { data: rawAulas } = await supabase
          .from('aprender_aulas')
          .select('id, titulo, objetivo, duracao_est_min, ordem, status')
          .eq('modulo_id', moduloId)
          .eq('status', 'published')
          .order('ordem');

        // 3. Fetch progress for current user if logged in
        const concluidasSet = new Set<string>();
        if (uid && rawAulas?.length) {
          const aulaIds = rawAulas.map((a) => a.id);
          const { data: progData } = await supabase
            .from('aprender_progresso_aula')
            .select('aula_id, concluida_em')
            .eq('user_id', uid)
            .in('aula_id', aulaIds);

          ((progData as any[]) ?? []).forEach((p) => {
            if (p.concluida_em) concluidasSet.add(p.aula_id);
          });
        }

        const aulasMapeadas: AulaItem[] = (rawAulas ?? []).map((a) => ({
          id: a.id,
          titulo: a.titulo,
          objetivo: a.objetivo,
          duracaoMin: a.duracao_est_min || 15,
          ordem: a.ordem,
          status: a.status,
          concluida: concluidasSet.has(a.id),
        }));

        if (!cancelled) {
          setAulas(aulasMapeadas);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduloId, uid]);

  // Busca flashcards e subtemas (listas) do módulo no Supabase
  const { data: flashcardsData, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['modulo_flashcards', modulo?.areaNome, modulo?.titulo],
    queryFn: async () => {
      if (!modulo?.areaNome || !modulo?.titulo) {
        return { cards: [], matchedTema: '', totalCards: 0, subtemas: [] };
      }

      // 1. Encontra tema correspondente na área
      const { data: temasArea } = await supabase.rpc('flashcards_temas', { _area: modulo.areaNome });
      const matchedTemaObj = (temasArea || []).find((t: any) => 
        t.tema.toLowerCase() === modulo.titulo.toLowerCase() ||
        t.tema.toLowerCase().includes(modulo.titulo.toLowerCase()) ||
        modulo.titulo.toLowerCase().includes(t.tema.toLowerCase())
      );
      const temaNome = matchedTemaObj ? matchedTemaObj.tema : modulo.titulo;

      // 2. Busca os cards do tema
      const { data: cardsRaw, error } = await supabase.rpc('flashcards_sessao', {
        _areas: [modulo.areaNome],
        _temas: [temaNome],
        _modo: 'todos',
        _deck_id: null,
        _limit: 500,
      });
      if (error) {
        console.warn('Erro ao carregar flashcards do tema:', error);
        return { cards: [], matchedTema: temaNome, totalCards: 0, subtemas: [] };
      }

      const cards = (cardsRaw || []) as FlashcardCard[];

      // 3. Agrupa por subtema (as listas do baralho)
      const subtemasMap = new Map<string, FlashcardCard[]>();
      cards.forEach((c) => {
        const key = c.subtema?.trim() || 'Conceitos Fundamentais';
        if (!subtemasMap.has(key)) subtemasMap.set(key, []);
        subtemasMap.get(key)!.push(c);
      });

      const subtemas = Array.from(subtemasMap.entries()).map(([nome, list], idx) => ({
        id: `subtema-${idx + 1}`,
        nome,
        ordem: idx + 1,
        total: list.length,
        cards: list,
      }));

      return {
        cards,
        matchedTema: temaNome,
        totalCards: matchedTemaObj?.total ?? cards.length,
        subtemas,
      };
    },
    enabled: !!modulo?.areaNome && !!modulo?.titulo,
    staleTime: 5 * 60 * 1000,
  });

  const cardIds = useMemo(() => flashcardsData?.cards.map(c => c.id) || [], [flashcardsData?.cards]);

  const { data: userCardsProgress } = useQuery({
    queryKey: ['modulo_flashcards_progresso', uid, cardIds],
    queryFn: async () => {
      if (!uid || !cardIds.length) return new Set<string>();
      const { data, error } = await supabase
        .from('flashcards_progresso')
        .select('card_id, status')
        .eq('user_id', uid)
        .in('card_id', cardIds);
      if (error) return new Set<string>();
      return new Set((data || []).filter((p: any) => p.status === 'memorizado' || p.status === 'facil' || p.status === 'bom').map((p: any) => p.card_id));
    },
    enabled: !!uid && cardIds.length > 0,
    staleTime: 60 * 1000,
  });

  // Alterna automaticamente para flashcards se veio com ?tab=flashcards OU se não houver aulas mas houver flashcards
  useEffect(() => {
    if (tabParam === 'flashcards') {
      setActiveTab('flashcards');
    } else if (!loading && aulas.length === 0 && (flashcardsData?.totalCards ?? 0) > 0) {
      setActiveTab('flashcards');
    }
  }, [tabParam, loading, aulas.length, flashcardsData?.totalCards]);

  const totalAulas = aulas.length;
  const concluidasCount = aulas.filter((a) => a.concluida).length;
  const pctConcluido = totalAulas > 0 ? Math.round((concluidasCount / totalAulas) * 100) : 0;

  const totalFlashcards = flashcardsData?.totalCards || flashcardsData?.cards.length || 0;
  const concluidasFlashcards = userCardsProgress?.size || 0;
  const pctFlashcards = totalFlashcards > 0 ? Math.round((concluidasFlashcards / totalFlashcards) * 100) : 0;
  const isFlashcards = activeTab === 'flashcards';

  const areaCurta = modulo ? shortenAreaName(modulo.areaNome) : 'Matéria';
  const areaVisual = modulo ? areaIconFor(modulo.areaSlug) : null;
  const AreaIconComp = areaVisual?.Icon;
  const palette = useMemo(() => getAreaThemePalette(modulo?.areaSlug || modulo?.areaNome), [modulo]);

  const handleVoltar = () => {
    haptic.light();
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    if (modulo?.areaSlug) {
      navigate(`/aprender/area/${modulo.areaSlug}`);
    } else {
      navigate('/aprender');
    }
  };

  const homeButton = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic.light();
        navigate('/aprender');
      }}
      aria-label="Ir para o início do Aprender"
      className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-muted flex items-center justify-center shrink-0 active:scale-95 transition-transform touch-manipulation select-none cursor-pointer"
    >
      <Home className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" strokeWidth={2.2} />
    </button>
  );

  const mobileHeader = (
    <PageHeader
      title={modulo?.titulo ?? 'Trilha do Tópico'}
      onBack={handleVoltar}
      rightAction={homeButton}
    />
  );

  return (
    <DesktopPageLayout activeId="aprender" mobileHeader={mobileHeader} title={modulo?.titulo ?? 'Trilha do Tópico'}>
      {/* Fundo ShapeGrid (padrão oficial do app / início do aplicativo) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0D0D]">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6 pb-20 pt-2 px-3 sm:px-6">
        {/* Botão de Voltar Desktop */}
        <div className="hidden sm:flex items-center justify-between">
          <button
            type="button"
            onClick={handleVoltar}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para {areaCurta}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              navigate('/aprender');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Início Aprender</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 rounded-3xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : !modulo ? (
          <div className="text-center p-8 rounded-2xl border border-border bg-card">
            <p className="text-sm font-semibold text-muted-foreground">Tópico não encontrado.</p>
          </div>
        ) : (
          <>
            {/* 🔴 Painel Vermelho Hero com Progresso */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/25 p-6 sm:p-8 text-white space-y-4"
              style={{
                background: palette.cardGradient,
                boxShadow: palette.shadow,
              }}
            >
              {modulo.areaSlug === 'direito-penal' ? (
                <img
                  src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  className="pointer-events-none absolute -right-4 -bottom-4 w-[160px] sm:w-[200px] h-[160px] sm:h-[200px] object-contain opacity-25 select-none z-0"
                />
              ) : AreaIconComp ? (
                <AreaIconComp
                  className="pointer-events-none absolute -right-4 -bottom-4 w-[140px] sm:w-[180px] h-[140px] sm:h-[180px] opacity-20 select-none z-0 text-white"
                  strokeWidth={1.2}
                  aria-hidden="true"
                />
              ) : null}

              <div className="flex items-center justify-between gap-3 relative z-10">
                <span className="px-3 py-1 rounded-full bg-black/40 border border-white/20 text-xs font-normal uppercase tracking-wider">
                  {isFlashcards ? `FLASHCARDS · ${areaCurta}` : areaCurta}
                </span>
                <span className="text-xs font-normal bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  {isFlashcards
                    ? `${totalFlashcards} ${totalFlashcards === 1 ? 'flashcard' : 'flashcards'} na trilha`
                    : `${totalAulas} ${totalAulas === 1 ? 'aula' : 'aulas'} na trilha`}
                </span>
              </div>

              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-normal font-sans tracking-tight text-white leading-tight">
                  {modulo.titulo}
                </h1>
                {modulo.resumo && (
                  <p className="text-xs sm:text-sm text-white/80 mt-1.5 line-clamp-2 max-w-2xl font-normal">
                    {modulo.resumo}
                  </p>
                )}
              </div>

              {/* Barra de Progresso do Tópico */}
              <div className="space-y-1.5 pt-2 relative z-10">
                <div className="flex items-center justify-between text-xs font-normal">
                  <span className="text-white/90">
                    {isFlashcards ? 'Progresso nos Flashcards' : 'Progresso no Tópico'}
                  </span>
                  <span className="text-white">
                    {isFlashcards
                      ? `${concluidasFlashcards} de ${totalFlashcards} memorizados (${pctFlashcards}%)`
                      : `${concluidasCount} de ${totalAulas} concluídas (${pctConcluido}%)`}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(
                        isFlashcards ? pctFlashcards : pctConcluido,
                        (isFlashcards ? totalFlashcards : totalAulas) > 0 ? 6 : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Seletor de Modo: Aulas vs Flashcards */}
            <div className="flex items-center gap-2 p-1 bg-card/60 border border-border/80 rounded-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setActiveTab('aulas');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                  activeTab === 'aulas'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Aulas ({totalAulas})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setActiveTab('flashcards');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                  activeTab === 'flashcards'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <FlashcardsIcon className="w-4 h-4" />
                <span>Flashcards ({totalFlashcards})</span>
              </button>
            </div>

            {/* Conteúdo: Flashcards vs Aulas */}
            {isFlashcards ? (
              <div className="space-y-4 pt-1">
                {/* Ação rápida para praticar todo o módulo */}
                {totalFlashcards > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 shadow-sm">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Praticar Baralho Completo</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Revise todos os {totalFlashcards} cards deste módulo em sequência
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact(); } catch {}
                        navigate(
                          `/flashcards/estudar?area=${encodeURIComponent(modulo.areaNome)}&temas=${encodeURIComponent(flashcardsData?.matchedTema || modulo.titulo)}&limite=${Math.max(totalFlashcards, 500)}`
                        );
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Praticar Todos ({totalFlashcards})</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Listas de Flashcards ({flashcardsData?.subtemas.length || 0})</span>
                  </h2>
                  {flashcardsData?.subtemas && flashcardsData.subtemas.length > 0 && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {concluidasFlashcards}/{totalFlashcards} memorizados
                    </span>
                  )}
                </div>

                {loadingFlashcards ? (
                  <div className="space-y-3">
                    <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                    <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                  </div>
                ) : !flashcardsData?.subtemas || flashcardsData.subtemas.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-border bg-card/60 text-center text-muted-foreground text-xs">
                    Nenhum flashcard cadastrado para este módulo no momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flashcardsData.subtemas.map((subtema, idx) => {
                      const memorizadosDoSubtema = subtema.cards.filter((c) => userCardsProgress?.has(c.id)).length;
                      const pctSubtema = subtema.total > 0 ? Math.round((memorizadosDoSubtema / subtema.total) * 100) : 0;
                      const isCompleted = subtema.total > 0 && memorizadosDoSubtema === subtema.total;
                      const isExpanded = expandedSubtema === subtema.id;

                      return (
                        <motion.div
                          key={subtema.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={cn(
                            'overflow-hidden rounded-2xl border transition-all text-left group shadow-sm bg-card/70 hover:border-primary/50',
                            isCompleted ? 'border-emerald-500/30' : 'border-border/60'
                          )}
                        >
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-muted-foreground border border-white/5">
                                  Lista {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {subtema.total} {subtema.total === 1 ? 'card' : 'cards'}
                                </span>
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Concluída
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                                {subtema.nome}
                              </h3>

                              {/* Progresso do Subtema */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                                <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${pctSubtema}%` }}
                                  />
                                </div>
                                <span className="text-[11px]">
                                  {memorizadosDoSubtema}/{subtema.total} ({pctSubtema}%)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  try { haptic.light(); } catch {}
                                  setExpandedSubtema(isExpanded ? null : subtema.id);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                title="Ver perguntas da lista"
                              >
                                <span>{isExpanded ? 'Ocultar' : 'Perguntas'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  try { haptic.impact(); } catch {}
                                  navigate(
                                    `/flashcards/estudar?area=${encodeURIComponent(modulo.areaNome)}&temas=${encodeURIComponent(flashcardsData?.matchedTema || modulo.titulo)}&subtema=${encodeURIComponent(subtema.nome)}&limite=${Math.max(subtema.total, 100)}`
                                  );
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Praticar</span>
                              </button>
                            </div>
                          </div>

                          {/* Dropdown de Perguntas (Preview dos cards) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-border/40 bg-card/40 px-4 py-3 sm:px-5 space-y-2"
                              >
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Cards nesta lista ({subtema.cards.length}):
                                </p>
                                <div className="divide-y divide-border/30 max-h-60 overflow-y-auto pr-1">
                                  {subtema.cards.map((c, cIdx) => {
                                    const isMem = userCardsProgress?.has(c.id);
                                    return (
                                      <div key={c.id} className="py-2 flex items-start gap-2 text-xs">
                                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 w-5">
                                          #{cIdx + 1}
                                        </span>
                                        <div className="flex-1 text-foreground/90 font-medium">
                                          {c.frente}
                                        </div>
                                        {isMem && (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* 📍 Trilha em Linha do Tempo (Timeline Trail) */
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-primary" />
                    <span>Aulas em Trilha ({totalAulas})</span>
                  </h2>
                </div>

                {aulas.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-border bg-card/60 text-center space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Aulas deste tópico em breve!</p>
                    {totalFlashcards > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            try { haptic.light(); } catch {}
                            setActiveTab('flashcards');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <FlashcardsIcon className="w-4 h-4" />
                          <span>Estudar {totalFlashcards} Flashcards deste módulo</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative space-y-4 ml-3 sm:ml-4">
                    {aulas.map((aula, idx) => {
                      const isNext = !aula.concluida && (idx === 0 || aulas[idx - 1]?.concluida);

                      return (
                        <motion.div
                          key={aula.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          {/* Nó da Linha do Tempo — alinhado com flex */}
                          <div
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 transition-all shadow-md',
                              aula.concluida
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : isNext
                                ? 'bg-primary/20 text-primary border-primary animate-pulse'
                                : 'bg-card text-muted-foreground border-border/80'
                            )}
                          >
                            {aula.concluida ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              try { haptic.light(); } catch {}
                              navigate(`/aprender/aula/${aula.id}`, {
                                state: {
                                  aulaTitulo: aula.titulo,
                                  moduloTitulo: modulo?.titulo,
                                  moduloId: modulo?.id,
                                  areaSlug: modulo?.areaSlug,
                                  from: `/aprender/modulo/${modulo?.id}`,
                                },
                              });
                            }}
                            onPointerEnter={() => prefetchAprenderAula(aula.id)}
                            className={cn(
                              'relative h-[120px] sm:h-[136px] overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none',
                              isNext
                                ? 'border-primary/60 bg-card hover:border-primary shadow-primary/5'
                                : aula.concluida
                                ? 'border-border/60 bg-card/70 hover:border-primary/40'
                                : 'border-border/50 bg-card/40 hover:border-primary/30'
                            )}
                          >
                            <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[64px] sm:w-[72px]">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 overflow-hidden shadow-inner shrink-0">
                                {modulo?.areaSlug === 'direito-penal' ? (
                                  <img
                                    src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-9 h-9 sm:w-10 sm:h-10 object-contain opacity-75 group-hover:opacity-90 transition-opacity select-none pointer-events-none"
                                  />
                                ) : AreaIconComp ? (
                                  <AreaIconComp
                                    className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 group-hover:text-white transition-colors select-none"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" strokeWidth={1.8} />
                                )}
                              </div>
                              {aula.concluida && (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-center leading-none border border-emerald-500/20">
                                  Concluída
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 flex flex-col justify-center h-full py-0.5">
                              <h3 className="text-sm sm:text-base font-normal font-sans text-foreground break-words leading-snug line-clamp-4 group-hover:text-primary transition-colors">
                                {aula.titulo}
                              </h3>
                            </div>

                            <div className="flex items-center justify-center shrink-0 ml-1 h-full">
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                            </div>

                            {/* Barra de Progresso do Card na base */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  aula.concluida ? "w-full bg-emerald-500" : "w-0 bg-emerald-500"
                                )} 
                              />
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DesktopPageLayout>
  );
};

export default AprenderModulo;
