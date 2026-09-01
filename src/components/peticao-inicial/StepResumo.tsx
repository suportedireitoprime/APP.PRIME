import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Peticao } from '@/types/peticao';

interface StepResumoProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
  onBack: () => void;
}

export function StepResumo({ pet, onNext, onBack }: StepResumoProps) {
  const [area, setArea] = useState(pet.area_direito ?? '');
  const [resumo, setResumo] = useState(pet.resumo ?? '');
  const [titulo, setTitulo] = useState(pet.titulo);
  const tags = pet.tags ?? [];
  const pedidos: string[] = Array.isArray(pet.pedidos) ? pet.pedidos : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Confirme a triagem</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Corrija o que estiver errado antes de continuar.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Título da petição</label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="h-11" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Área do direito</label>
        <Input value={area} onChange={(e) => setArea(e.target.value)} className="h-11" />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <Badge key={t} className="bg-[hsl(0_72%_52%)] text-primary-foreground hover:bg-[hsl(0_72%_52%)]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Resumo do caso</label>
        <Textarea
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          className="min-h-[120px] text-base"
        />
      </div>

      {pedidos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">Pedidos identificados</label>
          <div className="space-y-1.5">
            {pedidos.map((p, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-muted/50 border border-border text-sm"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl">
          Voltar
        </Button>
        <Button
          onClick={() => onNext({ titulo, area_direito: area, resumo })}
          className="flex-[2] h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
        >
          Confirmar e continuar
        </Button>
      </div>
    </div>
  );
}
