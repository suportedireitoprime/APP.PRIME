import React, { useRef, useState } from 'react';
import { 
  Sparkles, BookOpen, Shield, Scale, Building2, Layers, CheckCircle2 
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
    calcularProgressoCiclo,
  }) {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const cardWidth = el.firstElementChild?.clientWidth || 220;
      const newIdx = Math.round(el.scrollLeft / (cardWidth + 12));
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
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 mb-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[15px] sm:text-[16.5px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1.5 h-4.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.7)] shrink-0" />
              <span>Trilhas em Ordem Cronológica</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[11px] sm:text-[11.5px] leading-snug ml-3.5 truncate">
              Divididas do início ao fim da formação jurídica completa
            </p>
          </div>

          {faseSelecionadaId && (
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onSelectFase(null);
              }}
              className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 transition-all shrink-0 cursor-pointer"
            >
              Ver Todas
            </button>
          )}
        </div>

        {/* Faixa Horizontal de Cards Reduzidos em Degradê */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);

            return (
              <div
                key={fase.id}
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onSelectFase(isSelected ? null : fase.id);
                  scrollToFase(idx);
                }}
                className={`snap-center shrink-0 w-[205px] xs:w-[225px] sm:w-[245px] h-[142px] sm:h-[150px] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-white/60 border-white/70 shadow-xl scale-[1.02]'
                    : 'border-white/15 hover:border-white/30 shadow-md hover:shadow-lg'
                }`}
                style={{
                  background: fase.gradientBg,
                  boxShadow: isSelected
                    ? `0 12px 28px -6px ${fase.accentColor}55, 0 0 16px rgba(0,0,0,0.85)`
                    : '0 6px 18px -4px rgba(0,0,0,0.6)',
                }}
              >
                {/* Ícone d'água de fundo */}
                <Icon
                  className="absolute -right-3 -bottom-3 w-24 h-24 text-white/[0.08] pointer-events-none transform -rotate-12"
                  strokeWidth={1.2}
                />

                {/* Topo do Card: Badge da Fase & Quantidade de Matérias */}
                <div className="relative z-10 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-white/20"
                      style={{ backgroundColor: fase.badgeBg }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider text-white border border-white/20 leading-none"
                      style={{ backgroundColor: `${fase.accentColor}30` }}
                    >
                      Fase {fase.faseNumero}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-white/80">
                    {metricas.totalDisciplinas} matérias
                  </span>
                </div>

                {/* Título & Subtítulo compacto */}
                <div className="relative z-10 my-0.5">
                  <h3 className="font-serif font-black text-white text-[14.5px] sm:text-[15.5px] leading-tight tracking-wide drop-shadow-sm truncate">
                    {fase.nome}
                  </h3>
                  <p 
                    className="text-[10.5px] sm:text-[11px] font-sans font-medium mt-0.5 truncate"
                    style={{ color: fase.highlightColor }}
                  >
                    {fase.subtitulo}
                  </p>
                </div>

                {/* Rodapé: Progresso & Total de Aulas */}
                <div className="relative z-10 pt-1.5 border-t border-white/15 mt-auto">
                  <div className="flex items-center justify-between text-[10px] text-white/90 mb-1 font-sans">
                    <span className="font-medium text-white/80">
                      {metricas.totalAulas} aulas
                    </span>
                    <span className="font-bold font-mono text-white flex items-center gap-1">
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                      {metricas.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{
                        width: `${Math.max(metricas.pct === 0 ? 0 : 5, metricas.pct)}%`,
                        backgroundColor: fase.highlightColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicadores de Paginação */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5 mb-3">
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
              aria-label={`Ir para Fase ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }
);
