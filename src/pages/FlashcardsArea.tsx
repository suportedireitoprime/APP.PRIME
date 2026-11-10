// @ts-nocheck
import { FlashcardDeckItem } from '@/components/flashcards/FlashcardDeckItem';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
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
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Search } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { useTrackArea } from "@/hooks/useTrackArea";
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { CANONICAL_AREA_TOPICS } from '@/data/canonicalAreaTopics';
import { haptic } from '@/lib/nativeHaptics';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';
import { cn } from '@/lib/utils';

const FlashcardsArea = () => {
  useTrackArea("flashcards_area_aberta");
  const { isPremium } = useSubscription();
  const [premiumGateOpen, setPremiumGateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate('/flashcards');
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');
  const [activeTab] = useState<'flashcards'>('flashcards');

  const initial = slug ? getCachedAprenderArea(slug, user?.id ?? null) : undefined;
  const [data, setData] = useState<AprenderAreaData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Renderiza todos os decks com folga
  const [visibleCount, setVisibleCount] = useState(60);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 6);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // Busca temas e cards de flashcards desta área no Supabase com fallback resiliente
  const { data: temasFlashcards, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['area_flashcards_temas', flashcardAreaRow?.area, officialFlashcardArea, effectiveAreaName, slug],
    queryFn: async () => {
      const candidates = Array.from(
        new Set(
          [
            flashcardAreaRow?.area,
            officialFlashcardArea,
            effectiveAreaName,
            area?.nome,
            slug ? slug.replace(/-/g, ' ') : null,
            slug ? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null,
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
    enabled: !!(flashcardAreaRow?.area || officialFlashcardArea || effectiveAreaName || slug),
    staleTime: 5 * 60 * 1000,
  });

  const totalFlashcardsArea = useMemo(() => {
    if (flashcardAreaRow?.total_cards) return flashcardAreaRow.total_cards;
    return (temasFlashcards || []).reduce((acc, t) => acc + (t.total || 0), 0);
  }, [flashcardAreaRow?.total_cards, temasFlashcards]);

  const isFlash = true;

  const iconInfo = areaIconFor(slug || area?.slug || area?.nome || 'geral');
  const AreaIconComp = iconInfo?.Icon || BookOpenText;
  const palette = useMemo(() => getAreaThemePalette(slug || area?.nome || area?.slug || 'geral'), [slug, area]);

  // Progresso geral de flashcards da área
  const totalCompreendidos = useMemo(() => {
    if (flashcardAreaRow?.compreendidos !== undefined) {
      return flashcardAreaRow.compreendidos;
    }
    return (temasFlashcards || []).reduce((acc, t) => acc + (t.compreendidos || 0), 0);
  }, [temasFlashcards, flashcardAreaRow]);
  const progressoPctFlash = totalFlashcardsArea > 0 ? Math.round((totalCompreendidos / totalFlashcardsArea) * 100) : 0;

  // Itens unificados: na aba flashcards são sempre DECKS DE FLASHCARDS
  const itemsToRender = useMemo(() => {
    if (isFlash && temasFlashcards && temasFlashcards.length > 0) {
      return temasFlashcards.map((t, idx) => {
        const isLocked = !isPremium && idx >= 2;
        const cleanTitle = (t.tema || '').replace(/^\d+[\.\-\s_:]+/, '').trim();
        return {
          key: `deck-${t.tema}-${idx}`,
          titulo: cleanTitle || t.tema,
          ordemStr: String(idx + 1).padStart(2, '0'),
          badgeLabel: `Deck ${String(idx + 1).padStart(2, '0')}`,
          displayTotal: t.total,
          displayConcluidas: t.compreendidos,
          displayLabel: t.total === 1 ? 'flashcard' : 'flashcards',
          displayPct: t.total > 0 ? Math.round((t.compreendidos / t.total) * 100) : 0,
          isLocked,
          onClick: () => {
            if (isLocked) {
              haptic.impact('medium');
              setPremiumGateOpen(true);
              return;
            }
            try { haptic.light(); } catch {}
            navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(t.tema)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
              state: { from: `/flashcards/area/${slug}` }
            });
          },
        };
      });
    }

    if (isFlash) {
      const fallbackTopics = (slug && CANONICAL_AREA_TOPICS[slug]) || [];
      if (fallbackTopics.length > 0) {
        const estTotal = totalFlashcardsArea > 0 ? Math.max(10, Math.floor(totalFlashcardsArea / fallbackTopics.length)) : 30;
        return fallbackTopics.map((tema, idx) => {
          const isLocked = !isPremium && idx >= 2;
          const cleanTitle = (tema || '').replace(/^\d+[\.\-\s_:]+/, '').trim();
          return {
            key: `canon-deck-${tema}-${idx}`,
            titulo: cleanTitle || tema,
            ordemStr: String(idx + 1).padStart(2, '0'),
            badgeLabel: `Deck ${String(idx + 1).padStart(2, '0')}`,
            displayTotal: estTotal,
            displayConcluidas: 0,
            displayLabel: 'flashcards',
            displayPct: 0,
            isLocked,
            onClick: () => {
              if (isLocked) {
                haptic.impact('medium');
                setPremiumGateOpen(true);
                return;
              }
              try { haptic.light(); } catch {}
              navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(tema)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
                state: { from: `/flashcards/area/${slug}` }
              });
            },
          };
        });
      }

      if (modulosOrdenados.length > 0) {
        const estTotal = totalFlashcardsArea > 0 ? Math.max(10, Math.floor(totalFlashcardsArea / modulosOrdenados.length)) : 25;
        return modulosOrdenados.map((m, idx) => {
          const isLocked = !isPremium && idx >= 2;
          return {
            key: m.id,
            titulo: m.titulo.replace(/^\d+\.\s*/, ''),
            ordemStr: String(m.ordem || idx + 1).padStart(2, '0'),
            badgeLabel: `Deck ${String(m.ordem || idx + 1).padStart(2, '0')}`,
            displayTotal: estTotal,
            displayConcluidas: 0,
            displayLabel: 'flashcards',
            displayPct: 0,
            isLocked,
            onClick: () => {
              if (isLocked) {
                haptic.impact('medium');
                setPremiumGateOpen(true);
                return;
              }
              try { haptic.light(); } catch {}
              navigate(`/flashcards/estudar?area=${encodeURIComponent(officialFlashcardArea || area?.nome || effectiveAreaName)}&temas=${encodeURIComponent(m.titulo)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
                state: { from: `/flashcards/area/${slug}` }
              });
            },
          };
        });
      }

      // Fallback absoluto: se totalFlashcardsArea > 0 mas nenhum deck foi gerado, cria um deck genérico
      if (totalFlashcardsArea > 0) {
        const areaLabel = officialFlashcardArea || area?.nome || effectiveAreaName || 'Geral';
        return [{
          key: `fallback-all-${slug}`,
          titulo: areaLabel,
          ordemStr: '01',
          badgeLabel: 'Deck 01',
          displayTotal: totalFlashcardsArea,
          displayConcluidas: 0,
          displayLabel: totalFlashcardsArea === 1 ? 'flashcard' : 'flashcards',
          displayPct: 0,
          onClick: () => {
            try { haptic.light(); } catch {}
            navigate(`/flashcards/estudar?area=${encodeURIComponent(areaLabel)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`, {
              state: { from: `/flashcards/area/${slug}` }
            });
          },
        }];
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
        titulo: m.titulo.replace(/^\d+\.\s*/, ''),
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
              area: data?.area ? { ...data.area, slug: data.area.slug ?? slug } : undefined,
              aulas: moduloAulas,
              tab: activeTab,
            }
          });
        },
      };
    });
  }, [isFlash, temasFlashcards, modulosOrdenados, aulas, progresso, activeTab, area?.nome, officialFlashcardArea, effectiveAreaName, slug, navigate, data?.area, totalFlashcardsArea, user?.id, palette, isPremium]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return itemsToRender;
    const term = searchTerm.toLowerCase();
    return itemsToRender.filter(item => 
      item.titulo.toLowerCase().includes(term) ||
      (item.badgeLabel && item.badgeLabel.toLowerCase().includes(term))
    );
  }, [itemsToRender, searchTerm]);


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
      subtitle="Trilha de Flashcards" 
      onBack={goBack} 
      variant="dark"
    />
  );

  const todasAsAreas = useMemo(() => {
    if (flashcardsAreasResumo && flashcardsAreasResumo.length > 0) {
      return flashcardsAreasResumo;
    }
    return FALLBACK_FLASHCARDS_AREAS;
  }, [flashcardsAreasResumo]);

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle="Trilha de Flashcards"
      mobileHeader={mobileHeader}
    >
      {/* Fundo limpo sem ShapeGrid ou imagens vazadas */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0F12]" />

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-24 pt-4 min-w-0 overflow-x-hidden box-border">
        {/* ── Seletor Rápido de Matérias (Todas as Disciplinas de Flashcards) ── */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Todas as Matérias ({todasAsAreas.length})
            </span>
            <span className="text-[10px] text-zinc-500">Toque para trocar de matéria</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3.5 px-3.5 sm:-mx-6 sm:px-6">
            {todasAsAreas.map((a) => {
              const isSelected = a.slug === slug || a.area.toLowerCase() === (officialFlashcardArea || '').toLowerCase();
              return (
                <button
                  key={a.slug || a.area}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    navigate(`/flashcards/area/${a.slug}`);
                  }}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950/60 scale-[1.03]"
                      : "bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700 active:scale-95"
                  )}
                >
                  {a.area}
                </button>
              );
            })}
          </div>
        </div>

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
            <div className="flex items-center justify-between mb-3 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-5 h-5 shrink-0 text-blue-400" />
                <h2 className="text-xs sm:text-sm font-bold font-sans uppercase tracking-widest text-white truncate">
                  {`Decks de Flashcards (${itemsToRender.length})`}
                </h2>
              </div>
            </div>
            {/* Barra de progresso geral da área */}
            {isFlash && totalFlashcardsArea > 0 && (
              <div className="w-full mt-1 mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {totalCompreendidos} / {totalFlashcardsArea} dominados
                  </span>
                  <span 
                    className="text-[11px] sm:text-xs font-bold tabular-nums text-blue-400"
                  >
                    {progressoPctFlash}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{
                      width: `${Math.max(progressoPctFlash, 1)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {isFlash && loadingFlashcards && itemsToRender.length === 0 ? (
              <div className="space-y-4 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              /* Trilha em Zigue-Zague Mais Espaçada e Fluida com Decks Azuis e Nomes Abaixo */
              <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
                <div className="w-full min-w-0 relative z-[2] flex flex-col items-center">
                  {itemsToRender.slice(0, visibleCount).map((item, i) => {
                    return (
                      <FlashcardDeckItem
                        key={item.key}
                        item={item}
                        i={i}
                        palette={palette}
                        isLast={i === itemsToRender.length - 1}
                      />
                    );
                  })}
                  {/* Sentinela do Lazy Render */}
                  {visibleCount < itemsToRender.length && (
                    <div ref={observerTarget} className="w-full h-20" />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PremiumGate
        open={premiumGateOpen}
        onClose={() => setPremiumGateOpen(false)}
        feature="flashcards"
        usageLabel="Os 2 primeiros decks deste tema são gratuitos. Assine o Prime para estudar todos os decks!"
      />
    </DesktopPageLayout>
  );
};

export default FlashcardsArea;
