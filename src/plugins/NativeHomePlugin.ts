import { registerPlugin } from '@capacitor/core';
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

export const NativeHome = registerPlugin<NativeHomePlugin>('NativeHome');
