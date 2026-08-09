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
    
    // Pequeno delay para garantir que o render no DOM já ocorreu
    // antes de dropar a tela de splash nativa.
    setTimeout(() => {
      if (cancelled || hasHidden) return;
      hasHidden = true;
      import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
      });
    }, delay);
    
    return () => {
      cancelled = true;
    };
  }, [delay]);
}
