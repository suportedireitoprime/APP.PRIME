import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

let hasHidden = false;

export function useHideSplashScreen(delay = 100) {
  useEffect(() => {
    if (hasHidden) return;
    if (!Capacitor.isNativePlatform()) {
      hasHidden = true;
      return;
    }
    
    let cancelled = false;
    
    // Garante que o React já fez o commit e o browser já fez o paint inicial
    // antes de começarmos a contar o tempo de saída, eliminando concorrência.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (cancelled || hasHidden) return;
          hasHidden = true;
          import('@capacitor/splash-screen').then(({ SplashScreen }) => {
            SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
          });
        }, delay);
      });
    });
    
    return () => {
      cancelled = true;
    };
  }, [delay]);
}
