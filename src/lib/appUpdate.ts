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
import { useAppUpdateStore } from '@/lib/appUpdateStore';

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
    const { AppUpdate, AppUpdateAvailability } = await import(
      '@capawesome/capacitor-app-update'
    );

    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;

    if (Capacitor.getPlatform() === 'ios') {
      // iOS: Trigger our custom React blocking UI
      useAppUpdateStore.getState().setUpdateRequired(true);
    } else {
      // Android: Google Play native immediate/blocking UI
      if (info.immediateUpdateAllowed) {
        await AppUpdate.performImmediateUpdate();
      }
    }
  } catch (e) {
    console.warn('[AppUpdate] check skipped', e);
  }
}
