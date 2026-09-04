import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeBibliotecaPluginInterface {
  openBiblioteca(options?: {
    aba?: string;
    materia?: string;
    livroId?: string;
    accessToken?: string;
  }): Promise<void>;
  closeBiblioteca(): Promise<void>;
  addListener(
    eventName: 'onClose',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export const NativeBiblioteca = registerPlugin<NativeBibliotecaPluginInterface>('NativeBibliotecaPlugin');
