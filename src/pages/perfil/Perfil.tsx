import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { PerfilHero } from '@/components/perfil/PerfilHero';
import { PlanoCard } from '@/components/perfil/PlanoCard';
import { AtuacaoCard } from '@/components/perfil/AtuacaoCard';
import { InfoRow } from '@/components/perfil/InfoRow';
import { ExcluirContaButton } from '@/components/perfil/ExcluirContaButton';
import { copiarTexto } from '@/lib/nativo/copiar';
import { haptic } from '@/lib/nativeHaptics';

const planoLabel = (plano: string | null, source: 'play' | 'apple' | 'asaas' | null, expiresAt?: string | null) => {
  if (!plano) return { titulo: 'Gratuito', desc: 'Acesso limitado — 3 usos/mês em recursos premium.', tag: 'FREE' };
  const p = plano.toLowerCase();
  const via = source === 'play' ? 'Google Play' : source === 'asaas' ? 'Asaas' : 'App Store';

  const isFarFuture = expiresAt ? new Date(expiresAt).getFullYear() >= 2090 : false;
  if (p.includes('vitalicio') || isFarFuture) {
    return { titulo: 'Premium Vitalício', desc: `Acesso permanente liberado via ${via}.`, tag: 'VITALÍCIO' };
  }

  if (p.includes('anual') || p.includes('year')) return { titulo: 'Premium Anual', desc: `Renovação anual via ${via}.`, tag: 'ANUAL' };
  if (p.includes('mensal') || p.includes('month')) return { titulo: 'Premium Mensal', desc: `Renovação mensal via ${via}.`, tag: 'MENSAL' };
  if (p.includes('teste')) return { titulo: 'Teste de 3 Dias', desc: 'Período gratuito para testar todos os recursos.', tag: 'TRIAL' };
  return { titulo: 'Premium', desc: `Ativa via ${via}.`, tag: 'PRO' };
};

const providerName: Record<string, string> = {
  google: 'Conta Google', apple: 'Conta Apple', email: 'E-mail e senha',
};

const Perfil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sub = useSubscription();

  const [profile, setProfile] = useState<{ perfil_tipos?: string[]; perfil_contexto?: string | null } | null>(null);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('perfil_tipos, perfil_contexto')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data as any);
    })();
  }, [user]);

  if (!user) return null;

  const email = user.email || '';
  const phone = user.phone || (user.user_metadata?.phone as string | undefined) || '';
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined);
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—';
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—';
  const provider = (user.app_metadata?.provider as string | undefined) || 'email';
  const emailConfirmed = !!user.email_confirmed_at;

  const perfilTiposSel: string[] = profile?.perfil_tipos ?? [];
  const isVitalicio = (sub.plano?.toLowerCase().includes('vitalicio') || false) || (sub.expiresAt ? new Date(sub.expiresAt).getFullYear() >= 2090 : false);
  const plano = planoLabel(sub.plano, sub.source, sub.expiresAt);
  const expira = isVitalicio ? null : (sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-BR') : null);

  const canonicoContexto = (() => {
    if (!profile?.perfil_contexto) return null;
    const c = profile.perfil_contexto;
    if (c === 'Estudando pra OAB' || c === 'oab' || c === 'Rumo à OAB' || c === 'faculdade' || c === 'Estudante de Direito') {
      return 'Faculdade e OAB';
    }
    if (c === 'concurso' || c === 'Concurseiro Jurídico' || c === 'Concurseiro(a)') {
      return 'Concurseiro';
    }
    if (c === 'advogado' || c === 'Advogado(a)') {
      return 'Advogado';
    }
    return c;
  })();

  const handleCopyEmail = async () => {
    if (!email) return;
    haptic.selection();
    await copiarTexto(email);
    toast.success('E-mail copiado!');
  };

  return (
    <div className="min-h-dvh bg-background pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <PageHeader title="Meu Perfil" onBack={() => navigate('/')} />

      <div className="px-4 lg:px-8 pt-2 pb-4 space-y-5 max-w-lg lg:max-w-5xl mx-auto lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-5">
          <PerfilHero
            userId={user.id}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isPremium={sub.isPremium && !sub.isTrial}
            provider={provider}
            emailConfirmed={emailConfirmed}
            contexto={canonicoContexto}
            onNameChange={setDisplayName}
          />

          <div className="lg:hidden">
            <PlanoCard
              isPremium={sub.isPremium && !sub.isTrial}
              loading={sub.loading}
              titulo={plano.titulo}
              desc={plano.desc}
              tag={plano.tag}
              expira={expira}
            />
          </div>

          <AtuacaoCard
            userId={user.id}
            selected={perfilTiposSel}
            onChange={(next, contexto) => setProfile((prev) => ({ ...(prev ?? {}), perfil_tipos: next, perfil_contexto: contexto }))}
          />

          <div className="space-y-2">
            <p className="px-1 text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
              Dados da conta
            </p>
            <div className="rounded-2xl bg-card/70 border border-border/60 overflow-hidden divide-y divide-border/50">
              <InfoRow
                icon={Mail}
                label="E-mail"
                value={email}
                badge={emailConfirmed ? 'Verificado' : undefined}
                onCopy={email ? () => void handleCopyEmail() : undefined}
              />
              {phone && <InfoRow icon={Phone} label="Telefone" value={phone} />}
              <InfoRow icon={Calendar} label="Membro desde" value={createdAt} />
              <InfoRow icon={LogIn} label="Último acesso" value={lastSignIn} />
              <InfoRow icon={Shield} label="Autenticação" value={providerName[provider] ?? 'E-mail e senha'} />
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="hidden lg:block">
            <PlanoCard
              isPremium={sub.isPremium && !sub.isTrial}
              loading={sub.loading}
              titulo={plano.titulo}
              desc={plano.desc}
              tag={plano.tag}
              expira={expira}
            />
          </div>

          {provider === 'google' && !phone && (
            <p className="text-[11px] text-muted-foreground/75 font-body text-center px-3 leading-relaxed">
              O login do Google compartilha apenas nome, e-mail e foto de perfil.
            </p>
          )}

          <div className="pt-2 lg:pt-0">
            <ExcluirContaButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
