import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, ArrowRight } from 'lucide-react';

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

import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';
import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
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

  useEffect(() => {
    // ⚡ Executa o pré-aquecimento de capas após a tela inicial estar estável e interagida
    const timer = setTimeout(() => {
      warmCoverCache();
    }, 8000);
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
    // Navigation logic inside menu handles its own state now
  }, []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const handleAssistenteClose = useCallback(() => setAssistenteOpen(false), []);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] pb-[calc(7rem+var(--sai-bottom))] md:pb-0 md:pl-[90px] transition-all relative overflow-hidden">
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
          <main ref={contentRef} className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-6 sm:pt-7 pb-4 space-y-5">
            <img src={primeLogo} alt="" aria-hidden="true" loading="eager" decoding="sync" fetchPriority="high" className="absolute w-0 h-0 opacity-0 pointer-events-none" />

            {/* Destaque Minimalista do Vade Mecum no Início (saiu do rodapé) */}
            <button
              type="button"
              onClick={() => navigate('/vade-mecum')}
              className="w-full min-h-[56px] flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border border-rose-500/20 hover:border-rose-500/35 backdrop-blur-sm active:scale-[0.99] transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/12 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Scale className="w-5 h-5" strokeWidth={1.6} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-white tracking-tight truncate">
                    Vade Mecum · Legislação
                  </p>
                  <p className="font-body text-xs text-white/60 truncate mt-0.5">
                    CF/88, Códigos, Estatutos e Súmulas
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4.5 h-4.5 text-rose-300/75 shrink-0" strokeWidth={1.8} />
            </button>

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
