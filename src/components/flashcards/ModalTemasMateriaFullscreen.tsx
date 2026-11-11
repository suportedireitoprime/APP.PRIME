import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Lock, Check, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { ModalOrdemCronologica } from '@/components/flashcards/ModalOrdemCronologica';

export interface TemaModalItem {
  id: string;
  key: string;
  numeroAula?: string;
  titulo: string;
  descricao?: string;
  capaUrl?: string;
  displayTotal: number;
  isLocked?: boolean;
}

export interface MateriaModalRef {
  id: string;
  titulo: string;
  subtitulo?: string;
  capaUrl?: string;
  totalCards?: number;
  items?: TemaModalItem[];
}

interface ModalTemasMateriaFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  materia: MateriaModalRef | null;
  todasMaterias?: MateriaModalRef[];
  onSelectMateria?: (mat: MateriaModalRef) => void;
  temas: TemaModalItem[];
  onSelectTema: (tema: TemaModalItem) => void;
  areaNome?: string;
}

// Ramo de louros clássicos helênicos sobre pedras/rochas esculpidas
const LaurelStoneCorner = ({ flip = false }: { flip?: boolean }) => (
  <svg 
    viewBox="0 0 120 120" 
    className={cn(
      "w-16 h-16 sm:w-20 sm:h-20 text-[#d97706] pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]", 
      flip && "scale-x-[-1]"
    )}
    fill="currentColor"
  >
    {/* Pedras/rochas esculpidas de base no canto */}
    <path 
      d="M0,120 L45,120 L40,105 L25,98 L10,108 Z" 
      fill="#451a03" 
      stroke="#b45309" 
      strokeWidth="1.5"
      opacity="0.85"
    />
    <path 
      d="M20,120 L70,120 L60,108 L40,105 Z" 
      fill="#29180d" 
      stroke="#78350f" 
      strokeWidth="1.5"
      opacity="0.9"
    />
    {/* Ramo de louros dourados saindo das rochas */}
    <path d="M15,105 Q45,85 55,25 Q52,65 25,98 Z" opacity="0.9" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
    <path d="M55,23 C60,20 67,25 63,31 C59,37 53,29 55,23 Z" fill="#fde047" />
    <path d="M53,37 C61,35 68,41 62,48 C56,55 51,45 53,37 Z" fill="#f59e0b" />
    <path d="M47,53 C56,52 62,59 55,66 C48,73 45,61 47,53 Z" fill="#d97706" />
    <path d="M39,70 C48,70 53,77 45,83 C38,89 36,78 39,70 Z" fill="#b45309" />
    <path d="M51,29 C43,25 38,31 43,37 C48,43 53,34 51,29 Z" fill="#fde047" />
    <path d="M47,45 C38,42 34,49 40,55 C46,61 49,51 47,45 Z" fill="#f59e0b" />
    <path d="M41,63 C31,61 28,68 35,74 C42,80 44,69 41,63 Z" fill="#d97706" />
  </svg>
);

function formatarTituloCurto(t: string): string {
  if (!t) return '';
  return t
    .replace(/^\d+[\.\-\s_:]+/, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\s+([a-zA-ZÀ-ÿ]+)/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Administrativo\b/gi, '')
    .replace(/^Direito\s+[a-zA-ZÀ-ÿ]+\s*[-–:]\s*/i, '')
    .replace(/\s+Direito\s+Administrativo\b/gi, '')
    .trim();
}

export const ModalTemasMateriaFullscreen: React.FC<ModalTemasMateriaFullscreenProps> = ({
  isOpen,
  onClose,
  materia,
  todasMaterias = [],
  onSelectMateria,
  temas,
  onSelectTema,
  areaNome = 'Direito'
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 4;

  // Bottom Sheet da Ordem Cronológica para Temas Bloqueados
  const [lockedTemaTarget, setLockedTemaTarget] = useState<TemaModalItem | null>(null);
  const [isOrdemTemaModalOpen, setIsOrdemTemaModalOpen] = useState(false);

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
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#0f0905] text-white select-none overflow-hidden"
      >
        {/* ── FUNDO ESCURO SOFISTICADO (Clean Dark, sem imagem de fundo) ── */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 15%, #1c1108 0%, #0c0805 50%, #050302 100%)',
          }}
        />

        {/* ── HEADER SUPERIOR: Botão Voltar + Título Centralizado ── */}
        <div className="relative z-10 w-full pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 sm:px-6 pb-1.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onClose();
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/50 border border-[#78350f]/60 text-[#fef3c7] hover:bg-[#451a03] active:scale-95 transition-all cursor-pointer shadow-md"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.4]" />
          </button>

          <div className="flex-1 text-center pr-10">
            <h1 className="text-base sm:text-lg font-serif font-black text-[#fef3c7] tracking-wide">
              Qual tema de flashcards?
            </h1>
            <p className="text-[11px] sm:text-xs text-[#fef3c7]/65 mt-0.5">
              Escolha o tema para praticar os flashcards.
            </p>
          </div>
        </div>

        {/* ── CONTEÚDO CENTRAL: Capa 16:9 + Lista Vertical Separada por Linhas Finas ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between w-full max-w-[440px] mx-auto px-4 py-1 min-h-0">
          {/* 1. CAPA OFICIAL (SEM MOLDURA/FUNDO, COM DEGRADÊ PRETO NA PARTE DE BAIXO) */}
          <div className="relative w-full shrink-0 my-1 overflow-hidden rounded-2xl">
            <img
              src={capaExibicao}
              alt={materia.titulo}
              loading="eager"
              decoding="async"
              className="w-full aspect-[16/9] max-h-[180px] sm:max-h-[215px] object-cover object-center filter brightness-[0.98] contrast-[1.05]"
            />
            {/* Degradê preto na parte de baixo que se funde suavemente com a tela */}
            <div 
              className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, #0f0905 0%, rgba(15, 9, 5, 0.9) 35%, rgba(15, 9, 5, 0.4) 65%, transparent 100%)',
              }}
            />
          </div>

          {/* 2. LISTA VERTICAL DE TEMAS COM CONECTOR E LINHAS FINAS DIVISÓRIAS */}
          <div className="w-full flex-1 flex flex-col justify-center relative py-1">
            {/* Linha vertical conectora dourada à esquerda */}
            {currentTemas.length > 1 && (
              <div 
                className="absolute left-[27px] sm:left-[29px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#78350f]/50 pointer-events-none z-0" 
              />
            )}

            <div className="w-full flex flex-col">
              {currentTemas.map((item, idx) => {
                const isFirst = pageIndex === 0 && idx === 0;
                const isLocked = !isFirst;
                const cleanTitle = (item.titulo || '')
                  .replace(/^\d+[\.\-\s_:]+/, '')
                  .replace(/\s+(do|de|no|da|em)\s+Direito\s+([a-zA-ZÀ-ÿ]+)/gi, '')
                  .replace(/\s+(do|de|no|da|em)\s+Direito\b/gi, '')
                  .replace(/\s+(do|de|no|da|em)\s+Administrativo\b/gi, '')
                  .replace(/\s+Direito\s+Administrativo\b/gi, '')
                  .trim();
                const subtituloText = item.descricao || (item.displayTotal > 0 ? `${item.displayTotal} flashcards` : 'Conceitos fundamentais');

                return (
                  <div
                    key={item.key || item.id}
                    onClick={() => {
                      if (isLocked) {
                        try { haptic.impact('medium'); } catch {}
                        setLockedTemaTarget(item);
                        setIsOrdemTemaModalOpen(true);
                      } else {
                        try { haptic.light(); } catch {}
                        onSelectTema(item);
                      }
                    }}
                    className={cn(
                      "relative z-10 w-full flex items-center gap-3 cursor-pointer transition-all duration-200 select-none min-h-[58px] sm:min-h-[64px]",
                      // O item ativo tem card iluminado destacado; os demais têm linha fina separadora
                      isFirst && !isLocked
                        ? "my-1 p-2.5 sm:p-3 rounded-2xl border border-[#d97706]/75 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.35)]"
                        : "py-2.5 px-2 border-b border-[#78350f]/35 hover:bg-black/20"
                    )}
                    style={
                      isFirst && !isLocked ? {
                        background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.28) 0%, rgba(180, 83, 9, 0.15) 60%, rgba(20, 14, 10, 0.8) 100%)',
                        backdropFilter: 'blur(8px)',
                      } : undefined
                    }
                  >
                    {/* Círculo do Nó à Esquerda (Linha vertical cruza pelo centro) */}
                    <div className="relative shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
                      <div 
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform",
                          isFirst && !isLocked
                            ? "bg-[#f59e0b]/25 border border-[#fbbf24] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            : isLocked
                            ? "bg-black/70 border border-[#78350f]/60"
                            : "bg-black/60 border border-white/20"
                        )}
                      >
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#f59e0b]/75" />
                        ) : (
                          <Play 
                            className={cn(
                              "w-3.5 h-3.5 ml-0.5",
                              isFirst ? "text-[#fde047] fill-[#fde047]" : "text-[#fef3c7]/60 fill-[#fef3c7]/60"
                            )} 
                          />
                        )}
                      </div>
                    </div>

                    {/* Textos Centrais (Título e Subtítulo Sem Abreviação) */}
                    <div className="flex-1 min-w-0 pr-1 py-0.5">
                      <h3 
                        className={cn(
                          "font-serif font-black text-[13.5px] sm:text-[14.5px] leading-snug break-words line-clamp-2",
                          isFirst && !isLocked ? "text-[#fef3c7]" : isLocked ? "text-[#d6d3d1]" : "text-[#e7e5e4]"
                        )}
                      >
                        {cleanTitle}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#fef3c7]/65 font-sans break-words line-clamp-1 mt-0.5">
                        {subtituloText}
                      </p>
                    </div>

                    {/* Ação à Direita (Botão de Play Dourado apenas no item ativo liberado) */}
                    <div className="shrink-0 flex items-center justify-center pl-1">
                      {!isLocked && (
                        <div 
                          className={cn(
                            "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105 active:scale-95",
                            isFirst
                              ? "bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] text-[#451a03] shadow-[0_0_14px_rgba(245,158,11,0.7)]"
                              : "bg-[#d97706]/35 border border-[#f59e0b]/50 text-[#fde047]"
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
          </div>

          {/* 3. RODAPÉ: CONTADOR (1 / 4) + BULLETS + ROCHAS COM LOUROS HELÊNICOS */}
          <div className="w-full shrink-0 pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between relative">
            {/* Pedras e louros no canto inferior esquerdo */}
            <div className="absolute left-0 bottom-0 pointer-events-none">
              <LaurelStoneCorner />
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

            {/* Pedras e louros no canto inferior direito */}
            <div className="absolute right-0 bottom-0 pointer-events-none">
              <LaurelStoneCorner flip />
            </div>
          </div>
        </div>

        {/* Bottom Sheet Pedagógico para Temas Bloqueados */}
        <ModalOrdemCronologica
          isOpen={isOrdemTemaModalOpen}
          onClose={() => setIsOrdemTemaModalOpen(false)}
          temaBloqueadoTitulo={lockedTemaTarget?.titulo ? lockedTemaTarget.titulo.replace(/^\d+[\.\-\s_:]+/, '').trim() : 'Tema Selecionado'}
          temaAnteriorTitulo={temas[0]?.titulo ? temas[0].titulo.replace(/^\d+[\.\-\s_:]+/, '').trim() : 'Origens'}
          onConcluirAnterior={() => {
            setIsOrdemTemaModalOpen(false);
            if (temas[0]) {
              onSelectTema(temas[0]);
            }
          }}
          onContinuarAssimMesmo={() => {
            setIsOrdemTemaModalOpen(false);
            if (lockedTemaTarget) {
              onSelectTema(lockedTemaTarget);
            }
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};
