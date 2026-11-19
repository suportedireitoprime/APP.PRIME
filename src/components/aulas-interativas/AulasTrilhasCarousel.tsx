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

const CICLOS_TRILHA = [
  { id: 'todos', label: 'Todos (106)', min: 1, max: 106 },
  { id: 'fundamentos', label: 'Fundamentos (1-12)', min: 1, max: 12 },
  { id: 'publico', label: 'Público & Const. (13-35)', min: 13, max: 35 },
  { id: 'civil', label: 'Civil & Privado (36-65)', min: 36, max: 65 },
  { id: 'penal', label: 'Penal & Processo (66-88)', min: 66, max: 88 },
  { id: 'especiais', label: 'Trabalho & Especiais (89-106)', min: 89, max: 106 },
];

const ITENS_INICIAIS = 8;

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
    const [cicloAtivo, setCicloAtivo] = useState('todos');
    const [limiteExibicao, setLimiteExibicao] = useState(ITENS_INICIAIS);

    // Filtra módulos pelo ciclo selecionado
    const modulosFiltrados = useMemo(() => {
      const ciclo = CICLOS_TRILHA.find((c) => c.id === cicloAtivo) || CICLOS_TRILHA[0];
      if (ciclo.id === 'todos') {
        return TRILHAS_CRONOLOGICAS;
      }
      return TRILHAS_CRONOLOGICAS.filter(
        (f) => f.faseNumero >= ciclo.min && f.faseNumero <= ciclo.max
      );
    }, [cicloAtivo]);

    // Módulos visíveis com paginação/expansão suave
    const modulosVisiveis = useMemo(() => {
      if (cicloAtivo !== 'todos') {
        return modulosFiltrados;
      }
      return modulosFiltrados.slice(0, limiteExibicao);
    }, [cicloAtivo, modulosFiltrados, limiteExibicao]);

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
        <div className="flex items-center justify-between gap-2 px-3 xs:px-4 sm:px-6 mb-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1 h-3.5 sm:h-4 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span>Trilhas do Conhecimento</span>
            </h2>
            <p className="font-sans text-rose-200/70 text-[11px] sm:text-xs leading-snug ml-3 truncate">
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
                className="text-[10px] sm:text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full bg-red-950/60 text-rose-300 hover:text-white border border-red-500/30 transition-all cursor-pointer"
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
                className="text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full bg-[#180307]/80 hover:bg-[#25050d] text-rose-200 hover:text-white border border-red-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Ver todas (106)</span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
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
                  setLimiteExibicao(ITENS_INICIAIS);
                }}
                className={`px-3 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer active:scale-95 ${
                  isAtivo
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 border-rose-400/50 text-white shadow-[0_0_12px_rgba(225,29,72,0.35)]'
                    : 'bg-[#180307]/80 border-red-500/20 text-zinc-300 hover:text-white hover:bg-[#25050d]'
                }`}
              >
                {ciclo.label}
              </button>
            );
          })}
        </div>

        {/* ── LISTA VERTICAL DE CARDS RUBI DAS FUNÇÕES COM ESPAÇAMENTO HARMÔNICO ── */}
        <div className="px-3 xs:px-4 sm:px-6 space-y-2.5 sm:space-y-3">
          {modulosVisiveis.map((fase) => {
            const isSelected = faseSelecionadaId === fase.id;
            const Icon = ICON_MAP[fase.iconName] || Layers;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);

            return (
              <div
                key={fase.id}
                onClick={() => handleCardClick(fase)}
                className={`relative overflow-hidden w-full rounded-2xl p-2.5 sm:p-3 cursor-pointer group transition-all duration-200 border flex items-center justify-between gap-3 sm:gap-4 select-none ${
                  isSelected
                    ? 'border-red-500/60 shadow-[0_12px_32px_rgba(225,29,72,0.30)] ring-1 ring-rose-400/40'
                    : 'border-red-500/30 hover:border-red-400/50 shadow-[0_6px_20px_rgba(225,29,72,0.15)] hover:shadow-[0_10px_28px_rgba(225,29,72,0.25)]'
                }`}
              >
                {/* Fundo Rubi com Listras de Seda e Crista de Luz das Funções */}
                <AulasCardRubyBackground active={isSelected} />

                {/* Capa Thumbnail 1:1 Compacta com Cantos Arredondados */}
                <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-red-500/25 shadow-inner">
                  {fase.capaUrl ? (
                    <>
                      <img
                        src={fase.capaUrl}
                        alt={fase.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      style={{ background: fase.gradientBg }}
                    >
                      <Icon className="w-6 h-6 text-white/90" strokeWidth={2} />
                    </div>
                  )}

                  {/* Número do Módulo */}
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-black/85 text-rose-200 border border-red-500/35 shadow">
                    #{fase.faseNumero}
                  </span>
                </div>

                {/* Informações da Trilha (Título + Metadados + Progresso) */}
                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 text-rose-300 border border-red-500/35 leading-none">
                      Módulo {fase.faseNumero}
                    </span>
                    <span className="text-[11px] font-mono text-rose-200/70">
                      • {fase.totalAulas || 30} aulas em áudio
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-white text-[13.5px] sm:text-[15px] leading-snug line-clamp-1 group-hover:text-rose-200 transition-colors">
                    {fase.nome}
                  </h3>

                  {/* Barra de Progresso Fina se houver progresso */}
                  {metricas.pct > 0 && (
                    <div className="w-full max-w-xs mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-black/40 rounded-full h-1 overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          style={{ width: `${metricas.pct}%` }}
                        />
                      </div>
                      <span className="text-[9.5px] font-mono text-rose-300 font-bold">{metricas.pct}%</span>
                    </div>
                  )}
                </div>

                {/* Botão de Ação / Chevron na Direita */}
                <div className="relative z-10 shrink-0 pl-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/35 text-rose-300 group-hover:text-white transition-all flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.25)] group-hover:shadow-[0_0_16px_rgba(225,29,72,0.6)]">
                    <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Expansão de Módulos quando no filtro 'todos' */}
        {cicloAtivo === 'todos' && limiteExibicao < modulosFiltrados.length && (
          <div className="px-3 xs:px-4 sm:px-6 mt-3 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setLimiteExibicao((prev) => Math.min(modulosFiltrados.length, prev + 12));
              }}
              className="w-full py-2.5 rounded-xl bg-[#180307]/80 hover:bg-[#25050d] border border-red-500/30 text-rose-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <span>Mostrar mais módulos (+12)</span>
              <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default AulasTrilhasCarousel;
