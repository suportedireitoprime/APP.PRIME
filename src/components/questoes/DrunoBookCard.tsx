import React from 'react';
import { Play, Check, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

export interface DrunoBookCardProps {
  titulo: string;
  ordemStr: string;
  badgeLabel?: string;
  displayTotal: number;
  displayConcluidas: number;
  displayPct: number;
  coverImage: string;
  onClick: () => void;
  accentColor?: string;
  size?: 'normal' | 'compact' | 'large';
  className?: string;
}

export const DrunoBookCard: React.FC<DrunoBookCardProps> = ({
  titulo,
  ordemStr,
  badgeLabel = `Tema ${ordemStr}`,
  displayTotal,
  displayConcluidas,
  displayPct,
  coverImage,
  onClick,
  accentColor = '#E11D48',
  size = 'normal',
  className,
}) => {
  const isConcluido = displayPct >= 100 || (displayConcluidas >= displayTotal && displayTotal > 0);
  const isEmAndamento = !isConcluido && displayConcluidas > 0;

  const handleClick = (e: React.MouseEvent) => {
    try { haptic.impact(); } catch {}
    onClick();
  };

  // Dimensões do livro 3D
  const widthClass = size === 'compact' 
    ? 'w-[125px] xs:w-[135px] sm:w-[145px]' 
    : size === 'large'
    ? 'w-[160px] xs:w-[180px] sm:w-[210px]'
    : 'w-[138px] xs:w-[150px] sm:w-[168px] md:w-[185px]';

  const heightClass = size === 'compact'
    ? 'h-[185px] xs:h-[200px] sm:h-[215px]'
    : size === 'large'
    ? 'h-[235px] xs:h-[265px] sm:h-[305px]'
    : 'h-[205px] xs:h-[225px] sm:h-[250px] md:h-[275px]';

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex flex-col cursor-pointer select-none shrink-0 transition-transform duration-300 active:scale-[0.97]",
        widthClass,
        className
      )}
    >
      {/* ── LIVRO 3D EM PÉ COM LOMBADA E PÁGINAS ── */}
      <div className={cn("relative w-full rounded-2xl transition-all duration-300 group-hover:-translate-y-2", heightClass)}>
        
        {/* Sombra de projeção no chão (Base 3D do livro) */}
        <div 
          className="absolute -bottom-2.5 left-2 right-2 h-4 rounded-full bg-black/80 blur-md transition-all duration-300 group-hover:scale-110 group-hover:blur-lg group-hover:bg-black/90 pointer-events-none"
        />

        {/* Efeito 3D das Páginas Físicas na Lateral Direita */}
        <div 
          className="absolute top-1.5 bottom-1.5 -right-1.5 w-2 sm:w-2.5 rounded-r-[3px] bg-gradient-to-r from-amber-100/90 via-zinc-200 to-amber-50/70 border-r border-t border-b border-black/40 shadow-sm pointer-events-none z-0 overflow-hidden flex flex-col justify-between py-1"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)'
          }}
        />

        {/* Efeito 3D da Lombada na Lateral Esquerda */}
        <div className="absolute top-0 bottom-0 left-0 w-3 rounded-l-2xl bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none z-20" />

        {/* Corpo Principal da Capa do Livro */}
        <div 
          className={cn(
            "relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xl z-10 flex flex-col justify-between p-3",
            isConcluido
              ? "border-emerald-500/70 shadow-[0_12px_28px_rgba(16,185,129,0.25)]"
              : isEmAndamento
              ? "border-amber-400/70 shadow-[0_12px_28px_rgba(245,158,11,0.25)]"
              : "border-white/20 group-hover:border-white/50 shadow-[0_12px_24px_rgba(0,0,0,0.7)] group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.85)]"
          )}
          style={{ backgroundColor: '#141414' }}
        >
          {/* Imagem de Capa do Livro (Full-Bleed com Zoom no Hover) */}
          <img
            src={coverImage}
            alt={titulo}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
          />

          {/* Gradiente de Contraste Cinematográfico (Mantém a arte visível no centro) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/50 pointer-events-none" />

          {/* Brilho Diagonal Laminado da Capa (Igual Druno) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.15] pointer-events-none" />

          {/* Reflexo Dinâmico no Hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {/* Topo da Capa: Status discreto se concluído */}
          <div className="relative z-10 flex items-center justify-end w-full">
            {isConcluido ? (
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-emerald-300">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            ) : isEmAndamento ? (
              <span 
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: accentColor }}
              />
            ) : null}
          </div>

          {/* Centro da Capa: Botão de Play de Vidro Fosco (Design Sistema Druno) */}
          <div className="relative z-10 my-auto flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Pulso de aura luminosa se em andamento */}
              {isEmAndamento && (
                <div 
                  className="absolute inset-0 rounded-full blur-md opacity-80 animate-pulse scale-125"
                  style={{ backgroundColor: accentColor }}
                />
              )}

              <div 
                className={cn(
                  "w-11 h-11 xs:w-12 xs:h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl transition-all duration-300 group-hover:scale-110",
                  isConcluido
                    ? "bg-emerald-500/90 text-white border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    : "bg-black/65 border border-white/40 text-white group-hover:bg-amber-500 group-hover:border-amber-300 group-hover:text-black group-hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                )}
              >
                {isConcluido ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <Play className="w-4 h-4 xs:w-5 xs:h-5 fill-current translate-x-0.5 transition-colors" />
                )}
              </div>
            </div>
          </div>

          {/* Rodapé da Capa: Barra de Progresso elegante e discreta se iniciado */}
          {displayConcluidas > 0 && (
            <div className="relative z-10 w-full">
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(displayPct, 6)}%`,
                    backgroundColor: isConcluido ? '#10B981' : accentColor,
                    boxShadow: isConcluido ? '0 0 8px #10B981' : `0 0 8px ${accentColor}`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TEXTO E INFORMAÇÕES DO LIVRO (ABAIXO DA CAPA - IGUAL DRUNO) ── */}
      <div className="mt-2.5 px-0.5 space-y-0.5 w-full min-w-0">
        <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[13px] xs:text-[14px] sm:text-[15px] font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
          {titulo}
        </p>
        <p className="text-[11px] sm:text-[12px] text-zinc-400 truncate">
          {badgeLabel} • {displayTotal} questões
        </p>

        {isConcluido ? (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 pt-0.5">
            <Check className="w-3 h-3 stroke-[3]" /> Dominado
          </span>
        ) : isEmAndamento ? (
          <span 
            className="inline-block text-[10px] sm:text-[11px] font-bold pt-0.5"
            style={{ color: accentColor }}
          >
            Em Andamento • {displayConcluidas}/{displayTotal}
          </span>
        ) : (
          <span className="inline-block text-[10px] sm:text-[11px] text-zinc-500 pt-0.5">
            Não iniciado
          </span>
        )}
      </div>
    </div>
  );
};

export default DrunoBookCard;

