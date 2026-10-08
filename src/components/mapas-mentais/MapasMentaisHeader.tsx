import React from 'react';
import { ArrowLeft, Search, Mic, X, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import { CATEGORIA_INFO } from '@/lib/visuaisJuridicos/catalogo';
import { CATEGORIAS, FILTROS, CATEGORIA_ICON, CATEGORIA_COR, type Filtro } from './mapasConstants';
import { useDictation } from '@/hooks/useDictation';
import socratesThemisHeroImg from '@/assets/covers/socrates-themis-hero.webp';
import cerebroRoxo from '@/assets/covers/cerebro-vazado-roxo.webp';
import cerebroCiano from '@/assets/covers/cerebro-vazado-ciano.webp';
import cerebroDourado from '@/assets/covers/cerebro-vazado-dourado.webp';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface MapasMentaisHeaderProps {
  categoria: VisualCategoria;
  setCategoria: (c: VisualCategoria) => void;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  busca: string;
  setBusca: (b: string) => void;
  favoritosCount?: number;
  recentesCount?: number;
  pastasCount?: number;
  onBack: () => void;
}

const BRAIN_VARIANTS = [
  { img: cerebroRoxo, glow: 'rgba(168,85,247,0.75)' },
  { img: cerebroCiano, glow: 'rgba(56,189,248,0.75)' },
  { img: cerebroDourado, glow: 'rgba(251,191,36,0.75)' },
];

export function MapasMentaisHeader({
  categoria,
  setCategoria,
  filtro,
  setFiltro,
  busca,
  setBusca,
  favoritosCount = 0,
  recentesCount = 0,
  pastasCount = 0,
  onBack,
}: MapasMentaisHeaderProps) {
  const { state, start, stop } = useDictation((chunk) => {
    setBusca(`${busca} ${chunk}`.trim().slice(0, 60));
  });
  const ouvindo = state === 'recording';

  return (
    <>
      <div
        className="bg-hero-panel-violet relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20 shrink-0"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#120524',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#0D0D0D' }}
        aria-hidden="true"
      />

      {/* Imagem de Capa: Sócrates e Deusa Têmis no Fundo à Direita */}
      <img
        src={socratesThemisHeroImg}
        alt="Sócrates e Deusa Têmis - Mapas Mentais"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[75%_center] sm:object-[70%_center] md:object-center z-0 pointer-events-none"
      />

      {/* 3 Cérebros Vazados (Transparentes) em Cores Diferentes Orbitando */}
      <div className="absolute right-[-10px] sm:right-6 top-[28%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[2]">
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
                left: '50%',
                top: '50%',
                marginLeft: -24,
                marginTop: -24,
              }}
            >
              <img
                src={brain.img}
                alt=""
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_var(--glow)]"
                style={{ ['--glow' as string]: brain.glow }}
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
          style={{ clipPath: 'polygon(0 0, 48% 0, 36% 100%, 0% 100%)' }}
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

      {/* Cabeçalho Superior Transparente com Botão Voltar Padrão */}
      <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 sm:px-6 flex items-center justify-start">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onBack();
          }}
          aria-label="Voltar"
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 flex items-center justify-center rounded-full bg-black/60 border border-purple-500/20 text-white backdrop-blur-md transition-colors hover:bg-black/80 active:opacity-70 shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
      </header>

      {/* Conteúdo: Logo e Título à esquerda sobre a área roxa */}
      <div className="relative z-10 pt-3 sm:pt-4 flex flex-col justify-start min-h-[100px] px-4 sm:px-6 max-w-[55%] sm:max-w-[48%] items-start text-left">
        <h1 className="font-display uppercase tracking-widest text-white text-[20px] sm:text-[24px] md:text-[26px] font-black leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Mapas Mentais
        </h1>
        <p className="font-serif italic text-purple-200/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 line-clamp-2">
          Conexões neurais, resumos esquematizados e fixação acelerada.
        </p>
      </div>

      {/* ── Elementos Integrados DENTRO da Capa (Funções e Pesquisa) ── */}
      <div className="relative z-10 px-4 sm:px-6 w-full pt-4 pb-5 space-y-3 max-w-[1400px] mx-auto">
        {/* 1. Funções (Favoritos, Recentes, Pastas, Sincronizados) estilo Home */}
        <div className="grid grid-cols-2 gap-3 mx-1 mt-1">
          {FILTROS.map(({ id, label, Icone, color }) => {
            const isAtivo = filtro === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFiltro(isAtivo ? 'todos' : id);
                }}
                className={`group flex flex-col items-center justify-center py-4 px-2 rounded-2xl bg-black/45 backdrop-blur-md shadow-xl hover:bg-black/60 transition-all active:opacity-70 gap-2 text-center min-h-[64px] select-none cursor-pointer overflow-hidden ${
                  isAtivo
                    ? 'border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                    : 'border border-white/10'
                }`}
              >
                <Icone 
                  className="w-6 h-6 shrink-0 transition-all group-hover:scale-110" 
                  style={{ color: color }} 
                  strokeWidth={2} 
                />
                <span className={`text-[11px] font-extrabold leading-tight uppercase tracking-wider ${isAtivo ? 'text-white' : 'text-white/90'}`}>
                  {label}
                  {id === 'favoritos' && favoritosCount > 0 && ` (${favoritosCount})`}
                  {id === 'recentes' && recentesCount > 0 && ` (${recentesCount})`}
                  {id === 'pastas' && pastasCount > 0 && ` (${pastasCount})`}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  </>
  );
}
