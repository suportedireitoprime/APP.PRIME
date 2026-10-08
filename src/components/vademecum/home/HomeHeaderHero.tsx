import { useState, useEffect, useRef, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate } from 'react-router-dom';
import { prefetchHeroRoutesIdle } from '@/lib/routePrefetch';
import { pushRecente } from '@/lib/leisRecentes';
import { leiToSlug, tipoToSlug } from '@/lib/legislacaoSlugs';
import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.webp';

import penaImg from '@/assets/covers/pena_wireframe.jpg';
import livroImg from '@/assets/covers/livro_wireframe.jpg';
import balancaImg from '@/assets/covers/balanca_wireframe.jpg';
import { motion } from 'framer-motion';

import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HomeBrandBanner from './HomeBrandBanner';
import HomeActionShortcuts from './HomeActionShortcuts';
import { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import { Bell, Menu as MenuIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
const NotificationsSheet = lazyWithRetry(() => import('@/components/vademecum/outros/NotificationsSheet'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const RecentesOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/RecentesOverlay'));

// Re-exports for backward compatibility
export { RotatingStatCard, PHILOSOPHER_QUOTES, LEGAL_CURIOSITIES, TERMOS_JURIDICOS, type CardItem } from './RotatingStatCard';

// Fallback covers and hooks removed because they are not used in rendering

const ORBITING_ITEMS = [
  { img: penaImg, glow: 'rgba(168,85,247,0.75)' },
  { img: livroImg, glow: 'rgba(56,189,248,0.75)' },
  { img: balancaImg, glow: 'rgba(251,191,36,0.75)' },
];

interface HomeHeaderHeroProps {
  onSearchOpenChange?: (open: boolean) => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
  hasTopBanner?: boolean;
}

const HomeHeaderHero = ({ onSearchOpenChange, onOpenMenu, onOpenSearch, hasTopBanner = false }: HomeHeaderHeroProps = {}) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentesOpen, setRecentesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => { prefetchHeroRoutesIdle(); }, []);

  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const idle = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 500));
    idle(() => { void import('@/components/vademecum/navigation/SideMenu').catch(() => {}); });
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
          transform: 'translateZ(0)',
          backgroundColor: '#050505',
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#050505' }}
          aria-hidden="true"
        />

        {/* Imagem de Capa do Painel do InÃ­cio (Substituindo o vÃ­deo anterior) */}
        <img
          src={heroEstudanteImg}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[32%_center] md:object-center z-0 pointer-events-none translate-x-[12%] md:translate-x-[8%]"
        />

        {/* 3 Imagens Flutuantes Orbitando à Direita */}
        <div className="absolute right-[-10px] sm:right-6 top-[35%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[2]">
          {ORBITING_ITEMS.map((item, i) => {
            const delay = i * 4.6;
            return (
              <motion.div
                key={i}
                className="absolute w-14 h-14 sm:w-20 sm:h-20 mix-blend-screen"
                animate={{
                  x: [
                    100 * Math.cos(0),
                    100 * Math.cos((2 * Math.PI) / 3),
                    100 * Math.cos((4 * Math.PI) / 3),
                    100 * Math.cos(2 * Math.PI),
                  ],
                  y: [
                    42 * Math.sin(0),
                    42 * Math.sin((2 * Math.PI) / 3),
                    42 * Math.sin((4 * Math.PI) / 3),
                    42 * Math.sin(2 * Math.PI),
                  ],
                  scale: [1, 0.72, 1.15, 1],
                  opacity: [0.92, 0.5, 1, 0.92],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: -delay,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: -28,
                  marginTop: -28,
                }}
              >
                <img
                  src={item.img}
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-[0_0_12px_var(--glow)] rounded-full mix-blend-plus-lighter"
                  style={{ ['--glow' as string]: item.glow }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Overlay vermelho com gradiente estilo menu e sombra (drop-shadow real na divisória diagonal) */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-hero-panel" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            <HeroMotifs />

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </div>

        {/* Botões de Notificação e Menu — alinhados com Vade Mecum */}
        <header className={`absolute top-0 right-0 left-0 z-20 pointer-events-none transition-all duration-300 ${
          hasTopBanner 
            ? 'pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] sm:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]'
            : 'pt-[calc(1.35rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]'
        }`}>
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => { haptic.light(); setNotifOpen(true); }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative"
            >
              <Bell className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onPointerDown={() => { import('@/components/vademecum/navigation/SideMenu').catch(() => {}); }}
              onClick={() => { haptic.light(); (onOpenMenu || (() => setMenuOpen(true)))(); }}
              aria-label="Abrir menu"
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda — centralizado na área vermelha com recuo idêntico ao Vade Mecum */}
        <div className={`relative z-10 transition-all duration-300 flex-1 flex flex-col justify-start min-h-[120px] ${
          hasTopBanner ? 'pt-4 sm:pt-5' : 'pt-12 sm:pt-14'
        }`}>
          <HomeBrandBanner />
        </div>

        {/* Atalhos RÃ¡pidos: APRENDER, FLASHCARDS, QUESTÃ•ES, ME EXPLIQUE â€” dentro do painel */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-5">
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
              pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
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
            navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.leiId, nome: lei.nome })}`);
          }}
        />
      </Suspense>
    </>
  );
};

export default HomeHeaderHero;

