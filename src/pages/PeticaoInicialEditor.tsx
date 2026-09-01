import { useParams, useNavigate } from 'react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  StepFatos,
  StepTriagem,
  StepResumo,
  StepPartes,
  StepJurisprudencia,
  StepElaboracao,
  StepFinal,
} from '@/components/peticao-inicial';
import { usePeticaoInicial } from '@/hooks/domain/usePeticaoInicial';
import { STEPS, Peticao } from '@/types/peticao';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function PeticaoInicialEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pet, loading, saving, patch, canUse, register } = usePeticaoInicial(id);

  if (loading || !pet) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(0_70%_40%)]" />
      </div>
    );
  }

  const goStep = async (stepNumber: number, data?: Partial<Peticao>) => {
    let payload = { etapa: stepNumber, ...data };
    if (stepNumber === 7 && pet.etapa !== 7) {
      if (!canUse) {
        toast.error('Limite de petições iniciais (2) excedido nesta conta gratuita.');
        return;
      }
      await register();
      payload.status = 'pronta';
    }
    await patch(payload);
  };

  const pct = Math.round((pet.etapa / 7) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-3xl mx-auto w-full">
      {/* HEADER FIXO */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="px-4 pb-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (pet.etapa === 7) navigate('/ferramentas/peticao-inicial');
              else if (pet.etapa > 1) goStep(pet.etapa - 1);
              else navigate(-1);
            }}
            className="w-10 h-10 -ml-2 rounded-full grid place-items-center hover:bg-muted"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>

          <div className="flex-1 px-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {STEPS.find((s) => s.n === pet.etapa)?.label}
              </span>
              <span className="text-xs font-bold text-[hsl(0_72%_52%)]">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 bg-muted">
              <div
                className="h-full bg-gradient-to-r from-[hsl(0_72%_52%)] to-[hsl(0_70%_40%)] transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </Progress>
          </div>

          <div className="w-10 flex justify-end">
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 pb-24 overflow-x-hidden w-full max-w-full">
        {pet.etapa === 1 && (
          <StepFatos pet={pet} onNext={(v) => goStep(2, v)} />
        )}
        {pet.etapa === 2 && (
          <StepTriagem
            pet={pet}
            onNext={(v) => goStep(3, v)}
            onBack={() => goStep(1)}
          />
        )}
        {pet.etapa === 3 && (
          <StepResumo
            pet={pet}
            onNext={(v) => goStep(4, v)}
            onBack={() => goStep(2)}
          />
        )}
        {pet.etapa === 4 && (
          <StepPartes
            pet={pet}
            onNext={(v) => goStep(5, v)}
            onBack={() => goStep(3)}
          />
        )}
        {pet.etapa === 5 && (
          <StepJurisprudencia
            pet={pet}
            onNext={(v) => goStep(6, v)}
            onBack={() => goStep(4)}
          />
        )}
        {pet.etapa === 6 && (
          <StepElaboracao
            pet={pet}
            onNext={(v) => goStep(7, v)}
            onBack={() => goStep(5)}
          />
        )}
        {pet.etapa === 7 && (
          <StepFinal
            pet={pet}
            onEditJuris={() => goStep(5)}
            onSave={(v) => patch(v)}
          />
        )}
      </main>
    </div>
  );
}
