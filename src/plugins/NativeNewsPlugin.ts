import { registerPlugin } from '@capacitor/core';

export interface NativeNewsPluginInterface {
  openNewsDashboard(options: { accessToken?: string, refreshToken?: string }): Promise<void>;
}

export const NativeNewsPlugin = registerPlugin<NativeNewsPluginInterface>('NativeNewsPlugin');
