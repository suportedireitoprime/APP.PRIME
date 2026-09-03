import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

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

export const NativeVadeMecumPlugin = registerPlugin<NativeVadeMecumPluginInterface>('NativeVadeMecumPlugin');
