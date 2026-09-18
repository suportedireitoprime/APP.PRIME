import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeQuestaoItem {
  id: string;
  enunciado: string;
  alt_a: string | null;
  alt_b: string | null;
  alt_c: string | null;
  alt_d: string | null;
  alt_e?: string | null;
  gabarito_oficial: string;
  gabarito_comentado?: string | null;
  disciplina?: string | null;
  assunto?: string | null;
  ano?: number | null;
  banca?: string | null;
  orgao?: string | null;
}

export interface NativeQuestoesSessionData {
  titulo: string;
  questoes: NativeQuestaoItem[];
  startIndex?: number;
  contexto?: string;
}

export interface NativeQuestoesPlugin {
  openSession(options: NativeQuestoesSessionData): Promise<{ success: boolean }>;
  closeSession(): Promise<{ success: boolean }>;

  addListener(
    eventName: 'onQuestaoAnswered',
    listenerFunc: (info: { questaoId: string; alternativa: string; acertou: boolean; tempoSegundos: number }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onSessionCompleted',
    listenerFunc: (info: { total: number; acertos: number; erros: number; tempoTotalSegundos: number }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onClose',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const RawNativeQuestoes = registerPlugin<NativeQuestoesPlugin>('NativeQuestoesPlugin');

export const NativeQuestoes: NativeQuestoesPlugin = {
  async openSession(options) {
    if (!Capacitor.isPluginAvailable('NativeQuestoesPlugin')) return { success: false };
    return RawNativeQuestoes.openSession(options);
  },
  async closeSession() {
    if (!Capacitor.isPluginAvailable('NativeQuestoesPlugin')) return { success: false };
    return RawNativeQuestoes.closeSession();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: async (eventName: any, listenerFunc: any): Promise<PluginListenerHandle> => {
    if (!Capacitor.isPluginAvailable('NativeQuestoesPlugin')) {
      return { remove: async () => {} } as unknown as PluginListenerHandle;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (RawNativeQuestoes as any).addListener(eventName, listenerFunc);
  }
};
