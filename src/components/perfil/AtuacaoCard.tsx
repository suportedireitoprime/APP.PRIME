import { useState } from 'react';
import { GraduationCap, Landmark, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';

export type PerfilId = 'faculdade' | 'concurso' | 'advogado';

export const PERFIS: { id: PerfilId; label: string; icon: typeof GraduationCap; color: string; bg: string }[] = [
  { id: 'faculdade', label: 'Faculdade e OAB', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'concurso',  label: 'Concurseiro',      icon: Landmark,      color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'advogado',  label: 'Advogado',         icon: Briefcase,     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

interface Props {
  userId: string;
  selected: string[];
  onChange: (next: string[], contexto: string) => void;
}

export function AtuacaoCard({ userId, selected, onChange }: Props) {
  const [saving, setSaving] = useState(false);

  // Normaliza o perfil atual: se tiver 'oab', mapeia para 'faculdade' (Faculdade e OAB)
  const isSelected = (id: PerfilId) => {
    if (selected.includes(id)) return true;
    if (id === 'faculdade' && selected.includes('oab')) return true;
    return false;
  };

  const selectPerfil = async (id: PerfilId) => {
    haptic.selection();
    const item = PERFIS.find((p) => p.id === id);
    if (!item) return;
    const next = [id];
    const contexto = item.label;
    onChange(next, contexto);
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        status_perfil: id,
        perfil_tipos: next,
        perfil_contexto: contexto,
      }).eq('id', userId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-bold text-foreground leading-tight">Minha atuação</p>
          <p className="text-xs text-muted-foreground font-body mt-1 leading-snug">
            Personalize o app conforme seu momento.
          </p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PERFIS.map(({ id, label, icon: Icon, color, bg }) => {
          const on = isSelected(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectPerfil(id)}
              className={`flex items-center gap-3 p-3.5 min-h-[52px] rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                on
                  ? 'border-primary bg-primary/15 text-foreground shadow-sm shadow-primary/20 ring-1 ring-primary/40'
                  : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-primary text-white' : `${bg} ${color}`}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold font-body flex-1 truncate">{label}</span>
              {on && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
