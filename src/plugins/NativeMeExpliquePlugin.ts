import { registerPlugin } from '@capacitor/core';

export interface NativeMeExpliquePluginInterface {
  verificarPermissoes(): Promise<{ camera: boolean; microfone: boolean }>;
  alternarLanterna(): Promise<{ ligada: boolean }>;
  vibrarFeedback(options?: { tipo?: 'click' | 'heavy' }): Promise<void>;
}

export const NativeMeExpliquePlugin = registerPlugin<NativeMeExpliquePluginInterface>('NativeMeExpliquePlugin', {
  web: () => ({
    async verificarPermissoes() {
      return { camera: true, microfone: true };
    },
    async alternarLanterna() {
      return { ligada: false };
    },
    async vibrarFeedback() {
      if ('vibrate' in navigator) navigator.vibrate(20);
    },
  }),
});
