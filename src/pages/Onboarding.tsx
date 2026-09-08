import { useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';
import CadastroOnboardingOverlay, {
  type CadastroResult,
} from '@/components/onboarding/CadastroOnboardingOverlay';
import NotificacoesPermissaoStep from '@/components/onboarding/NotificacoesPermissaoStep';
import { AnimatePresence, motion } from 'framer-motion';

const Onboarding = () => {
  useHideSplashScreen(100);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [pedirNotificacoes, setPedirNotificacoes] = useState(false);

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

  const finalizar = async (r: CadastroResult) => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    setSaving(true);

    const timeoutPromise = new Promise<{ error: Error }>((resolve) => 
      setTimeout(() => resolve({ error: new Error('Timeout de rede') }), 10000)
    );

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

    const { error } = await Promise.race([savePromise, timeoutPromise]);

    setSaving(false);

    if (error) {
      if (error.message === 'Timeout de rede') {
        toast.error('A conexão está lenta. Salvando offline, ajustaremos depois.');
      } else {
        toast.error('Erro ao salvar no banco. Ajuste depois em Perfil.');
      }
    }

    try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
    import('idb-keyval').then(({ set }) => set(`onboarding_completed:${user.id}`, '1')).catch(() => {});
    try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
    setPedirNotificacoes(true);
  };


  const concluirNotificacoes = (granted: boolean) => {
    setPedirNotificacoes(false);
    toast.success(granted ? 'Notificações ativadas. Bora estudar!' : 'Bora estudar!');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  };

  const initialName = user?.user_metadata?.full_name || '';

  return (
    <main className="min-h-dvh bg-black">
      <AnimatePresence mode="wait">
        {!pedirNotificacoes ? (
          <motion.div key="onboarding-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <CadastroOnboardingOverlay open onFinished={finalizar} initialName={initialName} />
          </motion.div>
        ) : (
          <motion.div key="notificacoes-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <NotificacoesPermissaoStep onDone={concluirNotificacoes} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Onboarding;

