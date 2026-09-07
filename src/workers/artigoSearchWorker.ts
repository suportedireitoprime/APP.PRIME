// Web Worker para indexação e filtragem de artigos em leis extensas (> 1.000 artigos) - Item 37

interface IndexedArtigo {
  id: string;
  numero: string;
  cleanNum: string;
  cleanText: string;
}

let indexedArtigos: IndexedArtigo[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};

  if (type === 'INDEX') {
    const rawArtigos: Array<{ id: string; numero: string; caput?: string; paragrafos?: string[]; incisos?: string[] }> = payload?.artigos || [];
    indexedArtigos = rawArtigos.map((a) => {
      const cleanNum = (a.numero || '').replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim().toLowerCase();
      const allText = [a.caput || '', ...(a.paragrafos || []), ...(a.incisos || [])].join(' ').toLowerCase();
      return {
        id: String(a.id),
        numero: a.numero,
        cleanNum,
        cleanText: allText,
      };
    });
    self.postMessage({ type: 'INDEX_COMPLETE', count: indexedArtigos.length });
    return;
  }

  if (type === 'SEARCH') {
    const { query, queryId } = payload || {};
    const raw = String(query || '').trim().toLowerCase();
    if (!raw) {
      self.postMessage({ type: 'SEARCH_RESULT', queryId, matchingIds: null });
      return;
    }

    const qDigits = raw.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '');
    if (qDigits) {
      const exact = indexedArtigos.filter((a) => a.cleanNum === qDigits);
      if (exact.length > 0) {
        self.postMessage({ type: 'SEARCH_RESULT', queryId, matchingIds: exact.map((a) => a.id) });
        return;
      }
      const prefix = indexedArtigos.filter((a) => a.cleanNum.startsWith(qDigits));
      if (prefix.length > 0) {
        self.postMessage({ type: 'SEARCH_RESULT', queryId, matchingIds: prefix.map((a) => a.id) });
        return;
      }
    }

    // Busca textual full-text
    const matching = indexedArtigos.filter(
      (a) => a.cleanText.includes(raw) || a.cleanNum.includes(raw)
    );
    self.postMessage({ type: 'SEARCH_RESULT', queryId, matchingIds: matching.map((a) => a.id) });
  }
};
