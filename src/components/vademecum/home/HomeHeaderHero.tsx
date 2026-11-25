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
import { useUnreadNotifCount } from "@/components/vademecum/outros/NotificationsSheet";
import { Bell, Menu as MenuIcon, Search } from "lucide-react";
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
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll — proporção nobre e elegante */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[30px] xs:rounded-b-[34px] sm:rounded-b-[38px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[275px] xs:min-h-[295px] sm:min-h-[320px]"
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
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.65rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(0.9rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.35rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-3.5 xs:px-4.5 pb-1 pt-1.5 flex items-center justify-end gap-2.5 sm:gap-3.5">
            <button
              onClick={() => {
                haptic.light();
                setNotifOpen(true);
              }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
              className="grid w-11 h-11 xs:w-11.5 xs:h-11.5 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative"
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
              className="grid w-11 h-11 xs:w-11.5 xs:h-11.5 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <MenuIcon className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda e Card de Status à direita — altura e respiro generosos */}
        <div className="relative z-10 pt-3 xs:pt-3.5 sm:pt-4 flex flex-col justify-start min-h-[135px] xs:min-h-[148px] sm:min-h-[162px]">
          <div className="flex items-start justify-between gap-3 px-3.5 sm:px-4.5">
            <HomeBrandBanner />
            <div className="relative z-10 w-[135px] xs:w-[150px] sm:w-[170px] shrink-0 pt-[48px] xs:pt-[54px] sm:pt-[60px] pr-1 sm:pr-2 empty:hidden">
              <HomeTrialCard />
            </div>
          </div>
        </div>

        {/* Barra de Busca Global Minimalista */}
        <div className="relative z-10 px-3 xs:px-4 sm:px-5 mt-3 xs:mt-4 sm:mt-5 pb-3.5 xs:pb-4 sm:pb-5">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              if (onOpenSearch) {
                onOpenSearch();
              } else {
                navigate('/pesquisar');
              }
            }}
            aria-label="Buscar lei, artigo, tema ou aula"
            className="w-full min-h-[48px] h-12 flex items-center gap-3 px-4 rounded-2xl bg-black/50 hover:bg-black/65 backdrop-blur-md border border-white/15 hover:border-white/25 transition-all active:scale-[0.99] text-left cursor-pointer shadow-lg"
          >
            <Search className="w-4.5 h-4.5 text-zinc-300 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-sm text-zinc-300/90 truncate">
              Buscar lei, artigo, tema ou aula…
            </span>
          </button>
        </div>
      </div>

      <Suspense fallback={null}>
        {notifOpen && <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />}
      </Suspense>
    </>
  );
};

export default HomeHeaderHero;
