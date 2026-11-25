import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Wrench, BookOpen } from 'lucide-react';
import HomeCard from '@/components/vademecum/home/HomeCard';

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

            {/* Seção Em Alta — 3 Cards Principais no mesmo estilo de Estudos Livres */}
            <div className="flex flex-col gap-3">
              <div className="px-1">
                <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 uppercase tracking-[0.05em]">
                  <span className="w-1 h-4 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
                  <span className="truncate">EM ALTA</span>
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <HomeCard
                  icon={Scale}
                  label="Vade Mecum"
                  sublabel="Leis e Códigos"
                  color="hsl(var(--primary))"
                  delay={0}
                  className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                  onClick={() => navigate('/vade-mecum')}
                  data-track="home_card_click"
                  data-track-name="Vade Mecum"
                  data-track-section="em_alta"
                />
                <HomeCard
                  icon={BookOpen}
                  label="Biblioteca"
                  sublabel="Obras"
                  color="hsl(var(--primary))"
                  delay={0.05}
                  className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                  onClick={() => navigate('/bibliotecas')}
                  data-track="home_card_click"
                  data-track-name="Biblioteca"
                  data-track-section="em_alta"
                />
                <HomeCard
                  icon={Wrench}
                  label="Ferramentas"
                  sublabel="Utilitários"
                  color="hsl(var(--primary))"
                  delay={0.1}
                  className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                  onClick={() => navigate('/ferramentas')}
                  data-track="home_card_click"
                  data-track-name="Ferramentas"
                  data-track-section="em_alta"
                />
              </div>
            </div>

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
