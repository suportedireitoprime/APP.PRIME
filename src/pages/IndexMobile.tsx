import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate } from 'react-router-dom';

import heroImageAsset from '@/assets/hero-vademecum.webp';
const heroImage = heroImageAsset;
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import {pickAsset, srcOf } from '@/lib/assetUrl';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));
import camaraHeroAsset from '@/assets/radar/camara-hero.webp';
const camaraHero = camaraHeroAsset;
import senadoHeroAsset from '@/assets/radar/senado-hero.webp';
const senadoHero = senadoHeroAsset;
import BottomNav from '@/components/vademecum/BottomNav';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
// Heavy overlays are only rendered when opened — lazy-load their chunks so
// the initial mobile bundle stays lean and the home paints faster.
const SideMenu = lazyWithRetry(() => import('@/components/vademecum/SideMenu'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/AssistenteOverlayV2'));
import HomeHeaderHero from '@/components/vademecum/HomeHeaderHero';
import FeatureDiscoveryCard from '@/components/vademecum/FeatureDiscoveryCard';
import MobileHomeSections from '@/components/vademecum/MobileHomeSections';
import { prefetchAllArtigos } from '@/services/legislacaoService';
import { prefetchResenha } from '@/services/atualizacaoService';
import { prefetchNoticias } from '@/services/noticiasService';
import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { track } from '@/lib/analyticsEvents';

import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';

const HERO_CONFIG = { radar: camaraHero, legislacao: heroImage, noticias: senadoHero } as const;

type Tab = 'legislacao' | 'noticias' | 'ferramentas';

const IndexMobile = () => {
  useHideSplashScreen(400); // Give React more time to paint heavy UI before dropping native splash
  const navigate = useNavigate();
  const [, setActiveTab] = useState<Tab>('legislacao');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [heroSearchOpen, setHeroSearchOpen] = useState(false);
  const [homeTab, setHomeTab] = useState<'agenda' | 'estudos' | 'faculdade' | 'documentos' | 'categorias' | 'emalta' | 'areas'>('estudos');
  const [newsOpen, setNewsOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [personalizarOpen] = useState(false);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { hidden?: boolean } | undefined;
      if (detail && typeof detail.hidden === 'boolean') {
        setBottomNavHidden(detail.hidden);
      }
    };
    window.addEventListener('direitoprime:bottom-nav-visibility', handler as EventListener);
    return () => window.removeEventListener('direitoprime:bottom-nav-visibility', handler as EventListener);
  }, []);

  // SEO & Título dinâmico da Home
  useEffect(() => {
    document.title = 'Direito Prime - Vade Mecum, Leis & Estudos Jurídicos';
  }, []);

  useEffect(() => { warmCoverCache(); }, []);

  useEffect(() => {
    const ric: (cb: () => void) => number = (window as any).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 1500 })
      : (cb) => window.setTimeout(cb, 300);
    const id = ric(() => {
      [primeLogo, ...Object.values(HERO_CONFIG)].forEach(src => {
        const img = new Image();
        img.src = src;
      });
      prefetchResenha();
      prefetchNoticias();
      // Pre-warm overlays e Biblioteca para exibição instantânea (0ms)
      import('@/components/vademecum/SearchOverlay').catch(() => {});
      import('@/components/vademecum/SideMenu').catch(() => {});
      import('@/components/vademecum/AssistenteOverlayV2').catch(() => {});
      import('@/components/biblioteca/RecomendacoesCarousel').catch(() => {});
    });
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(id); else window.clearTimeout(id);
    };
  }, []);

  const handleSearchSelectLei = useCallback((lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
    track('lei_search_selected', { tipo: lei.tipo, lei_id: lei.leiId, lei_nome: lei.nome, has_artigo: Boolean(lei.artigoNumero) });
    pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
    const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
    const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
    navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
  }, [navigate]);

  const handleMenuClose = useCallback(() => setMenuOpen(false), []);
  const handleMenuNavigate = useCallback((section: string) => {
    if (section === 'atualizacao') setActiveTab('noticias');
    else if (section === 'novidades') { /* handled by SideMenu */ }
    else setActiveTab('legislacao');
  }, []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const handleAssistenteClose = useCallback(() => setAssistenteOpen(false), []);

  // Silence unused import warning; retained for future navigation flows.
  void LEIS_CATALOG;
  void leiPath;

  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+var(--sai-bottom))] md:pb-0 md:pl-[90px] transition-all">
      <HomeHeaderHero onSearchOpenChange={setHeroSearchOpen} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <main ref={contentRef} className="max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-2">
          <img src={primeLogo} alt="" aria-hidden="true" loading="eager" decoding="sync" fetchPriority="high" className="absolute w-0 h-0 opacity-0 pointer-events-none" />
          <FeatureDiscoveryCard />
          <MobileHomeSections onTabChange={setHomeTab} onNewsOpenChange={setNewsOpen} />
        </main>
        {homeTab === 'estudos' && !personalizarOpen && !searchOpen && !heroSearchOpen && !newsOpen && !bottomNavHidden && <BottomNav />}
      </motion.div>
      <Suspense fallback={null}>
        {menuOpen && (
          <SideMenu
            open={menuOpen}
            onClose={handleMenuClose}
            onNavigate={handleMenuNavigate}
          />
        )}
        {searchOpen && (
          <SearchOverlay open={searchOpen} onClose={handleSearchClose} onSelectLei={handleSearchSelectLei} />
        )}
        {assistenteOpen && (
          <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />
        )}
      </Suspense>
    </div>
  );
};

export default IndexMobile;
