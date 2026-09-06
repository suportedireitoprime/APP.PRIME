import React, { memo } from 'react';
import { useHeroHomeImages } from '@/hooks/useHeroHomeImages';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HeroCoverCarousel from '@/components/vademecum/home/HeroCoverCarousel';

import { FALLBACK_COVERS, toOptimized } from './chunks/VadeMecumHeroCovers';
import VadeMecumHeroHeader from './chunks/VadeMecumHeroHeader';
import VadeMecumHeroBrand from './chunks/VadeMecumHeroBrand';
import VadeMecumQuickActions from './chunks/VadeMecumQuickActions';
import VadeMecumSearchBar from './chunks/VadeMecumSearchBar';

interface Props {
  onBuscar: () => void;
}

const VadeMecumHero: React.FC<Props> = ({ onBuscar }) => {
  const { images: dbImages } = useHeroHomeImages();

  const HERO_COVERS = dbImages.length > 0
    ? dbImages.map((i) => ({ url: toOptimized(i.imagem_url), preset: i.animation_preset }))
    : FALLBACK_COVERS;

  return (
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

      {/* ── Cabeçalho Transparente Vade Mecum ───────────────── */}
      <VadeMecumHeroHeader />

      <div className="pointer-events-none absolute inset-0 bg-hero-panel z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <HeroMotifs />
      <HeroCoverCarousel covers={HERO_COVERS} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <div className="relative px-4 pt-1 pb-5 flex flex-col gap-4">
        {/* Centered brand block */}
        <VadeMecumHeroBrand />

        {/* ── 4 Botões de Ação Rápida ────────────────── */}
        <VadeMecumQuickActions />

        {/* Search bar */}
        <VadeMecumSearchBar onBuscar={onBuscar} />
      </div>
    </div>
  );
};

export default memo(VadeMecumHero);
