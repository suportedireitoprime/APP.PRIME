import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ResumosNativePluginInterface {
  openResumos(options?: { initialArea?: string; initialTema?: string; payload?: unknown }): Promise<{ success: boolean }>;
  openReader(options: { area: string; tema: string; payload?: unknown }): Promise<{ success: boolean }>;
}

const RawResumosNativePlugin = registerPlugin<ResumosNativePluginInterface>('ResumosNativePlugin');

export const ResumosNativePlugin: ResumosNativePluginInterface = {
  async openResumos(options) {
    if (!Capacitor.isPluginAvailable('ResumosNativePlugin')) return { success: false };
    return RawResumosNativePlugin.openResumos(options);
  },
  async openReader(options) {
    if (!Capacitor.isPluginAvailable('ResumosNativePlugin')) return { success: false };
    return RawResumosNativePlugin.openReader(options);
  }
};
