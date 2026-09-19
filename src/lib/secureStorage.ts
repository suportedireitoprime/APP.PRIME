/**
 * Secure storage wrapper — Keystore (Android) / Keychain (iOS) on native,
 * localStorage fallback on web. API mirrors Web Storage (async).
 *
 * On native, transparently migrates any existing `sb-*` (Supabase) tokens
 * from localStorage into the secure store on first read — no explicit
 * migration step required at boot.
 */
import { Capacitor } from '@capacitor/core';
import { localDb } from '@/services/localDb';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const isNative = Capacitor.isNativePlatform();

async function nativeGet(key: string): Promise<string | null> {
  try {
    const v = await localDb.getKv(key);
    if (v != null) return String(v);
    
    // Migração transparente do SecureStorage antigo para o localDb
    try {
      const oldV = await SecureStorage.get(key);
      if (oldV != null) {
        await localDb.setKv(key, String(oldV));
        await SecureStorage.remove(key);
        return String(oldV);
      }
    } catch {}
    
    return null;
  } catch {
    return null;
  }
}

async function nativeSet(key: string, value: string): Promise<void> {
  await localDb.setKv(key, value);
}

async function nativeRemove(key: string): Promise<void> {
  try {
    await localDb.delKv(key);
  } catch {
    /* noop */
  }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isNative) return localStorage.getItem(key);
    const secure = await nativeGet(key);
    if (secure != null) return secure;
    // Transparent migration from legacy localStorage
    const legacy = localStorage.getItem(key);
    if (legacy) {
      try {
        await nativeSet(key, legacy);
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('[secureStorage] migration failed for', key, e);
      }
      return legacy;
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!isNative) {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await nativeSet(key, value);
    } catch (e) {
      console.warn('[secureStorage] set failed, falling back to localStorage', e);
      localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (!isNative) {
      localStorage.removeItem(key);
      return;
    }
    await nativeRemove(key);
    // Also clear any legacy localStorage copy
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};
