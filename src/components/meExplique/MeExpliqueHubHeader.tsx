import React from 'react';
import { Sparkles, Clock, Settings, ArrowLeft, Crown } from 'lucide-react';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';
import { haptic } from '@/lib/nativo';

interface Props {
  titulo?: string;
  subtitulo?: string;
  onVoltar: () => void;
  onOpenConfig?: () => void;
  mostrarCota?: boolean;
}

export const MeExpliqueHubHeader: React.FC<Props> = ({
  titulo = 'Me Explique',
  subtitulo = 'Aprenda Direito com didática de 6 anos',
  onVoltar,
  onOpenConfig,
  mostrarCota = true,
}) => {
  const cota = useMeExpliqueCota();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {/* Lado Esquerdo: Voltar + Título */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              void haptic.light();
              onVoltar();
            }}
            aria-label="Voltar"
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white shrink-0 transition-all cursor-pointer border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 items-center gap-1 rounded-full bg-amber-500/20 px-2 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                <Sparkles className="h-2.5 w-2.5" /> IA Pedagógica
              </span>
            </div>
            <h1 className="font-sans text-base font-black text-white truncate tracking-normal mt-0.5">
              {titulo}
            </h1>
            <p className="font-sans text-[11px] font-medium text-zinc-400 truncate">
              {subtitulo}
            </p>
          </div>
        </div>

        {/* Lado Direito: Cota Diária de 5 Minutos + Config */}
        <div className="flex items-center gap-2 shrink-0">
          {mostrarCota && (
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 backdrop-blur transition-colors ${
                cota.limiteAtingido
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <div className="text-right">
                <span className="block font-mono text-xs font-bold leading-none">
                  {cota.tempoFormatado}
                </span>
                <span className="block text-[9px] font-medium opacity-80 leading-none mt-0.5">
                  {cota.limiteAtingido ? 'Esgotado hoje' : 'Restantes hoje'}
                </span>
              </div>
            </div>
          )}

          {onOpenConfig && (
            <button
              type="button"
              onClick={() => {
                void haptic.light();
                onOpenConfig();
              }}
              aria-label="Configurações do Me Explique"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini Barra de Progresso da Cota (5 min diários) */}
      {mostrarCota && (
        <div className="mx-auto mt-2 h-1 max-w-5xl overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              cota.limiteAtingido
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm shadow-amber-500/50'
            }`}
            style={{ width: `${cota.porcentagemRestante}%` }}
          />
        </div>
      )}
    </header>
  );
};
