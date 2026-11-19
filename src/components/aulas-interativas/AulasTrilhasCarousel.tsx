import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Shield, Scale, Building2, Sparkles, Layers, CheckCircle2, ChevronRight, ChevronDown
} from 'lucide-react';
import { 
  TRILHAS_CRONOLOGICAS, 
  calcularMetricasFase,
  TrilhaFaseItem
} from '@/data/aulasTrilhasCronologicas';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';
import { AulasCardRubyBackground } from './AulasCardRubyBackground';

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

const ITENS_INICIAIS = 10;

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
    const [limiteExibicao, setLimiteExibicao] = useState(ITENS_INICIAIS);

    // Módulos estritamente em ordem cronológica (1 a 106)
    const modulosCronologicos = useMemo(() => {
      return [...TRILHAS_CRONOLOGICAS].sort((a, b) => a.faseNumero - b.faseNumero);
    }, []);

    // Módulos visíveis com paginação progressiva
    const modulosVisiveis = useMemo(() => {
      return modulosCronologicos.slice(0, limiteExibicao);
    }, [modulosCronologicos, limiteExibicao]);

    const handleCardClick = (fase: TrilhaFaseItem) => {
      try { haptic.impact('medium'); } catch {}
      if (onOpenModuloDedicado) {
        onOpenModuloDedicado(fase.id);
      } else {
        onSelectFase(faseSelecionadaId === fase.id ? null : fase.id);
      }
    };

    return (
      <div className="w-full select-none">
        {/* Cabeçalho da Seção de Trilhas */}
        <div className="flex items-center justify-between gap-2 px-3 xs:px-4 sm:px-6 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1 h-4 sm:h-4.5 rounded-full bg-red-600 shrink-0" />
              <span>Trilhas do Conhecimento</span>
            </h2>
            <p className="font-sans text-zinc-400 text-[11px] sm:text-xs leading-snug ml-3 truncate">
              Módulos em ordem cronológica de estudo (1 a 106)
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
                className="text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Ver todas (106)</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* ── LISTA VERTICAL DE CARDS EM ORDEM CRONOLÓGICA (PADRÃO GOOGLE MATERIAL 3) ── */}
        <div className="px-3 xs:px-4 sm:px-6 space-y-3">
          {modulosVisiveis.map((fase) => {
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);

            return (
              <div
                key={fase.id}
                onClick={() => handleCardClick(fase)}
                className={`relative overflow-hidden w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 min-h-[92px] sm:min-h-[104px] cursor-pointer group transition-all duration-200 border flex items-center justify-between gap-3 sm:gap-4 select-none ${
                  isSelected
                    ? 'border-red-500/50 bg-[#1a050c] shadow-xl shadow-black/80'
                    : 'border-white/10 hover:border-red-500/30 bg-[#141416]/95 hover:bg-[#1a1a1f] shadow-lg shadow-black/50'
                }`}
              >
                {/* Fundo Padrão das Funções (Listras Sutis de Seda) */}
                <AulasCardRubyBackground active={isSelected} rounded="rounded-2xl sm:rounded-3xl" />

                {/* 1. Indicador Numérico Estratégico FORA da Capa (Padrão Google Material 3) */}
                <div className="relative z-10 flex flex-col items-center justify-center shrink-0 w-8 xs:w-10 sm:w-12 text-center select-none">
                  <span className="font-mono text-xl sm:text-2xl font-black text-rose-400 group-hover:text-rose-300 transition-colors tracking-tight leading-none">
                    {String(fase.faseNumero).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] sm:text-[8.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mt-1">
                    MÓD
                  </span>
                </div>

                {/* 2. Capa Thumbnail 1:1 Ampliada (Límpida, sem números poluindo por dentro) */}
                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-zinc-950 border border-white/15 shadow-md">
                  {fase.capaUrl ? (
                    <>
                      <img
                        src={fase.capaUrl}
                        alt={fase.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      style={{ background: fase.gradientBg }}
                    >
                      <Icon className="w-7 h-7 text-white/90" strokeWidth={2} />
                    </div>
                  )}
                </div>

                {/* 3. Informações Estratégicas do Módulo: Título Amplo + Metadados + Barra de Progresso */}
                <div className="relative z-10 flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider bg-black/70 text-rose-300 border border-red-500/30 leading-none">
                      {fase.totalAulas || 30} aulas em áudio
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-white text-[14px] sm:text-[16px] leading-snug line-clamp-2 group-hover:text-rose-200 transition-colors">
                    {fase.nome}
                  </h3>

                  {/* Barra de Progresso Sempre Visível */}
                  <div className="w-full max-w-xs mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-black/70 rounded-full h-1.5 overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${metricas.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-rose-300 font-bold shrink-0">
                      {metricas.pct}%
                    </span>
                  </div>
                </div>

                {/* 4. Botão de Toque Amplo (Padrão Google Touch Target min 48x48dp) */}
                <div className="relative z-10 shrink-0 pl-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 group-hover:bg-red-600 border border-white/10 group-hover:border-red-500 text-zinc-300 group-hover:text-white transition-all flex items-center justify-center shadow-md">
                    <ChevronRight className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Expansão Progressiva em Ordem Cronológica */}
        {limiteExibicao < modulosCronologicos.length && (
          <div className="px-3 xs:px-4 sm:px-6 mt-3.5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setLimiteExibicao((prev) => Math.min(modulosCronologicos.length, prev + 12));
              }}
              className="w-full py-3 rounded-2xl bg-[#141416]/95 hover:bg-[#1c080d] border border-red-500/30 text-rose-200 hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99] cursor-pointer min-h-[48px]"
            >
              <span>Mostrar mais módulos (+12)</span>
              <ChevronDown className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default AulasTrilhasCarousel;
