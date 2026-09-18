import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeMeExpliquePluginInterface {
  verificarPermissoes(): Promise<{ camera: boolean; microfone: boolean }>;
  alternarLanterna(): Promise<{ ligada: boolean }>;
  vibrarFeedback(options?: { tipo?: 'click' | 'heavy' }): Promise<void>;
}

const RawNativeMeExpliquePlugin = registerPlugin<NativeMeExpliquePluginInterface>('NativeMeExpliquePlugin', {
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

export const NativeMeExpliquePlugin: NativeMeExpliquePluginInterface = {
  async verificarPermissoes() {
    if (!Capacitor.isPluginAvailable('NativeMeExpliquePlugin')) {
      return { camera: true, microfone: true };
    }
    return RawNativeMeExpliquePlugin.verificarPermissoes();
  },
  async alternarLanterna() {
    if (!Capacitor.isPluginAvailable('NativeMeExpliquePlugin')) {
      return { ligada: false };
    }
    return RawNativeMeExpliquePlugin.alternarLanterna();
  },
  async vibrarFeedback(options) {
    if (!Capacitor.isPluginAvailable('NativeMeExpliquePlugin')) {
      if ('vibrate' in navigator) navigator.vibrate(20);
      return;
    }
    return RawNativeMeExpliquePlugin.vibrarFeedback(options);
  }
};
