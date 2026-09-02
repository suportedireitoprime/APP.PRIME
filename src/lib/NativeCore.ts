import { registerPlugin } from '@capacitor/core';

export interface NativeCorePlugin {
  /**
   * Initializes the native core module.
   * Can be used to run setup routines that require raw native performance.
   */
  initialize(options: { message: string }): Promise<{ success: boolean; platform: string }>;
}

export const NativeCore = registerPlugin<NativeCorePlugin>('NativeCore');
