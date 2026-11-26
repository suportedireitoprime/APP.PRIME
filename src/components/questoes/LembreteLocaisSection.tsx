import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { haptic } from '@/lib/nativeHaptics';
import { LOCAIS, type LocalRow } from '@/lib/questoesLembretesUtils';

type Props = {
  locais: LocalRow[];
  onAddPreset: (localId: string) => void;
  onToggle: (row: LocalRow) => void;
  onRemove: (row: LocalRow) => void;
};

export function LembreteLocaisSection({ locais, onAddPreset, onToggle, onRemove }: Props) {
  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border/70 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MapPin className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold leading-snug text-foreground">Lembrete por lugar</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
            Avisamos quando você chegar no local escolhido.
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5">
          {LOCAIS.map((l) => {
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  onAddPreset(l.id);
                }}
                className="flex min-h-[58px] items-center gap-2.5 rounded-2xl border border-border bg-background px-3 py-3 text-left active:scale-[0.99]"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate text-[15px] font-semibold text-foreground">{l.id}</span>
                <Plus className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {locais.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {locais.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground">{r.label}</p>
                    {r.address && <p className="truncate text-[12px] text-muted-foreground">{r.address}</p>}
                    <p className="text-[12px] text-muted-foreground">Raio {r.radius_m} m</p>
                  </div>
                  <Switch checked={r.active} onCheckedChange={() => onToggle(r)} aria-label={`Ativar ${r.label}`} />
                  <button
                    onClick={() => onRemove(r)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-destructive"
                    aria-label={`Excluir ${r.label}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
