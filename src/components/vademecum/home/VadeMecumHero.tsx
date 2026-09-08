import React, { memo } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { FallingLeaves } from '@/components/vademecum/home/FallingMotifs';
import vademecumHeroImg from '@/assets/covers/vademecum-judge.jpg';

import VadeMecumHeroHeader from './chunks/VadeMecumHeroHeader';
import VadeMecumHeroBrand from './chunks/VadeMecumHeroBrand';
import VadeMecumQuickActions from './chunks/VadeMecumQuickActions';

const VadeMecumHero: React.FC = () => {
  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
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

        {/* Imagem de Fundo */}
        <img
          src={vademecumHeroImg}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Animação caindo apenas sobre a imagem (por trás do painel vermelho) */}
        <FallingLeaves />

        {/* Overlay vermelho com gradiente estilo menu e sombra */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1a0004] via-[#5a050d] to-[#9b111e]" />
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <ShapeGrid />
            </div>
          </div>
        </div>

        {/* Cabeçalho Transparente Vade Mecum (Absolute position like HomeHeaderHero) */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-3 md:pt-4 lg:pt-6 pointer-events-none">
          <div className="pointer-events-auto">
            <VadeMecumHeroHeader />
          </div>
        </header>

        {/* Conteúdo: Logo à esquerda — centralizado na área vermelha */}
        <div className="relative z-10 pt-16 sm:pt-20 flex-1 flex flex-col justify-start min-h-[180px]">
          <VadeMecumHeroBrand />
        </div>

        {/* ── 4 Botões de Ação Rápida ────────────────── */}
        <div className="relative z-10 px-3 sm:px-5 pb-5 pt-3">
          <VadeMecumQuickActions />
        </div>
      </div>
    </>
  );
};

export default memo(VadeMecumHero);
