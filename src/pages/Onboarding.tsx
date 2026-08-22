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

  const finalizar = (r: CadastroResult) => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    // Libera o app na hora: nada de esperar a rede pra sair do onboarding.
    try { localStorage.setItem(`onboarding_completed:${user.id}`, '1'); } catch {}
    try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
    setPedirNotificacoes(true);
    setSaving(true);

    // Salvamento em segundo plano — o usuário não fica travado esperando.
    supabase
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
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) toast.error('Salvei seu acesso, mas o perfil não gravou. Ajuste depois em Perfil.');
      })
      .then(undefined, () => {})
      .then(() => setSaving(false));
  };


  const concluirNotificacoes = (granted: boolean) => {
    setPedirNotificacoes(false);
    toast.success(granted ? 'Notificações ativadas. Bora estudar!' : 'Bora estudar!');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  };

  return (
    <main className="min-h-dvh bg-black">
      {!pedirNotificacoes && <CadastroOnboardingOverlay open onFinished={finalizar} />}
      {pedirNotificacoes && <NotificacoesPermissaoStep onDone={concluirNotificacoes} />}
    </main>
  );
};

export default Onboarding;

