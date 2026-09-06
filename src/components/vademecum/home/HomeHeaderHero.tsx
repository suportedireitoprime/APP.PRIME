import { useState, useEffect, useRef, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { pickAsset, srcOf } from '@/lib/assetUrl';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { supabase } from '@/integrations/supabase/client';
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

import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HeroCoverCarousel from '@/components/vademecum/home/HeroCoverCarousel';
import HomeUserHeader from './HomeUserHeader';
import HomeBrandBanner from './HomeBrandBanner';
import HomeSearchButton from './HomeSearchButton';
import HomeActionShortcuts from './HomeActionShortcuts';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import SearchOverlay from '@/components/vademecum/overlays/SearchOverlay';
import RecentesOverlay from '@/components/vademecum/overlays/RecentesOverlay';

const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));

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

const HomeHeaderHero = ({ onSearchOpenChange }: { onSearchOpenChange?: (open: boolean) => void } = {}) => {
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
  const [perfilLabel, setPerfilLabel] = useState<string>('');
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
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('perfil_contexto, perfil_tipos')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.perfil_contexto) setPerfilLabel(String(data.perfil_contexto));
      else if (Array.isArray(data?.perfil_tipos) && data.perfil_tipos.length > 0) {
        const mapa: Record<string, string> = {
          faculdade: 'Estudante de Direito',
          oab: 'Concurseiro OAB',
          concurso: 'Concurseiro',
          advogado: 'Advogado(a)',
        };
        setPerfilLabel(mapa[data.perfil_tipos[0] as string] || 'Estudante de Direito');
      }
    })();
  }, [user?.id]);

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
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
        style={{
          transform: 'translateZ(0)',
          backgroundColor: '#881337',
          background: 'linear-gradient(135deg, hsl(350 68% 32%) 0%, hsl(350 74% 42%) 50%, hsl(348 80% 50%) 100%)',
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[500px] left-0 right-0 h-[500px] z-0"
          style={{ backgroundColor: '#881337' }}
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 bg-hero-panel z-0" />

        {/* Overlays radiais idênticos ao painel do Vade Mecum */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {/* Decorative legal motifs isolados */}
        <HeroMotifs />

        {/* Cover art — isolado */}
        <HeroCoverCarousel covers={HERO_COVERS} />

        {/* Bottom-up gradient for text legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        {/* Header com Avatar, Perfil, Notificações e Menu */}
        <HomeUserHeader
          nome={nome}
          perfilLabel={perfilLabel}
          avatarUrl={avatarUrl}
          iniciais={iniciais}
          unreadCount={unreadCount}
          onOpenNotif={() => setNotifOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <div className="relative px-4 pt-5 pb-5 min-h-[240px] flex flex-col gap-4">
          {/* Logo e subtítulo dinâmico */}
          <HomeBrandBanner />

          {/* Barra de Pesquisa Animada */}
          <HomeSearchButton onOpenSearch={() => setSearchOpen(true)} />

          {/* Atalhos Rápidos */}
          <HomeActionShortcuts />
        </div>
      </div>

      <Suspense fallback={null}>{menuOpen && <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}</Suspense>
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
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
      <RecentesOverlay
        open={recentesOpen}
        onClose={() => setRecentesOpen(false)}
        onSelectLei={(lei) => {
          setRecentesOpen(false);
          pushRecente(lei);
          navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.leiId, nome: lei.nome })}`);
        }}
      />
    </>
  );
};

export default HomeHeaderHero;
