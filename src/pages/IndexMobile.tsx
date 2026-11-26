import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Sparkles, Radar, Headphones, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import HomeEmAltaCardsCarousel from '@/components/vademecum/home/carousel/HomeEmAltaCardsCarousel';

import heroImageAsset from '@/assets/hero-vademecum.webp';
const heroImage = heroImageAsset;
import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import {pickAsset, srcOf } from '@/lib/assetUrl';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));
import camaraHeroAsset from '@/assets/radar/camara-hero.webp';
const camaraHero = camaraHeroAsset;
import senadoHeroAsset from '@/assets/radar/senado-hero.webp';
const senadoHero = senadoHeroAsset;
import BottomNav from '@/components/vademecum/navigation/BottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
// Heavy overlays are only rendered when opened — lazy-load their chunks so
// the initial mobile bundle stays lean and the home paints faster.
const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlay'));
import HomeHeaderHero from '@/components/vademecum/home/HomeHeaderHero';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';

import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';
import { pushRecente } from '@/lib/leisRecentes';
import { track } from '@/lib/analyticsEvents';

import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';
import { Capacitor } from '@capacitor/core';

import { useProfileSummary } from '@/hooks/useProfileSummary';
import { useSubscription } from '@/hooks/useSubscription';
import { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';


const HERO_CONFIG = { radar: camaraHero, legislacao: heroImage, noticias: senadoHero } as const;

type Tab = 'legislacao' | 'noticias' | 'ferramentas';

const IndexMobile = () => {
  const navigate = useNavigate();
  const { data: profileSummary } = useProfileSummary();
  const { isPremium, isTrial } = useSubscription();

  useHideSplashScreen(250, Boolean(profileSummary !== undefined || !Capacitor.isNativePlatform()));

  // Invocação Híbrida desativada: A View Nativa (Swift/Compose) sobrepunha a UI e ocultava o menu de rodapé (BottomNav).
  // Agora o app renderizará o layout React padrão com o BottomNav para garantir a UX correta no mobile nativo.

  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // SEO & Título dinâmico da Home
  useEffect(() => {
    document.title = 'Direito Prime - Vade Mecum, Leis & Estudos Jurídicos';
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
    // Navigation logic inside menu handles its own state now
  }, []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const handleAssistenteClose = useCallback(() => setAssistenteOpen(false), []);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] pb-[calc(7rem+var(--sai-bottom))] md:pb-0 md:pl-[90px] transition-all relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <ShapeGrid />
      </div>
      <div className="relative z-10">
        <HomeHeaderHero
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          hasTopBanner={false}
        />
        <div>
          <main ref={contentRef} className="relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-8 sm:pt-9 pb-2 space-y-8">
            {/* Seção Em Alta — Carrossel Infinito com Zoom no Card Central */}
            <HomeEmAltaCardsCarousel />

            {/* Atalhos compactos vermelhos abaixo de Em Alta (Vade Mecum, Novidades, Radar e Ouça a Lei) */}
            <section className="flex flex-col gap-3">
              <HomeSectionHeader title="LEIS E NOVIDADES" />

              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                {[
                  {
                    id: 'vade-mecum-atalho',
                    label: 'Vade Mecum',
                    route: '/vade-mecum',
                    icon: Scale,
                    bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 55%, #881337 100%)',
                  },
                  {
                    id: 'novidades-atalho',
                    label: 'Novidades',
                    route: '/novidades',
                    icon: Sparkles,
                    bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 55%, #881337 100%)',
                  },
                  {
                    id: 'radar-atalho',
                    label: 'Radar',
                    route: '/radar-360',
                    icon: Radar,
                    bg: 'linear-gradient(135deg, #9F1239 0%, #70102D 55%, #3B0718 100%)',
                  },
                  {
                    id: 'ouca-a-lei-atalho',
                    label: 'Ouça a Lei',
                    route: '/audioleis',
                    icon: Headphones,
                    bg: 'linear-gradient(135deg, #9F1239 0%, #70102D 55%, #3B0718 100%)',
                  },
                ].map(({ id, label, route, icon: Icon, bg }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      navigate(route);
                    }}
                    style={{ background: bg }}
                    className="group relative flex items-center justify-between w-full min-h-[68px] sm:min-h-[72px] px-3.5 sm:px-4 py-3 rounded-2xl border border-white/15 hover:border-white/30 shadow-md shadow-rose-950/40 active:scale-[0.98] transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white/90 shrink-0 transition-transform duration-300 group-hover:scale-105"
                        strokeWidth={1.6}
                      />
                      <span className="font-card text-white font-semibold text-[14px] sm:text-[15px] tracking-[-0.01em] leading-snug truncate">
                        {label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/75 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>

            <MobileHomeSections />
          </main>
        </div>
        {location.pathname === '/' && <BottomNav />}
        <Suspense fallback={null}>
          {menuOpen && (
            <SideMenu
              open={menuOpen}
              onClose={handleMenuClose}
              onNavigate={handleMenuNavigate}
            />
          )}
          {searchOpen && <SearchOverlay open={searchOpen} onClose={handleSearchClose} onSelectLei={handleSearchSelectLei} />}
          {assistenteOpen && <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />}
        </Suspense>
      </div>
    </div>
  );
};

export default IndexMobile;
