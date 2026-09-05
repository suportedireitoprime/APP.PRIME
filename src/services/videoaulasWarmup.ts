/**
 * Serviço de pré-aquecimento do Cache de Videoaulas.
 * Garante que catálogos, progresso e status de aulas estejam quentes em memória
 * e persistidos em IndexedDB antes do usuário clicar na aba.
 */
import { hydrateVideoaulasCache, warmVideoaulasCache } from '@/lib/videoaulasStore';
import { carregarResumoVideoaulas } from '@/lib/videoaulasResumo';

let videoaulasWarmed = false;

export function warmVideoaulasStartup(): void {
  if (videoaulasWarmed || typeof window === 'undefined') return;
  videoaulasWarmed = true;

  try {
    // 1) Hidrata do IndexedDB para a memória imediatamente
    hydrateVideoaulasCache();

    // 2) Dispara o aquecimento do catálogo e progresso
    warmVideoaulasCache();

    // 3) Carrega e agrega o resumo em idle para preencher resumoVideoaulasSincrono()
    const ric = (window as any).requestIdleCallback;
    if (ric) {
      ric(() => void carregarResumoVideoaulas().catch(() => {}), { timeout: 2500 });
    } else {
      setTimeout(() => void carregarResumoVideoaulas().catch(() => {}), 1000);
    }
  } catch {
    /* falha silenciosa em warmup */
  }
}
