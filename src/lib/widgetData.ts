import { Preferences } from '@capacitor/preferences';

export interface WidgetData {
  quote: string;
  author: string;
  progressPercent: number;
  streak: number;
}

/**
 * Salva os dados para serem lidos pelos Widgets Nativos (iOS/Android).
 * No iOS, o App Group deve estar configurado no Capacitor para que a extensão
 * do widget tenha acesso ao UserDefaults partilhado.
 * No Android, os widgets podem acessar o SharedPreferences "CapacitorStorage" livremente.
 */
export async function syncWidgetData(data: WidgetData) {
  try {
    await Preferences.set({ key: 'widget_quote', value: data.quote });
    await Preferences.set({ key: 'widget_author', value: data.author });
    await Preferences.set({ key: 'widget_progress', value: data.progressPercent.toString() });
    await Preferences.set({ key: 'widget_streak', value: data.streak.toString() });
    
    // A configuração group: 'group.br.com.direitoprime.app' já garante que a 
    // extensão no iOS leia as chaves "widget_quote", "widget_progress", etc.
    
    // Disparar uma notificação nativa para forçar atualização da Timeline do Widget
    try {
      const { WidgetBridge } = await import('capacitor-widget-bridge');
      await WidgetBridge.reloadAllTimelines();
    } catch (e) {
      console.log('Plugin capacitor-widget-bridge não disponível ou não suportado', e);
    }
  } catch (error) {
    console.error('Falha ao sincronizar dados com o widget nativo', error);
  }
}
