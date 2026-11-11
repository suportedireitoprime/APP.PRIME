import React, { memo } from 'react';
import { Check, Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisciplinaVisualTheme, getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';

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
  theme?: DisciplinaVisualTheme;
}

export const FlashcardDeckItem = memo(({ 
  item, 
  i, 
  isLast, 
  isActive = false,
  theme 
}: FlashcardDeckItemProps) => {
  const activeTheme = theme || getDisciplinaVisualTheme('administrativo');
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
  // Progresso efetivo para o anel circular da medalha
  const effectivePct = isCompleted ? 100 : Math.min(100, Math.max(0, item.displayPct || 0));
  const strokeDashoffset = circumference - (circumference * effectivePct) / 100;

  return (
    <div className="w-full flex flex-col items-center relative select-none">
      {/* ── Nó da Trilha: Moeda com Contorno de Progresso + Card da Disciplina ── */}
      <div className={cn("w-full max-w-[560px] flex z-10 my-1.5 sm:my-2", alignmentClass)}>
        <div
          onClick={item.onClick}
          onMouseEnter={item.onPrefetch}
          onTouchStart={item.onPrefetch}
          className={cn(
            "flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-2 rounded-2xl cursor-pointer transition-all duration-300 group max-w-[92vw] sm:max-w-[440px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.92)]",
            isActive
              ? "scale-[1.03] sm:scale-105"
              : "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
          )}
        >
          {/* ── 1. MOEDA / MEDALHÃO COM BARRA DE PROGRESSO EM CONTORNO ── */}
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]">
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
                stroke="#120608"
                strokeWidth="5"
              />
              {/* Guia visível do trilho circular */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={isCompleted ? "rgba(16, 185, 129, 0.35)" : activeTheme.glowSoft}
                strokeWidth="3.5"
              />

              {/* Barra de Progresso em Contorno: Verde Esmeralda se completado (100%), Cor da Disciplina se em andamento ou ativo */}
              {(isCompleted || item.displayPct > 0 || isActive) && (
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke={isCompleted ? "#10b981" : activeTheme.accent}
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: isCompleted 
                      ? 'drop-shadow(0 0 6px #10b981)' 
                      : `drop-shadow(0 0 6px ${activeTheme.primary})`,
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
                  background: activeTheme.medalActive,
                  boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.85), 0 0 12px ${activeTheme.glowSoft}`,
                  border: `1.5px solid ${activeTheme.medalBorder}`,
                } : item.isLocked ? {
                  background: 'radial-gradient(circle at 35% 30%, rgba(45, 18, 25, 0.95) 0%, rgba(20, 8, 12, 0.95) 65%, #0c0406 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)',
                  border: `1px solid ${activeTheme.borderSubtle}`,
                } : {
                  background: activeTheme.bgCard,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.25)',
                  border: `1px solid ${activeTheme.borderSubtle}`,
                }
              }
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
              ) : isActive ? (
                <span 
                  className="text-[10px] sm:text-[11px] font-mono font-black tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] select-none"
                  style={{ color: activeTheme.textActive }}
                >
                  {item.displayPct || 0}%
                </span>
              ) : item.isLocked ? (
                <Lock className="w-3.5 h-3.5 drop-shadow-sm" style={{ color: activeTheme.accent }} />
              ) : (
                <span 
                  className="text-[11px] sm:text-xs font-serif font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]"
                  style={{ color: activeTheme.highlight }}
                >
                  {item.ordemStr}
                </span>
              )}
            </div>
          </div>

          {/* ── 2. CARD HORIZONTAL COM AS CORES DA DISCIPLINA (ALTURA UNIFORME E SOMBRA ELEVADA) ── */}
          <div
            className={cn(
              "flex-1 min-w-0 px-4 sm:px-4.5 py-2.5 sm:py-3 h-[76px] sm:h-[82px] min-h-[76px] sm:min-h-[82px] max-h-[76px] sm:max-h-[82px] rounded-2xl border transition-all duration-300 flex flex-col justify-center",
              isCompleted && "border-[#10b981]/60",
              item.isLocked && "opacity-90"
            )}
            style={
              isCompleted ? {
                background: 'linear-gradient(135deg, rgba(20, 35, 25, 0.96) 0%, rgba(10, 24, 16, 0.96) 100%)',
                borderColor: 'rgba(16, 185, 129, 0.55)',
                boxShadow: '0 14px 34px -4px rgba(0, 0, 0, 0.95), 0 6px 16px rgba(0, 0, 0, 0.85), 0 0 16px rgba(16, 185, 129, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
              } : isActive ? {
                background: activeTheme.bgActive,
                borderColor: activeTheme.border,
                boxShadow: `0 16px 38px -4px rgba(0, 0, 0, 0.95), 0 8px 20px rgba(0, 0, 0, 0.9), 0 0 24px ${activeTheme.glowSoft}, inset 0 1px 2px rgba(255, 255, 255, 0.95)`,
              } : item.isLocked ? {
                background: activeTheme.bgCard,
                borderColor: activeTheme.borderSubtle,
                boxShadow: '0 14px 34px -4px rgba(0, 0, 0, 0.95), 0 6px 16px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
              } : {
                background: activeTheme.bgCard,
                borderColor: activeTheme.border,
                boxShadow: `0 14px 34px -4px rgba(0, 0, 0, 0.95), 0 6px 16px rgba(0, 0, 0, 0.85), 0 0 16px ${activeTheme.glowSoft}, inset 0 1px 1px rgba(255, 255, 255, 0.1)`,
              }
            }
          >
            {/* Título do Tema */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "font-serif font-black text-[13px] xs:text-[14px] sm:text-[15px] leading-tight break-words line-clamp-2",
                  isCompleted
                    ? "text-[#a7f3d0]"
                    : item.isLocked
                    ? "text-[#e7e5e4]"
                    : ""
                )}
                style={
                  isActive ? {
                    color: activeTheme.textActive,
                    filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.7))'
                  } : !isCompleted && !item.isLocked ? {
                    color: activeTheme.highlight
                  } : undefined
                }
              >
                {tituloLimpo}
              </span>
            </div>

            {/* Subtítulo: Quantidade de Temas e Cards com Seta Elegante */}
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-sans font-semibold mt-1">
              <span
                className="flex items-center gap-1"
                style={
                  isCompleted ? { color: '#34d399' } :
                  isActive ? { color: activeTheme.textActive, opacity: 0.85 } :
                  item.isLocked ? { color: '#a8a29e' } :
                  { color: activeTheme.highlight, opacity: 0.8 }
                }
              >
                {item.subtituloCustom ? (
                  item.subtituloCustom
                ) : item.temasCount !== undefined ? (
                  <>
                    <span>{item.temasCount} temas</span>
                    <span 
                      className="font-bold text-[11px]"
                      style={{ color: isActive ? activeTheme.primary : activeTheme.accent }}
                    >
                      →
                    </span>
                    <span>{item.displayTotal} cards</span>
                  </>
                ) : (
                  `${item.displayTotal} cards`
                )}
              </span>
              {item.displayPct > 0 && (
                <>
                  <span style={{ color: isActive ? activeTheme.primary : activeTheme.accent }}>•</span>
                  <span
                    className="font-mono font-bold"
                    style={{
                      color: isCompleted ? '#34d399' : isActive ? activeTheme.textActive : activeTheme.accent
                    }}
                  >
                    {item.displayPct}% {isCompleted ? 'concluído' : 'dominado'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. CAMINHO SERPENTEANTE COM A PALETA DA DISCIPLINA ── */}
      {!isLast && (
        <div className="relative w-full max-w-[560px] h-16 sm:h-20 my-0.5 pointer-events-none z-0 overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`trail-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeTheme.highlight} />
                <stop offset="50%" stopColor={activeTheme.accent} />
                <stop offset="100%" stopColor={activeTheme.primary} />
              </linearGradient>
              <filter id={`trail-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base escura rústica da estrada de montanha */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke="#130709"
              strokeWidth="9"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Borda esculpida com a tonalidade sutil da disciplina */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke={activeTheme.borderSubtle}
              strokeWidth="5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Estrada Luminosa na Cor da Disciplina */}
            <path
              d={
                isNextShiftRight
                  ? "M 32 0 C 32 60, 68 40, 68 100"
                  : "M 68 0 C 68 60, 32 40, 32 100"
              }
              fill="none"
              stroke={`url(#trail-gradient-${i})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#trail-glow-${i})`}
            />
          </svg>
        </div>
      )}
    </div>
  );
});

export default FlashcardDeckItem;