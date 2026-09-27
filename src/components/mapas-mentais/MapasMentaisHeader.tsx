import React from 'react';
import { ArrowLeft, Search, Mic, X, Heart } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import { CATEGORIA_INFO } from '@/lib/visuaisJuridicos/catalogo';
import { CATEGORIAS, FILTROS, type Filtro } from './mapasConstants';
import { useDictation } from '@/hooks/useDictation';
import socratesThemisHeroImg from '@/assets/covers/socrates-themis-hero.jpg';

interface MapasMentaisHeaderProps {
  categoria: VisualCategoria;
  setCategoria: (c: VisualCategoria) => void;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  busca: string;
  setBusca: (b: string) => void;
  favoritosCount?: number;
  recentesCount?: number;
  onBack: () => void;
}

export function MapasMentaisHeader({
  categoria,
  setCategoria,
  filtro,
  setFiltro,
  busca,
  setBusca,
  favoritosCount = 0,
  recentesCount = 0,
  onBack,
}: MapasMentaisHeaderProps) {
  const { state, start, stop } = useDictation((chunk) => {
    setBusca(`${busca} ${chunk}`.trim().slice(0, 60));
  });
  const ouvindo = state === 'recording';

  return (
    <div className="relative overflow-hidden rounded-b-[28px] sm:rounded-b-[36px] bg-[#0A0A0C] border-b border-white/5 shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20">
      {/* Imagem de Capa Estática com Gradiente Elegante (Zero loops de animação ou repaints de GPU) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={socratesThemisHeroImg}
          alt="Sócrates e Deusa Têmis - Mapas Mentais"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[75%_center] sm:object-[70%_center] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/85 to-[#0A0A0C]/60" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-5 max-w-[1400px] w-full mx-auto space-y-4">
        {/* Topo: Botão Voltar Padrão do Projeto e Título */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onBack();
            }}
            aria-label="Voltar"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
              Mapas Mentais & Visuais
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium truncate">
              Revisão visual e esquematizada de matérias, códigos e leis
            </p>
          </div>
        </div>

        {/* Barra de Pesquisa Rápida */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value.slice(0, 60))}
              placeholder="Pesquisar matéria, código, tema ou artigo..."
              className="h-12 sm:h-13 w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-10 sm:pl-11 pr-10 font-sans text-sm sm:text-base text-white placeholder:text-zinc-500 outline-none focus:border-purple-500/60 transition-colors"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar pesquisa"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => (ouvindo ? stop() : start())}
            aria-label={ouvindo ? 'Parar ditado' : 'Pesquisar por voz'}
            className={`flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-md ${
              ouvindo
                ? 'bg-red-500 border-red-400 text-white'
                : 'bg-purple-600/90 hover:bg-purple-600 border-purple-500/50 text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Categorias (Matérias, Códigos, Estatutos, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIAS.map((catKey) => {
            const info = CATEGORIA_INFO[catKey];
            const isAtiva = categoria === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setCategoria(catKey);
                  setBusca('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all border cursor-pointer ${
                  isAtiva
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                    : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-white/5'
                }`}
              >
                {info?.label ?? catKey}
              </button>
            );
          })}
        </div>

        {/* Abas de Filtros (Todos, Favoritos, Recentes, Pastas) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 border-t border-white/5">
          {FILTROS.map(({ id, label, Icone }) => {
            const isAtivo = filtro === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFiltro(id);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                  isAtivo
                    ? 'bg-white/15 text-white border-white/20 shadow-sm'
                    : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border-transparent'
                }`}
              >
                <Icone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${id === 'favoritos' && isAtivo ? 'fill-current text-rose-400' : ''}`} />
                <span className="truncate">{label}</span>
                {id === 'favoritos' && favoritosCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                    {favoritosCount}
                  </span>
                )}
                {id === 'recentes' && recentesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {recentesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
