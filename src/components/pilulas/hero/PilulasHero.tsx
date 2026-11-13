import React, { memo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import pilulasHeroCover from '@/assets/covers/pilulas-hero-cover.jpg';
import PilulasHeroWave from './PilulasHeroWave';
import PilulasBrandBanner from './PilulasBrandBanner';
import PilulasActionShortcuts, { type PilulasHeroTab } from './PilulasActionShortcuts';

interface Props {
  activeTab: PilulasHeroTab;
  onSelectTab: (tab: PilulasHeroTab) => void;
  onOpenSearch?: () => void;
  favoritosCount?: number;
}

export const PilulasHero: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  favoritosCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#050505',
      }}
    >
      {/* Blindagem de overscroll superior */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#050505' }}
        aria-hidden="true"
      />

      {/* Imagem de Capa do Pôr do Sol (Estudante no Terraço com Vista ao Mar) */}
      <img
        src={pilulasHeroCover}
        alt="Pílulas do Direito"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[52%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform"
      />

      {/* Onda Vermelha-Crepúsculo em Seda 3D com a Cor Exata do Céu */}
      <PilulasHeroWave />

      {/* Cabeçalho Superior Transparente (Botão de Voltar e Busca) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          {/* Botão Voltar Padrão Ouro do Projeto */}
          <button
            onClick={() => {
              haptic.light();
              navigate('/');
            }}
            aria-label="Voltar para o início"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          {/* Botão de Busca */}
          {onOpenSearch && (
            <button
              onClick={() => {
                haptic.light();
                onOpenSearch();
              }}
              aria-label="Buscar resumos em áudio"
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo: Logotipo à esquerda e Tipografia de Marca */}
      <div className="relative z-10 pt-10 sm:pt-12 flex-1 flex flex-col justify-start min-h-[120px]">
        <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
          <PilulasBrandBanner />
        </div>
      </div>

      {/* 4 Atalhos Rápidos no Rodapé do Painel: Favoritos, Em Alta, Recentes e Playlist */}
      <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
        <PilulasActionShortcuts
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          favoritosCount={favoritosCount}
        />
      </div>
    </div>
  );
};

export default memo(PilulasHero);
