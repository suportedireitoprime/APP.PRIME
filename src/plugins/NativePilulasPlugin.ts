import { registerPlugin } from '@capacitor/core';

export interface NativePilulasPluginInterface {
  openPilulasDashboard(options: { accessToken?: string, refreshToken?: string, startPilulaId?: string }): Promise<void>;
}

export const NativePilulasPlugin = registerPlugin<NativePilulasPluginInterface>('NativePilulasPlugin');
