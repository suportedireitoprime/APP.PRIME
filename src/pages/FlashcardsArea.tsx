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
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Search, Landmark, Scale, ScrollText } from 'lucide-react';
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
import greciaAcropoleTrilha from '@/assets/grecia-acropole-trilha.webp';
import greciaTrilhaRodape from '@/assets/grecia-trilha-rodape.jpg';

const LaurelBranch = ({ flip = false }: { flip?: boolean }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("w-14 h-14 sm:w-18 sm:h-18 text-[#d97706]/75 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]", flip && "scale-x-[-1]")}
    fill="currentColor"
  >
    <path d="M15,90 Q40,75 50,20 Q48,55 25,85 Z" opacity="0.9" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path d="M50,18 C55,15 62,20 58,26 C54,32 48,24 50,18 Z" />
    <path d="M48,32 C56,30 63,36 57,43 C51,50 46,40 48,32 Z" />
    <path d="M42,48 C51,47 57,54 50,61 C43,68 40,56 42,48 Z" />
    <path d="M34,65 C43,65 48,72 40,78 C33,84 31,73 34,65 Z" />
    <path d="M25,80 C32,80 37,86 30,91 C23,96 23,87 25,80 Z" />
    <path d="M46,24 C38,20 33,26 38,32 C43,38 48,29 46,24 Z" />
    <path d="M42,40 C33,37 29,44 35,50 C41,56 44,46 42,40 Z" />
    <path d="M36,58 C26,56 23,63 30,69 C37,75 39,64 36,58 Z" />
    <path d="M28,74 C19,73 17,80 24,85 C31,90 31,80 28,74 Z" />
  </svg>
);

interface SubMateriaCivilConfig {
  id: string;
  nome: string;
  numeros: number[];
  keywords: string[];
}

const SUB_MATERIAS_CIVIL: SubMateriaCivilConfig[] = [
  { 
    id: 'sec-parte-geral', 
    nome: 'Parte Geral & LINDB', 
    numeros: [1, 2, 3, 4, 5, 6, 32, 33],
    keywords: ['parte geral', 'lindb', 'pessoa', 'pessoas', 'bens', 'fato', 'negócio jurídico', 'prescrição', 'decadência']
  },
  { 
    id: 'sec-obrigacoes', 
    nome: 'Obrigações', 
    numeros: [7, 8, 9, 10],
    keywords: ['obrigação', 'obrigações', 'inadimplemento', 'pagamento', 'devedor', 'credor']
  },
  { 
    id: 'sec-contratos', 
    nome: 'Contratos', 
    numeros: [11, 12, 13, 30, 31, 40, 41],
    keywords: ['contrato', 'contratos', 'compra e venda', 'locação', 'doação', 'mútuo', 'fiança']
  },
  { 
    id: 'sec-responsabilidade-civil', 
    nome: 'Responsabilidade Civil', 
    numeros: [14],
    keywords: ['responsabilidade civil', 'dano moral', 'dano material', 'culpa', 'nexo', 'indenização']
  },
  { 
    id: 'sec-direitos-reais', 
    nome: 'Direitos Reais', 
    numeros: [15, 16, 17, 18, 19, 20, 22],
    keywords: ['reais', 'propriedade', 'posse', 'usucapião', 'imóveis', 'registro de imóveis', 'hipoteca', 'penhor']
  },
  { 
    id: 'sec-familia', 
    nome: 'Direito de Família', 
    numeros: [21, 23, 24, 25, 34, 37, 38, 39, 42, 43, 44],
    keywords: ['família', 'casamento', 'união estável', 'alimentos', 'filiação', 'guarda', 'divórcio', 'parentesco']
  },
  { 
    id: 'sec-sucessoes', 
    nome: 'Direito das Sucessões', 
    numeros: [26, 27, 35, 36],
    keywords: ['sucessão', 'sucessões', 'herança', 'testamento', 'inventário', 'herdeiro']
  },
  { 
    id: 'sec-consumidor-especial', 
    nome: 'Consumidor & Especial', 
    numeros: [28, 29],
    keywords: ['consumidor', 'cdc', 'especial', 'notarial', 'registral']
  },
];

function getNumeroTema(temaStr: string): number {
  if (!temaStr) return 0;
  const m = String(temaStr).match(/^(\d+)[\.\-\s_:]+/);
  return m ? parseInt(m[1], 10) : 0;
}

function itemMatchesSubMateria(sub: SubMateriaCivilConfig, it: any): boolean {
  const num = it.temaNum || getNumeroTema(it.rawTema || it.titulo);
  if (num > 0 && sub.numeros.includes(num)) return true;
  
  const text = (String(it.rawTema || '') + ' ' + String(it.titulo || '')).toLowerCase();
  if (sub.keywords.some((k) => text.includes(k))) return true;
  return false;
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


  const headerProgressBar = (
    <div className="w-full flex flex-col justify-center text-left py-0.5 pr-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] sm:text-xs font-serif font-black uppercase tracking-wider text-[#fef3c7] truncate flex items-center gap-1.5">
          <span 
            className="w-1.5 h-1.5 rounded-full shrink-0" 
            style={{ backgroundColor: '#fde047', boxShadow: '0 0 6px #fde047' }}
          />
          <span className="truncate">{officialFlashcardArea || area?.nome || effectiveAreaName || 'Direito Civil'}</span>
        </span>
        <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-[#fde047] tabular-nums shrink-0 ml-2">
          {totalCompreendidos} / {totalFlashcardsArea} ({progressoPctFlash}%)
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-black/60 border border-[#78350f]/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(progressoPctFlash, totalFlashcardsArea > 0 ? 3 : 0)}%`,
            background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fde047 100%)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.65)',
          }}
        />
      </div>
    </div>
  );

  const mobileHeader = (
    <PageHeader 
      title={headerProgressBar}
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
    const classifiedKeys = new Set<string>();

    const result = SUB_MATERIAS_CIVIL.map((sub) => {
      const matched = itemsToRender.filter((it) => {
        if (classifiedKeys.has(it.key)) return false;
        const matches = itemMatchesSubMateria(sub, it);
        if (matches) {
          classifiedKeys.add(it.key);
          return true;
        }
        return false;
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
    });

    // Se sobrou algum tema não classificado nos números ou keywords, anexa à primeira sub-matéria (Parte Geral)
    const unclassified = itemsToRender.filter((it) => !classifiedKeys.has(it.key));
    if (unclassified.length > 0) {
      const targetSec = result.find((s) => s.id === 'sec-parte-geral') || result[0];
      if (targetSec) {
        unclassified.forEach((it) => {
          const curr = globalCounter++;
          const numStr = String(curr + 1).padStart(2, '0');
          targetSec.items.push({
            ...it,
            globalIndex: curr,
            badgeLabel: `Deck ${numStr}`,
            ordemStr: numStr,
            isLocked: !isPremium && curr >= 2,
          });
        });
      }
    }

    // Retorna apenas sub-matérias com itens (ou todas se nenhuma tiver itens ainda)
    const withItems = result.filter((sub) => sub.items.length > 0);
    return withItems.length > 0 ? withItems : result;
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
      {/* Fundo da Acrópole e Montanha Grega Suavemente Ofuscado (Pouquinho Só) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#1c120c]">
        <img
          src={greciaAcropoleTrilha}
          alt="Acrópole Grega na Montanha"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top opacity-92 select-none pointer-events-none filter blur-[1.8px] brightness-[0.95] contrast-[1.06]"
        />
        {/* Vinheta leve nas extremidades preservando a imagem equilibrada e nítida */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-32 sm:pb-36 pt-2 min-w-0 overflow-x-hidden box-border">
        {/* ── Menu de Alternância (100% Limpo e Fiel à Referência da Grécia) ── */}
        <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 py-2 bg-[#1c120c]/85 backdrop-blur-md border-b border-[#78350f]/40 mb-3 shadow-lg shadow-black/70">
          <div
            ref={pillContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto px-4 sm:px-6 py-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    style={isActive ? {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706',
                      color: '#451a03',
                      boxShadow: '0 0 18px rgba(245, 158, 11, 0.65)',
                    } : {
                      backgroundColor: 'rgba(35, 20, 10, 0.75)',
                      borderColor: 'rgba(180, 83, 9, 0.45)',
                      color: '#fef3c7',
                    }}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-serif font-bold transition-all border cursor-pointer select-none flex items-center gap-1.5",
                      isActive
                        ? "scale-[1.04] font-black"
                        : "hover:bg-[#451a03]/80 hover:text-white hover:border-[#f59e0b]/60"
                    )}
                  >
                    <Landmark className={cn("w-3 h-3 shrink-0", isActive ? "text-[#451a03]" : "text-[#f59e0b]")} />
                    <span>{sub.nome}</span>
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
                    style={isSelected ? {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706',
                      color: '#451a03',
                      boxShadow: '0 0 18px rgba(245, 158, 11, 0.65)',
                    } : {
                      backgroundColor: 'rgba(35, 20, 10, 0.75)',
                      borderColor: 'rgba(180, 83, 9, 0.45)',
                      color: '#fef3c7',
                    }}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-serif font-bold transition-all border cursor-pointer select-none flex items-center gap-1.5",
                      isSelected
                        ? "scale-[1.04] font-black"
                        : "hover:bg-[#451a03]/80 hover:text-white hover:border-[#f59e0b]/60"
                    )}
                  >
                    <Landmark className={cn("w-3 h-3 shrink-0", isSelected ? "text-[#451a03]" : "text-[#f59e0b]")} />
                    <span>{a.area}</span>
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
            {/* ── BARRA DE PROGRESSO DA MATÉRIA (Estilo Helênico Dourado) ── */}
            {isFlash && isCivilArea && activeSection && (
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(35, 22, 13, 0.92) 0%, rgba(55, 34, 18, 0.92) 100%)',
                  borderColor: 'rgba(217, 119, 6, 0.45)',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.6)',
                }}
                className="w-full mb-4 p-3 sm:p-3.5 rounded-2xl border backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#fef3c7] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#fde047]" />
                    Progresso da Matéria
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#fde047] tabular-nums">
                    {activeSectionCompreendidos} / {activeSectionTotalCards} ({activeSectionPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/60 border border-[#78350f]/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(activeSectionPct, activeSectionTotalCards > 0 ? 3 : 0)}%`,
                      background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fde047 100%)',
                      boxShadow: '0 0 10px rgba(245, 158, 11, 0.7)',
                    }}
                  />
                </div>
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
                      {/* ── CUME DA TRILHA: O TEMPLO DA ACRÓPOLE (Destino da Maestria) ── */}
                      <div className="w-full flex flex-col items-center justify-center pt-2 pb-4">
                        <div className="relative flex flex-col items-center">
                          {/* Halo solar suave atrás do Parthenon */}
                          <div 
                            className="absolute -top-4 w-40 h-28 rounded-full pointer-events-none"
                            style={{
                              background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.35) 0%, rgba(217, 119, 6, 0.1) 60%, transparent 100%)',
                              filter: 'blur(16px)',
                            }}
                          />

                          {/* Ícone Monumental do Parthenon / Acrópole */}
                          <div 
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center shadow-2xl mb-2"
                            style={{
                              background: 'linear-gradient(135deg, rgba(41, 28, 18, 0.95) 0%, rgba(20, 14, 10, 0.95) 100%)',
                              borderColor: 'rgba(217, 119, 6, 0.6)',
                              boxShadow: '0 0 24px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(254, 240, 138, 0.2)',
                            }}
                          >
                            <Landmark className="w-9 h-9 sm:w-11 sm:h-11 text-[#fde047] drop-shadow-[0_2px_8px_rgba(234,179,8,0.7)]" />
                          </div>

                          {/* Placa em Mármore Helênico */}
                          <div 
                            className="px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md"
                            style={{
                              background: 'linear-gradient(135deg, rgba(28, 20, 13, 0.9) 0%, rgba(41, 28, 18, 0.9) 100%)',
                              borderColor: 'rgba(245, 158, 11, 0.5)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fde047] shadow-[0_0_6px_#fde047]" />
                            <span className="text-[11px] sm:text-xs font-serif font-black tracking-widest uppercase text-[#fef3c7]">
                              {activeSection.nome}
                            </span>
                          </div>

                          {/* Início da Estrada Dourada saindo do templo */}
                          <div 
                            className="w-1.5 h-6 my-1.5 rounded-full"
                            style={{
                              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
                              boxShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
                            }}
                          />
                        </div>
                      </div>

                      {/* Decks da Trilha desta Matéria */}
                      {activeSection.items.map((item, itemIdx) => {
                        const isLastInSection = itemIdx === activeSection.items.length - 1;
                        // Deck ativo é o primeiro deck (ou o primeiro com progresso em andamento)
                        const isActive = itemIdx === 0;
                        return (
                          <FlashcardDeckItem
                            key={item.key}
                            item={item}
                            i={itemIdx}
                            palette={palette}
                            isLast={isLastInSection}
                            isActive={isActive}
                          />
                        );
                      })}

                      {/* Louros da Vitória Clássicos no Rodapé da Matéria */}
                      <div className="w-full flex items-center justify-between px-6 pt-6 pb-2 text-[#d97706]/40">
                        <svg className="w-9 h-9 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                          <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                          <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                        </svg>
                        <span className="text-[10px] font-serif font-semibold tracking-widest uppercase text-[#d97706]/65">
                          Trilha da Sabedoria • {activeSection.nome}
                        </span>
                        <svg className="w-9 h-9 rotate-12 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                          <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                          <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                        </svg>
                      </div>

                      {/* Pórtico Triunfal Clássico para Avançar para a Próxima Matéria */}
                      {nextSection && (
                        <div
                          onClick={() => {
                            selectSubMateria(nextSection.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full my-8 pt-2 flex flex-col items-center justify-center cursor-pointer group select-none"
                        >
                          <div className="w-full max-w-[560px] flex items-center gap-3 px-3">
                            <div 
                              className="h-[2px] flex-1"
                              style={{ background: 'linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.8), #fde047)' }}
                            />
                            <div 
                              style={{
                                background: 'linear-gradient(135deg, rgba(41, 28, 18, 0.95) 0%, rgba(20, 14, 10, 0.95) 100%)',
                                borderColor: 'rgba(245, 158, 11, 0.65)',
                                boxShadow: '0 0 28px rgba(245, 158, 11, 0.35)',
                              }}
                              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border backdrop-blur-md group-hover:scale-105 group-hover:border-[#fde047] transition-all duration-300"
                            >
                              <Landmark className="w-4 h-4 text-[#fde047] shrink-0 animate-pulse drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                              <span className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-[#fef3c7] flex items-center gap-1.5">
                                Próxima Matéria: <span className="text-[#fde047] underline decoration-[#fde047]/60 underline-offset-4">{nextSection.nome}</span>
                              </span>
                              <ArrowRight className="w-4 h-4 text-[#fde047] group-hover:translate-x-1.5 transition-transform" />
                            </div>
                            <div 
                              className="h-[2px] flex-1"
                              style={{ background: 'linear-gradient(90deg, #fde047, rgba(217, 119, 6, 0.8), transparent)' }}
                            />
                          </div>
                          <span className="text-[10.5px] font-medium text-[#f59e0b] mt-2 flex items-center gap-1">
                            <ScrollText className="w-3 h-3 text-[#fde047]" />
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

      {/* ── Rodapé Helênico: Templo com Louros 100% sem margens laterais e altura compacta ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none flex flex-col justify-end items-center select-none overflow-hidden h-20 sm:h-26">
        {/* Gradiente de opacidade para a trilha surgir suavemente por trás */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120b07] via-[#120b07]/60 to-transparent pointer-events-none" />
        
        {/* Fachada do Templo com Louros: Edge-to-Edge sem margens laterais */}
        <div className="relative w-full h-15 sm:h-20 flex items-end">
          <img
            src={greciaTrilhaRodape}
            alt="Templo Clássico e Louros Helênicos"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-bottom opacity-95 drop-shadow-[0_-4px_16px_rgba(0,0,0,0.9)]"
            style={{
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>
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
