import { memo } from 'react';
import { X, Settings2, Clock, FileText, Flashlight, FlashlightOff } from 'lucide-react';
import type { StatusLive } from '@/lib/meExplique/liveClient';
import { type FalaSalva } from './TranscricaoSheet';

const ROTULO: Record<StatusLive, string> = {
  inativo: 'Aponte e toque em "Me explique"',
  conectando: 'Conectando com o professor…',
  ouvindo: 'Ouvindo você',
  falando: 'Explicando…',
  erro: 'Ocorreu um erro',
  encerrado: 'Sessão encerrada',
};

interface Props {
  status: StatusLive;
  minRest: number;
  segRest: string;
  historico: FalaSalva[];
  recursosLanterna: boolean;
  lanternaAtiva: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
  onOpenTranscricao: () => void;
  onToggleLanterna: () => void;
}

export const MeExpliqueHeader = memo(function MeExpliqueHeader({
  status, minRest, segRest, historico, recursosLanterna, lanternaAtiva,
  onClose, onOpenConfig, onOpenTranscricao, onToggleLanterna
}: Props) {
  return (
    <header className="relative z-10 flex items-center gap-3 px-4 pb-2 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white/15 backdrop-blur active:scale-95 transition-transform"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <p className="font-display text-base font-bold leading-tight">Me Explique</p>
        <p className="text-[13px] leading-tight text-white/70">{ROTULO[status]}</p>
      </div>

      <button
        onClick={onOpenConfig}
        aria-label="Configurações do professor"
        className="flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white/15 backdrop-blur active:scale-95 transition-transform"
      >
        <Settings2 className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 backdrop-blur text-xs font-mono font-extrabold text-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>{minRest}:{segRest}</span>
      </div>

      {historico.length > 0 && (
        <button
          onClick={onOpenTranscricao}
          aria-label="Ver e baixar a explicação"
          className="relative flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white/15 backdrop-blur active:scale-95 transition-transform"
        >
          <FileText className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {historico.length}
          </span>
        </button>
      )}

      {recursosLanterna && (
        <button
          onClick={onToggleLanterna}
          aria-label={lanternaAtiva ? 'Desligar lanterna' : 'Ligar lanterna'}
          className={`flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-full backdrop-blur active:scale-95 transition-transform ${
            lanternaAtiva ? 'bg-white text-black' : 'bg-white/15'
          }`}
        >
          {lanternaAtiva ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
        </button>
      )}
    </header>
  );
});
