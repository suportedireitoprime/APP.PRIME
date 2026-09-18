import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeBookItem {
  id: string;
  titulo: string;
  autor?: string;
  capaUrl?: string;
  ano?: number;
  subtitulo?: string;
}

export interface NativeHomeData {
  nome: string;
  iniciais: string;
  perfilLabel: string;
  avatarUrl?: string;
  unreadCount: number;
  livros?: NativeBookItem[];
}

export interface NativeHomePlugin {
  /**
   * Abre a tela nativa passando os dados do perfil
   */
  showHome(options: { data: NativeHomeData }): Promise<{ success: boolean }>;
  
  /**
   * Fecha ou oculta a tela nativa, retornando a visualização da WebView
   */
  hideHome(): Promise<{ success: boolean }>;

  /**
   * Listener para cliques nos atalhos nativos
   */
  addListener(
    eventName: 'onNavigate',
    listenerFunc: (info: { route: string }) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listener para evento de busca
   */
  addListener(
    eventName: 'onSearch',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
  
  /**
   * Listener para abertura de menu lateral ou notificações
   */
  addListener(
    eventName: 'onOpenSidebar',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onOpenNotifications',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const RawNativeHome = registerPlugin<NativeHomePlugin>('NativeHome');

export const NativeHome: NativeHomePlugin = {
  async showHome(options) {
    if (!Capacitor.isPluginAvailable('NativeHome')) return { success: false };
    return RawNativeHome.showHome(options);
  },
  async hideHome() {
    if (!Capacitor.isPluginAvailable('NativeHome')) return { success: false };
    return RawNativeHome.hideHome();
  },
  async addListener(eventName: string, listenerFunc: (...args: unknown[]) => void) {
    if (!Capacitor.isPluginAvailable('NativeHome')) {
      return { remove: async () => {} } as unknown as PluginListenerHandle & Promise<PluginListenerHandle>;
    }
    return RawNativeHome.addListener(eventName, listenerFunc);
  }
};
