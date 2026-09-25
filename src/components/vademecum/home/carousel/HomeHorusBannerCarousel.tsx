import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Star, ChevronRight, ChevronLeft, LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

import horusOwlAsset from '@/assets/horus/horus-owl.webp.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwl1 from '@/assets/horus/01_coruja_oratoria.webp';
import horusOwl2 from '@/assets/horus/02_coruja_estudando.webp';
import horusOwl3 from '@/assets/horus/03_coruja_balanca_justica.webp';
import horusOwl4 from '@/assets/horus/04_coruja_maleta_balanca.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

interface BannerConfig {
  id: string;
  headerTitle: string;
  headerSub: string;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  sparkleColor: string;
  title: string;
  route: string;
  textColor: string;
  owlImage: string;
  descriptions: string[];
}

const BANNERS: BannerConfig[] = [
  {
    id: 'horus',
    headerTitle: 'Horus · Assistente Jurídico',
    headerSub: 'Tire dúvidas e gere revisões 24h no WhatsApp',
    accentColor: '#E11D48',
    bgGradient: 'from-[#E11D48] via-[#BE123C] to-[#7F1D1D]',
    borderColor: 'border-rose-400/30',
    shadowColor: 'shadow-rose-950/40',
    sparkleColor: 'text-rose-200',
    title: 'ASSISTENTE NO WHATSAPP',
    route: '/assistente-horus',
    textColor: 'text-rose-100/90',
    owlImage: horusOwl,
    descriptions: [
      'Crie flashcards de revisão',
      'Seu tutor inteligente 24h',
      'Tire dúvidas pelo WhatsApp',
      'Peça resumos de leis',
      'Pesquise jurisprudência',
      'Explique termos difíceis',
      'Gere casos práticos',
      'Tabelas comparativas na hora',
      'Entenda a Lei Seca rápido',
      'Simule questões de provas',
    ],
  },
  {
    id: 'radar',
    headerTitle: 'Radar de Leis · Monitoramento',
    headerSub: 'Acompanhe mudanças e projetos em tempo real',
    accentColor: '#2563EB',
    bgGradient: 'from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A]',
    borderColor: 'border-blue-400/35',
    shadowColor: 'shadow-blue-950/40',
    sparkleColor: 'text-blue-200',
    title: 'RADAR DE LEIS',
    route: '/radares',
    textColor: 'text-blue-100/90',
    owlImage: horusOwl4,
    descriptions: [
      'Monitore novas leis e prazos',
      'Acompanhe projetos em tempo real',
      'Alertas de mudanças legislativas',
      'Tramitações no Congresso',
      'Atualizações diárias de normas',
      'Novidades do DOU em primeira mão',
      'Prazos e vigências comentadas',
    ],
  },
  {
    id: 'boletins',
    headerTitle: 'Boletins · Informativos Jurídicos',
    headerSub: 'Informativos e notícias jurídicas diárias',
    accentColor: '#D97706',
    bgGradient: 'from-[#D97706] via-[#B45309] to-[#78350F]',
    borderColor: 'border-amber-400/35',
    shadowColor: 'shadow-amber-950/40',
    sparkleColor: 'text-amber-200',
    title: 'BOLETINS JURÍDICOS',
    route: '/boletins',
    textColor: 'text-amber-100/95',
    owlImage: horusOwl2,
    descriptions: [
      'Informativos do STF e STJ',
      'Resumos diários dos Tribunais',
      'Jurisprudência comentada',
      'Notícias jurídicas essenciais',
      'Teses e súmulas recentes',
      'Áudios e vídeos diários',
      'Atualização rápida para advogados',
    ],
  },
];

const AUTOPLAY_INTERVAL = 6000;

const HomeHorusBannerCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [descIndices, setDescIndices] = useState<number[]>([0, 0, 0]);
  const isInteractingRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeBanner = BANNERS[currentIndex];

  const pauseInteraction = useCallback(() => {
    isInteractingRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 12000);
  }, []);

  const paginate = useCallback((direction: number) => {
    haptic.selection();
    pauseInteraction();
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 300;
    const nextIndex = (currentIndex + direction + BANNERS.length) % BANNERS.length;
    el.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
    setCurrentIndex(nextIndex);
  }, [currentIndex, pauseInteraction]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 300;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setCurrentIndex(Math.max(0, Math.min(BANNERS.length - 1, idx)));
  }, []);

  // Rotação periódica de descrições dentro de cada banner
  useEffect(() => {
    const timer = setInterval(() => {
      setDescIndices((prev) =>
        prev.map((idx, i) => (idx + 1) % BANNERS[i].descriptions.length)
      );
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Auto-play do carrossel infinito
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;
      const el = scrollerRef.current;
      if (!el) return;
      const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 300;
      const nextIndex = (currentIndex + 1) % BANNERS.length;
      el.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
      setCurrentIndex(nextIndex);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleBannerClick = (route: string) => {
    haptic.selection();
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {}
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    navigate(route);
  };

  return (
    <div className="flex flex-col items-center mb-8 mt-6 px-3">
      {/* 1. TÍTULO DINÂMICO COM RISQUINHO SUPERIOR */}
      <div className="flex items-center justify-between w-full max-w-[320px] mb-2.5 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <motion.span
            key={`bar-${activeBanner.id}`}
            initial={{ scaleY: 0.6, opacity: 0.5 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="w-1.5 h-4.5 rounded-full shrink-0"
            style={{ backgroundColor: activeBanner.accentColor }}
          />
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.h4
                key={`title-${activeBanner.id}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="font-display text-[14px] font-bold text-foreground leading-tight truncate uppercase tracking-wider"
              >
                {activeBanner.headerTitle}
              </motion.h4>
            </AnimatePresence>
          </div>
        </div>

        {/* Setinhas de navegação rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => paginate(-1)}
            aria-label="Anterior"
            className="w-6 h-6 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Próximo"
            className="w-6 h-6 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. ÁREA DO CARROSSEL SCROLLÁVEL */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={pauseInteraction}
        onTouchStart={pauseInteraction}
      >
        {BANNERS.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => handleBannerClick(banner.route)}
            className={`snap-center shrink-0 w-[86vw] max-w-[315px] h-[115px] group relative flex items-center bg-gradient-to-r ${banner.bgGradient} text-white pl-4.5 pr-22 py-3 rounded-[1.2rem] shadow-xl ${banner.shadowColor} transition-all active:scale-[0.98] border ${banner.borderColor} overflow-visible text-left`}
          >
            {/* SVGs decorativos de fundo */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.2rem] pointer-events-none">
              <Sparkles className={`absolute top-2 left-4 w-5 h-5 ${banner.sparkleColor} opacity-20`} />
              <Zap className={`absolute bottom-1 left-24 w-8 h-8 ${banner.sparkleColor} opacity-10`} />
              <Star className={`absolute top-1/2 left-32 w-4 h-4 ${banner.sparkleColor} opacity-15`} />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            </div>

            {/* Textos à esquerda */}
            <div className="flex flex-col items-start text-left z-10 min-w-0 flex-1">
              <span className="text-[13.5px] font-display font-black uppercase tracking-wider flex items-center gap-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-tight whitespace-nowrap">
                {banner.title}
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  <ChevronRight className="w-3.5 h-3.5 opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </motion.div>
              </span>

              {/* Subtítulo dinâmico com transição vertical */}
              <div className="h-4 relative w-full overflow-hidden mt-1">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={descIndices[i]}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28 }}
                    className={`absolute text-[11px] font-body ${banner.textColor} leading-snug font-semibold whitespace-nowrap truncate w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
                  >
                    {banner.descriptions[descIndices[i]]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Imagem do mascote Horus e texto no pé */}
            <div className="absolute -right-3 -top-7 w-[105px] flex flex-col items-center pointer-events-none z-20">
              <img
                src={banner.owlImage}
                alt="Horus"
                loading="eager"
                decoding="async"
                className="w-full h-[105px] object-contain drop-shadow-2xl filter saturate-[1.1]"
              />
              <span className="text-[10px] sm:text-[10.5px] font-display font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] -mt-2.5 relative z-10 bg-black/40 px-2 py-0.5 rounded-full border border-white/20">
                HORUS
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. DOTS INDICADORES DE POSIÇÃO */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {BANNERS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              haptic.selection();
              pauseInteraction();
              const el = scrollerRef.current;
              if (!el) return;
              const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 300;
              el.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
              setCurrentIndex(i);
            }}
            aria-label={`Ir para banner ${b.headerTitle}`}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? 'w-5'
                : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            style={{
              backgroundColor: i === currentIndex ? activeBanner.accentColor : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(HomeHorusBannerCarousel);
