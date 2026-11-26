import { useState } from 'react';
import { User, Pencil, Crown, CheckCircle2, Loader2, Mail, Chrome, Apple, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { avatarImg } from '@/lib/cdnImg';
import { haptic } from '@/lib/nativeHaptics';

type Provider = 'google' | 'apple' | 'email' | string;

const providerLabel: Record<string, { name: string; Icon: typeof Chrome }> = {
  google: { name: 'Conta Google', Icon: Chrome },
  apple: { name: 'Conta Apple', Icon: Apple },
  email: { name: 'E-mail e senha', Icon: Mail },
};

interface Props {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isPremium: boolean;
  provider: Provider;
  emailConfirmed: boolean;
  contexto?: string | null;
  onNameChange: (name: string) => void;
}

export function PerfilHero({
  userId, displayName, avatarUrl, isPremium, provider, emailConfirmed, contexto, onNameChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [saving, setSaving] = useState(false);

  const prov = providerLabel[provider] ?? providerLabel.email;
  const iniciais = displayName
    .split(' ').filter(Boolean).slice(0, 2)
    .map((n) => n[0]?.toUpperCase()).join('');

  const handleSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Informe um nome válido');
      return;
    }
    if (trimmed === displayName) {
      setEditing(false);
      return;
    }
    haptic.selection();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
      if (error) throw error;
      await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId);
      onNameChange(trimmed);
      toast.success('Nome atualizado!');
      setEditing(false);
    } catch {
      toast.error('Erro ao atualizar nome');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5 py-3">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden ring-2 ring-primary/35 shadow-lg shadow-primary/15">
          {avatarUrl ? (
            <img src={avatarImg(avatarUrl, 128)} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : iniciais ? (
            <span className="font-display text-xl font-bold text-primary">{iniciais}</span>
          ) : (
            <User className="w-8 h-8 text-primary" />
          )}
        </div>
        {isPremium && (
          <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ring-2 ring-background shadow">
            <Crown className="w-3.5 h-3.5 text-black" strokeWidth={2.3} />
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 w-full max-w-xs pt-0.5">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave();
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder="Seu nome"
            className="text-center h-9 rounded-xl bg-secondary/70 border-border/60"
          />
          <Button size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={handleSave} disabled={saving} aria-label="Salvar nome">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl" onClick={() => setEditing(false)} aria-label="Cancelar edição">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setNewName(displayName);
            setEditing(true);
          }}
          className="group inline-flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
          aria-label="Editar nome"
        >
          <h2 className="font-display text-xl font-bold text-foreground tracking-tight">{displayName}</h2>
          <Pencil className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
        </button>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted-foreground font-body">
        {contexto && (
          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-foreground/90 font-medium">
            {contexto}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <prov.Icon className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span>{prov.name}</span>
          {emailConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        </span>
      </div>
    </div>
  );
}
