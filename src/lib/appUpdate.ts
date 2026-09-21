/**
 * Google Play in-app update check.
 *
 * Default mode: FLEXIBLE — user keeps using the app while the update
 * downloads in the background. When download completes, a toast prompts
 * the user to restart to apply.
 *
 * Force-update: set the Preferences key `force_update_min_version` (e.g.
 * "1.4.2") remotely (via admin RPC or push) and the boot check will
 * switch to IMMEDIATE mode (blocking) when the installed version is lower.
 */
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useAppUpdateStore } from '@/lib/appUpdateStore';
import { supabase } from '@/integrations/supabase/client';

// Google Play install status codes
const INSTALL_STATUS_DOWNLOADED = 11;

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export async function checkForAppUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const platform = Capacitor.getPlatform();
    
    // 1. Verificação da Trava de Versão (Remote Force Update via Supabase)
    try {
      const info = await CapacitorApp.getInfo();
      const currentVersion = info.version; // ex: "1.4.0"
      
      const { data, error } = await supabase.functions.invoke('app-version-lock');
      if (!error && data) {
        const minAllowed = platform === 'ios' ? data.minIos : data.minAndroid;
        if (minAllowed && compareVersions(currentVersion, minAllowed) < 0) {
          // Versão atual é MENOR que a versão mínima exigida pelo servidor
          useAppUpdateStore.getState().setUpdateRequired(true);
          return; // Para a execução e trava o app
        }
      }
    } catch (edgeError) {
      console.warn('[AppUpdate] Fallback: Falha ao verificar Edge Function', edgeError);
    }
    // 2. Verificação Nativa nas Lojas (Google Play / App Store)
    const { AppUpdate, AppUpdateAvailability } = await import(
      '@capawesome/capacitor-app-update'
    );

    const storeInfo = await AppUpdate.getAppUpdateInfo();
    if (storeInfo.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;

    if (platform === 'ios') {
      // iOS: Trigger our custom React blocking UI
      useAppUpdateStore.getState().setUpdateRequired(true);
    } else {
      // Android: Google Play native immediate/blocking UI
      if (storeInfo.immediateUpdateAllowed) {
        await AppUpdate.performImmediateUpdate();
      }
    }
  } catch (e) {
    console.warn('[AppUpdate] check skipped', e);
  }
}
