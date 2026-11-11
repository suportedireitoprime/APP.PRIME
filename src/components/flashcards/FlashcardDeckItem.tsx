import React, { memo } from 'react';
import { Layers, ArrowRight, Crown, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FlashcardDeckItem = memo(({ item, i, palette, isLast }: any) => {
  const isLeft = i % 2 === 0;
  const tituloLimpo = (item.titulo || '').replace(/^\d+[\.\-\s_:]+/, '').trim();
  const primaryColor = palette?.primary || '#2563eb';

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Nó da Trilha: Deck com Título Abaixo (Alinhado em Zigue-Zague) ── */}
      <div
        className={cn(
          "w-full max-w-[520px] flex",
          isLeft ? "justify-start pl-2 sm:pl-6" : "justify-end pr-2 sm:pr-6"
        )}
      >
        <div
          onClick={item.onClick}
          onPointerEnter={item.onPrefetch}
          onTouchStart={item.onPrefetch}
          className="flex flex-col items-center text-center w-[180px] xs:w-[200px] sm:w-[220px] cursor-pointer select-none group focus-visible:outline-none"
        >
          {/* ── CONJUNTO DE 3 CARTAS EM FORMATO DE DECK AZUL ELEGANTE ── */}
          <div className="relative w-[130px] h-[130px] xs:w-[145px] xs:h-[145px] sm:w-[165px] sm:h-[165px] aspect-square transition-transform duration-300 group-hover:-translate-y-2 group-active:scale-[0.96]">
            {/* CARTA 1 (Traseira - Azul profundo com leve rotação) */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl border border-blue-400/20 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden aspect-square",
                isLeft
                  ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-4 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5"
                  : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-4 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5"
              )}
              style={{
                background: 'linear-gradient(145deg, #1e3a8a 0%, #0f172a 100%)',
                boxShadow: '0 8px 20px -4px rgba(37,99,235,0.3)',
              }}
            >
              <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-cyan-300/40" />
              </div>
            </div>

            {/* CARTA 2 (Meio - Azul intermediário) */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl border border-blue-400/30 opacity-70 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden aspect-square",
                isLeft
                  ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-2.5"
                  : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-2.5"
              )}
              style={{
                background: 'linear-gradient(145deg, #1d4ed8 0%, #0f172a 100%)',
                boxShadow: '0 10px 24px -5px rgba(37,99,235,0.4)',
              }}
            >
              <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-blue-200/50" />
              </div>
            </div>

            {/* CARTA 3 (Principal Frontal - Azul Vibrante com Borda Iluminada) */}
            <div
              className="relative w-full h-full p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-blue-400/50 group-hover:border-blue-300 transition-all duration-300 origin-bottom aspect-square shadow-xl group-hover:shadow-[0_16px_36px_rgba(37,99,235,0.45)]"
              style={{
                background: 'linear-gradient(145deg, #1e40af 0%, #1e3a8a 45%, #0f172a 100%)',
              }}
            >
              {/* Brilho reflexivo no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />

              {/* Topo da Carta: Templo Grego e Deck */}
              <div className="flex items-center justify-between z-[2] w-full px-0.5">
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-200 drop-shadow-sm font-sans">
                  <Landmark className="w-3 h-3 text-cyan-300 shrink-0" />
                  {item.badgeLabel}
                </span>
                <Layers className="w-3.5 h-3.5 text-blue-200/70" />
              </div>

              {/* Centro da Carta: Seta Normal (ArrowRight) ou Coroa de Bloqueio */}
              <div className="my-auto py-1 z-[2] w-full flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-300 scale-125 pointer-events-none bg-blue-500"
                  />

                  <div
                    className={cn(
                      "relative w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110",
                      item.isLocked
                        ? "bg-black/75 border-amber-400/60 text-amber-400 group-hover:border-amber-300 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                        : "bg-blue-600/90 border-blue-300/50 text-white group-hover:bg-blue-500 group-hover:border-white group-hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                    )}
                  >
                    {item.isLocked ? (
                      <Crown className="w-5 h-5 fill-amber-400/20 text-amber-400" />
                    ) : (
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2.6} />
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé da Carta: Progresso e Estatísticas */}
              <div className="z-[2] pt-1.5 border-t border-white/15 w-full px-0.5">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-blue-100 mb-1">
                  <span className="truncate">
                    {item.displayConcluidas > 0
                      ? `${item.displayConcluidas}/${item.displayTotal}`
                      : `${item.displayTotal} cards`}
                  </span>
                  <span className="font-bold text-white">{item.displayPct}%</span>
                </div>
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-300 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                    style={{
                      width: `${Math.max(item.displayPct, item.displayTotal > 0 ? 8 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── NOME DO DECK E QUAL DECK É DO LADO (Estilo Clássico Grego) ── */}
          <div className="mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-1.5 px-0.5 text-center flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-950/80 border border-cyan-400/40 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-300 shrink-0 shadow-sm">
              <Landmark className="w-2.5 h-2.5 text-cyan-400" />
              {item.badgeLabel}
            </span>
            <span className="font-sans font-bold text-[13px] xs:text-[14px] sm:text-[15px] leading-tight text-white group-hover:text-cyan-300 transition-colors drop-shadow-sm">
              {tituloLimpo}
            </span>
            {item.isLocked && (
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* ── Conector Serpenteante em Zigue-Zague Mais Espaçado (Fluido e Luminoso) ── */}
      {!isLast && (
        <div className="relative w-full max-w-[520px] h-28 sm:h-36 my-2 sm:my-3 pointer-events-none z-[5] overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id={`trail-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Leito da Trilha (traço suave de fundo) */}
            <path
              d={isLeft ? "M 28 0 C 28 65, 72 35, 72 100" : "M 72 0 C 72 65, 28 35, 28 100"}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Linha da Trilha em Zigue-Zague Pontilhada Luminosa em Azul Oficial */}
            <path
              d={isLeft ? "M 28 0 C 28 65, 72 35, 72 100" : "M 72 0 C 72 65, 28 35, 28 100"}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#trail-glow-${i})`}
            />
          </svg>

          {/* Medalhão Clássico Grego no Ponto Médio com Anel Iluminado */}
          <div
            className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border-2 border-cyan-300 bg-blue-600 shadow-[0_0_14px_rgba(34,211,238,0.7)] flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          </div>
        </div>
      )}
    </div>
  );
});

export default FlashcardDeckItem;
