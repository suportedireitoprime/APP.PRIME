import { useState } from 'react';
import { GraduationCap, Landmark, Briefcase, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

export type PerfilId = 'faculdade' | 'concurso' | 'advogado';

export const PERFIS: { id: PerfilId; label: string; shortLabel: string; icon: typeof GraduationCap }[] = [
  { id: 'faculdade', label: 'Faculdade e OAB', shortLabel: 'Faculdade / OAB', icon: GraduationCap },
  { id: 'concurso',  label: 'Concurseiro',      shortLabel: 'Concurseiro',     icon: Landmark },
  { id: 'advogado',  label: 'Advogado',         shortLabel: 'Advogado',        icon: Briefcase },
];

interface Props {
  userId: string;
  selected: string[];
  onChange: (next: string[], contexto: string) => void;
}

export function AtuacaoCard({ userId, selected, onChange }: Props) {
  const [saving, setSaving] = useState(false);

  const isSelected = (id: PerfilId) => {
    if (selected.includes(id)) return true;
    if (id === 'faculdade' && selected.includes('oab')) return true;
    return false;
  };

  const selectPerfil = async (id: PerfilId) => {
    if (isSelected(id)) return;
    haptic.selection();
    const item = PERFIS.find((p) => p.id === id);
    if (!item) return;
    const next = [id];
    const contexto = item.label;
    onChange(next, contexto);
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        status_perfil: id,
        perfil_tipos: next,
        perfil_contexto: contexto,
      }).eq('id', userId);
      if (error) throw error;
      toast.success(`Atuação alterada para ${item.label}`);
    } catch {
      toast.error('Não foi possível salvar sua atuação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
          Minha atuação
        </p>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PERFIS.map(({ id, shortLabel, icon: Icon }) => {
          const on = isSelected(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => void selectPerfil(id)}
              className={`relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 min-h-[76px] rounded-2xl border text-center transition-all active:scale-[0.97] cursor-pointer ${
                on
                  ? 'border-primary/70 bg-primary/12 text-foreground shadow-sm shadow-primary/15'
                  : 'border-border/60 bg-card/70 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {on && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
              )}
              <Icon className={`w-5 h-5 shrink-0 ${on ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.6} />
              <span className="text-[11.5px] font-medium font-body leading-tight line-clamp-2">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
