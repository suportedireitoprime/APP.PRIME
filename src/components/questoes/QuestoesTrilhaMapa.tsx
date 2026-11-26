import { Check, Lock, Play, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import type { TrilhaItem } from '@/lib/questoesCuratedCovers';

type Props = {
  items: TrilhaItem[];
  avatarUrl?: string | null;
  onSelectItem: (item: TrilhaItem) => void;
};

/** Posicionamento serpenteante em X na trilha (esquerda, centro, direita, centro...). */
function getOffsetPercent(index: number): number {
  switch (index % 4) {
    case 0:
      return 28;
    case 1:
      return 45;
    case 2:
      return 72;
    case 3:
    default:
      return 50;
  }
}

function getModuleLabel(idx: number): string {
  if (idx === 0) return 'MÓDULO 1: TEORIA GERAL DO CRIME';
  if (idx === 3) return 'MÓDULO 2: PENAS & CONDUTA';
  if (idx === 7) return 'MÓDULO 3: CRIMES EM ESPÉCIE';
  if (idx === 12) return 'MÓDULO 4: LEGISLAÇÃO ESPECIAL';
  return '';
}

export default function QuestoesTrilhaMapa({ items, avatarUrl, onSelectItem }: Props) {
  return (
    <div className="relative w-full py-6 select-none">
      {/* Pista Central Serpenteante (SVG Road contínua que desce conectando os nós) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="road-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {items.map((item, idx) => {
          if (idx === items.length - 1) return null;
          const y1 = idx * 220 + 110;
          const y2 = (idx + 1) * 220 + 110;
          const x1 = getOffsetPercent(idx);
          const x2 = getOffsetPercent(idx + 1);
          const midY = (y1 + y2) / 2;
          const ativo = item.isConcluido || item.isEmAndamento;

          return (
            <g key={`road-${idx}`}>
              <path
                d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.07)"
                strokeWidth="36"
                strokeLinecap="round"
              />
              <path
                d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                fill="none"
                stroke={ativo ? '#E11D48' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth="3"
                strokeDasharray="8 8"
                strokeLinecap="round"
                filter={ativo ? 'url(#road-glow)' : undefined}
              />
              <circle
                cx={`${(x1 + x2) / 2}%`}
                cy={midY}
                r={ativo ? '4' : '2.5'}
                fill={ativo ? '#FB7185' : 'rgba(255, 255, 255, 0.25)'}
                filter={ativo ? 'url(#road-glow)' : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* Nós da Trilha: Livros 3D sobre Pedestais */}
      <div className="relative z-10 flex flex-col space-y-24 sm:space-y-28">
        {items.map((item, idx) => {
          const xPercent = getOffsetPercent(idx);
          const moduleLabel = getModuleLabel(idx);

          return (
            <div key={item.key} className="w-full relative flex flex-col items-center">
              {moduleLabel && (
                <div className="w-full flex items-center justify-center gap-3 my-6 pointer-events-none">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-[#161228]/90 px-3.5 py-1 rounded-full border border-white/10 shadow-sm">
                    {moduleLabel}
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              )}

              <div
                className="relative flex flex-col items-center cursor-pointer transition-transform duration-300 active:scale-95 group"
                style={{ marginLeft: `${(xPercent - 50) * 1.6}%` }}
                onClick={() => {
                  try { haptic.impact(); } catch {}
                  onSelectItem(item);
                }}
              >
                {item.isEmAndamento && (
                  <div className="absolute -top-12 z-30 flex flex-col items-center animate-bounce">
                    <div className="px-4 py-1.5 rounded-full bg-[#1A0E1D] border-2 border-[#E11D48] text-[#FB7185] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.85)] backdrop-blur-md">
                      CONTINUAR
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#E11D48]" />
                  </div>
                )}

                {item.isEmAndamento && (
                  <div className="absolute -left-16 sm:-left-20 top-6 z-30 flex flex-col items-center pointer-events-none animate-pulse">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#E11D48] to-[#A855F7] shadow-[0_0_20px_rgba(225,29,72,0.7)]">
                      <div className="w-full h-full rounded-full bg-[#1C1433] flex items-center justify-center overflow-hidden border border-white/30">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-rose-300" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Livro 3D em Pé */}
                <div className="relative w-[86px] xs:w-[98px] sm:w-[110px] h-[126px] xs:h-[144px] sm:h-[160px] rounded-2xl z-20 transition-all duration-300 group-hover:-translate-y-2">
                  <div
                    className="absolute top-1.5 bottom-1.5 -right-2 w-2 rounded-r-[3px] bg-gradient-to-r from-amber-50 to-zinc-200 border-r border-t border-b border-black/40 shadow-sm pointer-events-none z-0"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
                    }}
                  />
                  <div className="absolute top-0 bottom-0 left-0 w-2.5 rounded-l-2xl bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-20" />

                  <div
                    className={cn(
                      'relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xl flex flex-col justify-center items-center p-2',
                      item.isEmAndamento
                        ? 'border-[#E11D48] shadow-[0_0_28px_rgba(225,29,72,0.65)] ring-1 ring-[#FB7185]/50'
                        : item.isConcluido
                        ? 'border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300/40'
                        : 'border-white/15 bg-zinc-900/90 opacity-70 grayscale-[35%]',
                    )}
                    style={{ backgroundColor: '#130F24' }}
                  >
                    <img
                      src={item.coverImage}
                      alt={item.titulo}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.18] pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-center">
                      {item.isConcluido ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.7)] border-2 border-emerald-200">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      ) : item.isEmAndamento ? (
                        <div className="relative flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-[#E11D48] blur-md opacity-75 animate-ping scale-110" />
                          <div className="relative w-11 h-11 rounded-full bg-white text-[#E11D48] flex items-center justify-center shadow-[0_0_22px_rgba(255,255,255,0.95)] border-2 border-white transition-transform duration-300 group-hover:scale-110">
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-black/60 text-white/90 border border-white/25 flex items-center justify-center backdrop-blur-md shadow-lg">
                          <Lock className="w-4 h-4 text-purple-200" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pedestal 3D Elíptico */}
                <div className="relative -mt-4 w-32 xs:w-36 sm:w-42 h-9 xs:h-10 z-10 pointer-events-none flex items-center justify-center">
                  <div
                    className={cn(
                      'absolute inset-0 rounded-[50%] blur-md transition-all duration-300',
                      item.isEmAndamento
                        ? 'bg-[#E11D48]/70 scale-110'
                        : item.isConcluido
                        ? 'bg-emerald-500/50 scale-105'
                        : 'bg-[#1E1635]/60',
                    )}
                  />
                  <div
                    className={cn(
                      'relative w-full h-full rounded-[50%] border transition-all duration-300 shadow-xl overflow-hidden flex items-center justify-center',
                      item.isEmAndamento
                        ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] border-[#FB7185] shadow-[0_0_30px_rgba(225,29,72,0.85)]'
                        : item.isConcluido
                        ? 'bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-950 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-gradient-to-b from-[#251E3D] via-[#1B152F] to-[#0E0B19] border-white/10 shadow-lg',
                    )}
                  >
                    <div className="w-[84%] h-[74%] rounded-[50%] border border-white/20 bg-black/10" />
                  </div>
                </div>

                {/* Rótulo abaixo do Pedestal */}
                <div className="mt-2 text-center max-w-[150px] sm:max-w-[175px] space-y-1 flex flex-col items-center">
                  <span
                    className={cn(
                      "font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-colors inline-block",
                      item.isEmAndamento
                        ? 'bg-[#E11D48]/20 text-[#FB7185] border-[#E11D48]/40 shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                        : item.isConcluido
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-zinc-400 border-white/10',
                    )}
                  >
                    {item.badgeLabel}
                  </span>

                  <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[12.5px] sm:text-[13.5px] font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-200 transition-colors drop-shadow-sm px-1">
                    {item.titulo}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium text-zinc-400">
                    {item.isConcluido ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Concluído
                      </span>
                    ) : (
                      <span>{item.displayConcluidas}/{item.displayTotal} resolvidas</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
