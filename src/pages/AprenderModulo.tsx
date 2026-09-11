import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Footprints, Home, Cloud
} from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { shortenAreaName } from '@/lib/areaNameShortener';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { keys } from 'idb-keyval';
import {
  getCachedModuloData,
  setCachedModuloData,
  hydrateModuloCache,
} from '@/lib/aprenderAreaLoader';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import type { FlashcardCard } from '@/lib/flashcardsQueries';
import { getLocalAulaProgress } from '@/lib/aprenderProgressoStorage';

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
  totalBlocos?: number;
  blocosConcluidos?: number;
};

const AprenderModulo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { moduloId } = useParams<{ moduloId: string }>();
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const tabParam = searchParams.get('tab') || (location.state as any)?.tab;
  const [activeTab, setActiveTab] = useState<'aulas' | 'flashcards' | 'questoes'>(() => {
    if (tabParam === 'flashcards' || tabParam === 'questoes') return tabParam;
    return 'aulas';
  });

  const routeState = location.state as {
    modulo?: { id: string; titulo: string; resumo: string | null; ordem: number; area_id?: string };
    area?: { id: string; nome: string; slug: string };
    aulas?: AulaItem[];
    tab?: 'aulas' | 'flashcards' | 'questoes';
  } | undefined;

  // Busca síncrona instantânea em cache (0ms)
  const cachedData = moduloId ? getCachedModuloData(moduloId, uid) : undefined;

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
    if (cachedData?.modulo) {
      return cachedData.modulo;
    }
    return null;
  });

  const [aulas, setAulas] = useState<AulaItem[]>(() => {
    if (routeState?.aulas && routeState.aulas.length > 0) {
      return routeState.aulas;
    }
    if (cachedData?.aulas && cachedData.aulas.length > 0) {
      return cachedData.aulas;
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (routeState?.aulas && routeState.aulas.length > 0) return false;
    if (cachedData?.aulas && cachedData.aulas.length > 0) return false;
    return true;
  });

  const [cachedAulas, setCachedAulas] = useState<Set<string>>(new Set());

  useEffect(() => {
    keys().then((allKeys) => {
      const cached = new Set<string>();
      for (const k of allKeys) {
        if (typeof k === 'string' && k.startsWith('aprender_aula_cache_')) {
          cached.add(k.replace('aprender_aula_cache_', ''));
        }
      }
      setCachedAulas(cached);
    }).catch(console.warn);
  }, []);

  useEffect(() => {
    if (!moduloId) return;
    let cancelled = false;

    (async () => {
      try {
        // Se ainda não temos aulas em memória (ex: link direto sem cache), tenta recuperar do IndexedDB (0ms/10ms)
        if (aulas.length === 0) {
          const persisted = await hydrateModuloCache(moduloId, uid);
          if (persisted && !cancelled && persisted.aulas.length > 0) {
            setModulo((prev) => prev ?? persisted.modulo);
            setAulas(persisted.aulas);
            setLoading(false);
          }
        }

        // Revalidação em paralelo com suporte a UUID e slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduloId);

        let [joinRes, rawAulasRes] = await Promise.all([
          isUuid
            ? supabase
                .from('aprender_modulos')
                .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
                .eq('id', moduloId)
                .maybeSingle()
            : supabase
                .from('aprender_modulos')
                .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
                .eq('slug', moduloId)
                .maybeSingle(),
          isUuid
            ? supabase
                .from('aprender_aulas')
                .select('id, titulo, objetivo, duracao_est_min, ordem, status')
                .eq('modulo_id', moduloId)
                .eq('status', 'published')
                .order('ordem')
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;

        let rawMod: any = joinRes.data;
        let rawAulas: any[] = (rawAulasRes.data ?? []) as any[];

        // 🛡️ RECOVERY FALLBACK: Se o módulo foi recriado (UUID mudou) ou retornou 0 aulas
        if (!rawMod || rawAulas.length === 0) {
          let foundMod: any = null;

          // 1. Tenta buscar por slug igual ao moduloId
          if (!foundMod) {
            const { data: bySlug } = await supabase
              .from('aprender_modulos')
              .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
              .eq('slug', moduloId)
              .maybeSingle();
            if (bySlug) foundMod = bySlug;
          }

          // 2. Tenta buscar pelo título do módulo
          const searchTitle = (rawMod?.titulo || modulo?.titulo || routeState?.modulo?.titulo || '').trim();
          if (!foundMod && searchTitle) {
            const { data: byTitle } = await supabase
              .from('aprender_modulos')
              .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
              .ilike('titulo', `%${searchTitle}%`)
              .limit(1);
            if (byTitle && byTitle.length > 0) foundMod = byTitle[0];
          }

          // 3. Se encontrou o módulo real no banco, busca as aulas publicadas dele
          if (foundMod) {
            rawMod = foundMod;
            const { data: freshAulas } = await supabase
              .from('aprender_aulas')
              .select('id, titulo, objetivo, duracao_est_min, ordem, status')
              .eq('modulo_id', foundMod.id)
              .eq('status', 'published')
              .order('ordem');
            if (freshAulas && freshAulas.length > 0) {
              rawAulas = freshAulas;
            }
          }
        }

        let areaData: any = null;
        if (rawMod) {
          const relArea = (rawMod as any).aprender_areas;
          areaData = Array.isArray(relArea) ? relArea[0] : relArea;
        }

        const modInfo: ModuloDetalhe = {
          id: rawMod?.id ?? moduloId,
          titulo: rawMod?.titulo ?? modulo?.titulo ?? '',
          resumo: rawMod?.resumo ?? modulo?.resumo ?? null,
          ordem: rawMod?.ordem ?? modulo?.ordem ?? 1,
          areaId: rawMod?.area_id ?? modulo?.areaId ?? '',
          areaNome: areaData?.nome ?? routeState?.area?.nome ?? modulo?.areaNome ?? 'Direito',
          areaSlug: areaData?.slug ?? routeState?.area?.slug ?? modulo?.areaSlug ?? 'geral',
        };
        setModulo(modInfo);
        const aulaIds = rawAulas.map((a) => a.id);

        let progData: any[] = [];
        const blocosCountMap = new Map<string, number>();

        if (aulaIds.length > 0) {
          const [progRes, blocosRes] = await Promise.all([
            uid
              ? supabase
                  .from('aprender_progresso_aula')
                  .select('aula_id, concluida_em, blocos_concluidos')
                  .eq('user_id', uid)
                  .in('aula_id', aulaIds)
              : Promise.resolve({ data: [] }),
            supabase
              .from('aprender_blocos')
              .select('aula_id')
              .in('aula_id', aulaIds)
              .limit(2000),
          ]);

          progData = (progRes.data as any[]) ?? [];
          ((blocosRes.data as any[]) ?? []).forEach((b: any) => {
            blocosCountMap.set(b.aula_id, (blocosCountMap.get(b.aula_id) || 0) + 1);
          });
        }

        if (cancelled) return;

        const progMap = new Map<string, any>();
        progData.forEach((p) => progMap.set(p.aula_id, p));

        const aulasMapeadas: AulaItem[] = rawAulas.map((a) => {
          const p = progMap.get(a.id);
          const local = getLocalAulaProgress(a.id);
          const totalBlocos = blocosCountMap.get(a.id) || (local?.total ?? 10);
          const blocosConcluidos = Math.max(p?.blocos_concluidos ?? 0, local?.blocosConcluidos ?? 0);
          const isConcluida = !!p?.concluida_em || !!local?.concluida || (totalBlocos > 0 && blocosConcluidos >= totalBlocos);
          const pct = isConcluida
            ? 100
            : totalBlocos > 0
            ? Math.min(100, Math.round((blocosConcluidos / totalBlocos) * 100))
            : 0;

          return {
            id: a.id,
            titulo: a.titulo,
            objetivo: a.objetivo,
            duracaoMin: a.duracao_est_min || 15,
            ordem: a.ordem,
            status: a.status,
            concluida: isConcluida,
            pct,
            totalBlocos,
            blocosConcluidos,
          };
        });

        setAulas(aulasMapeadas);
        setLoading(false);

        // Atualiza cache em memória e IndexedDB
        setCachedModuloData(moduloId, uid, {
          modulo: modInfo,
          aulas: aulasMapeadas,
        });
      } catch (err) {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduloId, uid]);

  // 🚀 PREFETCH AGRESSIVO EM BACKGROUND (0ms de delay no click)
  // Pré-carrega as aulas (e seus blocos) automaticamente no IndexedDB assim que entra no módulo
  useEffect(() => {
    if (aulas.length === 0) return;
    
    // Filtra as próximas 5 aulas não concluídas para não sobrecarregar a rede de uma vez
    const aulasParaPrefetch = aulas.filter(a => !a.concluida).slice(0, 5);
    
    // Se todas estiverem concluídas, faz prefetch das 3 primeiras apenas por segurança
    const alvos = aulasParaPrefetch.length > 0 ? aulasParaPrefetch : aulas.slice(0, 3);
    
    // Executa o prefetch de forma sequencial com pequeno delay para não bloquear a thread principal
    const runPrefetch = async () => {
      for (const aula of alvos) {
        try {
          await new Promise(resolve => setTimeout(resolve, 800)); // Delay entre requisições
          await prefetchAprenderAula(aula.id);
          setCachedAulas(prev => {
            const next = new Set(prev);
            next.add(aula.id);
            return next;
          });
        } catch (e) {
          console.warn(`Erro no prefetch da aula ${aula.id}`, e);
        }
      }
    };
    
    // Inicia o processo em background
    void runPrefetch();
  }, [aulas]);

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

  // Alterna automaticamente para flashcards ou questoes se veio na URL
  useEffect(() => {
    if (tabParam === 'flashcards' || tabParam === 'questoes') {
      setActiveTab(tabParam);
    } else if (!loading && aulas.length === 0 && (flashcardsData?.totalCards ?? 0) > 0 && !tabParam) {
      setActiveTab('flashcards');
    }
  }, [tabParam, loading, aulas.length, flashcardsData?.totalCards]);

  const totalAulas = aulas.length;
  const concluidasCount = aulas.filter((a) => a.concluida).length;
  const pctConcluido = totalAulas > 0 ? Math.round((concluidasCount / totalAulas) * 100) : 0;

  const totalFlashcards = flashcardsData?.totalCards || flashcardsData?.cards.length || 0;
  const concluidasFlashcards = userCardsProgress?.size || 0;
  const pctFlashcards = totalFlashcards > 0 ? Math.round((concluidasFlashcards / totalFlashcards) * 100) : 0;
  const isAulas = activeTab === 'aulas';
  const isFlashcards = activeTab === 'flashcards';
  const isQuestoes = activeTab === 'questoes';

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

  const dynamicPrimaryHsl = useMemo(() => {
    const hex = palette.primary || '#e11d48';
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    } else if (hex.length === 4) {
      r = parseInt(hex[1]+hex[1], 16);
      g = parseInt(hex[2]+hex[2], 16);
      b = parseInt(hex[3]+hex[3], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }, [palette.primary]);

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

      <div 
        className="relative z-10 w-full max-w-4xl mx-auto space-y-6 pb-20 pt-2 px-3 sm:px-6"
        style={{ '--primary': dynamicPrimaryHsl } as React.CSSProperties}
      >
        {/* Botão de Voltar Desktop */}
        <div className="hidden sm:flex items-center justify-between">
          <button
            type="button"
            onClick={handleVoltar}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Início Aprender</span>
          </button>
        </div>

        {loading && aulas.length === 0 ? (
          <div className="space-y-4">
            <div className="h-44 rounded-3xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : !modulo ? (
          <div className="text-center p-8 rounded-2xl border border-border bg-card">
            <p className="text-sm font-medium text-muted-foreground">Tópico não encontrado.</p>
          </div>
        ) : (
          <>
            {/* 🔴 Painel Vermelho Hero com Progresso */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/25 p-4 sm:p-5 text-white space-y-4"
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

              <div className="flex items-center justify-between gap-2 relative z-10 w-full overflow-hidden">
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/40 border border-white/20 text-[10px] sm:text-xs font-normal uppercase tracking-wider whitespace-nowrap shrink-0">
                  {isFlashcards ? `FLASHCARDS · ${areaCurta}` : isQuestoes ? `QUESTÕES · ${areaCurta}` : areaCurta}
                </span>
                <span className="text-[10px] sm:text-xs font-normal bg-black/40 px-2.5 sm:px-3 py-1 rounded-full border border-white/10 whitespace-nowrap shrink-0">
                  {isFlashcards
                    ? `${totalFlashcards} ${totalFlashcards === 1 ? 'flashcard' : 'flashcards'} na trilha`
                    : isQuestoes
                    ? `Questões Comentadas`
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
                    {isFlashcards ? 'Progresso nos Flashcards' : isQuestoes ? 'Prática de Questões' : 'Progresso no Tópico'}
                  </span>
                  <span className="text-white">
                    {isFlashcards
                      ? `${concluidasFlashcards} de ${totalFlashcards} memorizados (${pctFlashcards}%)`
                      : isQuestoes
                      ? 'Concursos & OAB'
                      : `${concluidasCount} de ${totalAulas} concluídas (${pctConcluido}%)`}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                    style={{
                      width: `${
                        isFlashcards
                          ? concluidasFlashcards > 0
                            ? Math.max(pctFlashcards, 5)
                            : 0
                          : isQuestoes
                          ? 100
                          : concluidasCount > 0
                          ? Math.max(pctConcluido, 5)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* 📍 Trilha em Linha do Tempo (Flashcards vs Aulas) */}
            {isFlashcards ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FlashcardsIcon className="w-4 h-4 text-emerald-400" />
                    <span>Flashcards em Trilha ({flashcardsData?.subtemas.length || 0})</span>
                  </h2>
                  {flashcardsData?.subtemas && flashcardsData.subtemas.length > 0 && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {concluidasFlashcards}/{totalFlashcards} memorizados
                    </span>
                  )}
                </div>

                {loadingFlashcards ? (
                  <div className="space-y-4">
                    <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                    <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                  </div>
                ) : !flashcardsData?.subtemas || flashcardsData.subtemas.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-border bg-card/60 text-center text-muted-foreground text-xs">
                    Flashcards deste tópico em breve!
                  </div>
                ) : (
                  <div className="relative space-y-4 ml-3 sm:ml-4">
                    {flashcardsData.subtemas.map((subtema, idx) => {
                      const memorizadosDoSubtema = subtema.cards.filter((c) => userCardsProgress?.has(c.id)).length;
                      const pctSubtema = subtema.total > 0 ? Math.round((memorizadosDoSubtema / subtema.total) * 100) : 0;
                      const isCompleted = subtema.total > 0 && memorizadosDoSubtema === subtema.total;
                      const isNext = !isCompleted && (idx === 0 || flashcardsData.subtemas[idx - 1]?.cards.every(c => userCardsProgress?.has(c.id)));

                      return (
                        <motion.div
                          key={subtema.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          {/* Nó da Linha do Tempo — alinhado com flex */}
                          <div
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 transition-all shadow-md',
                              isCompleted
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : isNext
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 animate-pulse'
                                : 'bg-card text-muted-foreground border-border/80'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              try { haptic.light(); } catch {}
                              navigate(
                                `/flashcards/estudar?area=${encodeURIComponent(modulo.areaNome)}&temas=${encodeURIComponent(flashcardsData?.matchedTema || modulo.titulo)}&subtema=${encodeURIComponent(subtema.nome)}&limite=1000&cor=${encodeURIComponent(palette.primary)}`,
                                {
                                  state: {
                                    from: `/aprender/modulo/${modulo.id}?tab=flashcards`,
                                    moduloTitulo: modulo.titulo,
                                    subtemaNome: subtema.nome,
                                  },
                                }
                              );
                            }}
                            className={cn(
                              'relative min-h-[120px] sm:min-h-[136px] h-auto overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none',
                              isNext
                                ? 'border-emerald-500/60 bg-card hover:border-emerald-500 shadow-emerald-500/5'
                                : isCompleted
                                ? 'border-border/60 bg-card/70 hover:border-emerald-500/40'
                                : 'border-border/50 bg-card/40 hover:border-emerald-500/30'
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
                                    className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 group-hover:text-emerald-400 transition-colors select-none"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <FlashcardsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400/90 group-hover:text-emerald-400 transition-colors select-none" />
                                )}
                              </div>
                              {isCompleted ? (
                                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-center leading-none border border-emerald-500/20">
                                  Concluída
                                </span>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded text-center leading-none border border-white/10">
                                  {subtema.total} cards
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 flex flex-col justify-center h-full py-1">
                              <h3 className="text-sm sm:text-base font-normal font-sans text-foreground break-words leading-snug line-clamp-3 group-hover:text-emerald-400 transition-colors">
                                {subtema.nome}
                              </h3>

                              {/* Barra de Progresso do Subtema */}
                              <div className="mt-2.5 space-y-1.5 w-full">
                                <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-normal">
                                  <span>
                                    {memorizadosDoSubtema > 0
                                      ? `${memorizadosDoSubtema} de ${subtema.total} memorizados`
                                      : `0 de ${subtema.total} memorizados`}
                                  </span>
                                  <span className={cn('font-medium', isCompleted ? 'text-emerald-400 font-medium' : 'text-foreground/80')}>
                                    {pctSubtema}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden border border-white/5">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      isCompleted
                                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                        : pctSubtema > 0
                                        ? 'bg-emerald-500'
                                        : 'bg-transparent'
                                    )}
                                    style={{ width: `${Math.max(pctSubtema, memorizadosDoSubtema > 0 ? 6 : 0)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center shrink-0 ml-1 h-full">
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                            </div>

                            {/* Barra de Progresso do Card na base */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  isCompleted ? "w-full bg-emerald-500" : pctSubtema > 0 ? "bg-emerald-500" : "w-0 bg-emerald-500"
                                )}
                                style={{ width: `${pctSubtema}%` }} 
                              />
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* 📍 Trilha em Linha do Tempo (Aulas) */
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-primary" />
                    <span>Aulas em Trilha ({totalAulas})</span>
                  </h2>
                </div>

                {aulas.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-border bg-card/60 text-center space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Aulas deste tópico em breve!</p>
                    {totalFlashcards > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            try { haptic.light(); } catch {}
                            setActiveTab('flashcards');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium shadow-md hover:bg-primary/90 transition-all cursor-pointer"
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
                          transition={{ delay: Math.min(idx * 0.02, 0.15) }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          {/* Nó da Linha do Tempo — alinhado com flex */}
                          <div
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 transition-all shadow-md',
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
                              'relative min-h-[120px] sm:min-h-[136px] p-3 sm:p-3.5 overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-4 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none',
                              isNext
                                ? 'border-primary/60 bg-card hover:border-primary shadow-primary/5'
                                : aula.concluida
                                ? 'border-emerald-500/40 bg-card/70 hover:border-emerald-500/60'
                                : (aula.pct || 0) > 0
                                ? 'border-primary/40 bg-card/60 hover:border-primary/60'
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
                              {aula.concluida ? (
                                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-center leading-none border border-emerald-500/20">
                                  Concluída
                                </span>
                              ) : (aula.pct || 0) > 0 ? (
                                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded text-center leading-none border border-primary/20">
                                  {aula.pct}%
                                </span>
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1 flex flex-col justify-center h-full py-0.5">
                              <h3 className="text-sm sm:text-base font-normal font-sans text-foreground break-words leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {aula.titulo}
                              </h3>

                              {/* Barra de Progresso da Aula na Lista */}
                              <div className="mt-2.5 space-y-1.5 w-full">
                                <div className="flex items-center justify-between text-[11px] sm:text-xs font-normal">
                                  <span className={cn(
                                    aula.concluida
                                      ? 'text-emerald-400 font-medium'
                                      : (aula.pct || 0) > 0
                                      ? 'text-primary font-medium'
                                      : 'text-muted-foreground'
                                  )}>
                                    {aula.concluida
                                      ? 'Aula Concluída'
                                      : (aula.pct || 0) > 0
                                      ? `${aula.blocosConcluidos || 0} de ${aula.totalBlocos || 0} páginas`
                                      : `0 de ${aula.totalBlocos || 0} páginas`}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {cachedAulas.has(aula.id) && (
                                      <Cloud className="w-3.5 h-3.5 text-primary/70" />
                                    )}
                                    <span className={cn(
                                      'font-medium tabular-nums',
                                      aula.concluida
                                        ? 'text-emerald-400'
                                        : (aula.pct || 0) > 0
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    )}>
                                      {aula.pct || 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden border border-white/5">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      aula.concluida
                                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                        : (aula.pct || 0) > 0
                                        ? 'bg-gradient-to-r from-primary to-primary-light shadow-sm shadow-primary/30'
                                        : 'bg-transparent'
                                    )}
                                    style={{ width: `${Math.max(aula.pct || 0, (aula.pct || 0) > 0 ? 6 : 0)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center shrink-0 ml-1 h-full">
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                            </div>

                            {/* Barra de Progresso do Card na base */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  aula.concluida
                                    ? "w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    : (aula.pct || 0) > 0
                                    ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                                    : "w-0 bg-transparent"
                                )} 
                                style={{ width: `${aula.pct || 0}%` }}
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
