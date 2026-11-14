import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Shield, CreditCard, LayoutGrid } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import MinhaAssinaturaView from '@/components/planos/MinhaAssinaturaView';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { Button } from '@/components/ui/button';

const PlanosAtivos = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const showDevToggle = isAdminEmail(session?.user?.email);
  const { isPremium, loading, plano, expiresAt, startedAt, source, status, isAdminOverride } = useSubscription();

  if (!loading && !isPremium && !showDevToggle && !isAdminOverride) {
    return <Navigate to="/assinatura" replace />;
  }

  const effectivePlano = plano || (showDevToggle || isAdminOverride ? 'Direito Prime Anual (Preview Admin)' : 'Direito Prime Anual');
  const effectiveStatus = status || 'active';
  const effectiveExpiresAt = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="min-h-dvh bg-background pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md">
        <div className="max-w-3xl lg:max-w-5xl mx-auto">
          <PageHeader
            title="ASSINATURA"
            subtitle="Gerencie seu plano Direito Prime Premium"
            onBack={() => navigate('/', { replace: true })}
          />
        </div>
      </header>


      <div className="max-w-3xl lg:max-w-5xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {showDevToggle && (
          <div className="rounded-2xl border border-border/60 bg-card/50 p-3 space-y-2">
            <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground text-center">
              Visualização (admin)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="default" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Plano ativo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/assinatura?preview=plans')}
              >
                <LayoutGrid className="w-4 h-4" />
                Ver planos
              </Button>
            </div>
          </div>
        )}


        {loading ? (
          <div className="h-40 rounded-2xl bg-card/50 border border-border/60 animate-pulse" />
        ) : (
          <MinhaAssinaturaView
            plano={effectivePlano}
            expiresAt={effectiveExpiresAt}
            startedAt={startedAt}
            source={source}
            status={effectiveStatus}
            isAdminOverride={isAdminOverride}
          />
        )}

        <section className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-body text-xs">
              Sua assinatura é gerenciada com segurança pela{' '}
              {source === 'apple' ? 'App Store' : source === 'asaas' ? 'Asaas Pagamentos' : 'Google Play'}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlanosAtivos;