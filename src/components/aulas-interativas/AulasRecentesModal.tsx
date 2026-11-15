import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, History, Play, X, Clock, CheckCircle2 } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { haptic } from '@/lib/nativeHaptics';

interface AulasRecentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  aulas: AulaItem[];
  calcularProgressoCiclo?: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
  onIniciarAula: (aula: AulaItem) => void;
}

export const AulasRecentesModal: React.FC<AulasRecentesModalProps> = ({
  isOpen,
  onClose,
  aulas,
  calcularProgressoCiclo,
  onIniciarAula,
}) => {
  if (!isOpen) return null;

  // Filtra aulas em andamento ou recentemente concluídas
  const aulasRecentes = useMemo(() => {
    if (!calcularProgressoCiclo) return aulas.slice(0, 10);
    const emProgresso = aulas.filter((a) => {
      const p = calcularProgressoCiclo(a);
      return p.porcentagemTotal > 0;
    });
    return emProgresso.length > 0 ? emProgresso : aulas.slice(0, 10);
  }, [aulas, calcularProgressoCiclo]);

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] bg-zinc-950 border border-zinc-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        style={{ paddingBottom: 'var(--sai-bottom)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-[#2dd4bf]">
              <History className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Aulas Recentes</h3>
              <p className="text-xs text-zinc-400">Continue seus estudos de onde parou</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Aulas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {aulasRecentes.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm">
              Nenhuma aula acessada recentemente.
            </div>
          ) : (
            aulasRecentes.map((aula) => {
              const disc = DISCIPLINALookup(aula.disciplinaId);
              const prog = calcularProgressoCiclo ? calcularProgressoCiclo(aula) : { etapaAtual: 1, totalEtapas: 4, porcentagemTotal: 0, aulaTerminada: false };

              return (
                <div
                  key={aula.id}
                  onClick={() => {
                    try { haptic.impact('medium'); } catch {}
                    onClose();
                    onIniciarAula(aula);
                  }}
                  className="group rounded-2xl border border-white/10 bg-zinc-900/70 hover:bg-zinc-900 hover:border-teal-500/40 p-3.5 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all shadow-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2dd4bf] px-1.5 py-0.2 rounded bg-teal-500/15">
                        {disc?.nome?.replace('DIREITO ', '') || 'DIREITO'}
                      </span>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Etapa {prog.etapaAtual} de {prog.totalEtapas}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                      {aula.titulo}
                    </h4>
                    {/* Barra de progresso */}
                    <div className="mt-2 w-full max-w-xs flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                          style={{ width: `${Math.max(5, prog.porcentagemTotal)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">{prog.porcentagemTotal}%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-500 text-black flex items-center justify-center shrink-0 shadow-lg shadow-teal-950/50 group-hover:scale-105 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

function DISCIPLINALookup(id: string) {
  return DISCIPLINAS_CATALOGO.find((d) => d.id === id);
}
