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
  { id: 'fundamentos', label: '🏛️ Fundamentos (1-12)', startIdx: 0 },
  { id: 'publico', label: '⚖️ Público & Const. (13-35)', startIdx: 12 },
  { id: 'civil', label: '📜 Civil & Privado (36-65)', startIdx: 35 },
  { id: 'penal', label: '⚔️ Penal & Processo (66-88)', startIdx: 65 },
  { id: 'especiais', label: '💼 Trabalho & Especiais (89-106)', startIdx: 88 },
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
        <div className="flex items-center justify-between gap-2 px-3 xs:px-4 sm:px-6 mb-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[15px] sm:text-[16.5px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-[3px] sm:w-[3.5px] h-4.5 sm:h-5 rounded-full bg-gradient-to-b from-[#5eead4] via-[#0d9488] to-[#042f2e] shadow-[0_0_8px_rgba(45,212,191,0.6)] shrink-0" />
              <span>Trilhas do Conhecimento</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[11px] sm:text-[11.5px] leading-snug ml-3.5 truncate">
              106 Módulos Oficiais • Divididos por ordem cronológica e temas
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
                className="text-[11px] sm:text-[11.5px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* Pílulas de Navegação Rápida por Grandes Ciclos */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 xs:px-4 sm:px-6 mb-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                className={`px-3 py-1 rounded-full text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer active:scale-95 ${
                  isAtivo
                    ? 'bg-teal-500/25 border-teal-400/60 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                    : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                {ciclo.label}
              </button>
            );
          })}
        </div>

        {/* ── CARROSSEL PANORÂMICO DE CARDS AMPLOS E ULTRA LEGÍVEIS ── */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-3 xs:gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory px-3 xs:px-4 sm:px-6 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {TRILHAS_CRONOLOGICAS.map((fase, idx) => {
            const isCenter = idx === activeIndex;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);

            return (
              <div
                key={fase.id}
                onClick={() => handleCardClick(fase, idx)}
                className={`snap-start shrink-0 flex flex-col justify-between w-[220px] xs:w-[245px] sm:w-[270px] md:w-[290px] rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 cursor-pointer group transition-all duration-300 ease-out border backdrop-blur-xl shadow-xl select-none ${
                  isCenter
                    ? 'bg-zinc-950/90 border-amber-400/50 ring-1 ring-amber-400/30 shadow-[0_12px_32px_rgba(0,0,0,0.85)] scale-[1.01]'
                    : 'bg-black/75 border-white/12 hover:border-white/30 hover:bg-black/85'
                }`}
              >
                {/* Imagem de Capa 16:10 */}
                <div className="relative w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-inner group">
                  {fase.capaUrl ? (
                    <>
                      <img
                        src={fase.capaUrl}
                        alt={fase.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      style={{ background: fase.gradientBg }}
                    >
                      <Icon className="w-8 h-8 text-white/90 mb-1" strokeWidth={2} />
                    </div>
                  )}

                  {/* Badge Superior Esquerdo: Módulo #01 */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-black bg-black/85 text-amber-300 border border-amber-500/40 shadow-sm leading-none flex items-center justify-center tracking-wider">
                      MÓDULO #{fase.faseNumero}
                    </span>
                  </div>

                  {/* Badge Superior Direito: Total de Aulas */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-black/85 text-teal-300 border border-teal-500/40 backdrop-blur-sm shadow-sm">
                      {fase.totalAulas || 30} aulas
                    </span>
                  </div>

                  {/* Indicador de Conclusão / Progresso */}
                  {metricas.pct >= 100 ? (
                    <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white border border-emerald-300 flex items-center gap-1 shadow-md text-[9px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.6} />
                      <span>Concluído</span>
                    </div>
                  ) : metricas.pct > 0 ? (
                    <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-teal-500/90 text-black border border-teal-300 flex items-center gap-1 shadow-md text-[9px] font-black font-mono">
                      <span>{metricas.pct}%</span>
                    </div>
                  ) : null}
                </div>

                {/* Informações Completas e Altamente Legíveis */}
                <div className="mt-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                      <span className="text-[9.5px] font-mono font-black text-teal-300 uppercase tracking-wider truncate">
                        {fase.subtitulo || fase.areas?.[0] || 'Formação Jurídica'}
                      </span>
                    </div>

                    <h3 className={`font-serif font-black text-white text-[13px] xs:text-[14px] leading-snug line-clamp-2 min-h-[38px] drop-shadow-sm transition-colors ${
                      isCenter ? 'text-amber-200' : 'text-zinc-100 group-hover:text-white'
                    }`}>
                      {fase.nome}
                    </h3>

                    <p className="text-[10.5px] text-zinc-400 mt-1 line-clamp-1 truncate font-sans">
                      {fase.temas && fase.temas.length > 0 ? fase.temas.join(' · ') : fase.descricao}
                    </p>
                  </div>

                  {/* Barra de Progresso do Módulo */}
                  {metricas.pct > 0 && (
                    <div className="w-full mt-2.5 bg-white/10 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${metricas.pct}%` }}
                      />
                    </div>
                  )}

                  {/* Rodapé de Ação do Card */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                      {metricas.concluidas > 0 ? `${metricas.concluidas}/${metricas.totalAulas} feitas` : 'Iniciar Trilha'}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-teal-500/15 group-hover:bg-teal-500 text-teal-300 group-hover:text-black border border-teal-500/30 transition-all">
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
        <div className="flex items-center justify-between px-3 xs:px-4 sm:px-6 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollDelta(-2)}
              disabled={activeIndex === 0}
              className="w-8 h-8 rounded-full bg-black/70 border border-white/15 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md"
              aria-label="Módulos anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollDelta(2)}
              disabled={activeIndex >= TRILHAS_CRONOLOGICAS.length - 1}
              className="w-8 h-8 rounded-full bg-black/70 border border-white/15 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md"
              aria-label="Próximos módulos"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="font-mono text-[11px] text-zinc-300 bg-black/60 border border-white/10 px-3 py-1 rounded-full">
              Módulo <strong className="text-amber-300">{activeIndex + 1}</strong> de {TRILHAS_CRONOLOGICAS.length}
            </span>
          </div>

          {onOpenTodasTrilhas && (
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onOpenTodasTrilhas();
              }}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Ver Grade Completa</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
