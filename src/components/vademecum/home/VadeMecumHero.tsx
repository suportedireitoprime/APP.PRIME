// @ts-nocheck
import React, { memo, useMemo } from 'react';
import { Search } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
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
        className="bg-hero-panel relative overflow-hidden rounded-b-[28px] xs:rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col justify-between z-20 min-h-[290px] xs:min-h-[310px] sm:min-h-[335px]"
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

        {/* ── Ações Rápidas acima da Barra de Busca dentro do Painel ────────── */}
        <div className="relative z-10 px-2.5 xs:px-3.5 sm:px-4 pt-2 pb-1">
          <VadeMecumQuickActions onSelectQuickAction={onSelectQuickAction} />
        </div>

        <div className="relative z-10 px-6 xs:px-7 sm:px-10 md:px-12 mt-2 xs:mt-2.5 sm:mt-3 pb-3.5 xs:pb-4 sm:pb-5">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onOpenSearch?.();
            }}
            aria-label="Buscar lei, artigo, súmula ou tema"
            className="w-full max-w-[540px] md:max-w-[600px] mx-auto min-h-[54px] sm:min-h-[58px] h-[54px] sm:h-[58px] flex items-center gap-3 px-4 sm:px-5 rounded-2xl bg-black/50 hover:bg-black/65 backdrop-blur-md border border-white/15 hover:border-white/25 transition-all active:scale-[0.99] text-left cursor-pointer shadow-lg"
          >
            <Search className="w-5 h-5 text-zinc-300 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-sm sm:text-[15px] text-zinc-300/90 truncate">
              Buscar lei, artigo, súmula ou tema…
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(VadeMecumHero);
