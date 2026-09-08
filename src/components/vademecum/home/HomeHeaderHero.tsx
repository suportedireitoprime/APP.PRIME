import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { pickAsset, srcOf } from '@/lib/assetUrl';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import cover2Asset from '@/assets/covers/cover-2.png.asset.json';
import cover2Bundled from '@/assets/covers/cover-2.webp';
import cover3Asset from '@/assets/covers/cover-3.png.asset.json';
import cover3Bundled from '@/assets/covers/cover-3.webp';
import cover4Asset from '@/assets/covers/cover-4.png.asset.json';
import cover4Bundled from '@/assets/covers/cover-4.webp';
import cover5Asset from '@/assets/covers/cover-5.png.asset.json';
import cover5Bundled from '@/assets/covers/cover-5.webp';
import cover6Asset from '@/assets/covers/cover-6.png.asset.json';
import cover6Bundled from '@/assets/covers/cover-6.webp';
import cover7Asset from '@/assets/covers/cover-7.png.asset.json';
import cover7Bundled from '@/assets/covers/cover-7.webp';
import cover8Asset from '@/assets/covers/cover-8.png.asset.json';
import cover8Bundled from '@/assets/covers/cover-8.webp';
import cover9Asset from '@/assets/covers/cover-9.png.asset.json';
import cover9Bundled from '@/assets/covers/cover-9.webp';
import cover10Asset from '@/assets/covers/cover-10.png.asset.json';
import cover10Bundled from '@/assets/covers/cover-10.webp';
import { useHeroHomeImages } from '@/hooks/useHeroHomeImages';
import { prefetchHeroRoutesIdle } from '@/lib/routePrefetch';
import { pushRecente } from '@/lib/leisRecentes';
import { leiToSlug, tipoToSlug } from '@/lib/legislacaoSlugs';
import heroEstudanteImg from '@/assets/covers/hero-estudante.webp';

import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HeroCoverCarousel from '@/components/vademecum/home/HeroCoverCarousel';
import HomeUserHeader from './HomeUserHeader';
import HomeBrandBanner from './HomeBrandBanner';
import HomeSearchButton from './HomeSearchButton';
import HomeActionShortcuts from './HomeActionShortcuts';
import { FallingLeaves } from './FallingMotifs';
import { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Bell, Menu as MenuIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
const NotificationsSheet = lazyWithRetry(() => import('@/components/vademecum/outros/NotificationsSheet'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const RecentesOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/RecentesOverlay'));

// Re-exports for backward compatibility
export { RotatingStatCard, PHILOSOPHER_QUOTES, LEGAL_CURIOSITIES, TERMOS_JURIDICOS, type CardItem } from './RotatingStatCard';

const FALLBACK_COVERS = [
  { url: pickAsset(cover2Bundled, srcOf(cover2Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover3Bundled, srcOf(cover3Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover4Bundled, srcOf(cover4Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover5Bundled, srcOf(cover5Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover6Bundled, srcOf(cover6Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover7Bundled, srcOf(cover7Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover8Bundled, srcOf(cover8Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover9Bundled, srcOf(cover9Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover10Bundled, srcOf(cover10Asset)), preset: 'ken-burns' },
];

interface HomeHeaderHeroProps {
  onSearchOpenChange?: (open: boolean) => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
}

const HomeHeaderHero = ({ onSearchOpenChange, onOpenMenu, onOpenSearch }: HomeHeaderHeroProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileSummary } = useProfileSummary();
  const { images: dbImages } = useHeroHomeImages();

  const toOptimized = (url: string): string => {
    try {
      if (!url) return url;
      if (url.includes('/storage/v1/object/public/')) {
        const opt = url.replace('/object/public/', '/render/image/public/');
        const sep = opt.includes('?') ? '&' : '?';
        return `${opt}${sep}width=1024&quality=78&format=origin`;
      }
      return url;
    } catch { return url; }
  };

  const HERO_COVERS = dbImages.length > 0
    ? dbImages.map((i) => ({ url: toOptimized(i.imagem_url), preset: i.animation_preset }))
    : FALLBACK_COVERS;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentesOpen, setRecentesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();
  const reduceMotion = useRef(false);

  const perfilLabel = useMemo(() => {
    if (profileSummary?.perfilContexto) return String(profileSummary.perfilContexto);
    if (Array.isArray(profileSummary?.perfilTipos) && profileSummary.perfilTipos.length > 0) {
      const mapa: Record<string, string> = {
        faculdade: 'Estudante de Direito',
        oab: 'Concurseiro OAB',
        concurso: 'Concurseiro',
        advogado: 'Advogado(a)',
      };
      return mapa[profileSummary.perfilTipos[0]] || 'Estudante de Direito';
    }
    return 'Estudando pra OAB';
  }, [profileSummary?.perfilContexto, profileSummary?.perfilTipos]);

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

  const nome =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split('@')[0] : 'Bem-vindo');
  const avatarUrl =
    (profileSummary?.avatarUrl || undefined) ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
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

        {/* Imagem de Fundo (Professor e Aluna) */}
        <img
          src={heroEstudanteImg}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Animação caindo apenas sobre a imagem (por trás do painel vermelho) */}
        <FallingLeaves />

        {/* Overlay vermelho com gradiente estilo menu e sombra (drop-shadow real na divisória diagonal) */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-brand-gradient" />
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <ShapeGrid />
            </div>
          </div>
        </div>

        {/* Botões de Notificação e Menu — alinhados com Vade Mecum */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => { haptic.light(); setNotifOpen(true); }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 relative"
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
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
            >
              <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda — centralizado na área vermelha com recuo idêntico ao Vade Mecum */}
        <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[100px]">
          <HomeBrandBanner />
        </div>

        {/* Atalhos Rápidos: APRENDER, FLASHCARDS, QUESTÕES, ME EXPLIQUE — dentro do painel */}
        <div className="relative z-10 px-3 sm:px-5 pt-2 pb-2">
          <HomeActionShortcuts />
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative z-10 px-4 sm:px-6 w-full pb-5">
          <HomeSearchButton onOpenSearch={() => {
            if (onOpenSearch) onOpenSearch();
            else setSearchOpen(true);
          }} />
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
