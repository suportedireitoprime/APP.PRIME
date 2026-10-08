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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background with the exact same styles as global BottomNav */}
      <div className="relative flex items-center justify-between px-2 sm:px-4 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-2 bg-[#0D0D0D]/90 backdrop-blur-xl border-t border-white/10">
        
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
              className={`flex flex-col items-center justify-end gap-1.5 py-1.5 transition-all active:opacity-70 duration-100 touch-manipulation cursor-pointer relative flex-1 ${
                isAtiva ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              <CatIcon 
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform drop-shadow-md ${isAtiva ? 'scale-110' : 'drop-shadow-sm'}`} 
                style={{ color: isAtiva ? cor : 'currentColor' }} 
                strokeWidth={1.5} 
              />
              <span className={`font-body text-[11px] sm:text-[12px] leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5 ${isAtiva ? 'font-bold' : 'font-medium'}`}>
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
          className="relative flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl md:hover:bg-white/10 active:opacity-70 transition-transform duration-100 touch-manipulation cursor-pointer flex-1"
        >
          <span
            className={`absolute -top-11 left-1/2 -translate-x-1/2 w-[76px] h-[76px] xs:w-[80px] xs:h-[80px] md:relative md:top-0 md:left-0 md:translate-x-0 md:w-auto md:h-auto md:bg-transparent md:shadow-none rounded-full flex items-center justify-center overflow-hidden shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition-transform ${
              buscaAtiva ? 'scale-110 md:bg-white/15 md:ring-1 md:ring-white/25 bg-purple-500' : 'bg-[#9333ea]'
            }`}
          >
            <Search className="relative w-10 h-10 xs:w-11 xs:h-11 md:w-9 md:h-9 text-white md:text-white/90 drop-shadow-lg -scale-x-100" strokeWidth={1.5} />
            {/* Reflexo brilhante que passa periodicamente no mobile */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-[vade-mecum-shine_3.4s_ease-in-out_infinite] md:hidden"
            />
          </span>
          {/* Spacer invisível ocupando o mesmo espaço do ícone dos outros slots no mobile */}
          <span aria-hidden className="w-7 h-7 sm:w-8 sm:h-8 md:hidden" />
          <span className={`font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5 ${buscaAtiva ? 'text-white' : 'text-white/80 hover:text-white md:text-white/90'}`}>
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
              className={`flex flex-col items-center justify-end gap-1.5 py-1.5 transition-all active:opacity-70 duration-100 touch-manipulation cursor-pointer relative flex-1 ${
                isAtiva ? 'text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              <CatIcon 
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform drop-shadow-md ${isAtiva ? 'scale-110' : 'drop-shadow-sm'}`} 
                style={{ color: isAtiva ? cor : 'currentColor' }} 
                strokeWidth={1.5} 
              />
              <span className={`font-body text-[11px] sm:text-[12px] leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5 ${isAtiva ? 'font-bold' : 'font-medium'}`}>
                {info?.label ?? catKey}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
