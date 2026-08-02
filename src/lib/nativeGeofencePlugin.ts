// Ponte para o plugin nativo `VacatioGeofence` (Android) que registra os
// lembretes no GeofencingClient do sistema operacional.
//
// Diferente do watcher em background (que depende do processo do app estar
// vivo), o geofence registrado no SO acorda o app sozinho quando a pessoa
// entra no raio — funciona com o app fechado e é re-registrado no boot.
//
// O código Java do plugin é injetado pelo workflow `.github/workflows/build-android.yml`.
// Em web / iOS as chamadas viram no-op silencioso.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeGeofenceItem {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  title: string;
  message: string;
}

interface VacatioGeofencePlugin {
  register(options: { geofences: NativeGeofenceItem[] }): Promise<{ registered: number }>;
  clear(): Promise<void>;
  /** Eventos de entrada que o receiver nativo gravou enquanto o app estava fechado. */
  pendingEvents(): Promise<{ events: { id: string; at: number; lat?: number; lng?: number }[] }>;
  isAvailable(): Promise<{ available: boolean }>;
}

const Plugin = registerPlugin<VacatioGeofencePlugin>('VacatioGeofence');

// Android limita a 100 geofences por app.
const MAX_GEOFENCES = 100;

function available(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('VacatioGeofence');
}

export async function nativeGeofenceAvailable(): Promise<boolean> {
  if (!available()) return false;
  try {
    const r = await Plugin.isAvailable();
    return !!r?.available;
  } catch {
    return false;
  }
}

export async function registerNativeGeofences(items: NativeGeofenceItem[]): Promise<number> {
  if (!available()) return 0;
  try {
    const list = items.slice(0, MAX_GEOFENCES);
    const res = await Plugin.register({ geofences: list });
    return res?.registered ?? list.length;
  } catch (e) {
    console.warn('[geofence-native] register falhou', e);
    return 0;
  }
}

export async function clearNativeGeofences(): Promise<void> {
  if (!available()) return;
  try { await Plugin.clear(); } catch (e) { console.warn('[geofence-native] clear falhou', e); }
}

export async function drainNativeGeofenceEvents(): Promise<{ id: string; at: number }[]> {
  if (!available()) return [];
  try {
    const res = await Plugin.pendingEvents();
    return res?.events ?? [];
  } catch {
    return [];
  }
}
