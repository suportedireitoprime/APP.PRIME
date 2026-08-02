// Chave pública VAPID — segura para expor no cliente.
// Espelho da variável VAPID_PUBLIC_KEY configurada nas edge functions.
export const VAPID_PUBLIC_KEY =
  'BL4wQPGaLwQIHk8DU_-dgZMUDHgXFe0GtopVvjS3aFUQxFCMLP69NIEBodLE0cfMAYagXOe6esT6E_T1R-Jw_MU';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
