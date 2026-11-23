import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import horusOwl from '@/assets/horus/horus-owl.webp';

export interface BannerDestaqueItem {
  id: string;
  tag: string;
  nome: string;
  subtitulo: string;
  color: string;
  icon?: LucideIcon;
  imageSrc?: string;
  to: string;
}

const BASE_BANNER_ITEMS: BannerDestaqueItem[] = [
  {
    id: 'aulas',
    tag: 'Aulas Interativas',
    nome: 'Aulas de Direito',
    subtitulo: 'Domine as matérias',
    color: '#E11D48', // Vermelho Carmesim
    icon: GraduationCap,
    to: '/aulas',
  },
  {
    id: 'horus',
    tag: 'Assistente no WhatsApp',
    nome: 'Hórus WhatsApp',
    subtitulo: 'Tire dúvidas em tempo real',
    color: '#EAB308', // Amarelo Dourado
    imageSrc: horusOwl, // Passarinho / Corujinha do Hórus
    to: '/assistente-horus',
  },
  {
    id: 'biblioteca',
    tag: 'Biblioteca Jurídica',
    nome: 'Biblioteca Digital',
    subtitulo: 'Obras fundamentais e clássicos',
    color: '#8B5CF6', // Roxo Violeta
    icon: BookOpen,
    to: '/bibliotecas',
  },
];

function shuffleArray<T>(items: readonly T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const HomeAulasInterativasBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Ordem aleatória a cada entrada no aplicativo
  const bannerItems = useMemo(() => shuffleArray(BASE_BANNER_ITEMS), []);

  // Contador para disparar a animação de reflexo sempre que entrar ou voltar para o Início
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimKey((prev) => prev + 1);
    }, 150);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        setAnimKey((prev) => prev + 1);
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [location.pathname, location.key]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      setActiveIndex(Math.max(0, Math.min(bannerItems.length - 1, idx)));
    }
  }, [bannerItems.length]);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    haptic.selection();
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  const handleClickItem = (item: BannerDestaqueItem) => {
    haptic.selection();
    navigate(item.to);
  };

  return (
    <div className="w-full flex flex-col gap-1.5 select-none">
      {/* Carrossel horizontal snap com largura total dos cards */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="w-full flex overflow-x-auto snap-x snap-mandatory gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {bannerItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = idx === activeIndex;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleClickItem(item)}
              style={{
                background: `linear-gradient(to right, ${item.color}33, ${item.color}0D)`,
                borderColor: `${item.color}4D`,
              }}
              className="w-full shrink-0 snap-center flex items-center gap-3 xs:gap-3.5 px-3.5 xs:px-4.5 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 min-h-[66px] xs:min-h-[72px] sm:min-h-[78px] rounded-2xl xs:rounded-3xl border text-left active:scale-[0.98] transition-transform overflow-hidden relative shadow-lg group cursor-pointer"
            >
              {/* Ícone principal à esquerda — SEM caixa de fundo, 100% limpo */}
              <div className="flex items-center justify-center shrink-0 z-10">
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.nome}
                    className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)] group-hover:scale-105 transition-transform select-none pointer-events-none"
                    loading="eager"
                    decoding="async"
                  />
                ) : Icon ? (
                  <Icon
                    className="w-7 h-7 xs:w-8 xs:h-8 sm:w-8.5 sm:h-8.5 drop-shadow-sm group-hover:scale-105 transition-transform"
                    style={{ color: item.color }}
                    strokeWidth={1.8}
                  />
                ) : null}
              </div>

              {/* Textos informativos centrais */}
              <div className="flex-1 min-w-0 z-10">
                <p
                  className="text-[9px] xs:text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: item.color }}
                >
                  {item.tag}
                </p>
                <p className="font-serif italic text-[15px] xs:text-[16px] sm:text-[17.5px] font-bold tracking-tight text-white truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] leading-tight">
                  {item.nome}
                </p>
                <p className="text-[10.5px] xs:text-[11px] sm:text-[11.5px] font-medium truncate flex items-center gap-1.5 text-zinc-300 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.subtitulo}</span>
                </p>
              </div>

              {/* Seta indicativa à direita calibrada e proporcional */}
              <ArrowRight
                className="w-5.5 h-5.5 xs:w-6 xs:h-6 shrink-0 z-10 group-hover:translate-x-1.5 transition-transform"
                style={{ color: item.color }}
                strokeWidth={2.4}
              />

              {/* Decoração de fundo — SVG translúcido no lado direito com glow temático */}
              <div
                className="absolute -right-2 -bottom-2 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center"
                style={{
                  filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${item.color}40)`,
                }}
              >
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="w-20 h-20 xs:w-22 xs:h-22 opacity-15 object-contain select-none pointer-events-none"
                    loading="lazy"
                    decoding="async"
                  />
                ) : Icon ? (
                  <Icon
                    className="w-20 h-20 xs:w-22 xs:h-22 opacity-15"
                    style={{ color: item.color }}
                    strokeWidth={1.2}
                  />
                ) : null}
              </div>

              {/* 🌟 ANIMAÇÃO DE REFLEXO / SHIMMER LUMINOSO */}
              <AnimatePresence>
                {animKey > 0 && isActive && (
                  <>
                    {/* Feixe Amplo de Reflexo Suave */}
                    <motion.div
                      key={`reflexo-broad-${animKey}-${item.id}`}
                      initial={{ x: '-160%', opacity: 0 }}
                      animate={{
                        x: ['-160%', '350%'],
                        opacity: [0, 0.85, 0.85, 0],
                      }}
                      transition={{
                        delay: 0.25,
                        duration: 1.15,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="pointer-events-none absolute inset-y-0 w-32 -skew-x-[25deg] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20"
                      style={{
                        filter: 'blur(4px)',
                      }}
                    />

                    {/* Linha Fina Brilhante de Alta Intensidade */}
                    <motion.div
                      key={`reflexo-sharp-${animKey}-${item.id}`}
                      initial={{ x: '-160%', opacity: 0 }}
                      animate={{
                        x: ['-160%', '360%'],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        delay: 0.35,
                        duration: 0.95,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="pointer-events-none absolute inset-y-0 w-10 -skew-x-[25deg] bg-gradient-to-r from-transparent via-white/80 to-transparent z-20"
                    />

                    {/* Pulso Luminoso no Contorno do Botão durante o Reflexo */}
                    <motion.div
                      key={`reflexo-border-${animKey}-${item.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.75, 0] }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="pointer-events-none absolute inset-0 rounded-xl xs:rounded-2xl border-2 border-white/50 z-20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Indicadores de Paginação do Carrossel (Dots temáticos) */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        {bannerItems.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={`dot-${item.id}`}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={`Ir para ${item.nome}`}
              className="p-1 cursor-pointer focus:outline-none"
            >
              <span
                className={`block transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-5 h-1.5 shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
                style={{
                  backgroundColor: isActive ? item.color : undefined,
                  boxShadow: isActive ? `0 0 8px ${item.color}80` : undefined,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(HomeAulasInterativasBanner);
