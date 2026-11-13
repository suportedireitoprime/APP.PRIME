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
import { HomeTrialCard } from "@/components/subscription/HomeTrialCard";
import HomeActionShortcuts from "./HomeActionShortcuts";
import { useUnreadNotifCount } from "@/components/vademecum/outros/NotificationsSheet";
import { Bell, Menu as MenuIcon } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";

const SideMenu = lazyWithRetry(() => import("@/components/vademecum/navigation/SideMenu"));
const NotificationsSheet = lazyWithRetry(
  () => import("@/components/vademecum/outros/NotificationsSheet"),
);
const SearchOverlay = lazyWithRetry(() => import("@/components/vademecum/overlays/SearchOverlay"));
const RecentesOverlay = lazyWithRetry(
  () => import("@/components/vademecum/overlays/RecentesOverlay"),
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
      {/* Shell sÃ³lido, opaco e com blindagem contra culling e overscroll */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
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

        {/* Onda Vermelha Fluida e Animada em Movimento (substitui o painel diagonal rígido) */}
        <HeroAnimatedWave />

        {/* Botões de Notificação e Menu — alinhados com Vade Mecum */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => {
                haptic.light();
                setNotifOpen(true);
              }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative"
            >
              <Bell className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
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
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda — centralizado na área vermelha com recuo idêntico ao Vade Mecum */}
        <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[120px]">
          <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
            <HomeBrandBanner />
            <div className="relative z-10 w-[150px] xs:w-[165px] sm:w-[185px] shrink-0 pt-1 sm:pt-2 pr-1 sm:pr-2">
              <HomeTrialCard />
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos — dentro do painel */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
          <HomeActionShortcuts />
        </div>
      </div>

      <Suspense fallback={null}>
        {!onOpenMenu && menuOpen && <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
        {notifOpen && <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />}
        {!onOpenSearch && (
          <SearchOverlay
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectLei={(lei) => {
              setSearchOpen(false);
              pushRecente({
                tipo: lei.tipo,
                leiId: lei.leiId,
                nome: lei.nome,
                descricao: lei.descricao,
                tabela_nome: lei.tabela_nome,
              });
              const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
              const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
              navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
            }}
          />
        )}
        <RecentesOverlay
          open={recentesOpen}
          onClose={() => setRecentesOpen(false)}
          onSelectLei={(lei) => {
            setRecentesOpen(false);
            pushRecente(lei);
            navigate(
              `/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.leiId, nome: lei.nome })}`,
            );
          }}
        />
      </Suspense>
    </>
  );
};

export default HomeHeaderHero;
