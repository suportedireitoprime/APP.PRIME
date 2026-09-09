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
} from '@/lib/aprenderAreaLoader';
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Play } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { useTrackArea } from "@/hooks/useTrackArea";
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
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
      navigate(`/aprender/modulo/${moduloIdParam}`, {
        replace: true,
        state: { modulo: found, area: data.area },
      });
    }
  }, [data, moduloIdParam, navigate]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const uid = user?.id ?? null;
    const hit = getCachedAprenderArea(slug, uid);
    if (hit) {
      setData(hit);
      setLoading(false);
      loadAprenderArea(slug, uid).then((d) => {
        if (!cancelled) setData(d);
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
      const fresh = await loadAprenderArea(slug, uid);
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

  // Busca temas e cards de flashcards desta área no Supabase
  const { data: temasFlashcards, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['area_flashcards_temas', effectiveAreaName],
    queryFn: async () => {
      if (!effectiveAreaName) return [];
      let { data: res } = await supabase.rpc('flashcards_temas', { _area: effectiveAreaName });
      if (!res || res.length === 0) {
        const alt = effectiveAreaName.startsWith('Direito ')
          ? effectiveAreaName.replace('Direito ', '')
          : `Direito ${effectiveAreaName}`;
        const { data: altRes } = await supabase.rpc('flashcards_temas', { _area: alt });
        if (altRes && altRes.length > 0) res = altRes;
      }
      return (res || []) as Array<{ tema: string; total: number; compreendidos: number; a_revisar: number }>;
    },
    enabled: !!effectiveAreaName,
    staleTime: 5 * 60 * 1000,
  });

  const totalFlashcardsArea = useMemo(() => {
    return (temasFlashcards || []).reduce((acc, t) => acc + (t.total || 0), 0);
  }, [temasFlashcards]);

  const isFlash = activeTab === 'flashcards';

  // Itens unificados para a trilha (temas reais de flashcards na aba flashcards, ou módulos de aulas/questões)
  const itemsToRender = useMemo(() => {
    if (isFlash && temasFlashcards && temasFlashcards.length > 0) {
      return temasFlashcards.map((t, idx) => ({
        key: `tema-${t.tema}-${idx}`,
        titulo: t.tema,
        ordemStr: String(idx + 1).padStart(2, '0'),
        badgeLabel: `Tópico ${String(idx + 1).padStart(2, '0')}`,
        displayTotal: t.total,
        displayConcluidas: t.compreendidos,
        displayLabel: t.total === 1 ? 'flashcard' : 'flashcards',
        displayPct: t.total > 0 ? Math.round((t.compreendidos / t.total) * 100) : 0,
        onClick: () => {
          try { haptic.light(); } catch {}
          navigate(`/flashcards/estudar?area=${encodeURIComponent(area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(t.tema)}`, {
            state: { from: `/aprender/area/${slug}?tab=flashcards` }
          });
        },
      }));
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

      if (isFlash && temasFlashcards) {
        const temaMatch = temasFlashcards.find((t) =>
          t.tema.toLowerCase() === m.titulo.toLowerCase() ||
          t.tema.toLowerCase().includes(m.titulo.toLowerCase()) ||
          m.titulo.toLowerCase().includes(t.tema.toLowerCase())
        );
        const totalCards = temaMatch?.total ?? 0;
        const concluidasCards = temaMatch?.compreendidos ?? 0;
        const pctCards = totalCards > 0 ? Math.round((concluidasCards / totalCards) * 100) : 0;

        return {
          key: m.id,
          titulo: m.titulo,
          ordemStr: numStr,
          badgeLabel: `Tópico ${numStr}`,
          displayTotal: totalCards,
          displayConcluidas: concluidasCards,
          displayLabel: totalCards === 1 ? 'flashcard' : 'flashcards',
          displayPct: pctCards,
          onClick: () => {
            try { haptic.light(); } catch {}
            if (temaMatch) {
              navigate(`/flashcards/estudar?area=${encodeURIComponent(area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(temaMatch.tema)}`, {
                state: { from: `/aprender/area/${slug}?tab=flashcards` }
              });
            } else {
              navigate(`/aprender/modulo/${m.id}?tab=flashcards`, {
                state: { modulo: m, area: data?.area, tab: 'flashcards' }
              });
            }
          },
        };
      }

      return {
        key: m.id,
        titulo: m.titulo,
        ordemStr: numStr,
        badgeLabel: activeTab === 'questoes' ? `Questões ${numStr}` : `Módulo ${numStr}`,
        displayTotal: total,
        displayConcluidas: concluidas,
        displayLabel: total === 1 ? 'aula' : 'aulas',
        displayPct: pct,
        onClick: () => {
          try { haptic.light(); } catch {}
          const destTab = activeTab === 'questoes' ? '?tab=questoes' : '';
          navigate(`/aprender/modulo/${m.id}${destTab}`, {
            state: { modulo: m, area: data?.area, tab: activeTab }
          });
        },
      };
    });
  }, [isFlash, temasFlashcards, modulosOrdenados, aulas, progresso, activeTab, area?.nome, effectiveAreaName, slug, navigate, data?.area]);

  const areaVisual = useMemo(() => areaIconFor(slug || area?.slug || area?.nome), [slug, area]);
  const AreaIconComp = areaVisual?.Icon;
  const palette = useMemo(() => getAreaThemePalette(slug || area?.slug || area?.nome), [slug, area]);

  const mobileHeader = (
    <PageHeader 
      title={area?.nome ?? effectiveAreaName} 
      subtitle={activeTab === 'flashcards' ? 'Trilha de Flashcards' : 'Trilha de Aprendizado'} 
      onBack={goBack} 
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={area?.nome ?? effectiveAreaName}
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
            {/* Seletor de Modo Aulas vs Flashcards vs Questões */}
            <div className="flex bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-full mb-4 shadow-sm gap-1.5">
              <button
                type="button"
                onClick={() => { haptic.selection(); setActiveTab('aulas'); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === 'aulas'
                    ? "bg-rose-500 text-white border border-rose-400/30 shadow-md shadow-rose-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Aulas</span>
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setActiveTab('flashcards'); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === 'flashcards'
                    ? "bg-emerald-500 text-white border border-emerald-400/30 shadow-md shadow-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                <FlashcardsIcon className="w-4 h-4 shrink-0" />
                <span>Flashcards</span>
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setActiveTab('questoes'); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === 'questoes'
                    ? "bg-sky-500 text-white border border-sky-400/30 shadow-md shadow-sky-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                <ListChecks className="w-4 h-4 shrink-0" />
                <span>Questões</span>
              </button>
            </div>

            {/* Top Bar Selecione o Módulo / Tópico */}
            <div className="flex items-center justify-between mb-4 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpenText className="w-5 h-5 shrink-0" style={{ color: palette.primary }} />
                <h2 className="text-xs sm:text-sm font-normal font-sans uppercase tracking-widest text-white truncate">
                  {isFlash ? `Tópicos (${itemsToRender.length})` : activeTab === 'questoes' ? 'Praticar por Tópico' : 'Selecione o Módulo'}
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
                {area?.nome || effectiveAreaName}
              </span>
            </div>

            {/* Banner de Estudo Rápido de Todos os Flashcards da Área */}
            {isFlash && totalFlashcardsArea > 0 && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  navigate(`/flashcards/estudar?area=${encodeURIComponent(area?.nome || effectiveAreaName)}`, {
                    state: { from: `/aprender/area/${slug}?tab=flashcards` }
                  });
                }}
                className="w-full mb-5 p-3.5 sm:p-4 rounded-2xl border border-white/15 bg-card/70 hover:bg-card/90 backdrop-blur-md flex items-center justify-between transition-all group cursor-pointer shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-sm"
                    style={{ backgroundColor: `${palette.primary}25` }}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" style={{ color: palette.primary }} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Estudar Todos os Flashcards de {area?.nome || effectiveAreaName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {totalFlashcardsArea.toLocaleString('pt-BR')} flashcards distribuídos em {itemsToRender.length} tópicos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold shrink-0 ml-2" style={{ color: palette.primary }}>
                  <span className="hidden sm:inline">Iniciar Trilha</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            )}

            {isFlash && loadingFlashcards && itemsToRender.length === 0 ? (
              <div className="space-y-4 py-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : itemsToRender.length === 0 ? (
              <div className="mx-auto max-w-md my-12 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                <BookOpenText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  {isFlash ? 'Nenhum tópico de flashcard encontrado' : 'Nenhum módulo publicado ainda'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFlash 
                    ? `Os flashcards de ${area?.nome || effectiveAreaName} estarão disponíveis em breve.`
                    : `Os módulos de ${area?.nome || effectiveAreaName} estarão disponíveis em breve.`}
                </p>
              </div>
            ) : (
              /* Trilha em Linha do Tempo Elegante (Alternando Esquerda/Direita) */
              <div className="relative py-6 w-full min-w-0 max-w-full overflow-hidden">
                {/* Linha vertical central luminosa */}
                <div 
                  className="absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 rounded-full z-0 pointer-events-none"
                  style={{ background: palette.lineGradient }}
                />

                <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                  {itemsToRender.map((item, i) => {
                    const isLeft = i % 2 === 0;

                    return (
                      <div
                        key={item.key}
                        className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Linha conectando o nó central ao card */}
                        <div 
                          className={`absolute top-1/2 w-[calc(50%-1.25rem)] h-[1.5px] border-b-2 border-dashed -translate-y-1/2 z-0 pointer-events-none ${
                            isLeft ? 'left-1/2' : 'right-1/2'
                          }`} 
                          style={{ borderColor: palette.dashedBorder }}
                        />

                        {/* Nó Central (Milestone da Linha do Tempo) */}
                        <div 
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-transform w-8 h-8 sm:w-9 sm:h-9 border-4 border-[#0D0D0D] text-white scale-105"
                          style={{
                            backgroundColor: palette.primary,
                            boxShadow: palette.nodeBoxShadow,
                          }}
                        >
                          <span className="text-[11px] sm:text-xs font-semibold font-sans">
                            {item.ordemStr}
                          </span>
                          <span 
                            className="absolute inset-0 rounded-full animate-ping -z-10 pointer-events-none"
                            style={{ backgroundColor: palette.pingBg }}
                          />
                        </div>

                        {/* Card no formato de Capa de Livro */}
                        <div
                          onClick={item.onClick}
                          className="relative w-[46%] sm:w-[45%] max-w-[225px] min-h-[175px] sm:min-h-[195px] h-auto p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden select-none box-border transition-all duration-300 z-10 border border-white/25 cursor-pointer active:scale-[0.97] group"
                          style={{
                            background: palette.cardGradient,
                            boxShadow: palette.shadow,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = palette.hoverShadow;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = palette.shadow;
                          }}
                        >
                          {/* Marca d'água de fundo */}
                          {slug === 'direito-penal' ? (
                            <img
                              src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] object-contain opacity-25 group-hover:opacity-35 transition-opacity duration-300 z-0 select-none"
                            />
                          ) : AreaIconComp ? (
                            <AreaIconComp
                              className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] opacity-15 group-hover:opacity-25 transition-opacity duration-300 z-0 select-none text-white"
                              strokeWidth={1.2}
                              aria-hidden="true"
                            />
                          ) : null}

                          {/* Cabeçalho da Capa: Módulo / Tópico */}
                          <div className="flex items-center justify-between gap-1 z-[1] w-full">
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-normal px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md bg-black/40 text-white border border-white/15">
                              {item.badgeLabel}
                            </span>
                          </div>

                          {/* Centro da Capa: Título do Tema Sem Negrito e Sem Abreviações */}
                          <div className="my-auto py-2 z-[1] w-full">
                            <h3 className="font-sans font-normal text-[12.5px] sm:text-[14px] leading-snug break-words text-white drop-shadow-sm">
                              {item.titulo}
                            </h3>
                          </div>

                          {/* Rodapé da Capa: Progresso */}
                          <div className="z-[1] pt-1.5 border-t border-white/15 w-full">
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-normal text-white/90 mb-1">
                                <span>{item.displayConcluidas > 0 ? `${item.displayConcluidas}/${item.displayTotal} concluídos` : `${item.displayTotal} ${item.displayLabel}`}</span>
                                <span className="font-normal font-sans">{item.displayPct}%</span>
                              </div>
                              <div className="w-full bg-black/35 h-1.5 rounded-full overflow-hidden border border-white/20">
                                <div 
                                  className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                                  style={{ width: `${Math.max(item.displayPct, item.displayTotal > 0 ? 8 : 0)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
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
