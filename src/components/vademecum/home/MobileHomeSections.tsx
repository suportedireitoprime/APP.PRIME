import { useState, useEffect, useCallback, useMemo, memo, Suspense, startTransition } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug } from '@/lib/legislacaoSlugs';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { TIPO_SLUG } from '@/lib/visuaisJuridicos/rotas';

import {
  Cat,
  AreaCat,
  CategoriaFormal,
  Tab,
  TABS_HOME,
  TABS_VADEMECUM,
  RADAR_CATS,
  ALL_CATS,
  FAST_PILLS_ITEMS,
  shuffle,
  normalizeSearch,
} from './sections/homeSectionsData';

import HomeSegmentedTabs from './sections/HomeSegmentedTabs';
import HomeTabCategorias from './sections/HomeTabCategorias';
import HomeTabEmAlta from './sections/HomeTabEmAlta';
import HomeTabAreas from './sections/HomeTabAreas';
import HomeTabEstudos from './sections/HomeTabEstudos';
import HomeCategorySheet from './sections/HomeCategorySheet';
import HomeAreasModal from './sections/HomeAreasModal';
import CircularGallery from '@/components/ui/CircularGallery';

const HomeNoticiasCarousel = lazyWithRetry(() => import('@/components/vademecum/home/HomeNoticiasCarousel'));
const VoiceCaptureOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/VoiceCaptureOverlay'));
const AgendaMobileTab = lazyWithRetry(() => import('@/components/vademecum/tabs/AgendaMobileTab'));
const GraficosMobileTab = lazyWithRetry(() => import('@/components/vademecum/tabs/GraficosMobileTab'));
const JurisprudenciaSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/JurisprudenciaSheet'));
const VisuaisJuridicosSheet = lazyWithRetry(() => import('@/components/visuais/VisuaisJuridicosSheet'));
const DocumentosSheet = lazyWithRetry(() => import('@/components/documentos/DocumentosSheet'));

interface Props {
  onTabChange?: (tab: Tab) => void;
  onNewsOpenChange?: (open: boolean) => void;
  /** Oculta a seção "Aprenda sobre as Leis" (blog jurídico). */
  hideBlog?: boolean;
  /** Oculta o carrossel de notícias/blogger do topo. */
  hideNoticias?: boolean;
  /** Controla o avanço automático do carrossel de notícias. */
  noticiasAutoplay?: boolean;
  /** Na aba "Em Alta", mostra categorias de leis em vez das funções de estudo. */
  emAltaLeis?: boolean;
  /** Oculta o menu de abas do topo */
  hideTabs?: boolean;
  /** Força a aba ativa */
  activeTab?: Tab;
  /** Passado para renderizar o buscador */
  onBuscar?: () => void;
}

const MobileHomeSections = ({
  onTabChange,
  onNewsOpenChange,
  hideBlog = false,
  hideNoticias = false,
  noticiasAutoplay = true,
  emAltaLeis = false,
  hideTabs = false,
  activeTab,
}: Props = {}) => {
  const navigate = useNavigate();
  const [juriOpen, setJuriOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState<Cat | AreaCat | CategoriaFormal | null>(null);
  const [visuaisOpen, setVisuaisOpen] = useState(false);
  const [docPasta, setDocPasta] = useState<{ id: string; nome: string } | null>(null);
  const [areasOpen, setAreasOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const activeTabs = useMemo(() => (emAltaLeis ? TABS_VADEMECUM : TABS_HOME), [emAltaLeis]);
  const [tab, setTab] = useState<Tab>(() => (emAltaLeis ? 'emalta' : 'estudos'));
  const currentTab = activeTab || tab;

  const handleVoiceSearch = useCallback((text: string) => {
    setCategorySearch(text);
  }, []);
  const voiceSearch = useVoiceInput(handleVoiceSearch);

  const pillsItems = useMemo(() => {
    return shuffle(FAST_PILLS_ITEMS).map((item) => ({
      ...item,
      progress: Math.random() * 0.7 + 0.1,
      showPlayButton: true,
    }));
  }, []);

  useEffect(() => {
    onTabChange?.(tab);
  }, [tab, onTabChange]);

  // Pré-aquecimento dos visuais jurídicos e imagens em idle
  useEffect(() => {
    const aquecer = () => {
      import('@/components/visuais/VisuaisJuridicosSheet');
      import('@/lib/visuaisJuridicos/cache').then((m) => m.prefetchVisuais());
    };
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(aquecer, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(aquecer, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    import('@/lib/cdnImg').then(({ prefetchImages }) => {
      prefetchImages(FAST_PILLS_ITEMS.map((item) => item.image));
    });
  }, []);

  const handle = useCallback(
    (id: string) => {
      const radarCat = RADAR_CATS.find((c) => c.id === id);
      if (radarCat) {
        navigate(`/normas/${radarCat.normaSlug}`);
        return;
      }
      if (id === 'jurisprudencia') {
        navigate('/jurisprudencia');
        return;
      }
      const cat = ALL_CATS.find((c) => c.id === id);
      if (cat) {
        const leisDaCategoria = LEIS_CATALOG.filter((l) => l.tipo === id);
        if (leisDaCategoria.length > 1) {
          setCategorySearch('');
          setCategoryOpen(cat);
          return;
        }
        if (leisDaCategoria.length === 1) {
          navigate(leiPath(leisDaCategoria[0]));
          return;
        }
        navigate(`/legislacao/${tipoToSlug(id)}`);
        return;
      }
      navigate(`/legislacao/${tipoToSlug(id)}`);
    },
    [navigate]
  );

  const categoryItems = useMemo(() => {
    if (!categoryOpen) return [] as typeof LEIS_CATALOG;
    if ('leiIds' in categoryOpen) {
      const ids = new Set((categoryOpen as AreaCat).leiIds);
      return LEIS_CATALOG.filter((l) => ids.has(l.id));
    }
    return LEIS_CATALOG.filter((l) => l.tipo === categoryOpen.id);
  }, [categoryOpen]);

  const filteredCategoryItems = useMemo(() => {
    const term = categorySearch.trim();
    if (!term) return categoryItems;
    const needle = normalizeSearch(term);
    return categoryItems.filter((lei) => {
      const haystack = normalizeSearch(`${lei.nome} ${lei.sigla} ${lei.descricao} ${(lei.tags || []).join(' ')}`);
      return haystack.includes(needle);
    });
  }, [categoryItems, categorySearch]);

  useBodyScrollLock(!!categoryOpen || juriOpen);

  return (
    <div className="space-y-6 pt-4">
      {/* Pílulas em Carrossel 3D no topo */}
      {!hideBlog && (
        <div className="pt-2">
          <div className="mb-4">
            <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#10B981]" />
              Pílulas de Códigos
            </h3>
            <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
              Áudios curtos sobre os artigos mais cobrados
            </p>
          </div>
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[300px]">
            <CircularGallery
              items={pillsItems}
              bend={0.3}
              textColor="#ffffff"
              scrollEase={0.15}
              borderRadius={0.05}
              onItemClick={(item) => {
                import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
                navigate(`/pilulas/${item.id}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Alternância de Abas Segmentadas */}
      {!hideTabs && (
        <HomeSegmentedTabs
          currentTab={currentTab}
          activeTabs={activeTabs}
          onSelectTab={(newTab) => setTab(newTab)}
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {currentTab === 'categorias' && (
          <HomeTabCategorias
            onOpenCategory={(cat) => {
              setCategorySearch('');
              setCategoryOpen(cat);
            }}
          />
        )}

        {currentTab === 'emalta' && (
          <HomeTabEmAlta
            onOpenCategory={(cat) => {
              setCategorySearch('');
              setCategoryOpen(cat);
            }}
            onSelectRadar={handle}
          />
        )}

        {currentTab === 'areas' && (
          <HomeTabAreas
            onOpenArea={(area) => {
              setCategorySearch('');
              setCategoryOpen(area);
            }}
          />
        )}

        {currentTab === 'agenda' && (
          <Suspense fallback={<div className="h-96 w-full animate-pulse bg-muted/5 rounded-2xl" />}>
            <AgendaMobileTab />
          </Suspense>
        )}

        {currentTab === 'estudos' && (
          <HomeTabEstudos
            emAltaLeis={emAltaLeis}
            hideBlog={hideBlog}
            hideNoticias={hideNoticias}
            noticiasAutoplay={noticiasAutoplay}
            onNewsOpenChange={onNewsOpenChange}
            onOpenCategory={(cat) => {
              setCategorySearch('');
              setCategoryOpen(cat);
            }}
            onOpenVisuais={() => startTransition(() => setVisuaisOpen(true))}
            onOpenAreas={() => startTransition(() => setAreasOpen(true))}
          />
        )}

        {currentTab === 'faculdade' && (
          <Suspense fallback={<div className="h-96 w-full animate-pulse bg-muted/5 rounded-2xl" />}>
            <GraficosMobileTab />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Category bottom sheet */}
      <HomeCategorySheet
        categoryOpen={categoryOpen}
        onClose={() => setCategoryOpen(null)}
        categorySearch={categorySearch}
        onSearchChange={setCategorySearch}
        voiceSearch={voiceSearch}
        filteredCategoryItems={filteredCategoryItems}
      />

      {/* Jurisprudência bottom sheet */}
      <AnimatePresence>
        {juriOpen && (
          <Suspense fallback={null}>
            <JurisprudenciaSheet open={juriOpen} onClose={() => setJuriOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Visuais jurídicos */}
      {visuaisOpen && (
        <Suspense fallback={null}>
          <VisuaisJuridicosSheet
            open={visuaisOpen}
            onClose={() => startTransition(() => setVisuaisOpen(false))}
            onEscolherTipo={(t) => {
              startTransition(() => {
                setVisuaisOpen(false);
                navigate(`/visuais/${TIPO_SLUG[t]}`);
              });
            }}
          />
        </Suspense>
      )}

      {/* Documentos */}
      {docPasta && (
        <Suspense fallback={null}>
          <DocumentosSheet categoria={docPasta} open={!!docPasta} onClose={() => setDocPasta(null)} />
        </Suspense>
      )}

      {/* Áreas do Direito — grade completa */}
      <HomeAreasModal
        open={areasOpen}
        onClose={() => setAreasOpen(false)}
        onSelectArea={(area) => {
          setAreasOpen(false);
          setCategorySearch('');
          setCategoryOpen(area);
        }}
      />

      {/* Voice capture full-screen overlay */}
      <Suspense fallback={null}>
        <VoiceCaptureOverlay
          open={voiceSearch.listening}
          partial={voiceSearch.partial}
          onStop={voiceSearch.stop}
        />
      </Suspense>
    </div>
  );
};

export default memo(MobileHomeSections);
