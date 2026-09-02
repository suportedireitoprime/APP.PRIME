import { registerPlugin } from '@capacitor/core';

export interface NativeFlashcardsPluginInterface {
  openDashboard(options: { userId: string }): Promise<void>;
  startStudySession(options: { category: string, cards: any[] }): Promise<{ result: any }>;
}

export const NativeFlashcardsPlugin = registerPlugin<NativeFlashcardsPluginInterface>('NativeFlashcardsPlugin');
