// @ts-nocheck
import React, { memo, useMemo } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { getVadeMecumHeroConfig } from '@/lib/vademecumHeroImage';
import HeroAnimatedWave from './HeroAnimatedWave';

import VadeMecumHeroHeader from './chunks/VadeMecumHeroHeader';
import VadeMecumHeroBrand from './chunks/VadeMecumHeroBrand';
import VadeMecumQuickActions from './chunks/VadeMecumQuickActions';
import VadeMecumSearchBar from './chunks/VadeMecumSearchBar';

import type { QuickActionType } from '@/components/vademecum/sheets/VadeMecumQuickActionSheet';

interface VadeMecumHeroProps {
  onOpenMenu?: () => void;
  onSelectQuickAction?: (action: QuickActionType) => void;
  onOpenSearch?: () => void;
}

const VadeMecumHero: React.FC<VadeMecumHeroProps> = ({ onOpenMenu, onSelectQuickAction, onOpenSearch }) => {
  const heroConfig = useMemo(() => getVadeMecumHeroConfig(), []);

  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
        style={{
          transform: 'translateZ(0)',
          backgroundColor: '#050505',
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#050505' }}
          aria-hidden="true"
        />

        {/* Imagem de Fundo (Inverte a cada 12h com o Início) */}
        <img
          src={heroConfig.src}
          alt="Vade Mecum Capa"
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={heroConfig.className}
        />

        {/* Onda Vermelha Fluida e Animada em Movimento (substitui o painel diagonal rígido) */}
        <HeroAnimatedWave />

        {/* Cabeçalho Transparente Vade Mecum (Absolute position like HomeHeaderHero) */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto">
            <VadeMecumHeroHeader />
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda — centralizado na área vermelha */}
        <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[120px]">
          <VadeMecumHeroBrand />
        </div>

        {/* ── 4 Botões de Ação Rápida ────────────────── */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
          <VadeMecumQuickActions onSelectQuickAction={onSelectQuickAction} />
        </div>



      </div>
    </>
  );
};

export default memo(VadeMecumHero);
