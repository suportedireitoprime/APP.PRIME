import { useState } from 'react';
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CAMPOS_SENSIVEIS, Peticao } from '@/types/peticao';

interface StepPartesProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
  onBack: () => void;
}

export function StepPartes({ pet, onNext, onBack }: StepPartesProps) {
  const [dados, setDados] = useState<Record<string, string>>(
    (pet.dados_sensiveis as any) ?? {},
  );
  const [openField, setOpenField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const openSheet = (key: string) => {
    setTempValue(dados[key] ?? '');
    setOpenField(key);
  };
  const saveSheet = () => {
    if (!openField) return;
    setDados({ ...dados, [openField]: tempValue.trim() });
    setOpenField(null);
  };

  const mask = (val: string) => {
    if (!val) return '';
    if (val.length <= 4) return '•'.repeat(val.length);
    return val.slice(0, 2) + '•'.repeat(Math.max(3, val.length - 4)) + val.slice(-2);
  };

  const field = CAMPOS_SENSIVEIS.find((c) => c.key === openField);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Partes e qualificação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados. Só ficam com você — a IA nunca vê esses valores em texto claro.
        </p>
      </div>

      <div className="space-y-2">
        {CAMPOS_SENSIVEIS.map((c) => {
          const val = dados[c.key] ?? '';
          const filled = val.length > 0;
          return (
            <button
              key={c.key}
              onClick={() => openSheet(c.key)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-[hsl(0_72%_52%)] transition text-left"
            >
              <div
                className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                  filled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                }`}
              >
                {filled ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {filled ? mask(val) : c.mask || 'Toque para preencher'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl">
          Voltar
        </Button>
        <Button
          onClick={() => onNext({ dados_sensiveis: dados })}
          className="flex-[2] h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
        >
          Continuar
        </Button>
      </div>

      <Sheet open={!!openField} onOpenChange={(o) => !o && setOpenField(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[80vh]">
          <SheetHeader>
            <SheetTitle>{field?.label}</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Este valor será usado apenas no PDF final gerado no seu aparelho. A IA nunca recebe
              o valor em texto claro.
            </p>
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={field?.mask || 'Digite aqui'}
              className="h-14 text-lg"
              autoFocus
            />
            <Button
              onClick={saveSheet}
              className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold"
            >
              Salvar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
