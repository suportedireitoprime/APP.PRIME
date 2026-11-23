// @ts-nocheck
import React, { memo, useMemo } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { getVadeMecumHeroConfig } from '@/lib/vademecumHeroImage';
import HeroAnimatedWave from './HeroAnimatedWave';
import { HomeTrialCard } from '@/components/subscription/HomeTrialCard';

import VadeMecumHeroHeader from './chunks/VadeMecumHeroHeader';
import VadeMecumHeroBrand from './chunks/VadeMecumHeroBrand';
import VadeMecumQuickActions from './chunks/VadeMecumQuickActions';

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
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll (mesma estrutura e proporção do Início) */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[28px] xs:rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[245px] xs:min-h-[260px] sm:min-h-[290px]"
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

        {/* Imagem de Fundo (Capa Oficial Constituição & Congresso Nacional) */}
        <img
          src={heroConfig.src}
          alt="Vade Mecum Capa Constituição"
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={heroConfig.className}
        />

        {/* Onda Verde Fluida e Animada em Movimento (100% cetim verde Brasil a 120fps) */}
        <HeroAnimatedWave colorScheme="green" />

        {/* Cabeçalho Transparente Vade Mecum (Alinhado com o Início) */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto">
            <VadeMecumHeroHeader />
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda e Card de Status à direita — posicionado abaixo do botão voltar */}
        <div className="relative z-10 pt-2 xs:pt-2.5 sm:pt-3 flex flex-col justify-start min-h-[110px] xs:min-h-[120px] sm:min-h-[135px]">
          {/* Espaçador calibrado para o botão de voltar padrão ouro (desce o título com folga elegante para ficar abaixo e não atrás) */}
          <div className="h-[48px] xs:h-[54px] sm:h-[60px] mb-1 xs:mb-1.5 shrink-0 w-full" aria-hidden="true" />
          <div className="flex items-start justify-between gap-2.5 px-3 sm:px-4">
            <VadeMecumHeroBrand />
            <div className="relative z-10 w-[130px] xs:w-[145px] sm:w-[165px] shrink-0 pt-0.5 sm:pt-1 pr-1 sm:pr-2 empty:hidden">
              <HomeTrialCard />
            </div>
          </div>
        </div>

        {/* ── 4 Botões de Ação Rápida no Rodapé do Painel ────────────────── */}
        <div className="relative z-10 px-2.5 xs:px-3.5 sm:px-4 pt-1 pb-2.5 xs:pb-3 sm:pb-3.5">
          <VadeMecumQuickActions onSelectQuickAction={onSelectQuickAction} />
        </div>
      </div>
    </>
  );
};

export default memo(VadeMecumHero);
