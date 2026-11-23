// @ts-nocheck
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate } from "react-router-dom";
import { prefetchHeroRoutesIdle } from "@/lib/routePrefetch";
import { pushRecente } from "@/lib/leisRecentes";
import { leiToSlug, tipoToSlug } from "@/lib/legislacaoSlugs";
import { getHomeHeroConfig } from "@/lib/vademecumHeroImage";

import HeroMotifs from "@/components/vademecum/home/HeroMotifs";
import HeroAnimatedWave from "./HeroAnimatedWave";
import HomeBrandBanner from "./HomeBrandBanner";
import FloatingOrbitingBrains from "@/components/common/FloatingOrbitingBrains";
import { HomeTrialCard } from "@/components/subscription/HomeTrialCard";
import HomeActionShortcuts from "./HomeActionShortcuts";
import { useUnreadNotifCount } from "@/components/vademecum/outros/NotificationsSheet";
import { Bell, Menu as MenuIcon } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";

const NotificationsSheet = lazyWithRetry(
  () => import("@/components/vademecum/outros/NotificationsSheet"),
);

// Re-exports for backward compatibility
export {
  RotatingStatCard,
  PHILOSOPHER_QUOTES,
  LEGAL_CURIOSITIES,
  TERMOS_JURIDICOS,
  type CardItem,
} from "./RotatingStatCard";

// Fallback covers and hooks removed because they are not used in rendering

interface HomeHeaderHeroProps {
  onSearchOpenChange?: (open: boolean) => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
  hasTopBanner?: boolean;
}

const HomeHeaderHero = ({
  onSearchOpenChange,
  onOpenMenu,
  onOpenSearch,
  hasTopBanner = false,
}: HomeHeaderHeroProps = {}) => {
  const navigate = useNavigate();
  const heroConfig = useMemo(() => getHomeHeroConfig(), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentesOpen, setRecentesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    prefetchHeroRoutesIdle();
  }, []);

  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const idle = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 500));
    idle(() => {
      void import("@/components/vademecum/navigation/SideMenu").catch(() => {});
    });
  }, []);

  useEffect(() => {
    onSearchOpenChange?.(searchOpen);
  }, [searchOpen, onSearchOpenChange]);

  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll — 100% idêntico ao Vade Mecum */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[28px] xs:rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[245px] xs:min-h-[260px] sm:min-h-[290px]"
        style={{
          transform: "translateZ(0)",
          backgroundColor: "#050505",
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: "#050505" }}
          aria-hidden="true"
        />

        {/* Imagem de Capa do Painel do Início (Inverte a cada 12h com o Vade Mecum) */}
        <img
          src={heroConfig.src}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={heroConfig.className}
        />

        {/* 3 Cérebros Vazados Transparentes com Glow Orbitando na Esquerda */}
        <FloatingOrbitingBrains position="left" />

        {/* Onda Vermelha Fluida e Animada em Movimento (substitui o painel diagonal rígido) */}
        <HeroAnimatedWave />

        {/* Botões de Notificação e Menu — alinhados com Vade Mecum */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-3 xs:px-4 pb-1 pt-1.5 flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => {
                haptic.light();
                setNotifOpen(true);
              }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
              className="grid w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative"
            >
              <Bell className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6" strokeWidth={2.4} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onPointerDown={() => {
                import("@/components/vademecum/navigation/SideMenu").catch(() => {});
              }}
              onClick={() => {
                haptic.light();
                (onOpenMenu || (() => setMenuOpen(true)))();
              }}
              aria-label="Abrir menu"
              className="grid w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <MenuIcon className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda e Card de Status à direita — altura, recuo e proporção 100% idênticos ao Vade Mecum */}
        <div className="relative z-10 pt-2 xs:pt-2.5 sm:pt-3 flex flex-col justify-start min-h-[110px] xs:min-h-[120px] sm:min-h-[135px]">
          <div className="flex items-start justify-between gap-2.5 px-3 sm:px-4">
            <HomeBrandBanner />
            <div className="relative z-10 w-[130px] xs:w-[145px] sm:w-[165px] shrink-0 pt-[44px] xs:pt-[50px] sm:pt-[56px] pr-1 sm:pr-2 empty:hidden">
              <HomeTrialCard />
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos — dentro do painel (alinhamento idêntico ao Vade Mecum) */}
        <div className="relative z-10 px-2.5 xs:px-3.5 sm:px-4 pt-1 pb-2.5 xs:pb-3 sm:pb-3.5">
          <HomeActionShortcuts />
        </div>
      </div>

      <Suspense fallback={null}>
        {notifOpen && <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />}
      </Suspense>
    </>
  );
};

export default HomeHeaderHero;
