import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeFlashcardItem {
  id: string;
  pergunta: string;
  resposta: string;
  area: string;
  tema?: string | null;
  subtema?: string | null;
  exemplo?: string | null;
  base_legal?: string | null;
  dica?: string | null;
  artigo_numero?: string | null;
}

export interface NativeFlashcardsSessionData {
  titulo: string;
  cards: NativeFlashcardItem[];
  startIndex?: number;
}

export interface NativeFlashcardsPlugin {
  openHub(options?: { payload?: unknown }): Promise<{ success: boolean }>;
  openSession(options: NativeFlashcardsSessionData): Promise<{ success: boolean }>;
  closeSession(): Promise<{ success: boolean }>;

  addListener(
    eventName: 'onCardAnswered',
    listenerFunc: (info: { cardId: string; status: 'compreendido' | 'revisar'; area: string; tema?: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onSessionCompleted',
    listenerFunc: (info: { total: number; compreendidos: number; revisar: number }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onClose',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const RawNativeFlashcards = registerPlugin<NativeFlashcardsPlugin>('NativeFlashcardsPlugin');

export const NativeFlashcards: NativeFlashcardsPlugin = {
  async openHub(options) {
    if (!Capacitor.isPluginAvailable('NativeFlashcardsPlugin')) return { success: false };
    return RawNativeFlashcards.openHub(options);
  },
  async openSession(options) {
    if (!Capacitor.isPluginAvailable('NativeFlashcardsPlugin')) return { success: false };
    return RawNativeFlashcards.openSession(options);
  },
  async closeSession() {
    if (!Capacitor.isPluginAvailable('NativeFlashcardsPlugin')) return { success: false };
    return RawNativeFlashcards.closeSession();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: async (eventName: any, listenerFunc: any): Promise<PluginListenerHandle> => {
    if (!Capacitor.isPluginAvailable('NativeFlashcardsPlugin')) {
      return { remove: async () => {} } as unknown as PluginListenerHandle;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (RawNativeFlashcards as any).addListener(eventName, listenerFunc);
  }
};
