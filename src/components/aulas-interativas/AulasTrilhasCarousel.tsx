import React, { useRef, useState } from 'react';
import { 
  Sparkles, BookOpen, Shield, Scale, Building2, Layers, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { 
  TRILHAS_CRONOLOGICAS, 
  calcularMetricasFase 
} from '@/data/aulasTrilhasCronologicas';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';

interface AulasTrilhasCarouselProps {
  disciplinas: DisciplinaItem[];
  aulas: AulaItem[];
  faseSelecionadaId: string | null;
  onSelectFase: (faseId: string | null) => void;
  onOpenTodasTrilhas?: () => void;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Shield,
  Scale,
  Building2,
  Sparkles,
};

export const AulasTrilhasCarousel: React.FC<AulasTrilhasCarouselProps> = React.memo(
  function AulasTrilhasCarousel({
    disciplinas,
    aulas,
    faseSelecionadaId,
    onSelectFase,
    onOpenTodasTrilhas,
    calcularProgressoCiclo,
  }) {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const nodeWidth = 145;
      const newIdx = Math.round(el.scrollLeft / nodeWidth);
      if (newIdx !== activeIndex && newIdx >= 0 && newIdx < TRILHAS_CRONOLOGICAS.length) {
        setActiveIndex(newIdx);
      }
    };

    const scrollToFase = (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const child = el.children[index] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: target, behavior: 'smooth' });
    };

    return (
      <div className="w-full select-none">
        {/* Cabeçalho da Seção de Trilhas */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 mb-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[15px] sm:text-[16.5px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-[3px] sm:w-[3.5px] h-4.5 sm:h-5 rounded-full bg-gradient-to-b from-[#5eead4] via-[#0d9488] to-[#042f2e] shadow-[0_0_8px_rgba(45,212,191,0.6)] shrink-0" />
              <span>Trilhas</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[11px] sm:text-[11.5px] leading-snug ml-3.5 truncate">
              Divididas do início ao fim da formação jurídica completa
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {faseSelecionadaId && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onSelectFase(null);
                }}
                className="text-[10px] sm:text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-[#2dd4bf] hover:bg-teal-500/30 border border-teal-500/30 transition-all cursor-pointer"
              >
                Limpar
              </button>
            )}

            {onOpenTodasTrilhas && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onOpenTodasTrilhas();
                }}
                className="text-[11px] sm:text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* ── TRILHA HORIZONTAL EM CÍRCULOS AMPLIADOS (DESIGN MINIMALISTA LIMPO) ── */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex items-start justify-start sm:justify-center gap-0 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);
            const isLast = idx === TRILHAS_CRONOLOGICAS.length - 1;
            
            // Cálculo do progresso no anel circular SVG ampliado (raio 34 -> perímetro ~213.63)
            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (metricas.pct / 100) * circumference;

            return (
              <React.Fragment key={fase.id}>
                {/* ── NÓ CIRCULAR DA TRILHA ── */}
                <div
                  onClick={() => {
                    try { haptic.impact('medium'); } catch {}
                    onSelectFase(isSelected ? null : fase.id);
                    scrollToFase(idx);
                  }}
                  className="snap-center shrink-0 flex flex-col items-center w-[116px] xs:w-[130px] sm:w-[145px] cursor-pointer group transition-all duration-300"
                >
                  {/* Container do Círculo com Anel de Progresso SVG e Badge Flutuante */}
                  <div className="relative flex items-center justify-center">
                    {/* SVG Progress Ring Ampliado */}
                    <svg 
                      className="w-[78px] h-[78px] xs:w-[86px] xs:h-[86px] sm:w-[94px] sm:h-[94px] transform -rotate-90 pointer-events-none drop-shadow-md"
                      viewBox="0 0 84 84"
                    >
                      {/* Trilha do anel (fundo sutil) */}
                      <circle
                        cx="42"
                        cy="42"
                        r={radius}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.12)"
                        strokeWidth="3.5"
                      />
                      {/* Progresso preenchido */}
                      {metricas.pct > 0 && (
                        <circle
                          cx="42"
                          cy="42"
                          r={radius}
                          fill="transparent"
                          stroke={fase.accentColor}
                          strokeWidth="3.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                    </svg>

                    {/* Círculo Principal Ampliado com Gradiente Temático */}
                    <div
                      className={`absolute inset-[7px] rounded-full flex flex-col items-center justify-center transition-all duration-300 ease-out border shadow-lg ${
                        isSelected
                          ? 'scale-105 border-white ring-2 ring-white/90'
                          : 'border-white/20 group-hover:scale-105 group-hover:border-white/40'
                      }`}
                      style={{
                        background: fase.gradientBg,
                        boxShadow: isSelected
                          ? `0 0 24px ${fase.accentColor}95, 0 8px 24px rgba(0,0,0,0.9)`
                          : `0 4px 14px rgba(0,0,0,0.65)`,
                      }}
                    >
                      {/* Ícone da Fase Ampliado */}
                      <Icon 
                        className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 transition-transform duration-300 ${
                          isSelected ? 'text-white scale-110' : 'text-white/90 group-hover:scale-110'
                        }`}
                        strokeWidth={2.2}
                      />
                    </div>

                    {/* Badge Circular do Número do Módulo no Topo Direito */}
                    <span 
                      className="absolute -top-1 right-1 w-5 h-5 xs:w-5.5 xs:h-5.5 rounded-full text-[9px] xs:text-[10px] font-mono font-black border shadow-md flex items-center justify-center leading-none"
                      style={{
                        backgroundColor: isSelected ? '#ffffff' : fase.accentColor,
                        color: isSelected ? '#000000' : '#ffffff',
                        borderColor: isSelected ? fase.accentColor : 'rgba(255,255,255,0.4)',
                        boxShadow: `0 2px 8px ${fase.accentColor}60`,
                      }}
                    >
                      {fase.faseNumero}
                    </span>

                    {/* Check de conclusão se 100% */}
                    {metricas.pct >= 100 && (
                      <span className="absolute -bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Informações Minimalistas Abaixo do Círculo (Sem poluição de textos de aulas) */}
                  <div className="flex flex-col items-center text-center mt-2 px-1 w-full">
                    <span 
                      className="text-[9px] xs:text-[9.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none mb-1 transition-colors"
                      style={{
                        backgroundColor: isSelected ? `${fase.accentColor}35` : 'rgba(0,0,0,0.4)',
                        color: isSelected ? '#ffffff' : fase.highlightColor,
                        borderColor: isSelected ? fase.accentColor : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      Módulo {fase.faseNumero}
                    </span>

                    <h3 className="font-serif font-black text-white text-[12px] xs:text-[13px] sm:text-[13.5px] leading-snug line-clamp-2 drop-shadow-sm min-h-[32px] flex items-center justify-center">
                      {fase.nome}
                    </h3>
                  </div>
                </div>

                {/* ── LINHA CONECTORA DA TRILHA ENTRE OS CÍRCULOS (EXCETO O ÚLTIMO) ── */}
                {!isLast && (
                  <div className="shrink-0 flex items-center justify-center w-5 xs:w-7 sm:w-9 pt-[35px] xs:pt-[39px] sm:pt-[43px] -mx-1">
                    <div 
                      className="w-full h-[2.5px] rounded-full transition-all duration-300 shadow-sm"
                      style={{
                        background: `linear-gradient(to right, ${fase.accentColor}90, ${TRILHAS_CRONOLOGICAS[idx + 1]?.accentColor || fase.accentColor}90)`,
                        opacity: isSelected ? 1 : 0.45,
                        boxShadow: isSelected ? `0 0 8px ${fase.accentColor}70` : undefined,
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Indicadores de Paginação Discretos */}
        <div className="flex items-center justify-center gap-1.5 mt-1 mb-2">
          {TRILHAS_CRONOLOGICAS.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToFase(dotIdx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === activeIndex
                  ? 'w-4.5 h-1.5 bg-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Ir para Módulo ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }
);
