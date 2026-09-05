import { useState, useEffect, useRef, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { motion, AnimatePresence } from 'framer-motion';
import {pickAsset, assetUrl, srcOf } from '@/lib/assetUrl';
import { Menu as MenuIcon, Search, Scale, BookOpen, Clock, Eye, Quote, Lightbulb, ScrollText, History, ChevronLeft, User as UserIcon, Mic, Radar, MapPin, Monitor, Library, Bell, GraduationCap, Target, CloudOff, ListChecks, Camera } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { VintageClockIcon } from '@/components/icons/VintageClockIcon';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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
import { useHomeCuriosidades } from '@/hooks/useHomeCuriosidades';
import { useHeroMotifsConfig } from '@/hooks/useHeroMotifsConfig';
import { HERO_ANIMATIONS } from '@/lib/heroAnimations';
const COVER_POSITIONS = ['right', 'left', 'center', 'right', 'left'] as const;
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
const SUBTITLES = [
  'Uso Profissional',
  'Para Estudantes',
  'Para Advogados',
  'Para Concurseiros',
  'Para Professores',
  'Para Servidores',
  'Para Magistrados',
];
import logoVacatioAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import logoVacatioBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
const logoVacatio = pickAsset(logoVacatioBundled, srcOf(logoVacatioAsset));
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
import SearchOverlay from '@/components/vademecum/overlays/SearchOverlay';
import RecentesOverlay from '@/components/vademecum/overlays/RecentesOverlay';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import { pushRecente } from '@/lib/leisRecentes';
import { useShortcutBadges } from '@/hooks/useShortcutBadges';
import { prefetchHeroRoutesIdle, prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import scales from '@/assets/landing-tribunal/scales.png';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HeroCoverCarousel from '@/components/vademecum/home/HeroCoverCarousel';

const TIME_KEY = 'tempo_no_app_segundos';
const DAILY_GOAL_SECONDS = 60 * 60; // 1h/dia para o anel de progresso

const HomeHeaderHero = ({ onSearchOpenChange }: { onSearchOpenChange?: (open: boolean) => void } = {}) => {
  const navigate = useNavigate();
  const shortcutBadges = useShortcutBadges();
  const { user } = useAuth();
  const { data: profileSummary } = useProfileSummary();
  const { images: dbImages } = useHeroHomeImages();
  const { config: motifsConfig } = useHeroMotifsConfig();
  // Serve Supabase-hosted images via the image transform endpoint so the
  // browser gets a compressed WebP (with long-lived Cache-Control) instead of
  // the original PNG upload. Non-Supabase URLs and bundled assets pass through.
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
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [perfilLabel, setPerfilLabel] = useState<string>('');
  const reduceMotion = useRef(false);

  // Detecta reduce-motion para economizar bateria se o usuário preferir
  useEffect(() => {
    reduceMotion.current = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Prefetch dos 4 chunks das rotas dos atalhos em idle (Radares, Boletim, Blog, Biblioteca)
  useEffect(() => { prefetchHeroRoutesIdle(); }, []);

  // Pré-carrega o menu lateral em idle para que ele abra instantaneamente.
  useEffect(() => {
    const idle: any = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 500));
    idle(() => { import('@/components/vademecum/navigation/SideMenu').catch(() => {}); });
  }, []);

  // Carrossel de capas e motivos decorativos foram isolados em HeroCoverCarousel e HeroMotifs para performance.


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
      {/* Unified yellow shell — hero cover as full background; gray profile card floats inset with side margins */}
      <div
        className="relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[var(--sai-top)]"
        style={{
          transform: 'translateZ(0)',
          isolation: 'isolate',
          contain: 'paint',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          maskImage: 'radial-gradient(white, black)'
        }}
      >
        <div className="absolute inset-0 bg-hero-panel -z-10" />
        
        {/* ShapeGrid Padronizado (Fundo de Pílulas) */}
        <div className="absolute inset-0 z-[-9] opacity-40 mix-blend-overlay overflow-hidden rounded-b-[36px]" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
          <ShapeGrid 
            className="rounded-b-[36px]"
            speed={0.5} 
            squareSize={40}
            direction='diagonal'
            borderColor='rgba(255, 255, 255, 0.2)'
            hoverFillColor='rgba(255, 255, 255, 0.1)'
            shape='square'
            hoverTrailAmount={5}
          />
        </div>

        {/* Overlays radiais idênticos ao painel do DIREITO PRIME */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)] z-[-8]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)] z-[-8]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent z-[-8]" />

        {/* Decorative legal motifs isolados */}
        <HeroMotifs />
        {/* Balanças flutuantes de forma elegante */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
          <img
            src={scales}
            alt=""
            aria-hidden="true"
            className="absolute right-[8%] top-[18%] w-10 md:w-14 lp-float"
            style={{
              animationDirection: 'reverse',
              animationDuration: '7s',
              opacity: 0.6,
              filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.4))',
            }}
          />
          <img
            src={scales}
            alt=""
            aria-hidden="true"
            className="absolute bottom-[20%] left-[10%] w-8 md:w-12 lp-float"
            style={{
              animationDelay: '1.5s',
              animationDuration: '6.5s',
              opacity: 0.4,
            }}
          />
        </div>

        {/* Reflexo horizontal passando sobre os ícones esmaecidos */}
        


        {/* Cover art — isolado */}
        <HeroCoverCarousel covers={HERO_COVERS} />

        {/* Bottom-up gradient for text legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        {/* Floating gray profile card — inset with lateral margins */}
        <header className="relative px-3 pt-[calc(0.75rem+var(--sai-top))] md:px-6 md:pt-[calc(1.5rem+var(--sai-top,0px))] lg:px-8 lg:pt-8 flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 pr-3 pl-1">
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white bg-black/40 flex items-center justify-center shrink-0 shadow-lg shadow-black/50">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={nome}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  className="w-full h-full object-cover"
                />
              ) : iniciais ? (
                <span className="font-display text-white text-[14px] md:text-[16px] lg:text-[18px] font-bold">{iniciais}</span>
              ) : (
                <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white/80" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-white text-[17px] md:text-[19px] lg:text-[21px] font-bold leading-[1.15] truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                {nome}
              </p>
              {perfilLabel && (
                <p className="font-body text-white/95 text-[13.5px] md:text-[15px] lg:text-[16px] font-medium leading-tight truncate mt-0.5 md:mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                  {perfilLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={() => {
                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                setNotifOpen(true);
              }}
              aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
              className="relative w-11 h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-full bg-neutral-900/85 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
            >
              <Bell className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] md:text-[11px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onPointerDown={() => { import('@/components/vademecum/navigation/SideMenu').catch(() => {}); }}
              onClick={() => {
                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                setMenuOpen(true);
              }}
              aria-label="Abrir menu"
              className="w-11 h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-full bg-neutral-900/85 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
            >
              <MenuIcon className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
            </button>
          </div>
        </header>

        <div className="relative px-4 pt-5 pb-5 min-h-[240px] flex flex-col gap-4">
          {/* Centered brand block */}
          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <div className="relative h-24 mb-2 flex items-center justify-center">
              <img
                src="/logo-prime.png"
                alt="Direito Prime"
                loading="eager"
                decoding="sync"
                {...({ fetchpriority: 'high' } as any)}
                className="w-auto h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              />
            </div>
            <h1 className="font-serif italic text-white text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
              Estudos Jurídicos
            </h1>
            <div className="relative h-[16px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={subtitleIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] whitespace-nowrap"
                >
                  {SUBTITLES[subtitleIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Search bar */}
          <button
            type="button"
            onClick={() => {
              if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
              setSearchOpen(true);
            }}
            aria-label="Pesquisar artigos e leis"
            className="mt-auto relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
            <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
              <TypingHint />
            </span>
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
              PESQUISAR
            </div>
          </button>


          {/* Atalhos rápidos — abaixo da barra de pesquisa */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            {[
              { label: 'Aprender',    icon: GraduationCap,    to: '/aprender',     color: '#FACC15', badgeColor: null, badgeKey: null, prefetch: 'aprender' as any },
              { label: 'Flashcards',  icon: FlashcardsIcon,   to: '/flashcards',   color: '#34D399', badgeColor: null, badgeKey: null, prefetch: 'flashcards' as PrefetchKey },
              { label: 'Questões',    icon: ListChecks,       to: '/questoes',     color: '#F87171', badgeColor: null, badgeKey: null, prefetch: 'questoes' as PrefetchKey },
              { label: 'Me Explique', icon: Camera,           to: '/me-explique',  color: '#F97316', badgeColor: null, badgeKey: null, prefetch: 'meExplique' as PrefetchKey },
            ].map((item, index) => {
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? shortcutBadges.counts[item.badgeKey] : 0;
              return (
                <button
                  key={item.label}
                  onPointerDown={() => prefetchRoute(item.prefetch)}
                  onMouseEnter={() => prefetchRoute(item.prefetch)}
                  onFocus={() => prefetchRoute(item.prefetch)}
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    if (item.badgeKey) shortcutBadges.markSeen(item.badgeKey);
                    navigate(item.to);
                  }}
                  style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
                  className="group relative flex flex-col items-center justify-center gap-1 h-[72px] rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 shadow-lg shadow-black/30 active:scale-[0.96] transition shortcut-button-shine"
                >
                  {badgeCount > 0 && item.badgeColor && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10"
                      style={{ backgroundColor: item.badgeColor }}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}

                  <Icon
                    className="w-6 h-6"
                    style={{ color: item.color, filter: 'saturate(1.3) drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
                    strokeWidth={1.6}
                  />
                  <span className="font-display text-white text-[12px] font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

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

const HINTS = [
  'Pesquise o artigo...',
  'Pesquise a lei...',
  'Pesquise o número da lei...',
  'Pesquise trechos...',
  'Pesquise normas...',
  'Pesquise jurisprudência...',
  'Pesquise súmulas...',
  'Pesquise por voz...',
];

const TypingHint = () => {
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'paused' | 'erasing'>('typing');

  useEffect(() => {
    const current = HINTS[hintIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 90);
      } else {
        timer = setTimeout(() => setPhase('paused'), 1500);
      }
    } else if (phase === 'paused') {
      timer = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 50);
      } else {
        setHintIndex((i) => (i + 1) % HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="ml-0.5 inline-block w-[2px] h-[14px] bg-white/80 animate-pulse" />
    </span>
  );
};


type CardItem =
  | {
      type: 'stat';
      icon: React.ElementType;
      label: string;
      getValue: () => string;
      subtitle: string;
    }
  | {
      type: 'quote';
      icon: React.ElementType;
      label: string;
      frase: string;
      autor: string;
    }
  | {
      type: 'curiosity';
      icon: React.ElementType;
      label: string;
      texto: string;
    }
  | {
      type: 'termo';
      icon: React.ElementType;
      label: string;
      termo: string;
      significado: string;
    }
  | {
      type: 'db-curiosity';
      icon: React.ElementType;
      label: string;
      texto: string;
      cor: string;
      imagem_url: string | null;
    };

const PHILOSOPHER_QUOTES = [
  { frase: 'Onde não há lei, não há liberdade.', autor: 'Aristóteles' },
  { frase: 'A justiça é a alma da sociedade.', autor: 'Platão' },
  { frase: 'A justiça é a constante vontade de dar a cada um o que lhe é devido.', autor: 'Ulpiano' },
  { frase: 'A lei deve ser a razão do governo.', autor: 'Montesquieu' },
  { frase: 'Justiça é a virtude que ordena a sociedade.', autor: 'Cícero' },
  { frase: 'Sem justiça, o Estado não passa de uma grande quadrilha.', autor: 'Santo Agostinho' },
  { frase: 'O direito é a vontade geral manifestada nas leis.', autor: 'Rousseau' },
  { frase: 'A liberdade consiste em fazer tudo o que as leis permitem.', autor: 'Montesquieu' },
  { frase: 'A injustiça em qualquer lugar é uma ameaça à justiça em todo lugar.', autor: 'Martin Luther King' },
  { frase: 'A justiça atrasada não é justiça, senão injustiça qualificada e manifesta.', autor: 'Rui Barbosa' },
  { frase: 'O direito não socorre aos que dormem.', autor: 'Brocardo latino' },
  { frase: 'Dura lex, sed lex — a lei é dura, mas é a lei.', autor: 'Ulpiano' },
  { frase: 'Fiat justitia, ruat caelum — faça-se justiça, ainda que caiam os céus.', autor: 'Sêneca' },
  { frase: 'Todo poder emana do povo.', autor: 'Rousseau' },
  { frase: 'O homem é um animal político por natureza.', autor: 'Aristóteles' },
  { frase: 'A pena deve ser proporcional ao crime.', autor: 'Beccaria' },
  { frase: 'É melhor prevenir os crimes do que puni-los.', autor: 'Cesare Beccaria' },
  { frase: 'Não há crime sem lei anterior que o defina.', autor: 'Feuerbach' },
  { frase: 'A liberdade de um termina onde começa a do outro.', autor: 'John Stuart Mill' },
  { frase: 'A propriedade é um roubo.', autor: 'Proudhon' },
];

const LEGAL_CURIOSITIES = [
  { texto: 'A Constituição Federal de 1988 é a 7ª da história do Brasil.' },
  { texto: 'O Código Civil brasileiro atual tem 2.046 artigos e entrou em vigor em 2003.' },
  { texto: 'A OAB foi criada em 1930, meses antes da Revolução.' },
  { texto: 'O Código Penal vigente foi sancionado em 1940 por Getúlio Vargas.' },
  { texto: 'O STF foi criado em 1891, junto com a primeira República.' },
  { texto: 'A Lei Maria da Penha leva o nome da farmacêutica Maria da Penha Maia Fernandes.' },
  { texto: 'A CLT foi assinada em 1º de maio de 1943 e ainda está em vigor.' },
  { texto: 'A Constituição de 1988 é chamada de "Constituição Cidadã" por Ulysses Guimarães.' },
  { texto: 'Habeas Corpus significa literalmente "que tenhas o teu corpo".' },
  { texto: 'O Brasil já teve 7 Constituições: 1824, 1891, 1934, 1937, 1946, 1967 e 1988.' },
  { texto: 'A Lei Áurea (1888) tem apenas 2 artigos — uma das mais curtas do Brasil.' },
  { texto: 'O júri popular está previsto na Constituição desde 1822.' },
  { texto: 'O Código de Defesa do Consumidor é de 1990 (Lei 8.078).' },
  { texto: 'A Lei da Ficha Limpa (2010) surgiu por iniciativa popular com 1,6 milhão de assinaturas.' },
  { texto: 'O voto feminino no Brasil foi conquistado em 1932.' },
  { texto: 'A pena de morte é proibida no Brasil, salvo em caso de guerra declarada.' },
  { texto: 'O Marco Civil da Internet (Lei 12.965/2014) foi pioneiro no mundo.' },
  { texto: 'O Estatuto da Criança e do Adolescente (ECA) é de 1990.' },
  { texto: 'A Lei de Introdução às Normas do Direito Brasileiro (LINDB) é de 1942.' },
  { texto: 'O CPC atual entrou em vigor em 2016, substituindo o de 1973.' },
  { texto: 'Rui Barbosa é chamado de "Águia de Haia" por sua atuação na Conferência da Paz de 1907.' },
  { texto: 'A LGPD (Lei Geral de Proteção de Dados) entrou em vigor em 2020.' },
  { texto: 'O Tribunal do Júri no Brasil julga apenas crimes dolosos contra a vida.' },
  { texto: 'A Lei Seca brasileira (Lei 11.705/2008) reduziu em 40% as mortes no trânsito.' },
  { texto: 'A Constituição de 1824 foi outorgada por Dom Pedro I e durou 65 anos.' },
];

const TERMOS_JURIDICOS = [
  { termo: 'Ab initio', significado: 'Desde o início.' },
  { termo: 'Ad hoc', significado: 'Para uma finalidade específica.' },
  { termo: 'Data venia', significado: 'Com o devido respeito.' },
  { termo: 'De cujus', significado: 'Pessoa falecida cuja sucessão se discute.' },
  { termo: 'Erga omnes', significado: 'Que produz efeitos contra todos.' },
  { termo: 'Ex tunc', significado: 'Efeito retroativo, desde então.' },
  { termo: 'Ex nunc', significado: 'Efeito a partir de agora, sem retroagir.' },
  { termo: 'Habeas Data', significado: 'Ação para acessar/corrigir informações pessoais em registros públicos.' },
  { termo: 'In dubio pro reo', significado: 'Na dúvida, decide-se em favor do réu.' },
  { termo: 'Inter partes', significado: 'Efeito que vale apenas entre as partes envolvidas.' },
  { termo: 'Litispendência', significado: 'Existência de duas ações idênticas em curso.' },
  { termo: 'Mandado de Segurança', significado: 'Ação que protege direito líquido e certo contra ato de autoridade.' },
  { termo: 'Nulla poena sine lege', significado: 'Não há pena sem lei anterior que a defina.' },
  { termo: 'Pacta sunt servanda', significado: 'Os pactos devem ser cumpridos.' },
  { termo: 'Res judicata', significado: 'Coisa julgada — decisão da qual não cabe mais recurso.' },
  { termo: 'Sub judice', significado: 'Assunto que ainda está sendo julgado.' },
  { termo: 'Ubi lex non distinguit', significado: 'Onde a lei não distingue, não cabe ao intérprete distinguir.' },
  { termo: 'Vacatio legis', significado: 'Período entre a publicação e a entrada em vigor da lei.' },
  { termo: 'Amicus curiae', significado: '"Amigo da corte" — terceiro que auxilia o tribunal.' },
  { termo: 'Bis in idem', significado: 'Punir alguém duas vezes pelo mesmo fato.' },
  { termo: 'Caput', significado: 'Cabeça do artigo — parte principal antes dos parágrafos.' },
  { termo: 'Culpa in vigilando', significado: 'Culpa por falta de vigilância.' },
  { termo: 'Dolo', significado: 'Vontade consciente de praticar o ato ilícito.' },
  { termo: 'Fumus boni iuris', significado: 'Fumaça do bom direito — plausibilidade do direito alegado.' },
  { termo: 'Periculum in mora', significado: 'Perigo na demora — risco de dano pelo atraso.' },
];

export const RotatingStatCard = ({ wide = false }: { wide?: boolean } = {}) => {
  const { items: dbCuriosidades } = useHomeCuriosidades();
  const [seconds, setSeconds] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(TIME_KEY) || '0');
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  });
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const persist = setInterval(() => {
      try { localStorage.setItem(TIME_KEY, String(secondsRef.current)); } catch {}
    }, 5000);
    const flush = () => { try { localStorage.setItem(TIME_KEY, String(secondsRef.current)); } catch {} };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', flush);
    return () => {
      clearInterval(tick);
      clearInterval(persist);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, []);

  const totalMinutes = Math.floor(seconds / 60);
  const displayTime =
    totalMinutes < 60
      ? `${totalMinutes}:${(seconds % 60).toString().padStart(2, '0')}`
      : `${Math.floor(totalMinutes / 60)}h ${(totalMinutes % 60).toString().padStart(2, '0')}min`;
  const pct = Math.min(100, (seconds / DAILY_GOAL_SECONDS) * 100);

  const totalLeis = LEIS_CATALOG.length.toLocaleString('pt-BR');

  const [artigosVistos, setArtigosVistos] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('artigos_vistos') || '0');
  });
  useEffect(() => {
    const sync = () => setArtigosVistos(Number(localStorage.getItem('artigos_vistos') || '0'));
    const t = setInterval(sync, 3000);
    window.addEventListener('focus', sync);
    return () => { clearInterval(t); window.removeEventListener('focus', sync); };
  }, []);

  const artigosSubtitle =
    artigosVistos === 0
      ? 'Abra um artigo para começar'
      : artigosVistos < 10
        ? 'Bom começo, continue!'
        : artigosVistos < 50
          ? 'Você está evoluindo 🔥'
          : artigosVistos < 200
            ? 'Estudante dedicado'
            : 'Referência em conhecimento';

  const baseItems: CardItem[] = [
    {
      type: 'stat',
      icon: Layers,
      label: 'Leis no acervo',
      getValue: () => totalLeis,
      subtitle: 'sempre atualizadas',
    },
    {
      type: 'stat',
      icon: Clock,
      label: 'Tempo de estudo',
      getValue: () => displayTime,
      subtitle: 'meta diária 1h',
    },
    {
      type: 'stat',
      icon: Eye,
      label: 'Artigos visualizados',
      getValue: () => artigosVistos.toLocaleString('pt-BR'),
      subtitle: artigosSubtitle,
    },
    ...PHILOSOPHER_QUOTES.map((q): CardItem => ({
      type: 'quote',
      icon: Quote,
      label: 'Pensamento jurídico',
      frase: q.frase,
      autor: q.autor,
    })),
    ...LEGAL_CURIOSITIES.map((c): CardItem => ({
      type: 'curiosity',
      icon: Lightbulb,
      label: 'Curiosidade jurídica',
      texto: c.texto,
    })),
    ...TERMOS_JURIDICOS.map((t): CardItem => ({
      type: 'termo',
      icon: ScrollText,
      label: 'Termo jurídico',
      termo: t.termo,
      significado: t.significado,
    })),
    ...dbCuriosidades.map((c): CardItem => ({
      type: 'db-curiosity',
      icon: Lightbulb,
      label: 'Curiosidade',
      texto: c.texto,
      cor: c.cor,
      imagem_url: c.imagem_url,
    })),
  ];

  const items = baseItems;

  // Persist rotation so user sees a different card each visit; loops after seeing all.
  const IDX_KEY = 'home_stat_card_idx';
  const [idx, setIdx] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(IDX_KEY) || '0');
    const next = (Number.isFinite(raw) ? raw : 0) % baseItems.length;
    try { localStorage.setItem(IDX_KEY, String((next + 1) % baseItems.length)); } catch {}
    return next;
  });
  useEffect(() => {
    const it = setInterval(() => setIdx((i) => {
      const n = (i + 1) % items.length;
      try { localStorage.setItem(IDX_KEY, String((n + 1) % items.length)); } catch {}
      return n;
    }), 10000);
    return () => clearInterval(it);
  }, [items.length]);


  const renderCard = (item: CardItem, i: number, keyed = false) => {
    const Icon = item.icon;
    const isStat = item.type === 'stat';
    const isTempo = isStat && item.label === 'Tempo de estudo';
    const isDbCur = item.type === 'db-curiosity';
    const accent = isDbCur ? item.cor : undefined;
    return (
      <div
        key={keyed ? i : undefined}
        className={`relative ${wide ? 'min-h-[160px]' : 'w-[220px] sm:w-[245px] md:w-[280px] lg:w-[300px] aspect-[4/3.6]'} rounded-2xl bg-[#212121]/95 border border-white/10 p-3.5 sm:p-4 md:p-5 backdrop-blur-md overflow-hidden shadow-xl shadow-black/40`}
        style={isDbCur ? { borderColor: `${accent}55` } : undefined}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/15 via-white/[0.03] to-transparent pointer-events-none"
          style={isDbCur ? { background: `linear-gradient(135deg, ${accent}20, transparent 60%)` } : undefined}
        />
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        {isDbCur && item.imagem_url ? (
          <img
            src={item.imagem_url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain object-right opacity-[0.28] pointer-events-none mix-blend-screen"
          />
        ) : (
          <Icon className="absolute -right-3 -bottom-3 w-24 h-24 text-primary/[0.06] pointer-events-none" strokeWidth={1.5} />
        )}

        <div className="relative h-full flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 shrink-0">
              {isTempo ? (
                <>
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${pct * 0.97} 100`}
                      style={{ transition: 'stroke-dasharray 0.8s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </>
              ) : isDbCur ? (
                <div
                  className="w-full h-full rounded-xl border flex items-center justify-center"
                  style={{ background: `${accent}22`, borderColor: `${accent}55` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <p
              className="font-body text-white/70 text-[10px] uppercase tracking-[0.14em] leading-tight flex-1 min-w-0"
              style={isDbCur ? { color: `${accent}dd` } : undefined}
            >
              {item.label}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0 mt-1">
            {isStat ? (
              <>
                <p className="font-display text-white text-[26px] sm:text-[28px] font-bold leading-none tabular-nums truncate">
                  {item.getValue()}
                </p>
                <p className="font-body text-white/60 text-[11px] leading-snug mt-1.5 line-clamp-2">
                  {item.subtitle}
                </p>
              </>
            ) : item.type === 'quote' ? (
              <div className="space-y-1">
                <p className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-3">
                  “{item.frase}”
                </p>
                <p className="font-body text-primary/80 text-[11px] leading-tight">
                  — {item.autor}
                </p>
              </div>
            ) : item.type === 'termo' ? (
              <div className="space-y-1">
                <p className="font-display text-primary text-[15px] sm:text-[16px] font-bold leading-tight truncate">
                  {item.termo}
                </p>
                <p className="font-body text-white/85 text-[11.5px] leading-snug line-clamp-3">
                  {item.significado}
                </p>
              </div>
            ) : item.type === 'db-curiosity' ? (
              <p
                className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                style={{ textShadow: `0 0 20px ${accent}22` }}
              >
                {item.texto}
              </p>
            ) : (
              <p className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-4">
                {item.texto}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <ScrollText className="w-3 h-3 text-primary/70 shrink-0" />
              <p className="font-body text-white/50 text-[9px] sm:text-[10px] leading-tight truncate">
                {totalLeis} leis disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (wide) {
    // Duplicamos os itens para dar sensação de carrossel infinito (loop visual).
    const looped = [...items, ...items];
    return (
      <div
        className="-mx-4 pl-10 pr-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '2.5rem', scrollPaddingRight: '1rem' }}
      >
        {looped.map((item, i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-[82%]"
          >
            {renderCard(item, i)}
          </div>
        ))}
      </div>
    );
  }


  const current = items[idx];
  return (
    <div key={idx} className="animate-in fade-in slide-in-from-right-3 duration-500">
      {renderCard(current, idx)}
    </div>
  );
};

/* Avatar with graceful fallback (Google photo often 403s without no-referrer) */
const AvatarWithFallback = ({ src, nome, iniciais }: { src?: string; nome: string; iniciais: string }) => {
  const [errored, setErrored] = useState(false);
  const show = src && !errored;
  return show ? (
    <img
      src={src}
      alt={nome}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      loading="eager"
      decoding="async"
      onError={() => setErrored(true)}
      className="w-12 h-12 rounded-full object-cover border-[2.5px] border-primary/70 shadow-lg shadow-black/40 shrink-0 bg-primary/20"
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-primary/20 border-[2.5px] border-primary/70 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
      <span className="font-display text-primary text-base font-bold">{iniciais || 'V'}</span>
    </div>
  );
};

export default HomeHeaderHero;
