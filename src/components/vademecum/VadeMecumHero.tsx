import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Scale } from 'lucide-react';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import brasaoImg from '@/assets/brasao-republica.webp';

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

const FALLBACK_COVERS = [
  pickAsset(cover2Bundled, srcOf(cover2Asset)),
  pickAsset(cover3Bundled, srcOf(cover3Asset)),
  pickAsset(cover4Bundled, srcOf(cover4Asset)),
  pickAsset(cover5Bundled, srcOf(cover5Asset)),
  pickAsset(cover6Bundled, srcOf(cover6Asset)),
  pickAsset(cover7Bundled, srcOf(cover7Asset)),
  pickAsset(cover8Bundled, srcOf(cover8Asset)),
  pickAsset(cover9Bundled, srcOf(cover9Asset)),
  pickAsset(cover10Bundled, srcOf(cover10Asset)),
];

const POSICOES = ['right', 'left', 'center', 'right', 'left'] as const;

const SUBTITULOS = [
  'Legislação Completa',
  'Códigos e Estatutos',
  'Sempre Atualizado',
  'Busca por Artigo',
];

import { haptic } from '@/lib/nativeHaptics';

interface Props {
  onBuscar: () => void;
}

const VadeMecumHero = ({ onBuscar }: Props) => {
  const navigate = useNavigate();
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
    ? dbImages.map((i) => toOptimized(i.imagem_url))
    : FALLBACK_COVERS;

  const [coverIndex, setCoverIndex] = useState(() => Math.floor(Math.random() * Math.max(1, HERO_COVERS.length)));
  const [subIndex, setSubIndex] = useState(0);

  useEffect(() => {
    if (HERO_COVERS.length <= 1) return;
    const t = setInterval(() => setCoverIndex((i) => (i + 1) % HERO_COVERS.length), 9000);
    return () => clearInterval(t);
  }, [HERO_COVERS.length]);

  useEffect(() => {
    const t = setInterval(() => setSubIndex((i) => (i + 1) % SUBTITULOS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="bg-hero-panel-yellow relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))]"
      style={{ transform: 'translateZ(0)', isolation: 'isolate', contain: 'paint' }}
    >
      {/* Overlays radiais */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(190,255,215,0.20),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />

      {/* Brasão em marca d'água */}
      <img
        src={brasaoImg}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-[280px] opacity-[0.10] select-none"
      />

      {/* Cover art — exatamente as mesmas imagens do painel do Início (Home) */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <AnimatePresence initial={false}>
          {(() => {
            const currentUrl = HERO_COVERS[coverIndex % HERO_COVERS.length];
            if (!currentUrl) return null;
            const pos = POSICOES[coverIndex % POSICOES.length];
            const posClass =
              pos === 'right'
                ? 'right-[4%] left-auto origin-bottom-right'
                : pos === 'left'
                ? 'left-[4%] right-auto origin-bottom-left'
                : 'left-1/2 -translate-x-1/2 origin-bottom';
            const kenBurnsAnim = coverIndex % 2 === 0
              ? 'ken-burns-a 12s ease-in-out infinite alternate'
              : 'ken-burns-b 12s ease-in-out infinite alternate';
            return (
              <motion.img
                key={coverIndex}
                src={currentUrl}
                alt=""
                loading="eager"
                decoding="async"
                width={1024}
                height={1024}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.opacity = '0';
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ animation: kenBurnsAnim, willChange: 'transform' }}
                className={`absolute bottom-0 h-[88%] w-auto max-w-[70%] object-contain object-bottom drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)] ${posClass}`}
              />
            );
          })()}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      {/* Topo */}
      <header className="relative px-3 pt-3 md:px-6 md:pt-6 flex items-center gap-2">
        <button
          onClick={() => {
            haptic.selection();
            navigate('/');
          }}
          aria-label="Voltar"
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 transition touch-manipulation"
        >
          <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.4} />
        </button>
      </header>

      <div className="relative px-4 pt-4 pb-5 min-h-[240px] flex flex-col gap-4">
        {/* Bloco de marca */}
        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <div className="relative w-20 h-20 rounded-full border border-white/90 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.45)] logo-shine">
            <img
              src={brasaoImg}
              alt="Brasão da República"
              width={80}
              height={80}
              loading="eager"
              decoding="sync"
              className="w-[74%] h-[74%] object-contain"
            />
          </div>
          <h1 className="font-display text-white text-[28px] leading-none font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Vade Mecum
          </h1>
          <div className="relative h-[16px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={subIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] whitespace-nowrap"
              >
                {SUBTITULOS[subIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Barra de pesquisa — só leis */}
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onBuscar();
          }}
          aria-label="Pesquisar leis"
          className="mt-auto relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white shrink-0" strokeWidth={2.2} />
          <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
            Pesquise a lei...
          </span>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel-yellow text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
            PESQUISAR
          </div>
        </button>

      </div>

      {/* Selo decorativo */}
      <Scale className="pointer-events-none absolute bottom-3 left-3 w-8 h-8 text-white/15" />
    </div>
  );
};

export default VadeMecumHero;
