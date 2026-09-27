import React from 'react';
import { ArrowLeft, Heart, Folder, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import type { Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import socratesThemisHeroImg from '@/assets/covers/socrates-themis-hero.jpg';
import cerebroRoxo from '@/assets/covers/cerebro-vazado-roxo.png';
import cerebroCiano from '@/assets/covers/cerebro-vazado-ciano.png';
import cerebroDourado from '@/assets/covers/cerebro-vazado-dourado.png';
import ShapeGrid from '@/components/ui/ShapeGrid';

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

const BRAIN_VARIANTS = [
  { img: cerebroRoxo, glow: 'rgba(168,85,247,0.75)' },
  { img: cerebroCiano, glow: 'rgba(56,189,248,0.75)' },
  { img: cerebroDourado, glow: 'rgba(251,191,36,0.75)' },
];

export function VisuaisHeroPanel({
  categoria,
  filtro,
  setFiltro,
  busca,
  setBusca,
  pastasCount = 0,
  favoritosCount = 0,
  onBack,
  onClose,
}: VisuaisHeroPanelProps) {
  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20"
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

      {/* Imagem de Capa: Sócrates e Deusa Têmis no Fundo */}
      <img
        src={socratesThemisHeroImg}
        alt="Sócrates e Deusa Têmis - Mapas Mentais"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[75%_center] sm:object-[70%_center] md:object-center z-0 pointer-events-none"
      />

      {/* 3 Cérebros Vazados (Transparentes) em Cores Diferentes Orbitando */}
      <div className="absolute right-[-10px] sm:right-6 top-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] pointer-events-none z-0">
        {BRAIN_VARIANTS.map((brain, i) => {
          const delay = i * 4.6; // Ciclo total de 14s dividido pelos 3 cérebros
          return (
            <motion.div
              key={i}
              className="absolute w-12 h-12 sm:w-16 sm:h-16"
              animate={{
                x: [
                  100 * Math.cos(0),
                  100 * Math.cos((2 * Math.PI) / 3),
                  100 * Math.cos((4 * Math.PI) / 3),
                  100 * Math.cos(2 * Math.PI),
                ],
                y: [
                  42 * Math.sin(0),
                  42 * Math.sin((2 * Math.PI) / 3),
                  42 * Math.sin((4 * Math.PI) / 3),
                  42 * Math.sin(2 * Math.PI),
                ],
                scale: [1, 0.72, 1.15, 1],
                opacity: [0.92, 0.5, 1, 0.92],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'linear',
                delay: -delay,
              }}
              style={{
                left: 'calc(50% - 24px)',
                top: 'calc(50% - 24px)',
              }}
            >
              <img
                src={brain.img}
                alt=""
                className="w-full h-full object-contain pointer-events-none select-none"
                style={{
                  filter: `drop-shadow(0 0 10px ${brain.glow})`,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Overlay com corte angular estilo menu Vade Mecum na cor roxa */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#120524] via-[#240845] to-[#3B0764]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(192,132,252,0.35),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(76,29,149,0.55),transparent_70%)]" />
          <div className="absolute inset-0 opacity-15 mix-blend-overlay">
            <ShapeGrid />
          </div>
          
          {/* SVGs flutuantes de Cérebro (translúcidos e em diferentes tamanhos/rotações) */}
          <Brain className="absolute top-[5%] left-[5%] w-24 h-24 text-white opacity-[0.07] -rotate-[15deg] pointer-events-none" />
          <Brain className="absolute top-[40%] left-[25%] w-40 h-40 text-white opacity-[0.05] rotate-[20deg] pointer-events-none" />
          <Brain className="absolute -bottom-[10%] left-[10%] w-32 h-32 text-white opacity-[0.08] -rotate-[5deg] pointer-events-none" />
          <Brain className="absolute top-[20%] left-[40%] w-20 h-20 text-white opacity-[0.06] rotate-[45deg] pointer-events-none" />
        </div>
      </div>

      {/* Cabeçalho Transparente Superior (Apenas botão voltar, conforme solicitado) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 sm:px-6 flex items-center justify-start">
          <button
            onClick={() => {
              haptic.light();
              onBack();
            }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/60 border border-purple-500/20 text-white backdrop-blur-md transition-colors hover:bg-black/80 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* Conteúdo: Logo / Título à esquerda — centralizado na área roxa (mesmo espaçamento pt-8 sm:pt-10 do Vade Mecum) */}
      <div className="relative z-10 pt-[72px] sm:pt-[84px] flex-1 flex flex-col justify-start min-h-[180px] sm:min-h-[190px] px-4 sm:px-6 max-w-[50%] sm:max-w-[46%] items-start text-left">
        <h1 className="font-display uppercase tracking-widest text-white text-[21px] sm:text-[25px] font-black leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Mapas Mentais
        </h1>
        <p className="font-serif italic text-purple-200/85 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 line-clamp-2">
          Conexões neurais, resumos esquematizados e fixação acelerada.
        </p>
      </div>

      {/* ── 2 Funções de Ação Rápida (Favoritos e Pastas) ── */}
      <div className="relative z-10 px-4 sm:px-6 pt-2 pb-2">
        <div className="grid grid-cols-2 gap-3 max-w-[420px]">
          {/* Botão Favoritos com Coração */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setFiltro(filtro === 'favoritos' ? 'todos' : 'favoritos');
            }}
            className={`relative group flex items-center justify-center py-2 px-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-2.5 min-h-[50px] select-none cursor-pointer overflow-hidden border ${
              filtro === 'favoritos'
                ? 'bg-purple-600/40 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/50 text-white'
                : 'bg-black/55 border-white/10 hover:bg-black/75 text-white/80 hover:text-white'
            }`}
          >
            {typeof favoritosCount === 'number' && favoritosCount > 0 && (
              <span className="absolute top-1.5 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500/80 text-white text-[9.5px] font-bold leading-none flex items-center justify-center shadow-sm">
                {favoritosCount > 99 ? '99+' : favoritosCount}
              </span>
            )}
            <Heart
              className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                filtro === 'favoritos'
                  ? 'fill-purple-300 text-purple-200 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                  : 'text-purple-400'
              }`}
              strokeWidth={filtro === 'favoritos' ? 2.4 : 2}
            />
            <div className="flex flex-col text-left">
              <span className="text-[11.5px] sm:text-[12.5px] font-extrabold uppercase tracking-wider leading-tight">
                Favoritos
              </span>
              <span className="text-[9.5px] text-zinc-400 font-medium leading-none">
                {favoritosCount || 0} salvos
              </span>
            </div>
          </button>

          {/* Botão Pastas */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setFiltro(filtro === 'pastas' ? 'todos' : 'pastas');
            }}
            className={`relative group flex items-center justify-center py-2 px-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-2.5 min-h-[50px] select-none cursor-pointer overflow-hidden border ${
              filtro === 'pastas'
                ? 'bg-purple-600/40 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/50 text-white'
                : 'bg-black/55 border-white/10 hover:bg-black/75 text-white/80 hover:text-white'
            }`}
          >
            {typeof pastasCount === 'number' && pastasCount > 0 && (
              <span className="absolute top-1.5 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/80 text-white text-[9.5px] font-bold leading-none flex items-center justify-center shadow-sm">
                {pastasCount > 99 ? '99+' : pastasCount}
              </span>
            )}
            <Folder
              className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                filtro === 'pastas'
                  ? 'fill-amber-400/80 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'text-amber-400'
              }`}
              strokeWidth={filtro === 'pastas' ? 2.4 : 2}
            />
            <div className="flex flex-col text-left">
              <span className="text-[11.5px] sm:text-[12.5px] font-extrabold uppercase tracking-wider leading-tight">
                Pastas
              </span>
              <span className="text-[9.5px] text-zinc-400 font-medium leading-none">
                {pastasCount || 0} módulos
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa (mesmo pb-5 do Vade Mecum) */}
      <div className="relative z-10 px-4 sm:px-6 w-full pb-5">
        <VisuaisBarraBusca
          valor={busca}
          onChange={setBusca}
          placeholder={`Buscar em ${
            categoria === 'materias'
              ? 'matérias (ex.: Penal, Civil...)'
              : categoria === 'codigos'
                ? 'códigos (ex.: CF/88, Penal...)'
                : categoria === 'estatutos'
                  ? 'estatutos (ex.: OAB, ECA...)'
                  : categoria === 'leis_especiais'
                    ? 'leis especiais (ex.: Maria da Penha, LEP...)'
                    : 'previdenciário (ex.: Benefícios, Custeio...)'
          }`}
        />
      </div>
    </div>
  );
}


