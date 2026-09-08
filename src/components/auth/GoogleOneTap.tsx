import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleOneTap: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[GoogleOneTap] VITE_GOOGLE_CLIENT_ID não está definido no .env');
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) throw error;
        
        // O Redirecionamento é automático pelo AuthContext e listener,
        // mas chamamos para forçar a renderização caso necessário.
        navigate('/', { replace: true });
      } catch (error: any) {
        console.error('[GoogleOneTap] Erro de autenticação', error);
        toast.error('Não foi possível entrar com o Google One Tap.');
      }
    };

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          context: 'use',
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('[GoogleOneTap] Popup não exibido: ', notification.getNotDisplayedReason());
          }
        });
      }
    };

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogle();
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initializeGoogle();
    }
  }, [navigate]);

  return null; // Este componente não renderiza DOM, apenas injeta o script e chama a API
};
