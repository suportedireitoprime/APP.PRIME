import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface NativeAuthResponse {
  success: boolean;
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

export const NativeAuth = registerPlugin<NativeAuthPluginInterface>('NativeAuth', {
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
