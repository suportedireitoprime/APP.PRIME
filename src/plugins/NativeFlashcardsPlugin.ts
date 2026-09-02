import { registerPlugin } from '@capacitor/core';

export interface NativeFlashcardsPluginInterface {
  openDashboard(options: { userId: string, accessToken?: string, refreshToken?: string }): Promise<void>;
  startStudySession(options: { category: string, cards: any[], accessToken?: string, refreshToken?: string }): Promise<{ result: any }>;
}

export const NativeFlashcardsPlugin = registerPlugin<NativeFlashcardsPluginInterface>('NativeFlashcardsPlugin');
