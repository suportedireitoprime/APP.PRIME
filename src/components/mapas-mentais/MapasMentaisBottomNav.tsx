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
          className="flex flex-col items-center justify-end gap-1 py-1 transition-all active:scale-95 duration-100 touch-manipulation cursor-pointer relative flex-1"
        >
          <div className={`p-2.5 sm:p-3 rounded-full flex items-center justify-center transform -translate-y-1 transition-all ${
            buscaAtiva 
              ? 'bg-[#9333ea] shadow-[0_4px_14px_rgba(168,85,247,0.4)] ring-2 ring-purple-400' 
              : 'bg-[#9333ea] hover:bg-[#7e22ce] shadow-[0_4px_14px_rgba(168,85,247,0.3)]'
          }`}>
            <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm -scale-x-100" strokeWidth={2.5} />
          </div>
          <span className={`font-body text-[11px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5 ${buscaAtiva ? 'text-purple-400' : 'text-white/90'}`}>
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
