import { memo } from 'react';
import { Mic, MicOff, Loader2, RefreshCw, Bot } from 'lucide-react';
import type { StatusLive } from '@/lib/meExplique/liveClient';

interface Props {
  ativo: boolean;
  micAtivo: boolean;
  iniciando: boolean;
  status: StatusLive;
  carregandoPlano: boolean;
  onAlternarMic: () => void;
  onEncerrar: () => void;
  onIniciar: () => void;
}

export const MeExpliqueControls = memo(function MeExpliqueControls({
  ativo, micAtivo, iniciando, status, carregandoPlano,
  onAlternarMic, onEncerrar, onIniciar
}: Props) {
  return (
    <footer className="relative z-10 flex items-center justify-center gap-4 px-6 pb-[calc(1.5rem+var(--sai-bottom))] pt-3">
      {ativo ? (
        <>
          <button
            onClick={onAlternarMic}
            aria-label={micAtivo ? 'Desligar microfone' : 'Ligar microfone'}
            className={`flex h-14 w-14 min-h-[48px] min-w-[48px] items-center justify-center rounded-full backdrop-blur active:scale-95 transition-transform ${
              micAtivo ? 'bg-white/20' : 'bg-white text-black'
            }`}
          >
            {micAtivo ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <button
            onClick={onEncerrar}
            className="flex h-16 min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-success px-7 text-[15px] font-bold text-success-foreground shadow-lg active:scale-95 transition-transform"
          >
            {status === 'conectando' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Conectando…
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                </span>
                Ao vivo — encerrar
              </>
            )}
          </button>
        </>
      ) : (
        <button
          onClick={onIniciar}
          disabled={iniciando || carregandoPlano}
          className="flex h-14 min-h-[52px] w-full max-w-sm items-center justify-center gap-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black text-base shadow-xl shadow-purple-600/30 active:scale-95 disabled:opacity-70 transition-all"
        >
          {iniciando ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === 'erro' || status === 'encerrado' ? (
            <RefreshCw className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5 text-amber-300" />
          )}
          {status === 'erro' || status === 'encerrado' ? 'Tentar de novo' : 'Me explique'}
        </button>
      )}
    </footer>
  );
});
