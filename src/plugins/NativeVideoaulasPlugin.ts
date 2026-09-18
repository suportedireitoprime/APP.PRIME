import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeVideoaulaItem {
  id: string;
  videoId: string;
  titulo: string;
  area: string;
  duracaoSegundos?: number;
  descricao?: string;
}

export interface NativeVideoaulasPlugin {
  openHub(options?: { payload?: unknown }): Promise<{ success: boolean }>;
  openVideo(options: NativeVideoaulaItem): Promise<{ success: boolean }>;
  closeVideo(): Promise<{ success: boolean }>;

  addListener(
    eventName: 'onVideoProgress',
    listenerFunc: (info: { id: string; videoId?: string; currentSeconds: number; durationSeconds: number; completed: boolean }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onVideoSelected',
    listenerFunc: (info: { id: string; videoId: string; titulo: string; area: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onClose',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const RawNativeVideoaulas = registerPlugin<NativeVideoaulasPlugin>('NativeVideoaulasPlugin');

export const NativeVideoaulas: NativeVideoaulasPlugin = {
  async openHub(options) {
    if (!Capacitor.isPluginAvailable('NativeVideoaulasPlugin')) return { success: false };
    return RawNativeVideoaulas.openHub(options);
  },
  async openVideo(options) {
    if (!Capacitor.isPluginAvailable('NativeVideoaulasPlugin')) return { success: false };
    return RawNativeVideoaulas.openVideo(options);
  },
  async closeVideo() {
    if (!Capacitor.isPluginAvailable('NativeVideoaulasPlugin')) return { success: false };
    return RawNativeVideoaulas.closeVideo();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: async (eventName: any, listenerFunc: any): Promise<PluginListenerHandle> => {
    if (!Capacitor.isPluginAvailable('NativeVideoaulasPlugin')) {
      return { remove: async () => {} } as unknown as PluginListenerHandle;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (RawNativeVideoaulas as any).addListener(eventName, listenerFunc);
  }
};
