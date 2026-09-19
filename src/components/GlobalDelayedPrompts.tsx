import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { hasRated, requestReviewNow } from '@/lib/inAppReview';

export function GlobalDelayedPrompts() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) return;

    // Só roda se o onboarding já foi concluído no localStorage
    // (a Home e a Triagem definem esse valor)
    const triageDone = localStorage.getItem(`onboarding_completed:${user.id}`) === '1';
    if (!triageDone) return;

    // 10 segundos para Avaliação nas lojas (In-App Review)
    const reviewTimer = setTimeout(async () => {
      try {
        const rated = await hasRated();
        if (!rated) {
          await requestReviewNow();
        }
      } catch (e) {
        console.warn('[GlobalDelayedPrompts] erro In-App Review', e);
      }
    }, 10000);

    // 30 segundos para Push Notifications (prompt nativo)
    const pushTimer = setTimeout(async () => {
      try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        const permStatus = await FirebaseMessaging.checkPermissions();
        if (permStatus.receive === 'prompt') {
          const requested = await FirebaseMessaging.requestPermissions();
          if (requested.receive === 'granted') {
            const { registerNativePushToken } = await import('@/lib/nativePush');
            await registerNativePushToken();
          }
        }
      } catch (e) {
        console.warn('[GlobalDelayedPrompts] erro Push Prompt', e);
      }
    }, 30000);

    return () => {
      clearTimeout(reviewTimer);
      clearTimeout(pushTimer);
    };
  }, [user]);

  return null;
}
