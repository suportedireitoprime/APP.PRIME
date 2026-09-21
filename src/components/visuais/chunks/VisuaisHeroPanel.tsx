import React from 'react';
import { ArrowLeft, X, Layers, Star, Clock, Folder, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import type { Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.jpg';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';

interface VisuaisHeroPanelProps {
  categoria: VisualCategoria;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  busca: string;
  setBusca: (b: string) => void;
  pastasCount?: number;
  favoritosCount?: number;
  recentesCount?: number;
  totalCount?: number;
  onBack: () => void;
  onClose: () => void;
}

const FILTROS_HERO: Array<{
  id: Filtro;
  label: string;
  icon: typeof Layers;
  color: string;
}> = [
  { id: 'todos', label: 'Todos', icon: Layers, color: '#38BDF8' },
  { id: 'favoritos', label: 'Favoritos', icon: Star, color: '#FACC15' },
  { id: 'recentes', label: 'Recentes', icon: Clock, color: '#A78BFA' },
  { id: 'pastas', label: 'Pastas', icon: Folder, color: '#F59E0B' },
];

export function VisuaisHeroPanel({
  categoria,
  filtro,
  setFiltro,
  busca,
  setBusca,
  pastasCount,
  favoritosCount,
  recentesCount,
  totalCount,
  onBack,
  onClose,
}: VisuaisHeroPanelProps) {
  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/80 flex flex-col z-20"
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

      {/* Imagem de Capa do Painel à Direita */}
      <img
        src={heroEstudanteImg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[32%_center] md:object-center z-0 pointer-events-none translate-x-[12%] md:translate-x-[8%]"
      />

      {/* Overlay vermelho com corte diagonal estilo menu e drop-shadow na divisória */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 52% 0, 38% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-panel" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          <HeroMotifs />

          {/* Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      </div>

      {/* Header superior: Voltar (esquerda) e Fechar (direita) colados no topo da safe area */}
      <header className="relative z-20 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 sm:px-6 flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => {
            haptic.light();
            onBack();
          }}
          aria-label="Voltar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
        <button
          onClick={() => {
            haptic.light();
            onClose();
          }}
          aria-label="Fechar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
      </header>

      {/* Brand / Título do Banner — na área esquerda sobre o corte vermelho */}
      <div className="relative z-10 pt-2 sm:pt-3 px-4 sm:px-6 max-w-[58%] sm:max-w-[50%] flex flex-col items-start text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/45 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md shadow-sm mb-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Mapas & Esquemas</span>
        </div>
        <h1 className="font-display uppercase tracking-tight text-white text-[22px] sm:text-[25px] font-black leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          Visuais Jurídicos
        </h1>
        <p className="font-sans font-medium text-white/90 text-[12px] sm:text-[13px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1.5 line-clamp-2">
          Domine os temas com resumos esquematizados e memorização ativa.
        </p>
      </div>

      {/* 4 Funções de Ação / Filtros (Todos, Favoritos, Recentes, Pastas) */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 pb-2">
        <div className="grid grid-cols-4 gap-2">
          {FILTROS_HERO.map((item) => {
            const Icon = item.icon;
            const ativo = filtro === item.id;
            const count =
              item.id === 'favoritos'
                ? favoritosCount
                : item.id === 'recentes'
                  ? recentesCount
                  : item.id === 'pastas'
                    ? pastasCount
                    : totalCount;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFiltro(item.id);
                }}
                className={`relative group flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-1 text-center min-h-[56px] select-none cursor-pointer overflow-hidden border ${
                  ativo
                    ? 'bg-primary/30 border-primary/70 shadow-[0_0_16px_rgba(224,31,71,0.35)] ring-1 ring-primary/50 text-white'
                    : 'bg-black/50 border-white/10 hover:bg-black/70 text-white/80 hover:text-white'
                }`}
              >
                {typeof count === 'number' && count > 0 && (
                  <span className="absolute top-1 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-white/20 text-white text-[9px] font-bold leading-none flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                <Icon
                  className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  style={{ color: ativo ? '#FFFFFF' : item.color }}
                  strokeWidth={ativo ? 2.4 : 1.8}
                />
                <span className="text-[10.5px] sm:text-[11.5px] font-extrabold uppercase tracking-wider leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Pesquisa dentro do Hero Panel */}
      <div className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-5 pt-1">
        <VisuaisBarraBusca
          valor={busca}
          onChange={setBusca}
          placeholder={`Buscar em ${
            categoria === 'materias'
              ? 'matérias (ex.: Penal, Civil...)'
              : categoria === 'codigos'
                ? 'códigos (ex.: Penal, Civil...)'
                : 'estatutos (ex.: OAB, ECA...)'
          }`}
        />
      </div>
    </div>
  );
}
