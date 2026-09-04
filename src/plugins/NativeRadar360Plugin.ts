import { registerPlugin } from '@capacitor/core';

export interface NativeRadar360PluginInterface {
  /**
   * Abre a tela nativa do Radar 360 (Kotlin no Android, Swift no iOS).
   * @param options Dados iniciais passados pelo React.
   */
  openRadar360(options: { 
    accessToken: string; 
    /**
     * Payload JSON das resenhas carregadas no frontend, para não precisarmos
     * duplicar a lógica complexa de cache e edge functions no nativo.
     */
    itemsJson: string;
  }): Promise<void>;
}

export const NativeRadar360Plugin = registerPlugin<NativeRadar360PluginInterface>('NativeRadar360Plugin');
