import { useMemo } from 'react';
import Fuse from 'fuse.js';

interface FuzzySearchOptions<T> {
  keys: (keyof T | string)[];
  threshold?: number;
  limit?: number;
}

const normalizeStr = (str: any): string => {
  if (typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export function useFuzzySearch<T>(items: T[], query: string, options: FuzzySearchOptions<T>) {
  const keysKey = options.keys.join(',');
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: options.keys as string[],
      threshold: options.threshold ?? 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      getFn: (obj, path) => {
        // Fallback para getFn padrão se path for complexo (mas funciona pra strings rasas)
        let value: any = obj;
        if (typeof path === 'string') {
          value = (obj as any)[path];
        } else if (Array.isArray(path)) {
          for (const key of path) {
            value = value?.[key];
          }
        }
        
        if (Array.isArray(value)) {
          return value.map(v => normalizeStr(v));
        }
        return normalizeStr(value);
      }
    });
  }, [items, keysKey, options.threshold]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return items;
    const normalizedQuery = normalizeStr(query);
    const fuseResults = fuse.search(normalizedQuery, { limit: options.limit ?? 50 });
    return fuseResults.map(r => r.item);
  }, [fuse, query, items, options.limit]);

  return results;
}
