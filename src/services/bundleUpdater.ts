import { saveOfflinePackage } from './downloadManager';
import { supabase } from '@/integrations/supabase/client';
import { Network } from '@capacitor/network';

const BUNDLES_TO_SYNC = [
  'resumos',
  'blog-posts',
  'noticias',
  'tematica-obras',
  'biblioteca-classicos',
  'biblioteca-oab',
  'biblioteca-estudos',
  'biblioteca-portugues',
  'biblioteca-lideranca',
  'biblioteca-fora-da-toga',
  'biblioteca-pesquisa-cientifica',
  'questoes-areas',
  'flashcards-resumo-areas',
  'flashcards-decks',
  'lei-seca-trilhas',
];

// Impede múltiplas execuções simultâneas do updater
let isUpdating = false;

/**
 * Atualiza os pacotes nativos de forma silenciosa.
 * Só executa se o aparelho estiver com conexão WiFi para economizar dados móveis.
 */
export async function startSilentBundleUpdate(): Promise<void> {
  if (isUpdating || typeof window === 'undefined') return;
  
  try {
    const status = await Network.getStatus();
    // Apenas rodar o background sync invisível se estiver no Wi-Fi
    if (status.connectionType !== 'wifi') {
      return;
    }
    
    isUpdating = true;
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

    for (const name of BUNDLES_TO_SYNC) {
      try {
        // Baixa a versão mais recente do CDN do Supabase. Usando 'no-cache' para garantir
        // que vamos buscar a versão fresca, ignorando o cache do navegador.
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/offline-bundles/${name}.json`, { 
          cache: 'no-cache' 
        });

        if (res.ok) {
          const data = await res.json();
          // Salva no IndexedDB. O fetchBundle() em offlineBundle.ts lê daqui primeiro!
          // Assim que atualizado, a interface passa a usar esses dados instantaneamente.
          await saveOfflinePackage(name, name, data);
        }
      } catch (err) {
        // Falhas silenciosas para não incomodar o usuário no background
        console.warn(`[BundleUpdater] Falha ao atualizar bundle silenciosamente: ${name}`);
      }
      
      // Pequeno delay entre downloads para não engasgar o app
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (err) {
    console.warn(`[BundleUpdater] Erro geral:`, err);
  } finally {
    isUpdating = false;
  }
}
