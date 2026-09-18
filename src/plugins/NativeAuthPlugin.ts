import { registerPlugin, PluginListenerHandle, Capacitor } from '@capacitor/core';

export interface NativeAuthResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: string | Record<string, any>;
}

export interface NativeAuthPluginInterface {
  openAuth(options?: { mode?: 'login' | 'signup' | 'forgot' }): Promise<NativeAuthResponse>;
  openLanding(): Promise<NativeAuthResponse>;
  addListener(
    eventName: 'onAuthSuccess',
    listenerFunc: (data: NativeAuthResponse) => void
  ): Promise<PluginListenerHandle>;
}

const RawNativeAuth = registerPlugin<NativeAuthPluginInterface>('NativeAuth', {
  web: () => ({
    async openAuth() {
      return { success: false };
    },
    async openLanding() {
      return { success: false };
    },
    async addListener() {
      return {
        remove: async () => {},
      };
    },
  }),
});

export const NativeAuth: NativeAuthPluginInterface = {
  async openAuth(options) {
    if (!Capacitor.isPluginAvailable('NativeAuth')) {
      return { success: false };
    }
    try {
      return await RawNativeAuth.openAuth(options);
    } catch (err) {
      console.warn('[NativeAuth] openAuth não disponível ou falhou:', err);
      return { success: false };
    }
  },

  async openLanding() {
    if (!Capacitor.isPluginAvailable('NativeAuth')) {
      return { success: false };
    }
    try {
      return await RawNativeAuth.openLanding();
    } catch (err) {
      console.warn('[NativeAuth] openLanding não disponível ou falhou:', err);
      return { success: false };
    }
  },

  async addListener(eventName, listenerFunc) {
    if (!Capacitor.isPluginAvailable('NativeAuth')) {
      return { remove: async () => {} };
    }
    try {
      return await RawNativeAuth.addListener(eventName, listenerFunc);
    } catch (err) {
      console.warn('[NativeAuth] addListener não disponível ou falhou:', err);
      return { remove: async () => {} };
    }
  },
};

