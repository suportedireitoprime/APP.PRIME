import { useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';
import NotificacoesPermissaoStep from '@/components/onboarding/NotificacoesPermissaoStep';

const Onboarding = () => {
  useHideSplashScreen(100);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [pedirNotificacoes, setPedirNotificacoes] = useState(true);
  // SEO & Título dinâmico da Triagem
  useEffect(() => {
    document.title = 'Personalizar Perfil | Direito Prime';
  }, []);


  const concluirNotificacoes = (granted: boolean) => {
    setPedirNotificacoes(false);
    toast.success(granted ? 'Notificações ativadas. Bora estudar!' : 'Bora estudar!');
    startTransition(() => {
      navigate('/', { replace: true });
    });
  };

  return (
    <main className="min-h-dvh bg-black">
      {pedirNotificacoes && <NotificacoesPermissaoStep onDone={concluirNotificacoes} />}
    </main>
  );
};

export default Onboarding;

