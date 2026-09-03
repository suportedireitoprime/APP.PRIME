import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Heart, History, Brain, FileText, NotebookText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { haptic } from '@/lib/nativeHaptics';
import HeroMotifs from '../vademecum/HeroMotifs';
import HeroCoverCarousel from '../vademecum/HeroCoverCarousel';
import { useHeroHomeImages } from '@/hooks/useHeroHomeImages';
import { pickAsset, srcOf } from '@/lib/assetUrl';

import cover2Asset from '@/assets/covers/cover-2.webp.asset.json';
import cover2Bundled from '@/assets/covers/cover-2.webp';
import cover3Asset from '@/assets/covers/cover-3.webp.asset.json';
import cover3Bundled from '@/assets/covers/cover-3.webp';

const FALLBACK_COVERS = [
  { url: pickAsset(cover2Bundled, srcOf(cover2Asset)), preset: 'ken-burns' },
  { url: pickAsset(cover3Bundled, srcOf(cover3Asset)), preset: 'ken-burns' },
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
  'Pesquise qualquer matéria...',
  'Pesquise uma lei...',
  'Pesquise súmulas...',
  'Pesquise conceitos...',
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
  onBuscar?: () => void;
  q?: string;
  setQ?: (val: string) => void;
}

const ResumosHero = ({ onBuscar, q, setQ }: Props) => {
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
      {/* ── Cabeçalho Transparente ───────────────── */}
      <div className="px-4 pb-2 pt-2 flex items-center justify-between relative z-30">
        <button 
          onClick={() => { haptic.selection(); navigate('/'); }} 
          aria-label="Voltar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
      </div>

      <div className="absolute inset-0 bg-hero-panel -z-10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <HeroMotifs />
      <HeroCoverCarousel covers={HERO_COVERS} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent z-[5]" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-[6] opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div className="relative px-4 pt-1 pb-5 flex flex-col gap-4 z-10">
        {/* Centered brand block */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative w-20 h-20 mb-2 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <NotebookText className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-white text-[24px] leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] uppercase">
            Resumos Jurídicos
          </h1>
          <p className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            Inteligentes e Estruturados
          </p>
        </div>

        {/* ── 4 Botões de Ação Rápida ────────────────── */}
        <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
          <button onClick={() => navigate('/resumos-juridicos/favoritos')} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/40 transition-all active:scale-95 gap-2 text-center">
            <Heart className="w-5 h-5 text-rose-400 group-hover:text-rose-300 group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Favoritos</span>
          </button>
          
          <button onClick={() => navigate('/resumos-juridicos/recentes')} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/40 transition-all active:scale-95 gap-2 text-center">
            <History className="w-5 h-5 text-sky-400 group-hover:text-sky-300 group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Recentes</span>
          </button>

          <button onClick={() => toast({ title: 'Em breve: Listagem Feynman' })} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/40 transition-all active:scale-95 gap-2 text-center">
            <Brain className="w-5 h-5 text-fuchsia-400 group-hover:text-fuchsia-300 group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Feynman</span>
          </button>

          <button onClick={() => toast({ title: 'Em breve: Listagem Cornell' })} className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/40 transition-all active:scale-95 gap-2 text-center">
            <FileText className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all" strokeWidth={2} />
            <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Cornell</span>
          </button>
        </div>

        {/* Search bar */}
        {setQ ? (
          <div className="mt-2 relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 focus-within:border-primary/80 transition-colors search-bar-shine">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
            <input
              value={q || ''}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquise uma lei..."
              className="w-full h-full bg-transparent text-white font-body text-[15px] font-medium outline-none placeholder:text-white/40"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30">
              PESQUISAR
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onBuscar}
            aria-label="Pesquisar resumos"
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
        )}
      </div>
    </div>
  );
};

export default ResumosHero;
