import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import { FILTROS, type Filtro } from './mapasConstants';
import socratesThemisHeroImg from '@/assets/covers/socrates-themis-hero.webp';
import MapasMentaisHeroWave from './MapasMentaisHeroWave';
import FloatingOrbitingBrains from '@/components/common/FloatingOrbitingBrains';

interface MapasMentaisHeaderProps {
  categoria: VisualCategoria;
  setCategoria: (c: VisualCategoria) => void;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  favoritosCount?: number;
  recentesCount?: number;
  pastasCount?: number;
  onBack: () => void;
}

export function MapasMentaisHeader({
  categoria,
  setCategoria,
  filtro,
  setFiltro,
  favoritosCount = 0,
  recentesCount = 0,
  pastasCount = 0,
  onBack,
}: MapasMentaisHeaderProps) {
  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 shrink-0 min-h-[300px] xs:min-h-[315px] sm:min-h-[335px] mb-3 bg-[#090214]"
      style={{
        transform: 'translateZ(0)',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#090214' }}
        aria-hidden="true"
      />

      {/* Imagem de Capa Oficial: Sócrates e Deusa Têmis nos Jardins da Filosofia */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img
          src={socratesThemisHeroImg}
          alt="Sócrates e Deusa Têmis - Mapas Mentais"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-[75%_center] sm:object-[70%_center] md:object-center"
        />
        {/* Gradiente sutil para garantir legibilidade de alto padrão na tipografia */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[62%] sm:w-[48%] bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
      </div>

      {/* 3 Cérebros Vazados Transparentes com Glow Orbitando na Direita */}
      <FloatingOrbitingBrains />

      {/* Onda Hiper-Realista 3D Roxa de Cetim e Seda Imperial */}
      <MapasMentaisHeroWave />

      {/* Cabeçalho Superior Transparente (Botão Voltar Padrão) */}
      <header className="relative z-20 px-3 xs:px-4 sm:px-6 pt-2 pb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onBack();
          }}
          aria-label="Voltar para o início"
          className="grid w-11 h-11 xs:w-12 xs:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-5.5 h-5.5 xs:w-6 xs:h-6" strokeWidth={2.4} />
        </button>
      </header>

      {/* Conteúdo de Marca: Mapas (branco) + Mentais (roxo ametista reluzente) - Padrão Oficial Início */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 sm:pt-4 flex-1 flex flex-col justify-start">
        <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
          <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
            Mapas
          </span>
          <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-purple-400 block drop-shadow-[0_2px_14px_rgba(168,85,247,0.65)] -mt-0.5">
            Mentais
          </span>
        </h1>

        {/* Traço vertical roxo e slogan oficial */}
        <div className="mt-2 flex items-start text-left gap-2 max-w-[280px]">
          <div className="w-[3px] h-8 bg-gradient-to-b from-purple-400 via-fuchsia-500 to-purple-900 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
          <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            Conexões neurais e esquematizadas.
            <br />
            Fixação visual acelerada.
          </p>
        </div>
      </div>

      {/* 4 Atalhos Rápidos com Ícones 100% Roxos flutuando sobre a Onda Roxa */}
      <div className="relative z-10 px-3 sm:px-5 pb-3 pt-2">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md border border-white/12 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-2xl">
          {FILTROS.map(({ id, label, Icone }) => {
            const isAtivo = filtro === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFiltro(isAtivo ? 'todos' : id);
                }}
                className={`flex-1 group flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 rounded-xl sm:rounded-2xl hover:bg-purple-500/10 active:bg-purple-500/20 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden min-h-[48px] ${
                  isAtivo ? 'bg-purple-600/25 shadow-inner ring-1 ring-purple-400/40' : ''
                }`}
                title={label}
              >
                <Icone
                  className={`w-[22px] h-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isAtivo ? 'text-purple-200' : 'text-purple-400 group-hover:text-purple-300'
                  }`}
                  style={{
                    filter: isAtivo
                      ? 'drop-shadow(0 0 10px rgba(168,85,247,0.85))'
                      : 'drop-shadow(0 0 4px rgba(168,85,247,0.35))',
                  }}
                  strokeWidth={isAtivo ? 2.5 : 2.2}
                />
                <span
                  className={`text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-bold truncate max-w-full w-full ${
                    isAtivo ? 'text-white' : 'text-purple-200/80 group-hover:text-purple-100'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MapasMentaisHeader;
