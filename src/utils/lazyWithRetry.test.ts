import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, retryImport } from './lazyWithRetry';

beforeEach(() => {
  sessionStorage.clear();
  // Keep exhausted-import tests on this document rather than navigating jsdom.
  sessionStorage.setItem('prime_chunk_recovery', String(Date.now()));
});

describe('lazy import recovery', () => {
  it('retries a failed page fetch and returns the recovered module', async () => {
    const module = { default: () => null };
    const load = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module: IndexMobile.tsx'))
      .mockResolvedValue(module);
    expect(await retryImport(load, 3, 0)).toBe(module);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('stops after three fetch attempts instead of looping forever', async () => {
    const error = new TypeError('Importing a module script failed');
    const load = vi.fn().mockRejectedValue(error);
    await expect(retryImport(load, 3, 0)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('does not retry a runtime error in a page', async () => {
    const error = new ReferenceError('missingVariable is not defined');
    const load = vi.fn().mockRejectedValue(error);
    await expect(retryImport(load, 3, 0)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('recognizes browser chunk errors but not ordinary API failures', () => {
    expect(isChunkLoadError(new Error('Loading chunk 15 failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Failed to fetch'))).toBe(false);
  });
});