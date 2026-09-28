import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

import horusOwlAsset from '@/assets/horus/horus-owl.webp.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwl1 from '@/assets/horus/01_coruja_oratoria.webp';
import horusOwl2 from '@/assets/horus/02_coruja_estudando.webp';
import horusOwl3 from '@/assets/horus/03_coruja_balanca_justica.webp';
import horusOwl4 from '@/assets/horus/04_coruja_maleta_balanca.webp';
import horusWhatsapp from '@/assets/horus/coruja_whatsapp.png';
import horusBiblioteca from '@/assets/horus/coruja_biblioteca.png';
import horusAudioaulas from '@/assets/horus/coruja_audioaulas.png';
import horusVideoaulas from '@/assets/horus/coruja_videoaulas.png';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

interface EmAltaItem {
  id: string;
  title: string;
  route: string;
  bgGradient: string;
  sparkleColor: string;
  owlImage: string;
}

const EM_ALTA_ITEMS: EmAltaItem[] = [
  { 
    id: 'biblioteca', 
    title: 'Biblioteca', 
    route: '/bibliotecas', 
    bgGradient: 'from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A]', // Azul (Radar)
    sparkleColor: 'text-blue-200',
    owlImage: horusBiblioteca 
  },
  { 
    id: 'resumos', 
    title: 'Resumos', 
    route: '/resumos-juridicos', 
    bgGradient: 'from-[#E11D48] via-[#BE123C] to-[#7F1D1D]', // Vermelho
    sparkleColor: 'text-rose-200',
    owlImage: horusOwl2 
  },
  { 
    id: 'assistente', 
    title: 'Assistente no WhatsApp', 
    route: '/assistente-horus', 
    bgGradient: 'from-[#059669] via-[#047857] to-[#064E3B]', // Verde
    sparkleColor: 'text-emerald-200',
    owlImage: horusWhatsapp 
  },
  { 
    id: 'audioaulas', 
    title: 'Audioaulas', 
    route: '/audioaulas', 
    bgGradient: 'from-[#D97706] via-[#B45309] to-[#78350F]', // Laranja (Boletins)
    sparkleColor: 'text-amber-200',
    owlImage: horusAudioaulas 
  },
  { 
    id: 'videoaulas', 
    title: 'Videoaulas', 
    route: '/videoaulas', 
    bgGradient: 'from-[#0891B2] via-[#0E7490] to-[#164E63]', // Cyan
    sparkleColor: 'text-cyan-200',
    owlImage: horusVideoaulas 
  },
  { 
    id: 'vademecum', 
    title: 'Vade Mecum', 
    route: '/vade-mecum', 
    bgGradient: 'from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]', // Roxo
    sparkleColor: 'text-purple-200',
    owlImage: horusOwl4 
  },
];

// Array multiplicado para criar efeito de loop infinito
const INFINITE_ITEMS = Array.from({ length: 14 }).flatMap((_, index) => 
  EM_ALTA_ITEMS.map(item => ({ ...item, uniqueId: `${item.id}-${index}` }))
);
// Total = 84 itens. O centro aproximado é o index 42.

const HomeHorusBannerCarousel = () => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Inicializamos no meio do array gigantesco para permitir scroll para trás e para frente infinitamente
  const [activeIndex, setActiveIndex] = useState(42);
  const userInteractingRef = useRef(false);
  const isInitialScrollDone = useRef(false);

  // Define a posição inicial no meio do array sem animação para o usuário não perceber
  useEffect(() => {
    if (!scrollerRef.current || isInitialScrollDone.current) return;
    const scroller = scrollerRef.current;
    const targetChild = scroller.children[42 + 1] as HTMLElement;
    if (targetChild) {
      const containerWidth = scroller.clientWidth;
      const targetLeft = targetChild.offsetLeft;
      const targetWidth = targetChild.clientWidth;
      const scrollPos = targetLeft - containerWidth / 2 + targetWidth / 2;
      scroller.scrollTo({ left: scrollPos, behavior: 'instant' });
      isInitialScrollDone.current = true;
    }
  }, []);

  // IntersectionObserver para detectar qual card está no centro
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
        });

        let maxRatio = -1;
        let bestTarget: Element | null = null;
        ratios.forEach((ratio, target) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            bestTarget = target;
          }
        });

        if (bestTarget) {
          const idx = Array.from(scroller.children).indexOf(bestTarget) - 1;
          if (idx >= 0 && idx < INFINITE_ITEMS.length) {
            setActiveIndex(idx);
          }
        }
      },
      {
        root: scroller,
        threshold: Array.from({ length: 11 }, (_, i) => i / 10),
      }
    );

    Array.from(scroller.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      if (userInteractingRef.current) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      let nextIndex = activeIndex + 1;
      // Se por um milagre chegar no final, joga de volta pro meio invisivelmente
      if (nextIndex >= INFINITE_ITEMS.length - 2) {
        nextIndex = 42;
        const targetChild = scroller.children[nextIndex + 1] as HTMLElement;
        if (targetChild) {
          const containerWidth = scroller.clientWidth;
          const targetLeft = targetChild.offsetLeft;
          const targetWidth = targetChild.clientWidth;
          scroller.scrollTo({ left: targetLeft - containerWidth / 2 + targetWidth / 2, behavior: 'instant' });
          setActiveIndex(nextIndex);
          return;
        }
      }
      
      const targetChild = scroller.children[nextIndex + 1] as HTMLElement;
      if (targetChild) {
        const containerWidth = scroller.clientWidth;
        const targetLeft = targetChild.offsetLeft;
        const targetWidth = targetChild.clientWidth;
        const scrollPos = targetLeft - containerWidth / 2 + targetWidth / 2;
        scroller.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const pauseInteraction = () => {
    userInteractingRef.current = true;
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 6000); // pausa por mais tempo ao interagir
  };

  const handleItemClick = (route: string) => {
    haptic.selection();
    pauseInteraction();
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {}
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    navigate(route);
  };

  return (
    <div className="flex flex-col mb-4 mt-2 w-full">
      <div className="mb-1 relative z-10 flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-foreground text-[18px] font-bold mb-0.5 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
            Em alta
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 truncate">
            Ferramentas complementares para seus estudos
          </p>
        </div>
      </div>

      {/* Container com scroll horizontal (margin negativa para permitir as laterais vazadas) */}
      <div 
        ref={scrollerRef}
        onPointerDown={pauseInteraction}
        onTouchStart={pauseInteraction}
        onScroll={pauseInteraction}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 hide-scrollbar -mx-4 pb-4 pt-2 scroll-smooth"
      >
        <div className="w-[calc(50vw-72.5px-16px)] shrink-0 pointer-events-none" />

        {INFINITE_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          
          return (
            <div
              key={item.uniqueId}
              onClick={() => {
                if (!isActive && scrollerRef.current) {
                  haptic.selection();
                  pauseInteraction();
                  const targetChild = scrollerRef.current.children[i + 1] as HTMLElement;
                  if (targetChild) {
                    const containerWidth = scrollerRef.current.clientWidth;
                    const targetLeft = targetChild.offsetLeft;
                    const targetWidth = targetChild.clientWidth;
                    const scrollPos = targetLeft - containerWidth / 2 + targetWidth / 2;
                    scrollerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
                  }
                } else {
                  handleItemClick(item.route);
                }
              }}
              className={`w-[145px] h-[135px] shrink-0 snap-center relative cursor-pointer transition-all duration-500 ease-out group ${
                isActive ? 'scale-105 opacity-100 z-10' : 'scale-[0.92] opacity-70 grayscale-[20%]'
              }`}
            >
              {/* Background Layer */}
              <div className={`absolute inset-x-0 bottom-0 top-7 rounded-[1.2rem] shadow-xl bg-gradient-to-br ${item.bgGradient} border border-white/10 overflow-hidden transition-transform duration-500 ${isActive ? 'shadow-2xl' : 'shadow-none'}`}>
                {/* Efeito de Reflexo (Shimmer) */}
                {isActive && (
                  <div className="absolute inset-0 z-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-once pointer-events-none" />
                )}
                {/* SVGs jurídicos decorativos ao fundo */}
                <svg
                  aria-hidden
                  viewBox="0 0 200 200"
                  className="pointer-events-none absolute -right-2 -bottom-4 w-[110px] h-[110px] text-white/10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
                  <path d="M35 95 Q55 135 75 95 Z" />
                  <path d="M125 95 Q145 135 165 95 Z" />
                </svg>
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  className="pointer-events-none absolute top-1 right-8 w-[45px] h-[45px] text-white/10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M18 78 L58 38" />
                  <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
                  <path d="M10 88 H50" />
                </svg>
              </div>

              {/* Owl Image vazado no topo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[90px] pointer-events-none z-20 flex justify-center">
                <img
                  src={item.owlImage}
                  alt={item.title}
                  className={`w-full h-full object-contain filter transition-all duration-500 ${isActive ? 'drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] saturate-[1.1] animate-float' : 'drop-shadow-none saturate-[0.8] translate-y-2'}`}
                  loading="lazy"
                />
              </div>

              {/* Text Content */}
              <div className="absolute inset-x-0 bottom-0 top-7 flex items-end justify-center px-3 pb-3.5 z-30">
                <h3 className={`font-sans font-bold leading-tight text-center transition-colors duration-500 ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[13px]' : 'text-white/80 text-[12.5px]'}`}>
                  {item.title}
                </h3>
              </div>
            </div>
          );
        })}
        <div className="w-[calc(50vw-72.5px-16px)] shrink-0 pointer-events-none" />
      </div>
    </div>
  );
};

export default memo(HomeHorusBannerCarousel);
