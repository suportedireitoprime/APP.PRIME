import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  AprenderAreaData,
  getCachedAprenderArea,
  hydrateAprenderAreaCache,
  loadAprenderArea,
  fetchAprenderAreaFromNetwork,
  setCachedModuloData,
} from '@/lib/aprenderAreaLoader';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Play } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { useTrackArea } from "@/hooks/useTrackArea";
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { CANONICAL_AREA_TOPICS } from '@/components/aprender/MateriaFlashcardsDeckSection';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

const AprenderArea = () => {
  useTrackArea("aprender_area_aberta");
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate('/aprender');
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');
  const tabParam = searchParams.get('tab') || (location.state as any)?.tab;
  const [activeTab, setActiveTab] = useState<'aulas' | 'flashcards' | 'questoes'>(() => {
    if (tabParam === 'flashcards' || tabParam === 'questoes') return tabParam;
    return 'aulas';
  });

  useEffect(() => {
    if (tabParam === 'flashcards' || tabParam === 'questoes' || tabParam === 'aulas') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const initial = slug ? getCachedAprenderArea(slug, user?.id ?? null) : undefined;
  const [data, setData] = useState<AprenderAreaData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (!data || !moduloIdParam) return;
    const found = data.modulos.find((m) => m.id === moduloIdParam);
    if (found) {
      const list = data.aulas.filter((a) => a.modulo_id === found.id);
      const moduloAulas = list.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        objetivo: a.objetivo,
        duracaoMin: a.duracao_est_min || 15,
        ordem: a.ordem,
        status: a.status || 'published',
        concluida: !!data.progresso[a.id]?.concluida,
        pct: data.progresso[a.id]?.pct || 0,
      }));

      setCachedModuloData(found.id, user?.id ?? null, {
        modulo: {
          id: found.id,
          titulo: found.titulo,
          resumo: found.resumo,
          ordem: found.ordem,
          areaId: data.area?.id ?? '',
          areaNome: data.area?.nome ?? 'Direito',
          areaSlug: data.area?.slug ?? slug ?? 'geral',
        },
        aulas: moduloAulas,
      });

      navigate(`/aprender/modulo/${moduloIdParam}?tab=${activeTab}`, {
        replace: true,
        state: { modulo: found, area: data.area, aulas: moduloAulas, tab: activeTab },
      });
    }
  }, [data, moduloIdParam, activeTab, navigate, user?.id, slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const uid = user?.id ?? null;
    const hit = getCachedAprenderArea(slug, uid);
    if (hit) {
      setData(hit);
      setLoading(false);
      fetchAprenderAreaFromNetwork(slug, uid).then((d) => {
        if (!cancelled && d && (d.aulas.length > 0 || !hit.aulas.length)) setData(d);
      }).catch(console.warn);
      return;
    }
    (async () => {
      const persisted = await hydrateAprenderAreaCache(slug, uid);
      if (cancelled) return;
      if (persisted) {
        setData(persisted);
        setLoading(false);
      } else {
        setLoading(true);
      }
      const fresh = await fetchAprenderAreaFromNetwork(slug, uid);
      if (cancelled) return;
      setData(fresh);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  const area = data?.area ?? null;
  const modulos = data?.modulos ?? [];
  const aulas = data?.aulas ?? [];
  const progresso = data?.progresso ?? {};

  const effectiveAreaName = useMemo(() => {
    if (area?.nome) return area.nome;
    if (!slug) return '';
    const map: Record<string, string> = {
      'direito-civil': 'Direito Civil',
      'direito-penal': 'Direito Penal',
      'direito-constitucional': 'Direito Constitucional',
      'direito-administrativo': 'Direito Administrativo',
      'direito-tributario': 'Direito Tributário',
      'direito-do-trabalho': 'Direito do Trabalho',
      'direito-processual-civil': 'Direito Processual Civil',
      'direito-processual-penal': 'Direito Processual Penal',
      'direito-empresarial': 'Direito Empresarial',
      'direito-ambiental': 'Direito Ambiental',
      'direitos-humanos': 'Direitos Humanos',
      'direito-previdenciario': 'Direito Previdenciário',
      'direito-financeiro': 'Direito Financeiro',
      'direito-desportivo': 'Direito Desportivo',
      'direito-processual-do-trabalho': 'Direito Processual do Trabalho',
      'direito-concorrencial': 'Direito Concorrencial',
      'direito-urbanistico': 'Direito Urbanístico',
      'direito-internacional-publico': 'Direito Internacional Público',
      'direito-internacional-privado': 'Direito Internacional Privado',
      'lei-penal-especial': 'Lei Penal Especial',
      'direito-eleitoral': 'Direito Eleitoral',
      'formacao-complementar': 'Formação Complementar',
      'politicas-publicas': 'Políticas Públicas',
      'pratica-profissional': 'Prática Profissional',
      'portugues': 'Português',
      'revisao-oab': 'Revisão OAB',
      'filosofia-do-direito': 'Filosofia do Direito',
      'teoria-e-filosofia-do-direito': 'Filosofia do Direito',
      'pesquisa-cientifica': 'Pesquisa Científica',
    };
    if (map[slug]) return map[slug];
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [area?.nome, slug]);

  const modulosOrdenados = useMemo(() => {
    return [...modulos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [modulos]);

  // Busca lista oficial de áreas de flashcards com contagens e slugs
  const { data: flashcardsAreasResumo } = useFlashcardsResumoAreas();

  const officialFlashcardArea = useMemo(() => {
    if (!flashcardsAreasResumo || flashcardsAreasResumo.length === 0) {
      return effectiveAreaName;
    }
    const found =
      flashcardsAreasResumo.find((a) => a.slug === slug) ||
      flashcardsAreasResumo.find((a) => a.area.toLowerCase() === (area?.nome || effectiveAreaName).toLowerCase()) ||
      flashcardsAreasResumo.find((a) => slug && (a.slug.includes(slug) || slug.includes(a.slug))) ||
      flashcardsAreasResumo.find((a) => slug && a.area.toLowerCase().includes(slug.replace(/-/g, ' ')));
    return found ? found.area : effectiveAreaName;
  }, [flashcardsAreasResumo, slug, area?.nome, effectiveAreaName]);

  const flashcardAreaRow = useMemo(() => {
    if (!flashcardsAreasResumo) return null;
    return flashcardsAreasResumo.find((a) => a.area === officialFlashcardArea || a.slug === slug) || null;
  }, [flashcardsAreasResumo, officialFlashcardArea, slug]);

  // Busca temas e cards de flashcards desta área no Supabase com fallback resiliente
  const { data: temasFlashcards, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['area_flashcards_temas', officialFlashcardArea, effectiveAreaName, slug],
    queryFn: async () => {
      const candidates = Array.from(
        new Set(
          [
            officialFlashcardArea,
            effectiveAreaName,
            area?.nome,
            officialFlashcardArea?.startsWith('Direito ')
              ? officialFlashcardArea.replace('Direito ', '')
              : `Direito ${officialFlashcardArea}`,
            effectiveAreaName?.startsWith('Direito ')
              ? effectiveAreaName.replace('Direito ', '')
              : `Direito ${effectiveAreaName}`,
          ].filter(Boolean) as string[]
        )
      );

      for (const cand of candidates) {
        try {
          const { data: res, error } = await supabase.rpc('flashcards_temas', { _area: cand });
          if (!error && res && res.length > 0) {
            return res as Array<{ tema: string; total: number; compreendidos: number; a_revisar: number }>;
          }
        } catch {}
      }

      // Se não encontrou temas via RPC ou se a área tiver tópicos canônicos configurados:
      if (slug && CANONICAL_AREA_TOPICS[slug]) {
        const defaultTotalPerTopic = flashcardAreaRow?.total_cards
          ? Math.max(10, Math.floor(flashcardAreaRow.total_cards / CANONICAL_AREA_TOPICS[slug].length))
          : 50;
        return CANONICAL_AREA_TOPICS[slug].map((t) => ({
          tema: t,
          total: defaultTotalPerTopic,
          compreendidos: 0,
          a_revisar: 0,
        }));
      }

      return [];
    },
    enabled: !!(officialFlashcardArea || effectiveAreaName || slug),
    staleTime: 5 * 60 * 1000,
  });

  const totalFlashcardsArea = useMemo(() => {
    if (flashcardAreaRow?.total_cards) return flashcardAreaRow.total_cards;
    return (temasFlashcards || []).reduce((acc, t) => acc + (t.total || 0), 0);
  }, [flashcardAreaRow?.total_cards, temasFlashcards]);

  const isFlash = activeTab === 'flashcards';

  // Itens unificados: na aba flashcards são sempre DECKS DE FLASHCARDS
  const itemsToRender = useMemo(() => {
    if (isFlash && temasFlashcards && temasFlashcards.length > 0) {
      return temasFlashcards.map((t, idx) => ({
        key: `deck-${t.tema}-${idx}`,
        titulo: t.tema,
        ordemStr: String(idx + 1).padStart(2, '0'),
        badgeLabel: `Deck ${String(idx + 1).padStart(2, '0')}`,
        displayTotal: t.total,
        displayConcluidas: t.compreendidos,
        displayLabel: t.total === 1 ? 'flashcard' : 'flashcards',
        displayPct: t.total > 0 ? Math.round((t.compreendidos / t.total) * 100) : 0,
        onClick: () => {
          try { haptic.light(); } catch {}
          navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(t.tema)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
            state: { from: `/aprender/area/${slug}?tab=flashcards` }
          });
        },
      }));
    }

    if (isFlash) {
      const fallbackTopics = (slug && CANONICAL_AREA_TOPICS[slug]) || [];
      if (fallbackTopics.length > 0) {
        const estTotal = totalFlashcardsArea > 0 ? Math.max(10, Math.floor(totalFlashcardsArea / fallbackTopics.length)) : 30;
        return fallbackTopics.map((tema, idx) => ({
          key: `canon-deck-${tema}-${idx}`,
          titulo: tema,
          ordemStr: String(idx + 1).padStart(2, '0'),
          badgeLabel: `Deck ${String(idx + 1).padStart(2, '0')}`,
          displayTotal: estTotal,
          displayConcluidas: 0,
          displayLabel: 'flashcards',
          displayPct: 0,
          onClick: () => {
            try { haptic.light(); } catch {}
            navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(tema)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
              state: { from: `/aprender/area/${slug}?tab=flashcards` }
            });
          },
        }));
      }

      if (modulosOrdenados.length > 0) {
        const estTotal = totalFlashcardsArea > 0 ? Math.max(10, Math.floor(totalFlashcardsArea / modulosOrdenados.length)) : 25;
        return modulosOrdenados.map((m, idx) => ({
          key: `mod-deck-${m.id}`,
          titulo: m.titulo,
          ordemStr: String(m.ordem || idx + 1).padStart(2, '0'),
          badgeLabel: `Deck ${String(m.ordem || idx + 1).padStart(2, '0')}`,
          displayTotal: estTotal,
          displayConcluidas: 0,
          displayLabel: 'flashcards',
          displayPct: 0,
          onClick: () => {
            try { haptic.light(); } catch {}
            navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(m.titulo)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
              state: { from: `/aprender/area/${slug}?tab=flashcards` }
            });
          },
        }));
      }
    }

    return modulosOrdenados.map((m, idx) => {
      const list = aulas.filter((a) => a.modulo_id === m.id);
      const total = list.length;
      const concluidas = list.filter((a) => progresso[a.id]?.concluida).length;
      const somaPct = list.reduce(
        (s, a) => s + (progresso[a.id]?.concluida ? 100 : progresso[a.id]?.pct || 0),
        0,
      );
      const pct = total ? Math.round(somaPct / total) : 0;
      const numStr = String(m.ordem || idx + 1).padStart(2, '0');

      const moduloAulas = list.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        objetivo: a.objetivo,
        duracaoMin: a.duracao_est_min || 15,
        ordem: a.ordem,
        status: a.status || 'published',
        concluida: !!progresso[a.id]?.concluida,
        pct: progresso[a.id]?.pct || 0,
      }));

      const warmModulo = () => {
        setCachedModuloData(m.id, user?.id ?? null, {
          modulo: {
            id: m.id,
            titulo: m.titulo,
            resumo: m.resumo,
            ordem: m.ordem,
            areaId: data?.area?.id ?? '',
            areaNome: data?.area?.nome ?? 'Direito',
            areaSlug: data?.area?.slug ?? slug ?? 'geral',
          },
          aulas: moduloAulas,
        });
        if (list[0]?.id) {
          prefetchAprenderAula(list[0].id);
        }
      };

      return {
        key: m.id,
        titulo: m.titulo,
        ordemStr: numStr,
        badgeLabel: activeTab === 'questoes' ? `Questões ${numStr}` : `Módulo ${numStr}`,
        displayTotal: total,
        displayConcluidas: concluidas,
        displayLabel: total === 1 ? 'aula' : 'aulas',
        displayPct: pct,
        onPrefetch: warmModulo,
        onClick: () => {
          try { haptic.light(); } catch {}
          warmModulo();
          const destTab = activeTab === 'questoes' ? '?tab=questoes' : '';
          navigate(`/aprender/modulo/${m.id}${destTab}`, {
            state: {
              modulo: m,
              area: data?.area,
              aulas: moduloAulas,
              tab: activeTab,
            }
          });
        },
      };
    });
  }, [isFlash, temasFlashcards, modulosOrdenados, aulas, progresso, activeTab, area?.nome, officialFlashcardArea, effectiveAreaName, slug, navigate, data?.area, totalFlashcardsArea, user?.id]);

  const areaVisual = useMemo(() => areaIconFor(slug || area?.slug || area?.nome), [slug, area]);
  const AreaIconComp = areaVisual?.Icon;
  const palette = useMemo(() => getAreaThemePalette(slug || area?.slug || area?.nome), [slug, area]);

  const titleDisplay = (
    <span className="font-sans font-extrabold uppercase tracking-widest text-[15px] sm:text-[16px] text-white">
      {officialFlashcardArea || area?.nome || effectiveAreaName}
    </span>
  );

  const mobileHeader = (
    <PageHeader 
      title={titleDisplay} 
      subtitle={activeTab === 'flashcards' ? 'Trilha de Flashcards' : 'Trilha de Aprendizado'} 
      onBack={goBack} 
      variant="dark"
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle={activeTab === 'flashcards' ? 'Trilha de Flashcards' : 'Trilha de Aprendizado'}
      mobileHeader={mobileHeader}
    >
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

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-20 pt-4 min-w-0 overflow-x-hidden box-border">
        {loading && !data && !effectiveAreaName ? (
          <div className="space-y-4 px-4 py-5 sm:px-6">
            <div className="h-44 rounded-2xl bg-muted animate-pulse" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : !area && !effectiveAreaName ? (
          <div className="mx-4 my-6 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Área não encontrada.
          </div>
        ) : (
          <>
            {/* Top Bar Selecione o Módulo / Decks de Flashcards */}
            <div className="flex items-center justify-between mb-4 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {isFlash ? (
                  <Layers className="w-5 h-5 shrink-0" style={{ color: palette.primary }} />
                ) : (
                  <BookOpenText className="w-5 h-5 shrink-0" style={{ color: palette.primary }} />
                )}
                <h2 className="text-xs sm:text-sm font-normal font-sans uppercase tracking-widest text-white truncate">
                  {isFlash ? `Decks de Flashcards (${itemsToRender.length})` : activeTab === 'questoes' ? 'Praticar por Tópico' : 'Selecione o Módulo'}
                </h2>
              </div>
              <span 
                className="text-[10px] sm:text-xs font-normal font-sans uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0"
                style={{
                  backgroundColor: palette.badgeBg,
                  borderColor: palette.badgeBorder,
                  color: palette.primary,
                }}
              >
                {officialFlashcardArea || area?.nome || effectiveAreaName}
              </span>
            </div>

            {isFlash && loadingFlashcards && itemsToRender.length === 0 ? (
              <div className="space-y-4 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              /* Trilha em Zigue-Zague Fluida com Caminho Serpenteante e Cards em Tamanho de Capa */
              <div className="relative py-6 sm:py-10 w-full min-w-0 max-w-full overflow-hidden">
                {/* ── Imagem Majestosa da Deusa Têmis Vazada e Impactante no Fundo Central da Trilha ── */}
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
                  <img
                    src="/images/gamificacao/deusa_temis_vazada.webp"
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-[320px] sm:w-[440px] md:w-[500px] max-w-[88vw] h-auto object-contain opacity-25 filter drop-shadow-[0_0_55px_rgba(234,179,8,0.28)] pointer-events-none"
                    style={{
                      maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    }}
                  />
                </div>

                <div className="w-full min-w-0 relative z-[2] flex flex-col">
                  {itemsToRender.map((item, i) => {
                    const isLeft = i % 2 === 0;

                    return (
                      <div key={item.key} className="w-full flex flex-col">
                        {/* Linha do Card em Zigue-Zague (Alternando Esquerda e Direita) */}
                        <div
                          className={`relative z-10 flex w-full items-center ${
                            isLeft ? 'justify-start pl-3 sm:pl-8 md:pl-12' : 'justify-end pr-3 sm:pr-8 md:pr-12'
                          }`}
                        >
                          {/* ── CONJUNTO DE 3 CARTAS EM FORMATO DE DECK ABERTO EM LEQUE COM ALTURA NIVELADA ── */}
                          <div
                            onClick={item.onClick}
                            onPointerEnter={(item as any).onPrefetch}
                            onTouchStart={(item as any).onPrefetch}
                            className="relative w-[165px] sm:w-[190px] md:w-[215px] h-[245px] sm:h-[275px] md:h-[295px] cursor-pointer group select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                          >
                            {/* Medalhão de Milestone / Nó da Trilha Centralizado no Topo (Estável e Elegante) */}
                            <div
                              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full w-8 h-8 sm:w-8.5 sm:h-8.5 border-2 border-white/70 text-white font-bold text-xs shadow-xl transition-transform duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: palette.primary,
                                boxShadow: palette.nodeBoxShadow,
                              }}
                            >
                              <span className="font-sans font-bold text-[11px] sm:text-xs">
                                {item.ordemStr}
                              </span>
                            </div>

                            {/* ── CARTA 1 (Traseira/Fundo - Menor e mais escura) ── */}
                            <div
                              className="absolute inset-0 rounded-2xl border border-white/10 transition-all duration-400 origin-bottom scale-[0.85] -translate-y-6 sm:-translate-y-8 group-hover:scale-95 group-hover:-rotate-[12deg] group-hover:-translate-x-8 group-hover:-translate-y-2 z-0 shadow-lg overflow-hidden"
                              style={{
                                background: palette.cardGradient,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              {/* Overlay de escurecimento para dar profundidade (Carta mais ao fundo) */}
                              <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                              
                              <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                                <div
                                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                                  style={{ borderColor: palette.primary }}
                                >
                                  <Layers className="w-4 h-4 text-white/60" />
                                </div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                              </div>
                            </div>

                            {/* ── CARTA 2 (Meio - Tamanho intermediário) ── */}
                            <div
                              className="absolute inset-0 rounded-2xl border border-white/15 transition-all duration-400 origin-bottom scale-[0.92] -translate-y-3 sm:-translate-y-4 group-hover:scale-95 group-hover:rotate-[12deg] group-hover:translate-x-8 group-hover:-translate-y-2 z-0 shadow-lg overflow-hidden"
                              style={{
                                background: palette.cardGradient,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              {/* Overlay de escurecimento médio para dar profundidade */}
                              <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />

                              <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                                <div
                                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                                  style={{ borderColor: palette.primary }}
                                >
                                  <Layers className="w-4 h-4 text-white/60" />
                                </div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                              </div>
                            </div>

                            {/* ── CARTA 3 (Principal Frontal - Centro Estável) ── */}
                            <div
                              className="relative w-full h-full p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 hover:border-amber-400/60 shadow-[0_16px_36px_rgba(0,0,0,0.75)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                              style={{
                                background: palette.cardGradient,
                                boxShadow: palette.shadow,
                              }}
                            >
                              {/* Brilho reflexivo sutil no hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />

                              {/* Moldura Interna Chanfrada de Carta de Baralho */}
                              <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />

                              {/* Efeito de Brilho e Acabamento Laminado da Carta */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

                              {/* Marca d'água / Gravura da Deusa Têmis Vazada na Carta */}
                              <img
                                src="/images/gamificacao/deusa_temis_vazada.webp"
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute -right-2 -bottom-2 w-[120px] sm:w-[145px] h-[140px] sm:h-[165px] object-contain opacity-35 group-hover:opacity-55 group-hover:scale-105 transition-all duration-300 z-0 select-none filter drop-shadow-[0_5px_12px_rgba(0,0,0,0.65)]"
                              />

                              {/* Cabeçalho da Carta: Tag Deck no Lado Direito e Sem Ícone */}
                              <div className="flex items-center justify-end z-[1] w-full pt-1">
                                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md bg-black/45 text-white/95 border border-white/20 shadow-sm whitespace-nowrap">
                                  <span>{item.badgeLabel}</span>
                                </span>
                              </div>

                              {/* Centro da Carta: Título do Tema sem negrito (font-normal) */}
                              <div className="my-auto py-2.5 z-[1] w-full px-1">
                                <h3 className="font-sans font-normal text-[16px] sm:text-[17.5px] md:text-[18.5px] leading-snug break-words text-white drop-shadow-md group-hover:text-amber-200 transition-colors line-clamp-3">
                                  {item.titulo}
                                </h3>
                              </div>

                              {/* Rodapé da Carta: Progresso e Estatísticas */}
                              <div className="z-[1] pt-2 border-t border-white/20 w-full px-0.5">
                                <div>
                                  <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-normal text-white/95 mb-1.5">
                                    <span className="truncate">
                                      {item.displayConcluidas > 0
                                        ? `${item.displayConcluidas}/${item.displayTotal} concluídos`
                                        : `${item.displayTotal} ${item.displayLabel}`}
                                    </span>
                                    <span className="font-semibold font-sans ml-1">{item.displayPct}%</span>
                                  </div>
                                  <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/20">
                                    <div
                                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                                      style={{
                                        width: `${Math.max(item.displayPct, item.displayTotal > 0 ? 8 : 0)}%`,
                                        backgroundColor: palette.primary,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Conector Serpenteante de Trilha em Zigue-Zague Conectando Suavemente de Deck a Deck */}
                        {i < itemsToRender.length - 1 && (
                          <div className="relative w-full h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                            <svg
                              className="w-full h-full overflow-visible"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <filter id={`trail-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>

                              {/* Leito da Trilha (traço suave e discreto) */}
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                              />

                              {/* Linha da Trilha em Zigue-Zague Pontilhada Luminosa */}
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke={palette.primary}
                                strokeWidth="2.5"
                                strokeDasharray="5 7"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                filter={`url(#trail-glow-${i})`}
                              />
                            </svg>

                            {/* Passos / Checkpoints Esféricos Perfeitos (Estáveis e com Glow Suave) */}
                            <div
                              className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md opacity-85"
                              style={{
                                left: isLeft ? '38%' : '62%',
                                top: '28%',
                                backgroundColor: palette.primary,
                                boxShadow: `0 0 6px ${palette.primary}`,
                              }}
                            />
                            <div
                              className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                              style={{
                                left: '50%',
                                top: '50%',
                                boxShadow: `0 0 10px ${palette.primary}`,
                              }}
                            />
                            <div
                              className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md opacity-85"
                              style={{
                                left: isLeft ? '62%' : '38%',
                                top: '72%',
                                backgroundColor: palette.primary,
                                boxShadow: `0 0 6px ${palette.primary}`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DesktopPageLayout>
  );
};

export default AprenderArea;
