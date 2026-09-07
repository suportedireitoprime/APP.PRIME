import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const DEFAULT_SUBTITLES = [
  'Para Concurseiros',
  'Para Estudantes',
  'Para Advogados',
  'Uso Profissional',
  'Para Professores',
  'Para Servidores',
  'Para Magistrados',
];

const formatPerfilSubtitle = (label?: string): string | null => {
  if (!label) return null;
  const l = label.trim();
  if (/oab/i.test(l)) return 'Estudos para OAB';
  if (/concurs/i.test(l)) return 'Para Concurseiros';
  if (/advogad/i.test(l)) return 'Para Advogados';
  if (/faculdade|estudante/i.test(l)) return 'Para Estudantes de Direito';
  if (/magistrad|juiz/i.test(l)) return 'Para Magistrados';
  if (/servidor/i.test(l)) return 'Para Servidores';
  if (l.length <= 25) return l.startsWith('Para ') ? l : `Para ${l}`;
  return null;
};

const HomeBrandBanner = ({ perfilLabel }: HomeBrandBannerProps) => {
  const subtitles = useMemo(() => {
    const custom = formatPerfilSubtitle(perfilLabel);
    if (!custom) return DEFAULT_SUBTITLES;
    return [custom, ...DEFAULT_SUBTITLES.filter((s) => s.toLowerCase() !== custom.toLowerCase())];
  }, [perfilLabel]);

  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    setSubtitleIndex(0);
  }, [subtitles]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [subtitles.length]);

  return (
    <div className="flex flex-col items-center text-center gap-2 pt-1">
      <div className="relative h-24 mb-2 flex items-center justify-center">
        <picture>
          <source srcSet="/logo-prime.webp" type="image/webp" />
          <img
            src="/logo-prime.png"
            alt="Direito Prime"
            loading="eager"
            decoding="async"
            width={96}
            height={96}
            fetchPriority="high"
            className="w-auto h-24 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </picture>
      </div>
      <h1 className="font-serif italic text-white text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        Estudos Jurídicos
      </h1>
      <div className="relative h-[22px] min-h-[22px] overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={subtitleIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="font-body text-white/95 text-[12.5px] font-bold tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap leading-tight"
          >
            {subtitles[subtitleIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
