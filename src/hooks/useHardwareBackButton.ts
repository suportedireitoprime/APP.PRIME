import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

/**
 * Hook global que intercepta o botão físico e o gesto de voltar do Android via Capacitor.
 * 1. Fecha modais, dialogs, drawers ou sheets que estejam abertos no DOM.
 * 2. Se estiver em uma sub-rota (qualquer rota que não seja '/' ou '/landing'), executa navigate(-1).
 * 3. Se estiver na tela raiz, solicita confirmação rápida com toast antes de sair do aplicativo.
 */
export function useHardwareBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastPressRef = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    let isSubscribed = true;
    let backHandle: { remove: () => void } | null = null;

    App.addListener('backButton', () => {
      if (!isSubscribed) return;

      // 1. Fecha modais, sheets ou diálogos abertos no DOM prioritariamente
      const activeDialogCloseBtn = document.querySelector<HTMLElement>(
        '[data-state="open"] button[aria-label="Fechar"], [data-state="open"] button[aria-label="Close"], [role="dialog"] button[aria-label="Fechar"], .close-modal-trigger'
      );
      if (activeDialogCloseBtn) {
        activeDialogCloseBtn.click();
        return;
      }

      // Se há elemento com data-state="open" (Radix Sheet/Dialog), despacha tecla Escape
      const openRadixModal = document.querySelector('[data-state="open"]');
      if (openRadixModal) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      // 2. Se estiver em sub-rota, navega para trás
      const isRoot = location.pathname === '/' || location.pathname === '/landing';
      if (!isRoot) {
        navigate(-1);
        return;
      }

      // 3. Se estiver na tela inicial, exige duplo toque em 2 segundos para encerrar
      const now = Date.now();
      if (now - lastPressRef.current < 2000) {
        App.exitApp();
      } else {
        lastPressRef.current = now;
        toast('Pressione novamente para sair', {
          duration: 2000,
          position: 'bottom-center',
        });
      }
    }).then((h) => {
      backHandle = h;
    }).catch(() => {});

    return () => {
      isSubscribed = false;
      backHandle?.remove?.();
    };
  }, [navigate, location.pathname]);
}

export default useHardwareBackButton;
