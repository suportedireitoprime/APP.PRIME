import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface OpenArtigoOptions {
  id: string;
  numero: string;
  caput: string;
  titulo?: string;
  tabelaNome?: string;
  paragrafos?: string[];
  incisos?: string[];
  highlights?: Array<{
    id: string;
    text: string;
    color: string;
    startOffset: number;
    endOffset: number;
  }>;
  audioUrl?: string;
  accessToken?: string;
}

export interface NativeVadeMecumPluginInterface {
  openArtigo(options: OpenArtigoOptions): Promise<void>;
  addListener(
    eventName: 'onHighlightsUpdated',
    listenerFunc: (data: { artigoId: string; highlights: string }) => void,
  ): Promise<PluginListenerHandle>;
}

const RawNativeVadeMecumPlugin = registerPlugin<NativeVadeMecumPluginInterface>('NativeVadeMecumPlugin');

export const NativeVadeMecumPlugin: NativeVadeMecumPluginInterface = {
  async openArtigo(options) {
    if (!Capacitor.isPluginAvailable('NativeVadeMecumPlugin')) {
      throw new Error('NativeVadeMecumPlugin not available');
    }
    return RawNativeVadeMecumPlugin.openArtigo(options);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: async (eventName: any, listenerFunc: any): Promise<PluginListenerHandle> => {
    if (!Capacitor.isPluginAvailable('NativeVadeMecumPlugin')) {
      throw new Error('NativeVadeMecumPlugin not available');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (RawNativeVadeMecumPlugin as any).addListener(eventName, listenerFunc);
  }
};
