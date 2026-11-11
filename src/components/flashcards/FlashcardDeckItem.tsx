import React, { memo } from 'react';
import { Check, Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardDeckItemProps {
  item: {
    key: string;
    titulo: string;
    badgeLabel: string;
    ordemStr: string;
    displayTotal: number;
    displayConcluidas: number;
    displayPct: number;
    temasCount?: number;
    subtituloCustom?: string;
    capaUrl?: string;
    isLocked?: boolean;
    onClick: () => void;
    onPrefetch?: () => void;
  };
  i: number;
  palette?: { primary: string };
  isLast: boolean;
  isActive?: boolean;
}

export const FlashcardDeckItem = memo(({ item, i, isLast, isActive = false }: FlashcardDeckItemProps) => {
  const isCompleted = item.displayPct === 100 || (item.displayTotal > 0 && item.displayConcluidas >= item.displayTotal);
  const tituloLimpo = (item.titulo || '').replace(/^\d+[\.\-\s_:]+/, '').trim();
  
  // Alterna o nó suavemente em curva pela encosta da montanha:
  const shiftIndex = i % 4;
  const alignmentClass = 
    shiftIndex === 0 ? "justify-start pl-2 sm:pl-6" :
    shiftIndex === 1 ? "justify-end pr-2 sm:pr-8" :
    shiftIndex === 2 ? "justify-start pl-6 sm:pl-12" :
    "justify-center";

  // Curva da estrada conectando este nó ao próximo
  const isNextShiftRight = shiftIndex === 0 || shiftIndex === 2;

  // Barra de progresso circular externa contornando a moeda (raio 26, circunferência ~163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  // Progresso efetivo: se completado 100%, se ativo sem progresso mostra 15% como indicador inicial do contorno
  const effectivePct = isCompleted ? 100 : Math.max(item.displayPct, isActive ? 15 : 0);
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, effectivePct))) / 100;

  return (
    <div className="w-full flex flex-col items-center relative select-none">
      {/* ── Nó da Trilha: Moeda com Contorno de Progresso + Card em Mármore ── */}
      <div className={cn("w-full max-w-[560px] flex z-10 my-1.5 sm:my-2", alignmentClass)}>
        <div
          onClick={item.onClick}
          onMouseEnter={item.onPrefetch}
          onTouchStart={item.onPrefetch}
          className={cn(
            "flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-2 rounded-2xl cursor-pointer transition-all duration-300 group max-w-[92vw] sm:max-w-[440px]",
            isActive
              ? "scale-[1.03] sm:scale-105"
              : "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
          )}
        >
          {/* ── 1. MOEDA / MEDALHÃO HELÊNICO COM BARRA DE PROGRESSO EM CONTORNO ── */}
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
            {/* SVG da Barra de Progresso Circular que Contorna a Moeda */}
            <svg 
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20 overflow-visible"
              viewBox="0 0 64 64"
            >
              {/* Trilho de base escuro contornando o círculo */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="#1c120c"
                strokeWidth="5"
              />
              {/* Guia visível do trilho circular */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={isCompleted ? "rgba(16, 185, 129, 0.35)" : "rgba(245, 158, 11, 0.35)"}
                strokeWidth="3.5"
              />

              {/* Barra de Progresso em Contorno: Verde Esmeralda se completado (100%), Dourada se em andamento ou ativo */}
              {(isCompleted || item.displayPct > 0 || isActive) && (
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke={isCompleted ? "#10b981" : "#fbbf24"}
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: isCompleted 
                      ? 'drop-shadow(0 0 6px #10b981)' 
                      : 'drop-shadow(0 0 5px #f59e0b)',
                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
                  }}
                />
              )}
            </svg>

            {/* Moeda Circular Interna (Centralizada com folga nítida para a barra de progresso circular) */}
            <div
              className={cn(
                "relative rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 z-10",
                "w-10 h-10 sm:w-11 sm:h-11"
              )}
              style={
                isCompleted ? {
                  background: 'radial-gradient(circle at 32% 30%, #34d399 0%, #059669 55%, #064e3b 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.7)',
                  border: '1.5px solid #34d399',
                } : isActive ? {
                  background: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #fef08a 35%, #f59e0b 80%, #b45309 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.85), inset 0 -2px 4px rgba(180,83,9,0.5)',
                  border: '1.5px solid #fef08a',
                } : item.isLocked ? {
                  background: 'radial-gradient(circle at 35% 30%, #78350f 0%, #451a03 65%, #1c1917 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.2)',
                  border: '1px solid rgba(120, 53, 15, 0.4)',
                } : {
                  background: 'radial-gradient(circle at 32% 30%, #fef3c7 0%, #d97706 60%, #78350f 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.5)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }
              }
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
              ) : isActive ? (
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#451a03] fill-[#451a03] ml-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]" />
              ) : item.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-[#fbbf24] drop-shadow-sm" />
              ) : (
                <span className="text-[11px] sm:text-xs font-serif font-black text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                  {item.ordemStr}
                </span>
              )}
            </div>
          </div>

          {/* ── 2. CARD HORIZONTAL EM PERGAMINHO / MÁRMORE DA GRÉCIA (Sem Capa na Lista) ── */}
          <div
            className={cn(
              "flex-1 min-w-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border transition-all duration-300",
              isCompleted
                ? "border-[#10b981]/50 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.3)]"
                : isActive
                ? "border-[#d97706]/70 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.4),0_0_16px_rgba(253,224,71,0.25)]"
                : item.isLocked
                ? "border-[#78350f]/35 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.6)] opacity-75"
                : "border-[#d97706]/40 shadow-[0_4px_16px_-4px_rgba(217,119,6,0.25)]"
            )}
            style={
              isCompleted ? {
                background: 'linear-gradient(135deg, rgba(20, 35, 25, 0.94) 0%, rgba(10, 24, 16, 0.94) 100%)',
              } : isActive ? {
                background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fde68a 100%)',
              } : item.isLocked ? {
                background: 'linear-gradient(135deg, rgba(20, 14, 10, 0.85) 0%, rgba(30, 21, 15, 0.85) 100%)',
              } : {
                background: 'linear-gradient(135deg, rgba(32, 22, 14, 0.92) 0%, rgba(48, 33, 20, 0.92) 100%)',
              }
            }
          >
            {/* Título do Tema */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={cn(
                  "font-serif font-black text-[13px] xs:text-[14px] sm:text-[15px] leading-snug truncate",
                  isCompleted
                    ? "text-[#a7f3d0]"
                    : isActive
                    ? "text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
                    : item.isLocked
                    ? "text-[#d6d3d1]"
                    : "text-[#fef3c7] group-hover:text-[#fde047] transition-colors"
                )}
              >
                {tituloLimpo}
              </span>
            </div>

            {/* Subtítulo: Quantidade de Temas e Cards com Seta Elegante */}
            <div className="flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-sans font-semibold">
              <span
                className={cn(
                  "flex items-center gap-1",
                  isCompleted
                    ? "text-[#34d399]"
                    : isActive
                    ? "text-[#78350f]"
                    : item.isLocked
                    ? "text-[#78716c]"
                    : "text-[#fef3c7]/75"
                )}
              >
                {item.subtituloCustom ? (
                  item.subtituloCustom
                ) : item.temasCount !== undefined ? (
                  <>
                    <span>{item.temasCount} temas</span>
                    <span className={cn("font-bold text-[11px]", isActive ? "text-[#b45309]" : "text-[#f59e0b]")}>→</span>
                    <span>{item.displayTotal} cards</span>
                  </>
                ) : (
                  `${item.displayTotal} cards`
                )}
              </span>
              {item.displayPct > 0 && (
                <>
                  <span className={cn(isCompleted ? "text-[#059669]" : isActive ? "text-[#b45309]" : "text-[#78350f]")}>•</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      isCompleted
                        ? "text-[#34d399]"
                        : isActive
                        ? "text-[#451a03]"
                        : "text-[#fbbf24]"
                    )}
                  >
                    {item.displayPct}% {isCompleted ? 'concluído' : 'dominado'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. CAMINHO DOURADO DE MONTANHA (Golden Serpentine Trail) ── */}
      {!isLast && (
        <div className="relative w-full max-w-[560px] h-16 sm:h-20 my-0.5 pointer-events-none z-0 overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`gold-trail-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <filter id={`gold-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base de pedra rústica da estrada de montanha */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke="#291b10"
              strokeWidth="9"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Borda dourada em pedra esculpida */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke="#78350f"
              strokeWidth="5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Estrada Dourada Luminosa */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke={`url(#gold-trail-${i})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#gold-glow-${i})`}
            />
          </svg>
        </div>
      )}
    </div>
  );
});

export default FlashcardDeckItem;
