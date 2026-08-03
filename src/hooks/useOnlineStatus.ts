import { useOnline } from '@/lib/nativo/rede';

/** Estado reativo da conexão (Capacitor Network no app nativo, eventos do window na web). */
export function useOnlineStatus(): boolean {
  return useOnline();
}
