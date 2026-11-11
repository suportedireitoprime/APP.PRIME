// @ts-nocheck
import { FlashcardDeckItem } from '@/components/flashcards/FlashcardDeckItem';
import { ModalTemasMateriaFullscreen } from '@/components/flashcards/ModalTemasMateriaFullscreen';
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
import { toast } from 'sonner';
import { BookOpenText, GraduationCap, ListChecks, Layers, ArrowRight, Search, Landmark, Scale, ScrollText, Heart } from 'lucide-react';
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
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import direitoAdministrativoFundo from '@/assets/direito-administrativo-fundo.webp';
import greciaTrilhaRodape from '@/assets/grecia-trilha-rodape.jpg';
import { FallingLotusPetals } from '@/components/flashcards/FallingLotusPetals';
import { ModalOrdemCronologica } from '@/components/flashcards/ModalOrdemCronologica';
import { getDisciplinaVisualTheme, DisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { formatarNomeArea } from '@/pages/Flashcards';
import { 
  MATERIAS_CATALOGO_COMPLETO, 
  AULAS_CATALOGO_COMPLETO,
  MateriaItem,
  AulaItem
} from '@/data/aulasInterativasCatalogoCompleto';

function getDisciplinaIdFromSlug(s?: string): string {
  if (!s) return 'administrativo';
  const clean = s.toLowerCase().trim();
  if (clean === 'direito-do-trabalho') return 'trabalho';
  if (clean === 'direito-processual-do-trabalho') return 'processual-trabalho';
  if (clean === 'filosofia-do-direito' || clean === 'teoria-e-filosofia-do-direito') return 'filosofia';
  return clean.replace(/^direito-/, '');
}

export function formatarTituloMateriaCurto(titulo: string): string {
  if (!titulo) return '';
  return titulo
    .replace(/^\d+[\.\-\s_:]+/, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\s+([a-zA-ZÀ-ÿ]+)/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Administrativo\b/gi, '')
    .replace(/^Direito\s+[a-zA-ZÀ-ÿ]+\s*[-–:]\s*/i, '')
    .replace(/\s+Direito\s+Administrativo\b/gi, '')
    .trim();
}

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

function getNumeroTema(temaStr: string): number {
  if (!temaStr) return 0;
  const m = String(temaStr).match(/^(\d+)[\.\-\s_:]+/);
  return m ? parseInt(m[1], 10) : 0;
}

function itemMatchesSubMateria(sub: SubMateriaConfig, it: any): boolean {
  const num = it.temaNum || getNumeroTema(it.rawTema || it.titulo);
  if (num > 0 && sub.numeros && sub.numeros.includes(num)) return true;
  
  const text = (String(it.rawTema || '') + ' ' + String(it.titulo || '')).toLowerCase();
  if (sub.keywords && sub.keywords.some((k) => text.includes(k.toLowerCase()))) return true;
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


  // 1. Identifica a disciplina oficial correspondente ao slug da rota (ex: 'administrativo', 'penal', 'civil')
  const disciplinaId = useMemo(() => getDisciplinaIdFromSlug(slug), [slug]);

  // Tema visual oficial da disciplina (cores idênticas às Aulas Interativas)
  const theme = useMemo(() => {
    return getDisciplinaVisualTheme(slug || disciplinaId || area?.slug || area?.nome || officialFlashcardArea || effectiveAreaName);
  }, [slug, disciplinaId, area?.slug, area?.nome, officialFlashcardArea, effectiveAreaName]);

  // Ícone oficial da área idêntico ao exibido nas listas (ex: Martelo para Penal, Templo para Administrativo)
  const AreaIconComponent = useMemo(() => {
    const rawTarget = slug || disciplinaId || area?.slug || area?.nome || officialFlashcardArea || effectiveAreaName;
    return areaIconFor(rawTarget).Icon;
  }, [slug, disciplinaId, area?.slug, area?.nome, officialFlashcardArea, effectiveAreaName]);

  // Capa oficial ilustrada da matéria
  const coverInfo = area ? (getAreaCover(area.nome) || getAreaCover(area.slug)) : (slug ? getAreaCover(slug) : null);
  const coverUrl = coverInfo?.cover || "/images/gamificacao/deusa_temis_vazada.webp";

  // Imagem de fundo oficial personalizada
  const fundoAreaOficial = theme.isCustomFundo 
    ? theme.fundoAssetUrl 
    : (coverUrl || greciaFilosofosFundo);

  const headerProgressBar = (
    <div className="w-full flex flex-col justify-center text-left py-0.5 pr-1">
      <div className="flex items-center justify-between mb-1">
        <span 
          className="text-[11px] sm:text-xs font-serif font-black uppercase tracking-wider truncate flex items-center gap-1.5"
          style={{ color: theme.highlight }}
        >
          <span 
            className="w-1.5 h-1.5 rounded-full shrink-0" 
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
          />
          <span className="truncate">{formatarNomeArea(officialFlashcardArea || area?.nome || effectiveAreaName || 'Civil')}</span>
        </span>
        <span 
          className="text-[10px] sm:text-[10.5px] font-mono font-bold tabular-nums shrink-0 ml-2"
          style={{ color: theme.accent }}
        >
          {totalCompreendidos} / {totalFlashcardsArea} ({progressoPctFlash}%)
        </span>
      </div>
      <div 
        className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden"
        style={{ border: `1px solid ${theme.borderSubtle}` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(progressoPctFlash, totalFlashcardsArea > 0 ? 3 : 0)}%`,
            background: theme.progressGradient,
            boxShadow: theme.progressShadow,
          }}
        />
      </div>
    </div>
  );

  const targetAreaKey = slug || area?.slug || officialFlashcardArea || '';
  const [isFavoritedArea, setIsFavoritedArea] = useState(() => {
    try {
      const raw = localStorage.getItem('flashcards_favoritos_areas');
      const list: string[] = raw ? JSON.parse(raw) : [];
      return list.includes(targetAreaKey) || list.includes(officialFlashcardArea || '');
    } catch {
      return false;
    }
  });

  const handleToggleFavoritoArea = () => {
    try { haptic.selection(); } catch {}
    setIsFavoritedArea((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('flashcards_favoritos_areas');
        let list: string[] = raw ? JSON.parse(raw) : [];
        const key = targetAreaKey;
        if (next) {
          if (!list.includes(key)) list.push(key);
          toast.success("Matéria adicionada aos Favoritos!");
        } else {
          list = list.filter((k) => k !== key && k !== officialFlashcardArea && k !== area?.slug);
          toast.info("Matéria removida dos Favoritos.");
        }
        localStorage.setItem('flashcards_favoritos_areas', JSON.stringify(list));
      } catch {}
      return next;
    });
  };

  const mobileHeader = (
    <PageHeader 
      title={headerProgressBar}
      onBack={goBack} 
      variant="dark"
      rightAction={
        <button
          type="button"
          onClick={handleToggleFavoritoArea}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/50 border border-[#78350f]/60 text-[#fef3c7] hover:text-rose-400 active:scale-110 transition-all cursor-pointer shadow-md"
          title={isFavoritedArea ? "Remover dos favoritos" : "Favoritar matéria"}
          aria-label={isFavoritedArea ? "Remover dos favoritos" : "Favoritar matéria"}
        >
          <Heart 
            className={cn(
              "w-4.5 h-4.5 transition-transform", 
              isFavoritedArea ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" : "text-[#fef3c7]/75"
            )} 
          />
        </button>
      }
    />
  );

  const todasAsAreas = useMemo(() => {
    if (flashcardsAreasResumo && flashcardsAreasResumo.length > 0) {
      return flashcardsAreasResumo;
    }
    return FALLBACK_FLASHCARDS_AREAS;
  }, [flashcardsAreasResumo]);

  const pillContainerRef = useRef<HTMLDivElement>(null);

  // 2. Obtém a lista oficial de matérias da disciplina diretamente de MATERIAS_CATALOGO_COMPLETO
  const materiasDaDisciplina = useMemo(() => {
    const list = MATERIAS_CATALOGO_COMPLETO.filter((m) => m.disciplinaId === disciplinaId);
    if (list.length > 0) return list;
    return MATERIAS_CATALOGO_COMPLETO.filter(
      (m) => m.disciplinaId.includes(disciplinaId) || disciplinaId.includes(m.disciplinaId)
    );
  }, [disciplinaId]);

  // 3. Matéria selecionada/visível no menu horizontal superior de alternância
  const [materiaAtivaId, setMateriaAtivaId] = useState<string>('');

  useEffect(() => {
    if (materiasDaDisciplina.length > 0) {
      const exists = materiasDaDisciplina.some((m) => m.id === materiaAtivaId);
      if (!exists) {
        setMateriaAtivaId(materiasDaDisciplina[0].id);
      }
    }
  }, [materiasDaDisciplina, materiaAtivaId]);

  // 4. Mapeamento de todas as matérias com seus temas e contagens de flashcards
  const materiasComTemas = useMemo(() => {
    return materiasDaDisciplina.map((mat, matIdx) => {
      const aulas = AULAS_CATALOGO_COMPLETO.filter((a) => a.materiaId === mat.id)
        .sort((a, b) => a.numeroAula - b.numeroAula);

      const numMat = parseInt(String(mat.numeroMateria).split('.')[0], 10) || (matIdx + 1);
      const matchBanco =
        (temasFlashcards || []).find((tf) => {
          const numTf = parseInt(String(tf.tema).split('.')[0], 10);
          return numTf > 0 && numTf === numMat;
        }) ||
        (temasFlashcards || []).find((tf) => {
          const tNorm = tf.tema.toLowerCase();
          const mNorm = mat.titulo.toLowerCase();
          return tNorm.includes(mNorm) || mNorm.includes(tNorm);
        });

      const totalCardsMat = matchBanco?.total || 144;
      const cardsPorTema = Math.max(12, Math.floor(totalCardsMat / Math.max(aulas.length, 1)));

      const items = aulas.map((aula, aIdx) => {
        const numStr = String(aIdx + 1).padStart(2, '0');
        const isLocked = !isPremium && matIdx > 0 && aIdx >= 2;

        return {
          key: aula.id,
          materiaId: mat.id,
          titulo: aula.titulo,
          ordemStr: numStr,
          badgeLabel: `Tema ${numStr}`,
          displayTotal: cardsPorTema,
          displayConcluidas: 0,
          displayPct: 0,
          capaUrl: aula.capaUrl,
          isLocked,
          onClick: () => {
            if (isLocked) {
              haptic.impact('medium');
              setPremiumGateOpen(true);
              return;
            }
            try { haptic.light(); } catch {}
            const temaQuery = matchBanco?.tema || aula.titulo;
            navigate(
              `/flashcards/estudar?area=${encodeURIComponent(
                officialFlashcardArea || area?.nome || effectiveAreaName
              )}&temas=${encodeURIComponent(temaQuery)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`,
              {
                state: { from: `/flashcards/area/${slug}`, capaUrl: aula.capaUrl, temaTitulo: aula.titulo },
              }
            );
          },
        };
      });

      const compreendidosMat = matchBanco?.compreendidos || 0;
      const pctMat = totalCardsMat > 0 ? Math.min(100, Math.round((compreendidosMat / totalCardsMat) * 100)) : 0;

      return {
        ...mat,
        matIndex: matIdx,
        items,
        totalCards: totalCardsMat,
        compreendidos: compreendidosMat,
        pct: pctMat,
        capaInicial: items[0]?.capaUrl || mat.capaUrl || greciaFilosofosFundo,
      };
    });
  }, [
    materiasDaDisciplina,
    temasFlashcards,
    isPremium,
    officialFlashcardArea,
    area?.nome,
    effectiveAreaName,
    palette,
    navigate,
    slug,
  ]);

  // 5. Imagem de fundo ativa (muda e sobrepõe de forma fluida conforme a pessoa rola a trilha)
  const [fundoAtivoUrl, setFundoAtivoUrl] = useState<string>(() => {
    return materiasComTemas[0]?.capaInicial || greciaFilosofosFundo;
  });

  const fundoAtivoUrlRef = useRef(fundoAtivoUrl);
  fundoAtivoUrlRef.current = fundoAtivoUrl;

  const materiaAtivaIdRef = useRef(materiaAtivaId);
  materiaAtivaIdRef.current = materiaAtivaId;

  useEffect(() => {
    if (materiasComTemas.length > 0 && (!fundoAtivoUrl || fundoAtivoUrl === greciaFilosofosFundo)) {
      setFundoAtivoUrl(materiasComTemas[0].capaInicial);
    }
  }, [materiasComTemas]);

  // Modal Fullscreen dos Temas da Matéria Selecionada
  const [materiaModal, setMateriaModal] = useState<typeof materiasComTemas[0] | null>(null);
  const [isModalTemasOpen, setIsModalTemasOpen] = useState(false);

  // Bottom Sheet Pedagógico: Ordem Cronológica de Estudos
  const [lockedMateriaTarget, setLockedMateriaTarget] = useState<typeof materiasComTemas[0] | null>(null);
  const [isOrdemCronologicaOpen, setIsOrdemCronologicaOpen] = useState(false);

  const openMateriaTemas = useCallback((mat: typeof materiasComTemas[0]) => {
    try { haptic.selection(); } catch {}
    setMateriaModal(mat);
    setIsModalTemasOpen(true);
  }, []);

  const handleSelectTemaNoModal = useCallback(
    (tema: any) => {
      if (tema.isLocked) {
        try { haptic.impact('medium'); } catch {}
        setPremiumGateOpen(true);
        return;
      }
      try { haptic.light(); } catch {}
      setIsModalTemasOpen(false);
      navigate(
        `/flashcards/estudar?area=${encodeURIComponent(
          officialFlashcardArea || area?.nome || effectiveAreaName
        )}&temas=${encodeURIComponent(tema.titulo)}&limite=todos&cor=${encodeURIComponent(palette.primary)}`,
        {
          state: { from: `/flashcards/area/${slug}`, capaUrl: tema.capaUrl, temaTitulo: tema.titulo },
        }
      );
    },
    [navigate, officialFlashcardArea, area?.nome, effectiveAreaName, palette.primary, slug]
  );

  const selectMateria = useCallback((matId: string) => {
    setMateriaAtivaId(matId);
    try { haptic.selection(); } catch {}

    const foundMat = materiasComTemas.find((m) => m.id === matId);
    if (foundMat) {
      openMateriaTemas(foundMat);
    }
  }, [materiasComTemas, openMateriaTemas]);

  // Centraliza a pílula da matéria ativa no carrossel horizontal SEM afetar o scroll da página (window)
  useEffect(() => {
    if (!materiaAtivaId || !pillContainerRef.current) return;
    const container = pillContainerRef.current;
    const btn = container.querySelector(`[data-materia-id="${materiaAtivaId}"]`) as HTMLElement;
    if (btn) {
      const scrollPos = btn.offsetLeft - (container.clientWidth / 2) + (btn.clientWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  }, [materiaAtivaId]);

  const totalDecksCount = useMemo(() => {
    return materiasComTemas.reduce((acc, m) => acc + m.items.length, 0);
  }, [materiasComTemas]);

  const totalMateriasCount = materiasComTemas.length;
  const totalTemasCount = useMemo(() => {
    return materiasComTemas.reduce((acc, m) => acc + m.items.length, 0);
  }, [materiasComTemas]);
  const totalCardsCountGeral = totalFlashcardsArea > 0 ? totalFlashcardsArea : materiasComTemas.reduce((acc, m) => acc + (m.totalCards || 0), 0);

  const materiaAtiva = useMemo(() => {
    return materiasComTemas.find((m) => m.id === materiaAtivaId) || materiasComTemas[0];
  }, [materiasComTemas, materiaAtivaId]);

  const activeSectionTotalCards = materiaAtiva?.totalCards || 144;
  const activeSectionCompreendidos = 0;
  const activeSectionPct = 0;

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle="Trilha de Flashcards"
      mobileHeader={mobileHeader}
    >
      {/* Fundo Oficial Fixo da Área (Sem troca contínua no scroll) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0705]">
        <img
          src={fundoAreaOficial}
          alt={officialFlashcardArea || area?.nome || effectiveAreaName || "Capa da Disciplina"}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={cn(
            "w-full h-full object-cover object-top select-none pointer-events-none transition-opacity duration-500",
            theme.isCustomFundo 
              ? "opacity-95 brightness-[0.98] contrast-[1.05]" 
              : "opacity-85 filter blur-[1.2px] brightness-[0.88] contrast-[1.08]"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Pétalas e Flores de Lótus Douradas Caindo Suavemente pela Montanha (120fps GPU) */}
      <FallingLotusPetals />

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-2 min-w-0 overflow-x-hidden box-border">
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
            {isFlash && loadingFlashcards && totalDecksCount === 0 ? (
              <div className="space-y-4 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              /* Trilha Serpenteante Oficial de Matérias */
              <div className="relative py-2 sm:py-4 w-full min-w-0 max-w-full overflow-hidden">
                <div className="w-full min-w-0 relative z-[2] flex flex-col items-center">
                  {/* ── CUME DA TRILHA: O TEMPLO DA ACRÓPOLE ── */}
                  <div className="w-full flex flex-col items-center justify-center pt-2 pb-4">
                    <div className="relative flex flex-col items-center">
                      {/* Halo solar suave atrás do Parthenon */}
                      <div 
                        className="absolute -top-4 w-40 h-28 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at center, ${theme.glow} 0%, ${theme.glowSoft} 60%, transparent 100%)`,
                          filter: 'blur(16px)',
                        }}
                      />

                      {/* Ícone Monumental Oficial da Disciplina (Idêntico ao das Listas) */}
                      <div 
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center shadow-2xl mb-2"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.border,
                          boxShadow: `0 0 24px ${theme.glowSoft}, inset 0 2px 4px rgba(255, 255, 255, 0.15)`,
                        }}
                      >
                        <AreaIconComponent 
                          className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md" 
                          style={{ color: theme.accent, filter: `drop-shadow(0 2px 8px ${theme.glow})` }}
                        />
                      </div>

                      {/* Placa com o Nome da Disciplina */}
                      <div 
                        className="px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.border,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
                        />
                        <span 
                          className="text-[11px] sm:text-xs font-serif font-black tracking-widest uppercase"
                          style={{ color: theme.highlight }}
                        >
                          {formatarNomeArea(officialFlashcardArea || area?.nome || effectiveAreaName || 'Direito')}
                        </span>
                      </div>

                      {/* Descrição Elegante com Setas: Matérias → Temas → Cards */}
                      <div 
                        className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-serif font-semibold mt-2 px-3 py-1 rounded-full border backdrop-blur-md"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.borderSubtle,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                          color: theme.highlight,
                        }}
                      >
                        <span>{totalMateriasCount} matérias</span>
                        <span className="font-bold" style={{ color: theme.accent }}>→</span>
                        <span>{totalTemasCount} temas</span>
                        <span className="font-bold" style={{ color: theme.accent }}>→</span>
                        <span className="font-mono font-bold" style={{ color: theme.accent }}>{totalCardsCountGeral} cards</span>
                      </div>

                      {/* Início da Estrada saindo do templo */}
                      <div 
                        className="w-1.5 h-6 my-2 rounded-full"
                        style={{
                          background: theme.roadGradient,
                          boxShadow: theme.roadShadow,
                        }}
                      />
                    </div>
                  </div>

                  {/* Nós Serpenteantes: Cada Nó é uma Matéria Oficial */}
                  {materiasComTemas.map((mat, matIdx) => {
                    const isLast = matIdx === materiasComTemas.length - 1;
                    // Apenas a matéria atual que a pessoa está estudando fica destacada (mais clara), sem mudar com o scroll
                    const isActive = matIdx === 0;
                    const isLocked = matIdx > 0;
                    // Título conciso sem redundâncias ("do Direito Administrativo" etc)
                    const tituloCurto = formatarTituloMateriaCurto(mat.titulo);

                    const totalCardsMat = mat.totalCards || (mat.items.length * 36);
                    const concluidasMat = mat.compreendidos || 0;
                    const pctMat = mat.pct !== undefined ? mat.pct : (totalCardsMat > 0 ? Math.min(100, Math.round((concluidasMat / totalCardsMat) * 100)) : 0);

                    const itemData = {
                      key: mat.id,
                      titulo: tituloCurto,
                      badgeLabel: `Matéria ${String(matIdx + 1).padStart(2, '0')}`,
                      ordemStr: String(matIdx + 1).padStart(2, '0'),
                      displayTotal: totalCardsMat,
                      temasCount: mat.items.length,
                      displayConcluidas: concluidasMat,
                      displayPct: pctMat,
                      isLocked,
                      onClick: () => {
                        if (isLocked) {
                          try { haptic.impact('medium'); } catch {}
                          setLockedMateriaTarget(mat);
                          setIsOrdemCronologicaOpen(true);
                        } else {
                          openMateriaTemas(mat);
                        }
                      },
                    };

                    return (
                      <div
                        key={mat.id}
                        id={`materia-section-${mat.id}`}
                        data-track-theme="true"
                        data-bg-url={mat.capaInicial}
                        data-materia-id={mat.id}
                        className="w-full flex flex-col items-center"
                      >
                        <FlashcardDeckItem
                          item={itemData}
                          i={matIdx}
                          palette={palette}
                          isLast={isLast}
                          isActive={isActive}
                          theme={theme}
                        />
                      </div>
                    );
                  })}

                  {/* Louros da Vitória Clássicos no Rodapé da Trilha */}
                  <div className="w-full flex items-center justify-between px-6 pt-8 pb-4" style={{ color: theme.borderSubtle }}>
                    <svg className="w-9 h-9 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                      <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                      <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                    </svg>
                    <span 
                      className="text-[10px] font-serif font-semibold tracking-widest uppercase"
                      style={{ color: theme.accent, opacity: 0.75 }}
                    >
                      Trilha da Sabedoria • {formatarNomeArea(officialFlashcardArea || area?.nome || effectiveAreaName || 'Direito')}
                    </span>
                    <svg className="w-9 h-9 rotate-12 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                      <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                      <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Rodapé Helênico: exibido apenas para disciplinas que usam o templo padrão de fundo ── */}
      {!theme.isCustomFundo && (
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
      )}

      <PremiumGate
        open={premiumGateOpen}
        onClose={() => setPremiumGateOpen(false)}
        feature="flashcards"
        usageLabel="Os 2 primeiros decks deste tema são gratuitos. Assine o Prime para estudar todos os decks!"
      />

      {/* Modal Tela Cheia 100% Fiel ao Design (Capa no Topo + Lista de Temas Encadeada com Louros) */}
      <ModalTemasMateriaFullscreen
        isOpen={isModalTemasOpen}
        onClose={() => setIsModalTemasOpen(false)}
        materia={materiaModal ? {
          id: materiaModal.id,
          titulo: materiaModal.titulo,
          subtitulo: materiaModal.subtitulo,
          capaUrl: materiaModal.capaInicial || materiaModal.capaUrl,
          totalCards: materiaModal.totalCards,
        } : null}
        todasMaterias={materiasComTemas.map((m) => ({
          id: m.id,
          titulo: m.titulo,
          subtitulo: m.subtitulo,
          capaUrl: m.capaInicial || m.capaUrl,
          totalCards: m.totalCards,
          items: m.items,
        }))}
        onSelectMateria={(selected) => {
          const found = materiasComTemas.find((m) => m.id === selected.id);
          if (found) {
            setMateriaModal(found);
            setMateriaAtivaId(found.id);
          }
        }}
        temas={materiaModal ? materiaModal.items : []}
        onSelectTema={handleSelectTemaNoModal}
        areaNome={officialFlashcardArea || area?.nome || effectiveAreaName || 'Direito'}
        theme={theme}
      />

      {/* Bottom Sheet Pedagógico: Ordem Cronológica de Estudos */}
      <ModalOrdemCronologica
        isOpen={isOrdemCronologicaOpen}
        onClose={() => setIsOrdemCronologicaOpen(false)}
        temaBloqueadoTitulo={lockedMateriaTarget?.titulo ? formatarTituloMateriaCurto(lockedMateriaTarget.titulo) : 'Matéria Selecionada'}
        temaAnteriorTitulo={materiasComTemas[0]?.titulo ? formatarTituloMateriaCurto(materiasComTemas[0].titulo) : 'Origens e Definições'}
        theme={theme}
        onConcluirAnterior={() => {
          setIsOrdemCronologicaOpen(false);
          if (materiasComTemas[0]) {
            openMateriaTemas(materiasComTemas[0]);
          }
        }}
        onContinuarAssimMesmo={() => {
          setIsOrdemCronologicaOpen(false);
          if (lockedMateriaTarget) {
            openMateriaTemas(lockedMateriaTarget);
          }
        }}
      />
    </DesktopPageLayout>
  );
};

export default FlashcardsArea;
