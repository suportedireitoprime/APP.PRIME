import React from 'react';
import { ArrowLeft, Film, Scale } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { QuestoesAnimadasView } from '@/components/questoes-animadas/furto-tentado/QuestoesAnimadasView';

interface QuestoesAnimadasPlayerProps {
  onVoltar: () => void;
}

export function QuestoesAnimadasPlayer({ onVoltar }: QuestoesAnimadasPlayerProps) {
  const handleVoltar = () => {
    try {
      haptic.selection();
    } catch {}
    onVoltar();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0f16] flex flex-col overflow-hidden text-white select-none">
      {/* Barra Superior Minimalista */}
      <header className="h-13 sm:h-14 px-3 sm:px-4 flex items-center justify-between border-b border-white/5 bg-[#0c0f16]/95 backdrop-blur-md shrink-0 z-20 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleVoltar}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center border border-white/10 transition-all text-zinc-200 hover:text-white"
            aria-label="Voltar para o laboratório"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                Questões Animadas 2D
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                OAB XLI · Q57
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 truncate max-w-[220px] sm:max-w-md">
              Furto Tentado no Supermercado · Amanda & Fernando
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-2 py-1 rounded-md bg-white/5 border border-white/5">
            <Scale className="w-3 h-3 text-sky-400" />
            Súmula 567 STJ
          </span>
        </div>
      </header>

      {/* Palco Nativo Modular 2D (120fps, sem iframe, sem layout de celular, sem scrollbars) */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#0a0d14]">
        <QuestoesAnimadasView onVoltar={handleVoltar} />
      </main>
    </div>
  );
}

export default QuestoesAnimadasPlayer;
