import { lazy, type ComponentType } from 'react';

const RECOVERY_KEY = 'prime_chunk_recovery';

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|Failed to load module script/i.test(message);
}

// One fresh navigation per minute, shared by lazy imports and the boundary.
// Never unregister push workers or clear the user's offline media/session.
export function recoverChunkLoad(): boolean {
  if (typeof window === 'undefined' || !navigator.onLine) return false;
  try {
    const previous = Number(sessionStorage.getItem(RECOVERY_KEY) || '0');
    if (Date.now() - previous < 60_000) return false;
    sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
    sessionStorage.removeItem('chunk_reload');
  } catch {
    // Without storage there is no safe way to prevent a reload loop.
    return false;
  }
  const url = new URL(window.location.href);
  url.searchParams.set('v', Date.now().toString());
  window.location.replace(url.toString());
  return true;
}

export const retryImport = async <T>(
  promiseFactory: () => Promise<T>,
  retriesLeft: number = 3,
  interval: number = 1000
): Promise<T> => {
  try {
    return await promiseFactory();
  } catch (error: unknown) {
    // Retry temporary fetch failures before interrupting the current page.
    // Syntax/runtime errors are not network failures and must remain visible.
    if (!isChunkLoadError(error)) throw error;
    if (retriesLeft <= 1) {
      if (recoverChunkLoad()) return new Promise<T>(() => {});
      throw error;
    }

    // Espera e tenta novamente
    await new Promise(resolve => setTimeout(resolve, interval));
    return retryImport(promiseFactory, retriesLeft - 1, interval);
  }
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
  interval: number = 1000
): React.LazyExoticComponent<T> => {
  return lazy(() => retryImport(componentImport, retries, interval));
};
