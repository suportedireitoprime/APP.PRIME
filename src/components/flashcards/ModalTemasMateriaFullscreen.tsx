import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

interface TemaModalItem {
  id: string;
  key: string;
  numeroAula?: string;
  titulo: string;
  descricao?: string;
  capaUrl?: string;
  displayTotal: number;
  isLocked?: boolean;
}

interface ModalTemasMateriaFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  materia: {
    id: string;
    titulo: string;
    subtitulo?: string;
    capaUrl?: string;
    totalCards?: number;
  } | null;
  temas: TemaModalItem[];
  onSelectTema: (tema: TemaModalItem) => void;
  areaNome?: string;
}

// Ramo de louros clássicos helênicos para os cantos inferiores
const LaurelCorner = ({ flip = false }: { flip?: boolean }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn(
      "w-14 h-14 sm:w-16 sm:h-16 text-[#d97706]/70 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]", 
      flip && "scale-x-[-1]"
    )}
    fill="currentColor"
  >
    <path d="M15,90 Q40,75 50,20 Q48,55 25,85 Z" opacity="0.9" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path d="M50,18 C55,15 62,20 58,26 C54,32 48,24 50,18 Z" />
    <path d="M48,32 C56,30 63,36 57,43 C51,50 46,40 48,32 Z" />
    <path d="M42,48 C51,47 57,54 50,61 C43,68 40,56 42,48 Z" />
    <path d="M34,65 C43,65 48,72 40,78 C33,84 31,73 34,65 Z" />
    <path d="M25,80 C32,80 37,86 30,91 C23,96 23,87 25,80 Z" />
    <path d="M46,24 C38,20 33,26 38,32 C43,38 48,29 46,24 Z" />
    <path d="M42,40 C33,37 29,44 35,50 C41,56 44,46 42,40 Z" />
    <path d="M36,58 C26,56 23,63 30,69 C37,75 39,64 36,58 Z" />
    <path d="M28,74 C19,73 17,80 24,85 C31,90 31,80 28,74 Z" />
  </svg>
);

export const ModalTemasMateriaFullscreen: React.FC<ModalTemasMateriaFullscreenProps> = ({
  isOpen,
  onClose,
  materia,
  temas,
  onSelectTema,
  areaNome = 'Direito'
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 4;

  // Reseta a página ao abrir ou trocar matéria
  useEffect(() => {
    if (isOpen) {
      setPageIndex(0);
    }
  }, [isOpen, materia?.id]);

  const totalPages = Math.max(1, Math.ceil(temas.length / itemsPerPage));

  const currentTemas = useMemo(() => {
    const start = pageIndex * itemsPerPage;
    return temas.slice(start, start + itemsPerPage);
  }, [temas, pageIndex]);

  const capaExibicao = materia?.capaUrl || currentTemas[0]?.capaUrl || '/images/gamificacao/deusa_temis_vazada.webp';

  if (!isOpen || !materia) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#110b07] text-white select-none overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 15%, #2a180e 0%, #150d08 55%, #0a0604 100%)',
        }}
      >
        {/* Vinheta escura clássica */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        {/* ── HEADER SUPERIOR: Botão Voltar + Título Centralizado ── */}
        <div className="relative z-10 w-full pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 sm:px-6 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onClose();
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/40 border border-[#78350f]/50 text-[#fef3c7] hover:bg-[#451a03] active:scale-95 transition-all cursor-pointer shadow-md"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.4]" />
          </button>

          <div className="flex-1 text-center pr-10">
            <h1 className="text-base sm:text-lg font-serif font-black text-[#fef3c7] tracking-wide">
              Qual tema da aula?
            </h1>
            <p className="text-[11px] sm:text-xs text-[#fef3c7]/65 mt-0.5">
              Escolha o tema para acessar o conteúdo.
            </p>
          </div>
        </div>

        {/* ── CONTEÚDO CENTRAL (Capa + Lista Encadeada) ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between w-full max-w-[440px] mx-auto px-4 py-1 min-h-0">
          {/* 1. CAPA OFICIAL EM DESTAQUE NO TOPO (16:9 Arredondada) */}
          <div className="w-full shrink-0 my-1.5 sm:my-2">
            <div 
              className="relative w-full aspect-[16/9] max-h-[190px] sm:max-h-[220px] rounded-2xl overflow-hidden border border-[#d97706]/40 shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_18px_rgba(245,158,11,0.2)] bg-[#1c120c]"
            >
              <img
                src={capaExibicao}
                alt={materia.titulo}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
              />
              {/* Leve vinheta interna na imagem */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            </div>
          </div>

          {/* 2. LISTA VERTICAL DE TEMAS COM CONECTOR LINEAR À ESQUERDA */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3 relative py-1">
            {/* Linha vertical conectora dos nós */}
            {currentTemas.length > 1 && (
              <div 
                className="absolute left-[29px] sm:left-[31px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#78350f]/50 pointer-events-none z-0" 
              />
            )}

            {currentTemas.map((item, idx) => {
              const isFirst = idx === 0;
              const isLocked = !!item.isLocked;
              const cleanTitle = (item.titulo || '').replace(/^\d+[\.\-\s_:]+/, '').trim();
              const subtituloText = item.descricao || (item.displayTotal > 0 ? `${item.displayTotal} flashcards` : 'Conceitos fundamentais');

              return (
                <div
                  key={item.key || item.id}
                  onClick={() => {
                    if (isLocked) {
                      try { haptic.impact('medium'); } catch {}
                    } else {
                      try { haptic.light(); } catch {}
                    }
                    onSelectTema(item);
                  }}
                  className={cn(
                    "relative z-10 w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-200 select-none",
                    isFirst && !isLocked
                      ? "border border-[#d97706]/70 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.35)]"
                      : "border border-white/10 hover:border-[#f59e0b]/40 bg-black/40 hover:bg-black/60"
                  )}
                  style={
                    isFirst && !isLocked ? {
                      background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.28) 0%, rgba(180, 83, 9, 0.15) 60%, rgba(20, 14, 10, 0.8) 100%)',
                      backdropFilter: 'blur(8px)',
                    } : {
                      background: 'rgba(24, 16, 11, 0.72)',
                      backdropFilter: 'blur(8px)',
                    }
                  }
                >
                  {/* Círculo do Nó à Esquerda (Linha vertical cruza aqui) */}
                  <div className="relative shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
                    <div 
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform",
                        isFirst && !isLocked
                          ? "bg-[#f59e0b]/25 border border-[#fbbf24] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          : "bg-black/60 border border-white/20"
                      )}
                    >
                      <Play 
                        className={cn(
                          "w-3.5 h-3.5 ml-0.5",
                          isFirst && !isLocked ? "text-[#fde047] fill-[#fde047]" : "text-[#fef3c7]/60 fill-[#fef3c7]/60"
                        )} 
                      />
                    </div>
                  </div>

                  {/* Textos Centrais (Título e Subtítulo) */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 
                      className={cn(
                        "font-serif font-black text-[13px] sm:text-[14px] leading-snug truncate",
                        isFirst && !isLocked ? "text-[#fef3c7]" : "text-[#e7e5e4]"
                      )}
                    >
                      {cleanTitle}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#fef3c7]/65 font-sans truncate mt-0.5">
                      {subtituloText}
                    </p>
                  </div>

                  {/* Ação à Direita (Botão de Play Dourado ou Cadeado) */}
                  <div className="shrink-0 flex items-center justify-center pl-1">
                    {isLocked ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-[#78350f]/50">
                        <Lock className="w-4 h-4 text-[#f59e0b]/75" />
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105 active:scale-95",
                          isFirst
                            ? "bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] text-[#451a03] shadow-[0_0_14px_rgba(245,158,11,0.7)]"
                            : "bg-[#d97706]/30 border border-[#f59e0b]/50 text-[#fde047]"
                        )}
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. RODAPÉ: CONTADOR (1 / 4) + BULLETS + LOUROS NOS CANTOS */}
          <div className="w-full shrink-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between relative">
            {/* Louro no canto inferior esquerdo */}
            <div className="absolute left-0 bottom-1">
              <LaurelCorner />
            </div>

            {/* Paginação Central (Ex: 1 / 4 e bullets) */}
            <div className="w-full flex flex-col items-center justify-center space-y-1.5 z-10">
              <span className="text-xs font-serif font-black tracking-widest text-[#fde047]/90">
                {pageIndex + 1} / {totalPages}
              </span>

              {/* Pontinhos (Bullets) de Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setPageIndex(pIdx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all cursor-pointer",
                        pIdx === pageIndex
                          ? "w-4 bg-[#fde047] shadow-[0_0_6px_#fde047]"
                          : "bg-[#78350f]/70 hover:bg-[#d97706]"
                      )}
                      aria-label={`Ir para página ${pIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Louro no canto inferior direito */}
            <div className="absolute right-0 bottom-1">
              <LaurelCorner flip />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
