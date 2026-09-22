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
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | null>(null);
  const [pedirNotificacoes, setPedirNotificacoes] = useState(false);
  const [pedirTrial, setPedirTrial] = useState(false);
  const [onboardingFinished, setOnboardingFinished] = useState(false);
  
  // 24 hours countdown in seconds garantido a partir do início da promoção
  const calculatePromoTimeLeft = useCallback((): number => {
    const key = user?.id ? `promo_24h_expires_${user.id}` : 'promo_24h_expires_guest';
    let expiresAt = 0;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        expiresAt = parseInt(stored, 10);
      }
    } catch {}

    // Se não existir ou estiver expirado ao abrir pela primeira vez a triagem, define 24h
    if (!expiresAt || expiresAt <= Date.now()) {
      expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      try {
        localStorage.setItem(key, String(expiresAt));
      } catch {}
    }

    const diff = Math.floor((expiresAt - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [user?.id]);

  const [timeLeft, setTimeLeft] = useState<number>(calculatePromoTimeLeft);

  useEffect(() => {
    if (!pedirPromo) return;
    setTimeLeft(calculatePromoTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [pedirPromo, calculatePromoTimeLeft]);

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

  const salvarNoBanco = useCallback(async (r: CadastroResult): Promise<void> => {
    if (!user) return;

    try {
      // 1. Tenta salvar via RPC Security Definer (à prova de falhas de RLS/sessão)
      const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: { success?: boolean; error?: string } | null; error: unknown }>)(
        'completar_onboarding_perfil',
        {
          _user_id: user.id,
          _status_perfil: r.persona,
          _faixa_etaria: r.faixa,
          _perfil_contexto: r.personaLabel || '',
          _display_name: r.nome || null,
          _areas_interesse: r.areas || [],
          _interesses: r.interesses || [],
          _whatsapp: r.whatsapp || null,
        }
      );

      let saveSuccess = !rpcError && rpcData?.success !== false;

      // 2. Fallback: se a RPC falhar, tenta update direto
      if (!saveSuccess) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status_perfil: r.persona,
            faixa_etaria: r.faixa,
            perfil_tipos: r.persona ? [r.persona] : null,
            perfil_contexto: r.personaLabel || '',
            display_name: r.nome || null,
            areas_interesse: r.areas || [],
            interesses: r.interesses || [],
            telefone: r.whatsapp || null,
            whatsapp_number: r.whatsapp || null,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        saveSuccess = !updateError;
        if (updateError) {
          console.error('[Onboarding] Erro no fallback de update:', updateError);
        }
      }

      if (!saveSuccess) {
        console.error('[Onboarding] Não foi possível persistir perfil:', { rpcError });
        toast.error('Erro ao salvar no banco. Ajuste depois em Perfil.');
      } else {
        try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
        import('idb-keyval').then(({ set }) => set(`onboarding_completed:${user.id}`, '1')).catch(() => {});
        try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
      }
    } catch (err) {
      console.error('[Onboarding] Falha inesperada ao salvar perfil:', err);
    }
  }, [user]);

  const finalizar = useCallback(() => {
    // Marca o onboarding como concluído no fluxo e apresenta a promoção exclusiva
    setTimeLeft(calculatePromoTimeLeft());
    setOnboardingFinished(true);
    setPedirPromo(true);
  }, [calculatePromoTimeLeft]);

  const fecharPromo = useCallback(() => {
    setPedirPromo(false);
    setPedirTrial(true);
  }, []);

  const resgatarPromo = useCallback(() => {
    setCheckoutPlan('vitalicio_pix');
  }, []);

  const concluirCheckout = useCallback(() => {
    setCheckoutPlan(null);
    setPedirPromo(false);
    toast.success('Parabéns! Sua assinatura foi ativada.');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  }, [navigate]);

  const concluirTrial = useCallback(() => {
    setPedirTrial(false);
    toast.success('Seja bem-vindo(a)!');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  }, [navigate]);

  const userEmail = user?.email || '';
  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0] || '';

  return (
    <main className="min-h-dvh bg-black">
      {/* Modal de Checkout PIX R$ 149,90 */}
      <CheckoutModal
        open={!!checkoutPlan}
        onOpenChange={(v) => { 
          if (!v) {
            setCheckoutPlan(null);
            setPedirTrial(true);
          }
        }}
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
        {!onboardingFinished ? (
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
        ) : null}
      </AnimatePresence>
    </main>
  );
};

export default Onboarding;

