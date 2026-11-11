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
import ShapeGrid from '@/components/ui/ShapeGrid';
import { motion, AnimatePresence } from 'framer-motion';

interface SubMateriaCivilConfig {
  id: string;
  nome: string;
  numeros: number[];
}

const SUB_MATERIAS_CIVIL: SubMateriaCivilConfig[] = [
  { id: 'sec-parte-geral', nome: 'Parte Geral & LINDB', numeros: [1, 2, 3, 4, 5, 6, 32, 33] },
  { id: 'sec-obrigacoes', nome: 'Obrigações', numeros: [7, 8, 9, 10] },
  { id: 'sec-contratos', nome: 'Contratos', numeros: [11, 12, 13, 30, 31, 40, 41] },
  { id: 'sec-responsabilidade-civil', nome: 'Responsabilidade Civil', numeros: [14] },
  { id: 'sec-direitos-reais', nome: 'Direitos Reais', numeros: [15, 16, 17, 18, 19, 20, 22] },
  { id: 'sec-familia', nome: 'Direito de Família', numeros: [21, 23, 24, 25, 34, 37, 38, 39, 42, 43, 44] },
  { id: 'sec-sucessoes', nome: 'Direito das Sucessões', numeros: [26, 27, 35, 36] },
  { id: 'sec-consumidor-especial', nome: 'Consumidor & Especial', numeros: [28, 29] },
];

function getNumeroTema(temaStr: string): number {
  if (!temaStr) return 0;
  const m = String(temaStr).match(/^(\d+)[\.\-\s_:]+/);
  return m ? parseInt(m[1], 10) : 0;
}

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
          rawTema: t.tema,
          temaNum: getNumeroTema(t.tema),
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
            rawTema: tema,
            temaNum: getNumeroTema(tema),
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

  const pillContainerRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-parte-geral');

  const isCivilArea = useMemo(() => {
    return slug === 'direito-civil' || (officialFlashcardArea && officialFlashcardArea.toLowerCase().includes('civil'));
  }, [slug, officialFlashcardArea]);

  // Se for Direito Civil, agrupa os temas nas 8 sub-matérias clássicas
  const sections = useMemo(() => {
    if (!isCivilArea) {
      return [{
        id: 'sec-trilha-geral',
        nome: officialFlashcardArea || area?.nome || effectiveAreaName || 'Trilha',
        items: itemsToRender.map((it, idx) => ({ ...it, globalIndex: idx })),
      }];
    }

    let globalCounter = 0;
    const result = SUB_MATERIAS_CIVIL.map((sub) => {
      const matched = itemsToRender.filter((it) => {
        const num = it.temaNum || getNumeroTema(it.rawTema || it.titulo);
        return sub.numeros.includes(num);
      }).sort((a, b) => {
        const numA = a.temaNum || getNumeroTema(a.rawTema || a.titulo);
        const numB = b.temaNum || getNumeroTema(b.rawTema || b.titulo);
        return numA - numB;
      });

      const itemsWithGlobal = matched.map((it) => {
        const curr = globalCounter++;
        const numStr = String(curr + 1).padStart(2, '0');
        const isLocked = !isPremium && curr >= 2;
        return {
          ...it,
          globalIndex: curr,
          badgeLabel: `Deck ${numStr}`,
          ordemStr: numStr,
          isLocked,
        };
      });

      return {
        id: sub.id,
        nome: sub.nome,
        items: itemsWithGlobal,
      };
    }).filter((sub) => sub.items.length > 0);

    // Se sobrou algum tema não classificado nos números padrão, anexa à última sub-matéria
    const classifiedKeys = new Set(result.flatMap((s) => s.items.map((it) => it.key)));
    const unclassified = itemsToRender.filter((it) => !classifiedKeys.has(it.key));
    if (unclassified.length > 0 && result.length > 0) {
      const lastSec = result[result.length - 1];
      unclassified.forEach((it) => {
        const curr = globalCounter++;
        const numStr = String(curr + 1).padStart(2, '0');
        lastSec.items.push({
          ...it,
          globalIndex: curr,
          badgeLabel: `Deck ${numStr}`,
          ordemStr: numStr,
          isLocked: !isPremium && curr >= 2,
        });
      });
    }

    return result;
  }, [isCivilArea, itemsToRender, isPremium, officialFlashcardArea, area?.nome, effectiveAreaName]);

  const activeSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0] || null;
  }, [sections, activeSectionId]);

  const activeSectionIndex = useMemo(() => {
    return sections.findIndex((s) => s.id === (activeSection?.id || ''));
  }, [sections, activeSection]);

  const nextSection = useMemo(() => {
    if (activeSectionIndex >= 0 && activeSectionIndex < sections.length - 1) {
      return sections[activeSectionIndex + 1];
    }
    return null;
  }, [sections, activeSectionIndex]);

  const activeSectionTotalCards = useMemo(() => {
    if (!activeSection) return 0;
    return activeSection.items.reduce((acc, item) => acc + (item.displayTotal || 0), 0);
  }, [activeSection]);

  const activeSectionCompreendidos = useMemo(() => {
    if (!activeSection) return 0;
    return activeSection.items.reduce((acc, item) => acc + (item.displayConcluidas || 0), 0);
  }, [activeSection]);

  const activeSectionPct = activeSectionTotalCards > 0
    ? Math.round((activeSectionCompreendidos / activeSectionTotalCards) * 100)
    : 0;

  const totalDecksCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.items.length, 0);
  }, [sections]);

  const selectSubMateria = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    try { haptic.selection(); } catch {}
  }, []);

  // Mantém a pílula ativa sempre visível no carrossel horizontal
  useEffect(() => {
    if (!activeSectionId || !pillContainerRef.current) return;
    const btn = pillContainerRef.current.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSectionId]);

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle="Trilha de Flashcards"
      mobileHeader={mobileHeader}
    >
      {/* Fundo Base idêntico ao Vade Mecum */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0D0D]" />

      {/* Fundo com Grid de Quadrados (ShapeGrid) idêntico ao Vade Mecum */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <ShapeGrid 
          speed={0.3} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.08)'
          hoverFillColor='rgba(37, 99, 235, 0.15)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-24 pt-2 min-w-0 overflow-x-hidden box-border">
        {/* ── Menu de Alternância (100% Azul e Fixo no Topo sem Sobreposição) ── */}
        <div className="sticky top-0 z-30 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 py-2.5 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-blue-500/25 mb-4 shadow-lg shadow-black/60">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              {isCivilArea ? `Matérias de Direito Civil (${sections.length})` : `Todas as Matérias (${todasAsAreas.length})`}
            </span>
            <span className="text-[10px] text-blue-300/80 font-medium">
              Toque para alternar a matéria
            </span>
          </div>
          <div
            ref={pillContainerRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {isCivilArea ? (
              sections.map((sub) => {
                const isActive = activeSectionId === sub.id;
                return (
                  <button
                    key={sub.id}
                    data-section-id={sub.id}
                    type="button"
                    onClick={() => selectSubMateria(sub.id)}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none",
                      isActive
                        ? "bg-blue-600 text-white border-blue-300 shadow-[0_0_18px_rgba(37,99,235,0.7)] scale-[1.04] font-black"
                        : "bg-blue-950/40 text-blue-200 border-blue-800/50 hover:bg-blue-900/60 hover:text-white hover:border-blue-400/60"
                    )}
                  >
                    {sub.nome}
                  </button>
                );
              })
            ) : (
              todasAsAreas.map((a) => {
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
                      "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-300 shadow-[0_0_18px_rgba(37,99,235,0.7)] scale-[1.04] font-black"
                        : "bg-blue-950/40 text-blue-200 border-blue-800/50 hover:bg-blue-900/60 hover:text-white hover:border-blue-400/60"
                    )}
                  >
                    {a.area}
                  </button>
                );
              })
            )}
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
            {/* ── DUAS BARRAS DE PROGRESSO: GERAL E DA MATÉRIA (Conforme Solicitado) ── */}
            {isFlash && totalFlashcardsArea > 0 && (
              <div className="w-full space-y-3 mb-5 p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/25 shadow-lg shadow-black/40">
                {/* BARRA 1: Progresso Geral (Direito Civil) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      Progresso Geral • {officialFlashcardArea || area?.nome || effectiveAreaName || 'Direito Civil'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-cyan-300 tabular-nums">
                      {totalCompreendidos} / {totalFlashcardsArea} dominados ({progressoPctFlash}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      style={{
                        width: `${Math.max(progressoPctFlash, totalFlashcardsArea > 0 ? 3 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* BARRA 2: Progresso da Matéria Atual */}
                {isCivilArea && activeSection && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                        Progresso da Matéria • {activeSection.nome}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-300 tabular-nums">
                        {activeSectionCompreendidos} / {activeSectionTotalCards} dominados ({activeSectionPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{
                          width: `${Math.max(activeSectionPct, activeSectionTotalCards > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isFlash && loadingFlashcards && totalDecksCount === 0 ? (
              <div className="space-y-4 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              /* Trilha em Zigue-Zague com Transição Animada por Matéria (Framer Motion) */
              <div className="relative py-2 sm:py-4 w-full min-w-0 max-w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeSection && (
                    <motion.div
                      key={activeSection.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="w-full min-w-0 relative z-[2] flex flex-col items-center"
                    >
                      {/* Marcador / Título da Matéria Atual */}
                      <div className="w-full mb-8 pt-1 flex flex-col items-center justify-center">
                        <div className="w-full max-w-[560px] flex items-center gap-3 px-3">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-blue-500/60 to-blue-400" />
                          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-950/85 border border-blue-500/50 shadow-[0_0_24px_rgba(37,99,235,0.4)] backdrop-blur-md">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
                            <span className="text-xs sm:text-sm font-sans font-black uppercase tracking-wider text-white">
                              {activeSection.nome}
                            </span>
                            <span className="text-[10.5px] font-mono font-bold text-blue-200 bg-blue-600/35 px-2 py-0.5 rounded-full border border-blue-400/40">
                              {activeSection.items.length} {activeSection.items.length === 1 ? 'deck' : 'decks'}
                            </span>
                          </div>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-400 via-blue-500/60 to-transparent" />
                        </div>
                      </div>

                      {/* Decks da Trilha desta Matéria */}
                      {activeSection.items.map((item, itemIdx) => {
                        const isLastInSection = itemIdx === activeSection.items.length - 1;
                        return (
                          <FlashcardDeckItem
                            key={item.key}
                            item={item}
                            i={item.globalIndex}
                            palette={palette}
                            isLast={isLastInSection}
                          />
                        );
                      })}

                      {/* Linha Divisória para Avançar para a Próxima Matéria */}
                      {nextSection && (
                        <div
                          onClick={() => {
                            selectSubMateria(nextSection.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full my-12 pt-3 flex flex-col items-center justify-center cursor-pointer group select-none"
                        >
                          <div className="w-full max-w-[560px] flex items-center gap-3 px-3">
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-blue-500/60 to-blue-400" />
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-blue-950/90 border border-blue-500/50 shadow-[0_0_24px_rgba(37,99,235,0.4)] backdrop-blur-md group-hover:scale-105 group-hover:border-blue-400 group-hover:bg-blue-900/90 transition-all duration-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                              <span className="text-xs sm:text-sm font-sans font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                Próxima Matéria: <span className="text-cyan-300">{nextSection.nome}</span>
                              </span>
                              <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-400 via-blue-500/60 to-transparent" />
                          </div>
                          <span className="text-[10.5px] font-medium text-blue-300/80 mt-2">
                            Toque para avançar para a próxima matéria
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
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
