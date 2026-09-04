import { registerPlugin } from '@capacitor/core';
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

export const NativeVideoaulas = registerPlugin<NativeVideoaulasPlugin>('NativeVideoaulasPlugin');
