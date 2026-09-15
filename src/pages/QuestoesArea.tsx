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
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Play, Check } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { useTrackArea } from "@/hooks/useTrackArea";
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { CANONICAL_AREA_TOPICS } from '@/components/aprender/MateriaFlashcardsDeckSection';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { getAllProgressoArea, TopicoProgresso } from '@/lib/questoesTrilhaProgress';

const QuestoesArea = () => {
  useTrackArea("questoes_area_aberta");
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate('/questoes');
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');
  const [activeTab] = useState<'questoes'>('questoes');

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
        state: { modulo: found, area: data.area ? { ...data.area, slug: data.area.slug ?? slug } : undefined, aulas: moduloAulas, tab: activeTab },
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
        if (!cancelled && d && (d.aulas.length > 0 || !hit.aulas.length)) {
          setData(d);
        }
      }).catch((err) => {
        console.warn(err);
      });
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

  // Carrega progresso local dos tópicos desta trilha de questões
  const [progressoLocal, setProgressoLocal] = useState<Record<string, TopicoProgresso>>({});

  useEffect(() => {
    if (slug) {
      setProgressoLocal(getAllProgressoArea(slug));
    }
  }, [slug, location.key]);

  // Busca temas e contagens de questões desta matéria no banco
  const { data: temasQuestoes, isLoading: loadingQuestoesTemas } = useQuery({
    queryKey: ['area_questoes_temas', officialFlashcardArea, effectiveAreaName, slug],
    queryFn: async () => {
      const candidates = Array.from(
        new Set(
          [
            effectiveAreaName,
            officialFlashcardArea,
            area?.nome,
            slug ? slug.replace(/-/g, ' ') : null,
          ].filter(Boolean) as string[]
        )
      );

      for (const cand of candidates) {
        try {
          const { data: res, error } = await supabase.rpc('questoes_filtro_counts', {
            _disciplinas: [cand],
            _segmentos: null,
            _assuntos: null,
            _anos: null,
            _bancas: null,
          });
          if (!error && res && (res as any).assuntos) {
            const principais: Record<string, number> = {};
            Object.entries((res as any).assuntos).forEach(([raw, count]) => {
              const main = raw.split(' > ')[0].trim();
              principais[main] = (principais[main] || 0) + (Number(count) || 0);
            });
            const list = Object.entries(principais)
              .map(([tema, total]) => ({ tema, total }))
              .sort((a, b) => b.total - a.total);
            if (list.length > 0) return list;
          }
        } catch {}
      }

      // Se não encontrou temas via RPC ou se a área tiver tópicos canônicos configurados:
      if (slug && CANONICAL_AREA_TOPICS[slug]) {
        return CANONICAL_AREA_TOPICS[slug].map((t) => ({
          tema: t,
          total: 25,
        }));
      }

      return [];
    },
    enabled: !!(officialFlashcardArea || effectiveAreaName || slug),
    staleTime: 5 * 60 * 1000,
  });

  const iconInfo = areaIconFor(slug || area?.slug || area?.nome || 'geral');
  const AreaIconComp = iconInfo?.Icon || BookOpenText;
  const palette = useMemo(() => getAreaThemePalette(slug || area?.nome || area?.slug || 'geral'), [slug, area]);

  // Itens unificados da Trilha de Questões
  const itemsToRender = useMemo(() => {
    if (temasQuestoes && temasQuestoes.length > 0) {
      return temasQuestoes.map((t, idx) => {
        const prog = progressoLocal[t.tema] || { respondidas: 0, acertos: 0 };
        const numStr = String(idx + 1).padStart(2, '0');
        const displayTotal = t.total || 25;
        const displayConcluidas = prog.respondidas || 0;
        const displayPct = displayTotal > 0 ? Math.min(100, Math.round((displayConcluidas / displayTotal) * 100)) : 0;

        return {
          key: `tema-${t.tema}-${idx}`,
          titulo: t.tema,
          ordemStr: numStr,
          badgeLabel: `Tópico ${numStr}`,
          displayTotal,
          displayConcluidas,
          displayLabel: 'questões',
          displayPct,
          onClick: () => {
            try { haptic.light(); } catch {}
            navigate(`/questoes/praticar?area=${encodeURIComponent(effectiveAreaName || area?.nome || 'Direito')}&assunto=${encodeURIComponent(t.tema)}&areaSlug=${slug || ''}`, {
              state: { from: `/questoes/area/${slug}`, tema: t.tema }
            });
          },
        };
      });
    }

    const fallbackTopics = (slug && CANONICAL_AREA_TOPICS[slug]) || [];
    if (fallbackTopics.length > 0) {
      return fallbackTopics.map((tema, idx) => {
        const prog = progressoLocal[tema] || { respondidas: 0, acertos: 0 };
        const numStr = String(idx + 1).padStart(2, '0');
        const displayTotal = 25;
        const displayConcluidas = prog.respondidas || 0;
        const displayPct = Math.min(100, Math.round((displayConcluidas / displayTotal) * 100));

        return {
          key: `canon-tema-${tema}-${idx}`,
          titulo: tema,
          ordemStr: numStr,
          badgeLabel: `Tópico ${numStr}`,
          displayTotal,
          displayConcluidas,
          displayLabel: 'questões',
          displayPct,
          onClick: () => {
            try { haptic.light(); } catch {}
            navigate(`/questoes/praticar?area=${encodeURIComponent(effectiveAreaName || area?.nome || 'Direito')}&assunto=${encodeURIComponent(tema)}&areaSlug=${slug || ''}`, {
              state: { from: `/questoes/area/${slug}`, tema }
            });
          },
        };
      });
    }

    return modulosOrdenados.map((m, idx) => {
      const numStr = String(m.ordem || idx + 1).padStart(2, '0');
      const prog = progressoLocal[m.titulo] || { respondidas: 0, acertos: 0 };
      const displayTotal = 20;
      const displayConcluidas = prog.respondidas || 0;
      const displayPct = Math.min(100, Math.round((displayConcluidas / displayTotal) * 100));

      return {
        key: m.id,
        titulo: m.titulo.replace(/^\d+\.\s*/, ''),
        ordemStr: numStr,
        badgeLabel: `Tópico ${numStr}`,
        displayTotal,
        displayConcluidas,
        displayLabel: 'questões',
        displayPct,
        onClick: () => {
          try { haptic.light(); } catch {}
          navigate(`/questoes/praticar?area=${encodeURIComponent(effectiveAreaName || area?.nome || 'Direito')}&assunto=${encodeURIComponent(m.titulo)}&areaSlug=${slug || ''}`, {
            state: { from: `/questoes/area/${slug}`, tema: m.titulo }
          });
        },
      };
    });
  }, [temasQuestoes, progressoLocal, slug, effectiveAreaName, area?.nome, modulosOrdenados, navigate]);

  const totalQuestoesArea = useMemo(() => {
    return itemsToRender.reduce((acc, t) => acc + (t.displayTotal || 0), 0);
  }, [itemsToRender]);

  const totalRespondidasArea = useMemo(() => {
    return itemsToRender.reduce((acc, t) => acc + (t.displayConcluidas || 0), 0);
  }, [itemsToRender]);

  const progressoPctArea = totalQuestoesArea > 0 ? Math.min(100, Math.round((totalRespondidasArea / totalQuestoesArea) * 100)) : 0;


  // Capa oficial ilustrada da matéria
  const coverInfo = area ? (getAreaCover(area.nome) || getAreaCover(area.slug)) : (slug ? getAreaCover(slug) : null);
  const coverUrl = coverInfo?.cover || "/images/gamificacao/deusa_temis_vazada.webp";


  const titleDisplay = (
    <span className="font-sans font-extrabold uppercase tracking-widest text-[15px] sm:text-[16px] text-white">
      {officialFlashcardArea || area?.nome || effectiveAreaName}
    </span>
  );

  const mobileHeader = (
    <PageHeader 
      title={titleDisplay} 
      subtitle="Praticar Questões" 
      onBack={goBack} 
      variant="dark"
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle="Praticar Questões"
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
            {/* Top Bar Selecione o Módulo */}
            <div className="flex items-center justify-between mb-4 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpenText className="w-5 h-5 shrink-0" style={{ color: palette.primary }} />
                <h2 className="text-xs sm:text-sm font-normal font-sans uppercase tracking-widest text-white truncate">
                  Praticar por Tópico
                </h2>
              </div>
            {/* Barra de progresso geral da área */}
            {totalQuestoesArea > 0 && (
              <div className="w-full mt-2 mb-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {totalRespondidasArea} / {totalQuestoesArea} resolvidas
                  </span>
                  <span 
                    className="text-[11px] sm:text-xs font-bold tabular-nums"
                    style={{ color: palette.primary }}
                  >
                    {progressoPctArea}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(progressoPctArea, 1)}%`,
                      background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent || palette.primary})`,
                      boxShadow: `0 0 8px ${palette.primary}66`,
                    }}
                  />
                </div>
              </div>
            )}

            {loadingQuestoesTemas && itemsToRender.length === 0 ? (
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
                        {/* Linha do Card em Zigue-Zague com Card e Título no Lado Oposto Conectado por Linha Fina */}
                        <div
                          className={cn(
                            "relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                            isLeft ? "flex-row" : "flex-row-reverse"
                          )}
                        >
                          {/* ── CONJUNTO DE 3 CARTAS EM FORMATO DE DECK ABERTO EM LEQUE COM ALTURA NIVELADA ── */}
                          <div
                            onClick={item.onClick}
                            onPointerEnter={(item as any).onPrefetch}
                            onTouchStart={(item as any).onPrefetch}
                            className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[215px] xs:h-[235px] sm:h-[265px] md:h-[290px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                          >
                            {/* Medalhão de Milestone / Nó da Trilha Centralizado no Topo (Estável e Elegante) */}
                            <div
                              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full w-8 h-8 sm:w-8.5 sm:h-8.5 border-2 border-white/70 text-white font-bold text-xs shadow-xl transition-transform duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: item.displayPct >= 100 ? '#10B981' : palette.primary,
                                boxShadow: item.displayPct >= 100 ? '0 0 12px rgba(16,185,129,0.7)' : palette.nodeBoxShadow,
                              }}
                            >
                              {item.displayPct >= 100 || (item.displayConcluidas >= item.displayTotal && item.displayTotal > 0) ? (
                                <Check className="w-4 h-4 stroke-[3] text-white" />
                              ) : (
                                <span className="font-sans font-bold text-[11px] sm:text-xs">
                                  {item.ordemStr}
                                </span>
                              )}
                            </div>

                            {/* ── CARTA 1 (Traseira/Fundo - Menor e mais escura) ── */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                                  : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
                              )}
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
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                                  : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
                              )}
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
                              className={cn(
                                "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 hover:border-amber-400/60 transition-all duration-300 origin-bottom",
                                isLeft
                                  ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                                  : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                              )}
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

                              {/* Imagem de Fundo (Capa da Matéria Expandida e Original) */}
                              <img
                                src={coverUrl}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                              />
                              {/* Overlay para Contraste do Topo e Rodapé, mantendo o centro limpo para a ilustração */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/90 via-black/10 to-[#0d0f12]/50 pointer-events-none z-0" />

                              {/* Cabeçalho da Carta: Tag Deck no Lado Esquerdo */}
                              <div className="flex items-center justify-start z-[1] w-full pt-1">
                                <span className="inline-flex items-center text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md bg-black/50 text-white/95 border border-white/20 shadow-sm whitespace-nowrap">
                                  <span>{item.badgeLabel}</span>
                                </span>
                              </div>

                              {/* Centro da Carta: Ícone de Player (Destaque Elegante para Iniciar o Deck) */}
                              <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
                                <div className="relative flex items-center justify-center">
                                  {/* Pulso luminoso no hover */}
                                  <div
                                    className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125 pointer-events-none"
                                    style={{ backgroundColor: `${palette.primary}50` }}
                                  />

                                  {/* Botão de Play Minimalista e Moderno */}
                                  <div
                                    className="relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/90 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-amber-300 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_22px_rgba(245,158,11,0.6)]"
                                  >
                                    <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 fill-current translate-x-0.5 transition-colors" />
                                  </div>
                                </div>
                              </div>

                              {/* Rodapé da Carta: Progresso e Estatísticas */}
                              <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                                <div>
                                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                                    <span className="truncate">
                                      {item.displayConcluidas > 0
                                        ? `${item.displayConcluidas}/${item.displayTotal} resolvidas`
                                        : `${item.displayTotal} ${item.displayLabel}`}
                                    </span>
                                    <span className="font-semibold font-sans ml-1">{item.displayPct}%</span>
                                  </div>
                                  <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
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

                          {/* ── LINHA FINA CONECTORA E TÍTULO NO LADO OPOSTO ── */}
                          <div
                            onClick={item.onClick}
                            onPointerEnter={(item as any).onPrefetch}
                            onTouchStart={(item as any).onPrefetch}
                            className={cn(
                              "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
                              isLeft
                                ? "flex-row pl-1.5 xs:pl-2 sm:pl-3"
                                : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3"
                            )}
                          >
                            {/* Linha Fina Conectora com Degradê */}
                            <div
                              className={cn(
                                "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
                                isLeft ? "flex-row" : "flex-row-reverse"
                              )}
                            >
                              {/* Ponto de Ancoragem na Lateral do Card */}
                              <div
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                                style={{
                                  backgroundColor: palette.primary,
                                  boxShadow: `0 0 8px ${palette.primary}`,
                                }}
                              />
                              {/* Linha Fina */}
                              <div
                                className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                                style={{
                                  background: isLeft
                                    ? `linear-gradient(to right, ${palette.primary}, rgba(255,255,255,0.3), transparent)`
                                    : `linear-gradient(to left, ${palette.primary}, rgba(255,255,255,0.3), transparent)`,
                                }}
                              />
                            </div>

                            {/* Nome do Card em Letras Finas (Conforme Solicitado) */}
                            <div
                              className={cn(
                                "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                                isLeft ? "items-start text-left" : "items-end text-right"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 mb-1 opacity-80",
                                  isLeft ? "justify-start" : "justify-end"
                                )}
                              >
                                <span
                                  className="text-[9.5px] sm:text-[11px] font-normal uppercase tracking-wider"
                                  style={{ color: palette.primary }}
                                >
                                  {item.badgeLabel}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/25" />
                                <span className="text-[9.5px] sm:text-[11px] font-light text-zinc-400">
                                  {item.displayTotal} questões
                                </span>
                              </div>

                              <h3 className="font-sans font-light text-[13.5px] xs:text-[15px] sm:text-[17px] md:text-[19px] lg:text-[20px] leading-snug break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-sm line-clamp-3 sm:line-clamp-4">
                                {item.titulo}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Conector Serpenteante de Trilha em Zigue-Zague Conectando Suavemente de Deck a Deck */}
                        {i < itemsToRender.length - 1 && (
                          <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
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

                            {/* Passos / Checkpoints Esféricos Perfeitos (Apenas a central branca) */}
                            <div
                              className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                              style={{
                                left: '50%',
                                top: '50%',
                                boxShadow: `0 0 10px ${palette.primary}`,
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

export default QuestoesArea;
