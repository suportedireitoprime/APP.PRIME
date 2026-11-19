import React from 'react';
import { createPortal } from 'react-dom';
import { Flame, Play, X, Sparkles } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { haptic } from '@/lib/nativeHaptics';
import { AulasCardRubyBackground } from './AulasCardRubyBackground';

interface AulasEmAltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  aulas: AulaItem[];
  onIniciarAula: (aula: AulaItem) => void;
}

export const AulasEmAltaModal: React.FC<AulasEmAltaModalProps> = ({
  isOpen,
  onClose,
  aulas,
  onIniciarAula,
}) => {
  if (!isOpen) return null;

  // Seleciona aulas chave recomendadas e mais acessadas
  const aulasEmAlta = aulas.slice(0, 12);

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] bg-zinc-950 border border-zinc-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        style={{ paddingBottom: 'var(--sai-bottom)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Aulas em Alta</h3>
              <p className="text-xs text-zinc-400">Os temas mais acessados e relevantes para fixação</p>
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
          {aulasEmAlta.map((aula, i) => {
            const disc = DISCIPLINAS_CATALOGO.find((d) => d.id === aula.disciplinaId);

            return (
              <div
                key={aula.id}
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onClose();
                  onIniciarAula(aula);
                }}
                className="group relative overflow-hidden rounded-2xl border border-red-500/35 hover:border-red-400/60 shadow-[0_8px_24px_rgba(225,29,72,0.18)] p-3.5 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
              >
                <AulasCardRubyBackground />

                <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs font-black text-rose-300 w-5 text-center">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 px-1.5 py-0.2 rounded bg-black/60 border border-red-500/30">
                        {disc?.nome?.replace('DIREITO ', '') || 'DIREITO'}
                      </span>
                      <span className="text-[10.5px] text-rose-200/70 flex items-center gap-1 font-mono">
                        <Flame className="w-3 h-3 text-red-500" />
                        Em Alta
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-white group-hover:text-rose-200 transition-colors truncate">
                      {aula.titulo}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-950/60 group-hover:scale-105 transition-transform border border-rose-400/30"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
