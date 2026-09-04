import { registerPlugin } from '@capacitor/core';

export interface ResumosNativePluginInterface {
  /**
   * Abre a tela nativa principal de Resumos (Lista de Áreas e Temas).
   * Opcionalmente, pode receber um initialArea se o usuário clicar diretamente em uma matéria.
   */
  openResumos(options?: { initialArea?: string; initialTema?: string; payload?: unknown }): Promise<{ success: boolean }>;
  
  /**
   * Abre o leitor nativo para um resumo específico.
   * Utilizado caso a navegação ocorra a partir de outro ponto do app para um resumo direto.
   */
  openReader(options: { area: string; tema: string; payload?: unknown }): Promise<{ success: boolean }>;
}

export const ResumosNativePlugin = registerPlugin<ResumosNativePluginInterface>('ResumosNativePlugin');
