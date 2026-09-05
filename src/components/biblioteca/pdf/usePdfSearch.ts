import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Match } from './pdfReaderTypes';

export function usePdfSearch(pdfRef: React.MutableRefObject<any>) {
  const [showBusca, setShowBusca] = useState(false);
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);

  const buscar = useCallback(async (q: string) => {
    const alvo = q.trim();
    if (alvo.length < 2 || !pdfRef.current) {
      setMatches(null);
      return;
    }
    setBuscando(true);
    try {
      const pdf = pdfRef.current;
      const alvoNormalized = alvo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const achados: Match[] = [];

      const fetchPageText = async (i: number) => {
        let pageObj: any = null;
        try {
          pageObj = await pdf.getPage(i);
          const content = await pageObj.getTextContent();
          const texto = content.items.map((it: any) => it.str).join(' ').replace(/\s+/g, ' ');
          const textoNormalized = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const pos = textoNormalized.indexOf(alvoNormalized);
          if (pos >= 0) {
            return {
              pagina: i,
              trecho: texto.slice(Math.max(0, pos - 50), pos + alvo.length + 60).trim(),
            };
          }
        } catch {
        } finally {
          if (pageObj) {
            try {
              pageObj.cleanup();
            } catch {}
          }
        }
        return null;
      };

      const promises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        promises.push(fetchPageText(i));
      }

      const chunkSize = 20;
      for (let i = 0; i < promises.length; i += chunkSize) {
        const chunk = await Promise.all(promises.slice(i, i + chunkSize));
        chunk.forEach((res) => {
          if (res && achados.length < 80) achados.push(res);
        });
        if (achados.length >= 80) break;
      }

      achados.sort((a, b) => a.pagina - b.pagina);
      setMatches(achados);
      if (!achados.length) toast.info('Nenhuma ocorrência encontrada');
    } finally {
      setBuscando(false);
    }
  }, [pdfRef]);

  const resetBusca = useCallback(() => {
    setShowBusca(false);
    setTermo('');
    setMatches(null);
    setBuscando(false);
  }, []);

  return {
    showBusca,
    setShowBusca,
    termo,
    setTermo,
    buscando,
    matches,
    buscar,
    resetBusca,
  };
}
