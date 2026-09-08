import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';

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
import BottomNav from '@/components/vademecum/navigation/BottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
// Heavy overlays are only rendered when opened — lazy-load their chunks so
// the initial mobile bundle stays lean and the home paints faster.
const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlayV2'));
import HomeHeaderHero from '@/components/vademecum/home/HomeHeaderHero';
import HomeSearchButton from '@/components/vademecum/home/HomeSearchButton';
import FeatureDiscoveryCard from '@/components/vademecum/ui_elements/FeatureDiscoveryCard';
import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';
import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { track } from '@/lib/analyticsEvents';

import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';
import { Capacitor } from '@capacitor/core';

import { useProfileSummary } from '@/hooks/useProfileSummary';
import { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';

const HERO_CONFIG = { radar: camaraHero, legislacao: heroImage, noticias: senadoHero } as const;

type Tab = 'legislacao' | 'noticias' | 'ferramentas';

const IndexMobile = () => {
  const navigate = useNavigate();
  const { data: profileSummary } = useProfileSummary();
  const unreadCount = useUnreadNotifCount();
  useHideSplashScreen(250, Boolean(profileSummary !== undefined || !Capacitor.isNativePlatform()));

  // Invocação Híbrida: Se estiver rodando no Nativo puro (iOS/Android Capacitor), tenta
  // exibir a View Swift/Compose por cima. A UI React continua montando atrás.
  useEffect(() => {
    let active = true;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      import('@/plugins/NativeHomePlugin').then(async ({ NativeHome }) => {
        if (!active) return;
        NativeHome.showHome({
          data: {
            nome: profileSummary?.displayName || 'Usuário',
            iniciais: (profileSummary?.displayName || 'DP').slice(0, 2).toUpperCase(),
            perfilLabel: 'Estudando pra OAB',
            avatarUrl: profileSummary?.avatarUrl || '',
            unreadCount: unreadCount || 0,
            livros: [
              { id: 'livro_1', titulo: 'Como as Democracias Morrem', autor: 'Steven Levitsky', ano: 2018 },
              { id: 'livro_2', titulo: 'O Último Dia de um Condenado', autor: 'Victor Hugo', ano: 1829 },
              { id: 'livro_3', titulo: 'Dos Delitos e das Penas', autor: 'Cesare Beccaria', ano: 1764 },
              { id: 'livro_4', titulo: 'O Caso dos Exploradores de Cavernas', autor: 'Lon L. Fuller', ano: 1949 },
            ]
          }
        })
          .then(() => {
            if (active) {
              setBottomNavHidden(true);
              window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: true } }));
            }
          })
          .catch(e => console.warn('NativeHome not bound, fallback to React', e));

        try {
          const h1 = await NativeHome.addListener('onNavigate', (info) => {
            navigate(info.route);
          });
          const h2 = await NativeHome.addListener('onSearch', () => {
            setSearchOpen(true);
          });
          const h3 = await NativeHome.addListener('onOpenSidebar', () => {
            setMenuOpen(true);
          });

          if (!active) {
            void h1.remove();
            void h2.remove();
            void h3.remove();
          } else {
            handles.push(h1, h2, h3);
          }
        } catch (err) {
          console.warn('[IndexMobile] NativeHome listeners error:', err);
        }
      });
    }
    return () => {
      active = false;
      handles.forEach(h => { void h.remove().catch(() => {}); });
      if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
        import('@/plugins/NativeHomePlugin').then(({ NativeHome }) => NativeHome.hideHome().catch(() => {}));
        setBottomNavHidden(false);
        window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: false } }));
      }
    };
  }, [navigate, profileSummary?.displayName, profileSummary?.avatarUrl, unreadCount]);

  const location = useLocation();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      warmCoverCache();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Usa o hook de warmup centralizado para a Home Mobile
  useHomeWarmup([primeLogo, ...Object.values(HERO_CONFIG)], undefined, false);

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
    <div className="min-h-dvh bg-zinc-950 pb-[calc(5rem+var(--sai-bottom))] md:pb-0 md:pl-[90px] transition-all relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>
      <div className="relative z-10">
        <HomeHeaderHero
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onSearchOpenChange={setHeroSearchOpen}
        />
        <div>
          <main ref={contentRef} className="max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-2">
            <img src={primeLogo} alt="" aria-hidden="true" loading="eager" decoding="sync" fetchPriority="high" className="absolute w-0 h-0 opacity-0 pointer-events-none" />
            
            <div className="py-2 -mt-4 z-30 relative">
              <HomeSearchButton onOpenSearch={() => setSearchOpen(true)} />
            </div>
            
            <FeatureDiscoveryCard />
            <MobileHomeSections onTabChange={setHomeTab} onNewsOpenChange={setNewsOpen} />
          </main>
        </div>
        {location.pathname === '/' && <BottomNav />}
        <Suspense fallback={null}>
          <SideMenu
            open={menuOpen}
            onClose={handleMenuClose}
            onNavigate={handleMenuNavigate}
          />
          <SearchOverlay open={searchOpen} onClose={handleSearchClose} onSelectLei={handleSearchSelectLei} />
          <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />
        </Suspense>
      </div>
    </div>
  );
};

export default IndexMobile;
