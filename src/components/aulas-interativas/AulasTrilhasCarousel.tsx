import React, { useRef, useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Shield, Scale, Building2, CheckCircle2, ChevronRight, Layers 
} from 'lucide-react';
import { 
  TRILHAS_CRONOLOGICAS, 
  TrilhaFaseItem, 
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
      const cardWidth = el.firstElementChild?.clientWidth || 300;
      const newIdx = Math.round(el.scrollLeft / (cardWidth + 16));
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
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[16px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#2dd4bf] to-[#0d9488] shadow-[0_0_10px_rgba(45,212,191,0.65)] shrink-0" />
              <span>Trilhas em Ordem Cronológica</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[12px] sm:text-[12.5px] leading-snug ml-3.5 truncate">
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
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 transition-all shrink-0 cursor-pointer"
            >
              Ver Todas
            </button>
          )}
        </div>

        {/* Faixa Horizontal de Cards em Degradê */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);
            const discNomes = disciplinas
              .filter((d) => fase.disciplinasIds.includes(d.id))
              .map((d) => d.nome.replace('DIREITO ', ''));

            return (
              <div
                key={fase.id}
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onSelectFase(isSelected ? null : fase.id);
                  scrollToFase(idx);
                }}
                className={`snap-center shrink-0 w-[280px] xs:w-[310px] sm:w-[340px] rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-white/50 border-white/60 shadow-2xl scale-[1.02]'
                    : 'border-white/15 hover:border-white/30 shadow-lg hover:shadow-xl'
                }`}
                style={{
                  background: fase.gradientBg,
                  boxShadow: isSelected
                    ? `0 16px 36px -8px ${fase.accentColor}60, 0 0 20px rgba(0,0,0,0.85)`
                    : '0 10px 25px -5px rgba(0,0,0,0.7)',
                }}
              >
                {/* Ícone d'água de fundo */}
                <Icon
                  className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.08] pointer-events-none transform -rotate-12"
                  strokeWidth={1.2}
                />

                {/* Topo do Card: Badge da Fase & Métricas */}
                <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/20"
                      style={{ backgroundColor: fase.badgeBg }}
                    >
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                    </div>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider text-white border border-white/20"
                      style={{ backgroundColor: `${fase.accentColor}30` }}
                    >
                      Fase {fase.faseNumero}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-white/80">
                    {metricas.totalDisciplinas} matérias
                  </span>
                </div>

                {/* Título & Descrição */}
                <div className="relative z-10 my-1">
                  <h3 className="font-serif font-black text-white text-[17px] sm:text-[18px] leading-tight tracking-wide drop-shadow-sm">
                    {fase.nome}
                  </h3>
                  <p 
                    className="text-[11.5px] sm:text-[12px] font-sans font-semibold mt-0.5 line-clamp-1"
                    style={{ color: fase.highlightColor }}
                  >
                    {fase.subtitulo}
                  </p>
                  <p className="text-[11px] text-white/70 font-sans mt-1.5 leading-relaxed line-clamp-2">
                    {fase.descricao}
                  </p>
                </div>

                {/* Tags das Matérias */}
                <div className="relative z-10 my-2.5 flex flex-wrap gap-1">
                  {discNomes.slice(0, 4).map((nome, nIdx) => (
                    <span
                      key={nIdx}
                      className="px-2 py-0.5 rounded-md bg-black/35 text-white/90 text-[9.5px] font-medium border border-white/10"
                    >
                      {nome}
                    </span>
                  ))}
                  {discNomes.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-black/45 text-white/70 text-[9.5px] font-mono">
                      +{discNomes.length - 4}
                    </span>
                  )}
                </div>

                {/* Rodapé: Progresso & Status */}
                <div className="relative z-10 pt-2 border-t border-white/15 mt-auto">
                  <div className="flex items-center justify-between text-[11px] text-white/90 mb-1.5 font-sans">
                    <span className="font-medium text-white/80">
                      {metricas.totalAulas} aulas interativas
                    </span>
                    <span className="font-bold font-mono text-white">
                      {metricas.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{
                        width: `${Math.max(metricas.pct === 0 ? 0 : 5, metricas.pct)}%`,
                        backgroundColor: fase.highlightColor,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-white/90 flex items-center gap-1">
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Fase Selecionada</span>
                        </>
                      ) : (
                        <span>Filtrar matérias desta fase</span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicadores de Paginação */}
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-4">
          {TRILHAS_CRONOLOGICAS.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToFase(dotIdx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === activeIndex
                  ? 'w-5 h-1.5 bg-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.6)]'
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
