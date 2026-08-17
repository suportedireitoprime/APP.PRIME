import { Capacitor } from '@capacitor/core';

/**
 * Recebe conteúdo compartilhado com o Direito Prime por outros apps (Android SEND).
 * Requer o plugin `send-intent` + intent-filter no AndroidManifest.
 *
 * Uso: chamar `initSharedIntentListener(navigate)` no root do app.
 * Ao receber um SEND, navega para `/compartilhado?texto=...`.
 */

type NavigateFn = (path: string) => void;

let started = false;

function isSendIntentPayload(v: unknown): v is { title?: string; description?: string; url?: string; type?: string } {
  return typeof v === 'object' && v !== null;
}

async function readCurrentIntent(): Promise<{ title?: string; description?: string; url?: string } | null> {
  // Plugin `send-intent` (v7) foi removido por incompatibilidade com Capacitor 8.
  // Retorna nulo até que uma alternativa seja implementada.
  return null;
}

function buildTarget(payload: { title?: string; description?: string; url?: string }): string {
  // A prioridade é o texto compartilhado; URL entra como referência.
  const text = payload.description || payload.title || '';
  // URL pode ser um content:// (PDF/imagem compartilhada) — vai codificada
  // para a tela decidir entre texto e arquivo.
  const url = payload.url ? decodeURIComponent(payload.url) : '';
  const params = new URLSearchParams();
  if (text) params.set('texto', text);
  if (url) params.set('url', url);
  return `/compartilhado${params.toString() ? `?${params.toString()}` : ''}`;
}

export async function initSharedIntentListener(navigate: NavigateFn): Promise<void> {
  if (!Capacitor.isNativePlatform() || started) return;
  started = true;

  // 1) Intenção inicial (app aberto pelo compartilhar)
  const initial = await readCurrentIntent();
  if (initial && (initial.description || initial.title || initial.url)) {
    setTimeout(() => navigate(buildTarget(initial)), 50);
  }

  // 2) Escuta novos SENDs enquanto o app está vivo
  try {
    const { App: CapacitorApp } = await import('@capacitor/app');
    CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      const payload = await readCurrentIntent();
      if (payload && (payload.description || payload.title || payload.url)) {
        navigate(buildTarget(payload));
      }
    });
  } catch (e) {
    console.warn('[sharedIntent] listener falhou', e);
  }
}
