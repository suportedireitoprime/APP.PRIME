import { useState, useEffect, useCallback, startTransition } from 'react';
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
  
  // 24 hours countdown in seconds baseado no momento de criação do usuário (Item 24)
  const calculatePromoTimeLeft = useCallback((): number => {
    const baseTime = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
    const expiresAt = baseTime + 24 * 60 * 60 * 1000;
    const diff = Math.floor((expiresAt - Date.now()) / 1000);
    return Math.max(0, Math.min(diff, 24 * 60 * 60 - 1));
  }, [user?.created_at]);

  const [timeLeft, setTimeLeft] = useState<number>(calculatePromoTimeLeft);

  useEffect(() => {
    setTimeLeft(calculatePromoTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [calculatePromoTimeLeft]);

  // SEO & Título dinâmico da Triagem
  useEffect(() => {
    document.title = 'Personalizar Perfil | Direito Prime';
  }, []);

  // Prevenir Loop Infinito sincronizando com a fonte de verdade do banco
  useEffect(() => {
    let isMounted = true;
    if (user) {
      // Se acabou de se cadastrar no fluxo de onboarding, permite concluir sem desvio prematuro
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('just_signed_up') === '1') {
        return;
      }

      const checkStatus = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_completed_at')
            .eq('id', user.id)
            .maybeSingle();

          if (!isMounted) return;

          if (data?.onboarding_completed_at) {
            try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
            navigate('/', { replace: true });
          } else {
            // Se no banco ainda não foi concluído, limpa flags locais obsoletas para não criar loop
            try { localStorage.removeItem(`onboarding_completed:${user.id}`); } catch {}
          }
        } catch {
          const alreadyDone = localStorage.getItem(`onboarding_completed:${user.id}`);
          if (alreadyDone === '1' && isMounted) {
            navigate('/', { replace: true });
          }
        }
      };

      void checkStatus();
    }
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const salvarNoBanco = async (r: CadastroResult): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status_perfil: r.persona,
          faixa_etaria: r.faixa,
          perfil_tipos: r.persona ? [r.persona] : null,
          perfil_contexto: r.personaLabel || '',
          display_name: r.nome || null,
          areas_interesse: r.areas || [],
          interesses: r.interesses || [],
          whatsapp_number: r.whatsapp || null,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Onboarding] Erro ao salvar perfil:', error);
        toast.error('Erro ao salvar no banco. Ajuste depois em Perfil.');
      } else {
        try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
        import('idb-keyval').then(({ set }) => set(`onboarding_completed:${user.id}`, '1')).catch(() => {});
        try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
      }
    } catch (err) {
      console.error('[Onboarding] Falha inesperada ao salvar perfil:', err);
    }
  };

  const finalizar = () => {
    // Apresenta a promoção exclusiva de boas-vindas logo após a triagem (R$ 149,90 no PIX)
    setPedirPromo(true);
  };

  const fecharPromo = () => {
    setPedirPromo(false);
    // Intervalo para liberação do scroll lock antes de abrir o próximo modal (Item 22)
    setTimeout(() => {
      setPedirTrial(true);
    }, 200);
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
    // Intervalo para liberação do scroll lock antes de abrir o próximo modal (Item 22)
    setTimeout(() => {
      setPedirNotificacoes(true);
    }, 200);
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

