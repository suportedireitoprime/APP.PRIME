import React, { useRef, useState } from 'react';
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

const CICLOS_TRILHA = [
  { id: 'todos', label: 'Todos (106)', startIdx: 0 },
  { id: 'fundamentos', label: 'Fundamentos (1-12)', startIdx: 0 },
  { id: 'publico', label: 'Público & Const. (13-35)', startIdx: 12 },
  { id: 'civil', label: 'Civil & Privado (36-65)', startIdx: 35 },
  { id: 'penal', label: 'Penal & Processo (66-88)', startIdx: 65 },
  { id: 'especiais', label: 'Trabalho & Especiais (89-106)', startIdx: 88 },
];

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
    const [cicloAtivo, setCicloAtivo] = useState('todos');

    const handleScroll = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let minDiff = Infinity;

      for (let i = 0; i < TRILHAS_CRONOLOGICAS.length; i++) {
        const child = el.children[i] as HTMLElement | undefined;
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
      const child = el.children[index] as HTMLElement | undefined;
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
        <div className="flex items-center justify-between gap-2 px-3 xs:px-4 sm:px-6 mb-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1 h-3.5 sm:h-4 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span>Trilhas do Conhecimento</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[11px] sm:text-xs leading-snug ml-3 truncate">
              106 módulos em ordem cronológica de estudo
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
                className="text-[10px] sm:text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
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
                className="text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Ver todas (106)</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* Pílulas de Navegação Rápida por Grandes Ciclos */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 xs:px-4 sm:px-6 mb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CICLOS_TRILHA.map((ciclo) => {
            const isAtivo = cicloAtivo === ciclo.id;
            return (
              <button
                key={ciclo.id}
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setCicloAtivo(ciclo.id);
                  scrollToFase(ciclo.startIdx);
                }}
                className={`px-3 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer active:scale-95 ${
                  isAtivo
                    ? 'bg-white/15 border-white/30 text-white shadow-sm'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {ciclo.label}
              </button>
            );
          })}
        </div>

        {/* ── CARROSSEL MINIMALISTA E RESPONSIVO DE CARDS ── */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-3 xs:gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory px-3 xs:px-4 sm:px-6 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isCenter = idx === activeIndex;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);

            return (
              <div
                key={fase.id}
                onClick={() => handleCardClick(fase, idx)}
                className={`snap-start shrink-0 flex flex-col justify-between w-[205px] xs:w-[225px] sm:w-[245px] md:w-[265px] rounded-2xl p-2.5 sm:p-3 cursor-pointer group transition-all duration-200 border backdrop-blur-md select-none ${
                  isCenter
                    ? 'bg-zinc-900/95 border-white/25 shadow-xl scale-[1.01]'
                    : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/80 shadow-md'
                }`}
              >
                {/* Imagem de Capa 16:10 */}
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-zinc-950 border border-white/5 shadow-inner group">
                  {fase.capaUrl ? (
                    <>
                      <img
                        src={fase.capaUrl}
                        alt={fase.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      style={{ background: fase.gradientBg }}
                    >
                      <Icon className="w-7 h-7 text-white/90 mb-1" strokeWidth={2} />
                    </div>
                  )}

                  {/* Badge Superior Esquerdo: Módulo #01 */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/80 backdrop-blur-md text-zinc-200 border border-white/10 shadow-sm leading-none flex items-center justify-center">
                      MÓDULO #{fase.faseNumero}
                    </span>
                  </div>

                  {/* Badge Superior Direito: Total de Aulas */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10 shadow-sm">
                      {fase.totalAulas || 30} aulas
                    </span>
                  </div>

                  {/* Indicador de Conclusão / Progresso */}
                  {metricas.pct >= 100 ? (
                    <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow text-[9px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.4} />
                      <span>Feito</span>
                    </div>
                  ) : metricas.pct > 0 ? (
                    <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 shadow text-[9px] font-mono font-bold">
                      <span>{metricas.pct}%</span>
                    </div>
                  ) : null}
                </div>

                {/* Informações Minimalistas */}
                <div className="mt-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider truncate block">
                      {fase.subtitulo || fase.areas?.[0] || 'Formação Jurídica'}
                    </span>

                    <h3 className="font-sans font-bold text-white text-[13px] xs:text-[14px] leading-snug line-clamp-2 min-h-[38px] mt-0.5 group-hover:text-red-300 transition-colors">
                      {fase.nome}
                    </h3>

                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 font-sans">
                      {fase.totalAulas || 30} aulas em áudio • Cronograma oficial
                    </p>
                  </div>

                  {/* Barra de Progresso Fina */}
                  {metricas.pct > 0 && (
                    <div className="w-full mt-2 bg-white/10 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${metricas.pct}%` }}
                      />
                    </div>
                  )}

                  {/* Rodapé Limpo do Card */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-mono text-zinc-400">
                      {metricas.concluidas > 0 ? `${metricas.concluidas}/${metricas.totalAulas} feitas` : 'Iniciar Trilha'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">
                      <span>Ver Aulas</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Barra de Controle de Navegação & Indicador Rápido */}
        <div className="flex items-center justify-between px-3 xs:px-4 sm:px-6 mt-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollDelta(-2)}
              disabled={activeIndex === 0}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              aria-label="Módulos anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollDelta(2)}
              disabled={activeIndex >= TRILHAS_CRONOLOGICAS.length - 1}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              aria-label="Próximos módulos"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="font-mono text-[11px] text-zinc-400 px-2 py-0.5">
              Módulo <strong className="text-white font-bold">{activeIndex + 1}</strong> de {TRILHAS_CRONOLOGICAS.length}
            </span>
          </div>

          {onOpenTodasTrilhas && (
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onOpenTodasTrilhas();
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Grade Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
