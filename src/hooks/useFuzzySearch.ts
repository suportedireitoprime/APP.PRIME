import { useMemo } from 'react';
import MiniSearch from 'minisearch';

interface FuzzySearchOptions<T> {
  keys: (keyof T | string)[];
  threshold?: number;
  limit?: number;
}

const normalizeStr = (str: any): string => {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export function useFuzzySearch<T>(items: T[], query: string, options: FuzzySearchOptions<T>) {
  const keysKey = options.keys.join(',');
  
  const miniSearchData = useMemo(() => {
    const searcher = new MiniSearch({
      fields: options.keys as string[],
      storeFields: [],
      idField: 'id',
      extractField: (doc: any, fieldName: string) => {
        let value: any = doc;
        const path = fieldName.split('.');
        for (const key of path) {
          value = value?.[key];
        }
        // Retorna o ID bruto para evitar que normalizeStr converta números em string vazia
        if (fieldName === 'id') {
          return value;
        }
        if (Array.isArray(value)) {
          return value.map(v => normalizeStr(v)).join(' ');
        }
        return normalizeStr(value);
      },
      searchOptions: {
        fuzzy: options.threshold ?? 0.2,
        prefix: true,
      }
    });

    const itemsWithId = items.map((item, idx) => ({ ...item, id: idx }));
    searcher.addAll(itemsWithId);
    return { searcher, itemsWithId };
  }, [items, keysKey, options.threshold]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return items;
    const normalizedQuery = normalizeStr(query);
    const searchResults = miniSearchData.searcher.search(normalizedQuery, { combineWith: 'AND' });
    const limit = options.limit ?? 50;
    const limited = searchResults.slice(0, limit);
    return limited.map(r => miniSearchData.itemsWithId[r.id]);
  }, [miniSearchData, query, items, options.limit]);

  return results as T[];
}
