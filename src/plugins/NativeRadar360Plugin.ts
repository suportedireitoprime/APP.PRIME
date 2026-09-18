import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeRadar360PluginInterface {
  openRadar360(options: { 
    accessToken: string; 
    itemsJson: string;
  }): Promise<void>;
}

const RawNativeRadar360Plugin = registerPlugin<NativeRadar360PluginInterface>('NativeRadar360Plugin');

export const NativeRadar360Plugin: NativeRadar360PluginInterface = {
  async openRadar360(options) {
    if (!Capacitor.isPluginAvailable('NativeRadar360Plugin')) return;
    return RawNativeRadar360Plugin.openRadar360(options);
  }
};
