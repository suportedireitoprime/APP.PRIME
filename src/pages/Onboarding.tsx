import { useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';
import CadastroOnboardingOverlay, {
  type CadastroResult,
} from '@/components/onboarding/CadastroOnboardingOverlay';
import { HorusPromoModal } from '@/components/assinatura/HorusPromoModal';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import NotificacoesPermissaoStep from '@/components/onboarding/NotificacoesPermissaoStep';
import TrialWelcomeModal from '@/components/onboarding/TrialWelcomeModal';
import { AnimatePresence, motion } from 'framer-motion';

const Onboarding = () => {
  useHideSplashScreen(100);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pedirPromo, setPedirPromo] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'anual' | 'anual_pix' | null>(null);
  const [pedirNotificacoes, setPedirNotificacoes] = useState(false);
  const [pedirTrial, setPedirTrial] = useState(false);
  
  // 24 hours countdown in seconds
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SEO & Título dinâmico da Triagem
  useEffect(() => {
    document.title = 'Personalizar Perfil | Direito Prime';
  }, []);

  // Prevenir Loop Infinito
  useEffect(() => {
    if (user) {
      const alreadyDone = localStorage.getItem(`onboarding_completed:${user.id}`);
      if (alreadyDone === '1') {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const salvarNoBanco = async (r: CadastroResult) => {
    if (!user) return;

    try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
    import('idb-keyval').then(({ set }) => set(`onboarding_completed:${user.id}`, '1')).catch(() => {});
    try { window.sessionStorage.removeItem('just_signed_up'); } catch {}

    const savePromise = supabase
      .from('profiles')
      .update({
        status_perfil: r.persona,
        faixa_etaria: r.faixa,
        perfil_tipos: r.persona ? [r.persona] : null,
        perfil_contexto: r.personaLabel || '',
        display_name: r.nome || null,
        areas_interesse: r.areas || [],
        interesses: r.interesses || [],
        dores: r.dores || [],
        whatsapp_number: r.whatsapp || null,
        onboarding_completed_at: new Date().toISOString(),
      } as any)
      .eq('id', user.id);

    savePromise.then(({ error }) => {
      if (error) toast.error('Erro ao salvar no banco. Ajuste depois em Perfil.');
    });
  };

  const finalizar = () => {
    // Apresenta a promoção exclusiva de boas-vindas logo após a triagem (R$ 149,90 no PIX)
    setPedirPromo(true);
  };

  const fecharPromo = () => {
    setPedirPromo(false);
    setPedirTrial(true);
  };

  const resgatarPromo = () => {
    setCheckoutPlan('anual_pix');
  };

  const concluirCheckout = () => {
    setCheckoutPlan(null);
    setPedirPromo(false);
    toast.success('Parabéns! Sua assinatura foi ativada.');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  };

  const concluirTrial = () => {
    setPedirTrial(false);
    setPedirNotificacoes(true);
  };

  const concluirNotificacoes = (granted: boolean) => {
    setPedirNotificacoes(false);
    toast.success(granted ? 'Notificações ativadas. Seja bem-vindo(a)!' : 'Seja bem-vindo(a)!');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  };

  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const userEmail = user?.email || '';

  return (
    <main className="min-h-dvh bg-black">
      {/* Modal de Checkout PIX R$ 149,90 */}
      <CheckoutModal
        open={!!checkoutPlan}
        onOpenChange={(v) => { if (!v) setCheckoutPlan(null); }}
        plan={checkoutPlan}
        userEmail={userEmail}
        userName={initialName}
        onSuccess={concluirCheckout}
      />

      {/* Modal de Promoção 24h R$ 149,90 PIX */}
      <HorusPromoModal
        open={pedirPromo}
        timeLeft={timeLeft}
        onClose={fecharPromo}
        onRedeem={resgatarPromo}
      />

      <AnimatePresence mode="wait">
        {!pedirTrial && !pedirNotificacoes ? (
          <motion.div key="onboarding-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <CadastroOnboardingOverlay 
              open 
              onFormFinished={salvarNoBanco}
              onFinished={finalizar} 
              initialName={initialName} 
            />
          </motion.div>
        ) : pedirTrial ? (
          <motion.div key="trial-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <TrialWelcomeModal onDone={concluirTrial} />
          </motion.div>
        ) : (
          <motion.div key="notificacoes-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <NotificacoesPermissaoStep onDone={concluirNotificacoes} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Onboarding;

