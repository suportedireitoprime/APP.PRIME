import React from 'react';
import { ArrowLeft, X, Heart, Folder, Sparkles, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import type { Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import socratesMapasHeroImg from '@/assets/covers/socrates-mapas-hero.jpg';
import cerebroNeuralImg from '@/assets/covers/cerebro-neural-roxo.jpg';
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
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/90 flex flex-col z-20"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#0a0314',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#0a0314' }}
        aria-hidden="true"
      />

      {/* Imagem de Capa de Sócrates / Filósofo à Direita */}
      <img
        src={socratesMapasHeroImg}
        alt="Sócrates - Mapas Mentais"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] sm:object-[68%_center] md:object-center z-0 pointer-events-none translate-x-[4%] sm:translate-x-[2%]"
      />

      {/* 3 Cérebros Orbitais em Movimento 3D em torno da composição */}
      <div className="absolute right-[-15px] sm:right-10 top-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] pointer-events-none z-0">
        {[0, 1, 2].map((i) => {
          const delay = i * 4.6; // 14s total cycle
          return (
            <motion.div
              key={i}
              className="absolute w-14 h-14 sm:w-18 sm:h-18"
              animate={{
                x: [
                  115 * Math.cos(0),
                  115 * Math.cos((2 * Math.PI) / 3),
                  115 * Math.cos((4 * Math.PI) / 3),
                  115 * Math.cos(2 * Math.PI),
                ],
                y: [
                  45 * Math.sin(0),
                  45 * Math.sin((2 * Math.PI) / 3),
                  45 * Math.sin((4 * Math.PI) / 3),
                  45 * Math.sin(2 * Math.PI),
                ],
                scale: [1, 0.72, 1.18, 1],
                opacity: [0.92, 0.45, 1, 0.92],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'linear',
                delay: -delay,
              }}
              style={{
                left: 'calc(50% - 28px)',
                top: 'calc(50% - 28px)',
              }}
            >
              <div className="relative w-full h-full filter drop-shadow-[0_0_16px_rgba(168,85,247,0.85)]">
                <img
                  src={cerebroNeuralImg}
                  alt=""
                  className="w-full h-full object-contain mix-blend-screen"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overlay com corte angular roxo estilo Direito Prime */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 12px rgba(124,58,237,0.4))' }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 52% 0, 38% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#120524] via-[#240845] to-[#3B0764]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(192,132,252,0.35),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(76,29,149,0.55),transparent_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* ShapeGrid suave no fundo do corte */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay">
            <ShapeGrid />
          </div>

          {/* Grid pontilhado sutil */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(rgba(216, 180, 254, 0.4) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
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
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/60 border border-purple-500/20 text-white backdrop-blur-md transition-colors hover:bg-black/80 active:scale-95 shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
        <button
          onClick={() => {
            haptic.light();
            onClose();
          }}
          aria-label="Fechar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/60 border border-purple-500/20 text-white backdrop-blur-md transition-colors hover:bg-black/80 active:scale-95 shadow-lg"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
      </header>

      {/* Brand / Título do Banner — na área esquerda sobre o corte roxo */}
      <div className="relative z-10 pt-2 sm:pt-3 px-4 sm:px-6 max-w-[58%] sm:max-w-[50%] flex flex-col items-start text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider text-purple-200 backdrop-blur-md shadow-sm mb-1.5">
          <Brain className="w-3 h-3 text-purple-400" />
          <span>Memorização Ativa</span>
        </div>
        <h1 className="font-display uppercase tracking-widest text-white text-[21px] sm:text-[25px] font-black leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Mapas Mentais
        </h1>
        <p className="font-serif italic text-purple-200/85 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 line-clamp-2">
          Conexões neurais, resumos esquematizados e fixação acelerada.
        </p>
      </div>

      {/* 2 Funções Exclusivas no Painel: Favoritos (Coração) e Pastas */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 pb-2">
        <div className="grid grid-cols-2 gap-3 max-w-[420px]">
          {/* Botão Favoritos com Coração */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setFiltro(filtro === 'favoritos' ? 'todos' : 'favoritos');
            }}
            className={`relative group flex items-center justify-center py-2.5 px-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-2.5 min-h-[54px] select-none cursor-pointer overflow-hidden border ${
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
            className={`relative group flex items-center justify-center py-2.5 px-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 gap-2.5 min-h-[54px] select-none cursor-pointer overflow-hidden border ${
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

      {/* Barra de Pesquisa dentro do Hero Panel */}
      <div className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-5 pt-1">
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

