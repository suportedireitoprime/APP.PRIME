import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Layers, ChevronRight, CheckCircle2, Sparkles, BookOpen, Shield, Scale, Building2, BookMarked
} from 'lucide-react';
import { 
  TRILHAS_CRONOLOGICAS, 
  calcularMetricasFase, 
  TrilhaFaseItem 
} from '@/data/aulasTrilhasCronologicas';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';

interface AulasTrilhasListaModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AulasTrilhasListaModal: React.FC<AulasTrilhasListaModalProps> = ({
  isOpen,
  onClose,
  disciplinas,
  aulas,
  faseSelecionadaId,
  onSelectFase,
  calcularProgressoCiclo,
}) => {
  if (!isOpen) return null;

  const handleSelecionarTrilha = (faseId: string) => {
    try { haptic.impact('medium'); } catch {}
    onSelectFase(faseId);
    onClose();
  };

  const handleLimparFiltro = () => {
    try { haptic.selection(); } catch {}
    onSelectFase(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        style={{ paddingBottom: 'var(--sai-bottom)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white truncate">
                Trilhas
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                Do 1º ao 10º período • 5 Módulos • 22 Matérias • 3.003 Aulas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onClose();
            }}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Informativa e Limpar Filtro */}
        {faseSelecionadaId && (
          <div className="px-5 py-2.5 bg-rose-950/40 border-b border-rose-900/40 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-rose-200 font-medium">
              Filtro ativo no catálogo principal
            </span>
            <button
              type="button"
              onClick={handleLimparFiltro}
              className="px-3 py-1 rounded-full bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 font-bold border border-rose-500/40 transition-all cursor-pointer"
            >
              Exibir Todas as Matérias
            </button>
          </div>
        )}

        {/* Lista Completa das Trilhas em Ordem */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {TRILHAS_CRONOLOGICAS.map((fase) => {
            const isSelected = faseSelecionadaId === fase.id;
            const metricas = calcularMetricasFase(fase, disciplinas, aulas, calcularProgressoCiclo);
            const materiasDaFase = disciplinas.filter((d) => fase.disciplinasIds.includes(d.id));

            return (
              <div
                key={fase.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden relative ${
                  isSelected
                    ? 'border-white/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 ring-2 ring-white/30 shadow-xl'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/70 hover:bg-zinc-900'
                }`}
              >
                {/* Linha de Destaque com o Degradê da Fase */}
                <div 
                  className="h-1.5 w-full"
                  style={{ background: fase.gradientBg }}
                />

                <div className="p-4 sm:p-5">
                  {/* Topo do Card: Badge do Módulo & Quantidade (Sem ícone em cima) */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider text-white border border-white/20"
                      style={{ backgroundColor: `${fase.accentColor}35` }}
                    >
                      Módulo {fase.faseNumero}
                    </span>

                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <span>{metricas.totalDisciplinas} matérias</span>
                      <span>•</span>
                      <span>{metricas.totalAulas} aulas</span>
                    </div>
                  </div>

                  {/* Título sem abreviação e Subtítulo */}
                  <div className="mb-2">
                    <h4 className="font-serif font-black text-white text-[17px] sm:text-[19px] leading-tight">
                      {fase.nome}
                    </h4>
                    <p 
                      className="text-[12px] sm:text-[12.5px] font-sans font-semibold mt-0.5"
                      style={{ color: fase.highlightColor }}
                    >
                      {fase.subtitulo}
                    </p>
                  </div>

                  {/* Descrição Didática */}
                  <p className="text-[12px] sm:text-[12.5px] text-zinc-300 font-sans leading-relaxed mb-3.5">
                    {fase.descricao}
                  </p>

                  {/* Matérias Inclusas na Trilha */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Matérias desta trilha:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {materiasDaFase.map((materia) => (
                        <span
                          key={materia.id}
                          className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-sans font-medium text-zinc-200"
                        >
                          {materia.nome.replace('DIREITO ', '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progresso do Usuário */}
                  <div className="pt-3 border-t border-white/10 mb-3.5">
                    <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                      <span className="font-sans">Progresso nesta trilha</span>
                      <span className="font-mono font-bold text-white flex items-center gap-1.5">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {metricas.pct}% concluído
                      </span>
                    </div>
                    <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(metricas.pct === 0 ? 0 : 4, metricas.pct)}%`,
                          backgroundColor: fase.accentColor,
                          boxShadow: `0 0 8px ${fase.accentColor}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSelecionarTrilha(fase.id)}
                      style={{
                        backgroundColor: isSelected ? '#10b981' : `${fase.accentColor}25`,
                        borderColor: isSelected ? '#34d399' : `${fase.accentColor}50`,
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white border flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <span>
                        {isSelected ? 'Módulo Selecionado no Catálogo' : 'Filtrar Matérias Deste Módulo'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
