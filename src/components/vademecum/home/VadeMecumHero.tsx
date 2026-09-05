import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing, Search, Heart, NotebookPen, Radar, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { haptic } from '@/lib/nativeHaptics';
import brasaoImg from '@/assets/brasao-republica.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import { useHeroHomeImages } from '@/hooks/useHeroHomeImages';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HeroCoverCarousel from '@/components/vademecum/home/HeroCoverCarousel';

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

interface Props {
  onBuscar: () => void;
}

const VadeMecumHero = ({ onBuscar }: Props) => {
  const navigate = useNavigate();
  const { images: dbImages } = useHeroHomeImages();

  const HERO_COVERS = dbImages.length > 0
    ? dbImages.map((i) => ({ url: toOptimized(i.imagem_url), preset: i.animation_preset }))
    : FALLBACK_COVERS;

  return (
    <div
      className="relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
      style={{
        transform: 'translateZ(0)',
        isolation: 'isolate',
        contain: 'paint',
      }}
    >
      {/* ── Cabeçalho Transparente Vade Mecum ───────────────── */}
      <div className="px-4 pb-2 pt-2 flex items-center justify-between relative z-30">
        <button 
          onClick={() => { haptic.selection(); navigate('/'); }} 
          aria-label="Voltar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
        <button 
          onClick={() => { haptic.selection(); navigate('/meus-lembretes'); }} 
          aria-label="Lembretes"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
        >
          <BellRing className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
      </div>

      <div className="absolute inset-0 bg-hero-panel -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <HeroMotifs />
      <HeroCoverCarousel covers={HERO_COVERS} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <div className="relative px-4 pt-1 pb-5 flex flex-col gap-4">
        {/* Centered brand block */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative h-24 mb-2 flex items-center justify-center">
            <img
              src={brasaoImg}
              alt="Brasão da República"
              loading="eager"
              decoding="sync"
              className="w-auto h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
            />
          </div>
          <h1 className="font-serif italic text-white text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Vade Mecum
          </h1>
          <p className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            Legislação Completa
          </p>
        </div>

        {/* ── 4 Botões de Ação Rápida ────────────────── */}
        <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
          <button onClick={() => navigate('/vade-mecum/favoritos')} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center">
            <Heart className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Favoritos</span>
          </button>
          
          <button onClick={() => toast({ title: 'Em breve' })} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center">
            <NotebookPen className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Anotações</span>
          </button>

          <button onClick={() => navigate('/radares')} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center">
            <Radar className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Radares</span>
          </button>

          <button onClick={() => navigate('/vade-mecum/recentes')} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center">
            <History className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Histórico</span>
          </button>
        </div>

        {/* Search bar */}
        <button
          type="button"
          onClick={onBuscar}
          aria-label="Pesquisar artigos e leis"
          className="mt-2 relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
          <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
            <TypingHint />
          </span>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
            PESQUISAR
          </div>
        </button>
      </div>
    </div>
  );
};

export default VadeMecumHero;
