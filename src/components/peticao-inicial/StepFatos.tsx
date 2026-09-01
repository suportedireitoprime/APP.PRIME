import { useState } from 'react';
import { Mic, Pause, Play, Square, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDictation } from '@/hooks/useDictation';
import { Peticao } from '@/types/peticao';

interface StepFatosProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
}

export function StepFatos({ pet, onNext }: StepFatosProps) {
  const [texto, setTexto] = useState(pet.fatos_texto ?? '');
  const { state, partial, start, pause, resume, stop } = useDictation((chunk) => {
    setTexto((prev) => (prev ? prev.trimEnd() + ' ' : '') + chunk);
  });

  const recording = state === 'recording';
  const paused = state === 'paused';
  const active = recording || paused;
  const displayed = recording && partial ? (texto ? texto.trimEnd() + ' ' + partial : partial) : texto;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Descreva os fatos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Grave um áudio ou digite. Conte o que aconteceu com detalhes — quem, quando, onde e como.
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={displayed}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: No dia 15/10, ao consultar meu CPF, descobri uma inscrição indevida em nome da empresa XYZ, no valor de R$ 1.850, sem nunca ter contratado o serviço…"
          className="min-h-[220px] text-base resize-none pr-4 pb-16"
          disabled={active}
        />
        {/* Controles de gravação */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {!active && (
            <button
              type="button"
              onClick={start}
              className="w-11 h-11 rounded-full grid place-items-center shadow bg-gradient-to-br from-[hsl(0_72%_52%)] to-[hsl(0_70%_40%)] text-primary-foreground"
              aria-label="Gravar áudio"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          {recording && (
            <>
              <button
                type="button"
                onClick={pause}
                className="w-11 h-11 rounded-full grid place-items-center shadow bg-gray-900 text-white"
                aria-label="Pausar gravação"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={stop}
                className="w-11 h-11 rounded-full grid place-items-center shadow bg-red-500 text-white animate-pulse"
                aria-label="Parar gravação"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
          {paused && (
            <>
              <button
                type="button"
                onClick={resume}
                className="w-11 h-11 rounded-full grid place-items-center shadow bg-gradient-to-br from-[hsl(0_72%_52%)] to-[hsl(0_70%_40%)] text-primary-foreground"
                aria-label="Continuar gravação"
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={stop}
                className="w-11 h-11 rounded-full grid place-items-center shadow bg-red-500 text-white"
                aria-label="Parar gravação"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      {recording && (
        <p className="text-xs text-red-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Gravando… pode pausar quando quiser
        </p>
      )}
      {paused && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" /> Pausado — toque em ▶ para continuar
        </p>
      )}

      <Button
        onClick={() => {
          if (texto.trim().length < 30) {
            toast.error('Conte mais detalhes dos fatos (mín. 30 caracteres).');
            return;
          }
          onNext({ fatos_texto: texto });
        }}
        className="w-full h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
      >
        Analisar com IA
        <Sparkles className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
