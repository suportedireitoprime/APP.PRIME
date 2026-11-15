import React, { useRef, useState, useEffect } from 'react';
import { 
  BookOpen, Shield, Scale, Building2, Sparkles, Layers, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { 
  TRILHAS_CRONOLOGICAS, 
  calcularMetricasFase,
  TrilhaFaseItem
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
  onOpenModuloDedicado?: (moduloId: string) => void;
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
    onOpenModuloDedicado,
    calcularProgressoCiclo,
  }) {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
      const el = scrollerRef.current;
      if (!el) return;
      // Item width (130px) + connector width (48px) = ~178px
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let minDiff = Infinity;

      // Percorre os nós para encontrar o mais próximo do centro exato
      for (let i = 0; i < TRILHAS_CRONOLOGICAS.length; i++) {
        const child = el.children[i * 2] as HTMLElement | undefined;
        if (child) {
          const childCenter = child.offsetLeft + child.clientWidth / 2;
          const diff = Math.abs(center - childCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
      }

      if (closestIdx !== activeIndex && closestIdx >= 0 && closestIdx < TRILHAS_CRONOLOGICAS.length) {
        setActiveIndex(closestIdx);
      }
    };

    const scrollToFase = (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const child = el.children[index * 2] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: target, behavior: 'smooth' });
      setActiveIndex(index);
    };

    const scrollDelta = (deltaModules: number) => {
      const nextIdx = Math.max(0, Math.min(TRILHAS_CRONOLOGICAS.length - 1, activeIndex + deltaModules));
      scrollToFase(nextIdx);
    };

    const handleCardClick = (fase: TrilhaFaseItem, idx: number) => {
      try { haptic.impact('medium'); } catch {}
      scrollToFase(idx);
      if (onOpenModuloDedicado) {
        onOpenModuloDedicado(fase.id);
      } else {
        onSelectFase(faseSelecionadaId === fase.id ? null : fase.id);
      }
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
              106 Módulos Oficiais • Divididos por aulas e temas
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

        {/* ── TRILHA HORIZONTAL EM FORMATO 1:1 COM ZOOM CENTRAL E LINHA DE GUIA PROEMINENTE ── */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex items-start justify-start gap-0 overflow-x-auto snap-x snap-mandatory px-8 sm:px-12 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isCenter = idx === activeIndex;
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);
            const isLast = idx === TRILHAS_CRONOLOGICAS.length - 1;

            return (
              <React.Fragment key={fase.id}>
                {/* ── CARD 1:1 DO MÓDULO (COM ZOOM NA CAPA CENTRAL E SEM CONTORNO COLORIDO) ── */}
                <div
                  onClick={() => handleCardClick(fase, idx)}
                  className={`snap-center shrink-0 flex flex-col items-center w-[120px] xs:w-[130px] sm:w-[142px] cursor-pointer group transition-all duration-300 ease-out ${
                    isCenter ? 'scale-110 z-20' : 'scale-95 opacity-80 hover:opacity-100 hover:scale-100 z-10'
                  }`}
                >
                  {/* Container Quadrado 1:1 Limpo sem Contorno Colorido */}
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <div
                      className={`relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950 transition-all duration-300 shadow-md ${
                        isCenter
                          ? 'border border-white/40 ring-1 ring-white/30 shadow-[0_12px_28px_rgba(0,0,0,0.95)]'
                          : 'border border-white/10 group-hover:border-white/25'
                      }`}
                    >
                      {fase.capaUrl ? (
                        <>
                          <img
                            src={fase.capaUrl}
                            alt={fase.nome}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div 
                          className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                          style={{ background: fase.gradientBg }}
                        >
                          <Icon className="w-8 h-8 text-white/90 mb-1" strokeWidth={2} />
                        </div>
                      )}

                      {/* Badge Superior Esquerdo Neutro e Minimalista */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black bg-black/80 text-white border border-white/20 shadow-sm leading-none flex items-center justify-center">
                          #{fase.faseNumero}
                        </span>
                      </div>

                      {/* Badge Inferior Direito com Quantidade de Aulas */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-black/80 text-zinc-300 border border-white/10 backdrop-blur-sm">
                          {fase.totalAulas || 30} aulas
                        </span>
                      </div>

                      {/* Indicador de Conclusão */}
                      {metricas.pct >= 100 && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Minimalistas Abaixo do Card 1:1 */}
                  <div className="flex flex-col items-center text-center mt-2 px-1 w-full">
                    <span className="text-[9px] xs:text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 leading-none mb-1">
                      Módulo {fase.faseNumero}
                    </span>

                    <h3 className={`font-serif font-black text-white text-[11.5px] xs:text-[12px] sm:text-[12.5px] leading-snug line-clamp-2 drop-shadow-sm min-h-[30px] flex items-center justify-center transition-colors ${
                      isCenter ? 'text-teal-300' : 'text-zinc-200'
                    }`}>
                      {fase.nome}
                    </h3>
                  </div>
                </div>

                {/* ── LINHA DE GUIA DA TRILHA COM MARGEM GENEROSA ── */}
                {!isLast && (
                  <div className="shrink-0 flex items-center justify-center w-10 xs:w-12 sm:w-16 pt-[54px] xs:pt-[58px] sm:pt-[64px] px-1">
                    <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-zinc-700 via-teal-500/70 to-zinc-700 shadow-[0_0_8px_rgba(45,212,191,0.5)] transition-all duration-300" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Barra de Controle de Navegação & Indicador Rápido */}
        <div className="flex items-center justify-center gap-3 mt-1 mb-2">
          <button
            type="button"
            onClick={() => scrollDelta(-3)}
            disabled={activeIndex === 0}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Módulos anteriores"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10.5px] text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
            Módulo <strong className="text-white">{activeIndex + 1}</strong> de 106
          </span>

          <button
            type="button"
            onClick={() => scrollDelta(3)}
            disabled={activeIndex >= TRILHAS_CRONOLOGICAS.length - 1}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Próximos módulos"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
);
