import React from 'react';
import { Search } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualCategoria } from '@/lib/visuaisJuridicos/types';
import { CATEGORIA_INFO } from '@/lib/visuaisJuridicos/catalogo';
import { CATEGORIAS, CATEGORIA_ICON, CATEGORIA_COR } from './mapasConstants';

interface MapasMentaisBottomNavProps {
  categoria: VisualCategoria;
  setCategoria: (c: VisualCategoria) => void;
  onSearchClick: () => void;
  buscaAtiva: boolean;
}

export function MapasMentaisBottomNav({ categoria, setCategoria, onSearchClick, buscaAtiva }: MapasMentaisBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[calc(4.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] bg-[#0d0f12]/95 backdrop-blur-xl border-t border-white/5 z-50 flex items-center justify-around px-1 sm:px-2 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
      {/* Botões da esquerda: Códigos, Estatutos */}
      {CATEGORIAS.slice(0, 2).map((catKey) => {
        const info = CATEGORIA_INFO[catKey];
        const isAtiva = categoria === catKey;
        const CatIcon = CATEGORIA_ICON[catKey];
        const cor = CATEGORIA_COR[catKey];
        return (
          <button
            key={catKey}
            type="button"
            onClick={() => {
              haptic.selection();
              setCategoria(catKey);
            }}
            className={`flex flex-col items-center justify-center w-[22%] h-full gap-1 transition-all active:scale-95 ${
              isAtiva ? 'text-white' : 'text-zinc-500 hover:text-white/80'
            }`}
          >
            <CatIcon className={`w-[22px] h-[22px] sm:w-6 sm:h-6 ${isAtiva ? 'scale-110' : ''}`} style={{ color: isAtiva ? cor : 'currentColor' }} />
            <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase truncate w-full text-center px-0.5 mt-0.5 ${isAtiva ? '' : 'font-medium'}`}>
              {info?.label ?? catKey}
            </span>
          </button>
        );
      })}

      {/* Botão Central: Pesquisar */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onSearchClick();
        }}
        className="relative flex flex-col items-center justify-center w-[12%] sm:w-[15%] h-full"
      >
        <div className={`absolute -top-5 w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 border-[3px] border-[#0d0f12] ${
          buscaAtiva ? 'bg-[#9333ea] shadow-purple-500/40 ring-2 ring-purple-400' : 'bg-[#9333ea] hover:bg-[#7e22ce] shadow-purple-600/30'
        }`}>
          <Search className="w-[22px] h-[22px] sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
        </div>
        <span className={`absolute bottom-2 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${buscaAtiva ? 'text-purple-400' : 'text-zinc-500'}`}>
          Pesquisar
        </span>
      </button>

      {/* Botões da direita: Leis Especiais, Súmulas */}
      {CATEGORIAS.slice(2, 4).map((catKey) => {
        const info = CATEGORIA_INFO[catKey];
        const isAtiva = categoria === catKey;
        const CatIcon = CATEGORIA_ICON[catKey];
        const cor = CATEGORIA_COR[catKey];
        return (
          <button
            key={catKey}
            type="button"
            onClick={() => {
              haptic.selection();
              setCategoria(catKey);
            }}
            className={`flex flex-col items-center justify-center w-[22%] h-full gap-1 transition-all active:scale-95 ${
              isAtiva ? 'text-white' : 'text-zinc-500 hover:text-white/80'
            }`}
          >
            <CatIcon className={`w-[22px] h-[22px] sm:w-6 sm:h-6 ${isAtiva ? 'scale-110' : ''}`} style={{ color: isAtiva ? cor : 'currentColor' }} />
            <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase truncate w-full text-center px-0.5 mt-0.5 ${isAtiva ? '' : 'font-medium'}`}>
              {info?.label ?? catKey}
            </span>
          </button>
        );
      })}
    </div>
  );
}
