import { useCallback, useEffect, useState } from 'react';
import {
  listarAudiosOffline,
  assinarAudioOffline,
  type AudioOffline,
} from '@/lib/nativo/audioOffline';
import { listCachedPdfs } from '@/services/bibliotecaPdfCache';
import { estimateAudiosSize } from '@/services/audioDownloadService';
import { listDownloadedPackages } from '@/services/downloadManager';

export interface ResumoCategoria {
  count: number;
  bytes: number;
}

export interface DownloadsOffline {
  audioaulas: ResumoCategoria;
  leisCantadas: ResumoCategoria;
  apresentacoes: ResumoCategoria;
  narracoes: ResumoCategoria;
  livros: ResumoCategoria;
  pacotes: ResumoCategoria;
  carregando: boolean;
  recarregar: () => void;
}

const vazio: ResumoCategoria = { count: 0, bytes: 0 };

function agrupar(itens: AudioOffline[], categoria: AudioOffline['categoria']): ResumoCategoria {
  const filtrados = itens.filter(i => i.categoria === categoria);
  return {
    count: filtrados.length,
    bytes: filtrados.reduce((s, i) => s + (i.bytes || 0), 0),
  };
}

/** Agrega o que está baixado no aparelho, por categoria. */
export function useDownloadsOffline(): DownloadsOffline {
  const [estado, setEstado] = useState({
    audioaulas: vazio,
    leisCantadas: vazio,
    apresentacoes: vazio,
    narracoes: vazio,
    livros: vazio,
    pacotes: vazio,
  });
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(() => {
    void (async () => {
      const audios: AudioOffline[] = await listarAudiosOffline().catch(() => []);
      const pdfs: { size: number }[] = await listCachedPdfs().catch(() => []);
      const narr: { count: number; bytes: number } = await estimateAudiosSize().catch(() => ({ count: 0, bytes: 0 }));
      const pkgs = await listDownloadedPackages().catch(() => []);
      
      setEstado({
        audioaulas: agrupar(audios, 'audioaulas'),
        leisCantadas: agrupar(audios, 'leis-cantadas'),
        apresentacoes: agrupar(audios, 'outro'),
        narracoes: {
          count: narr.count + agrupar(audios, 'narracao').count,
          bytes: narr.bytes + agrupar(audios, 'narracao').bytes,
        },
        livros: {
          count: pdfs.length,
          bytes: pdfs.reduce((s: number, p) => s + (p.size || 0), 0),
        },
        pacotes: {
          count: pkgs.length,
          bytes: pkgs.reduce((s: number, p) => s + (p.sizeBytes || 0), 0),
        },
      });
      setCarregando(false);
    })();
  }, []);

  useEffect(() => {
    recarregar();
    return assinarAudioOffline(recarregar);
  }, [recarregar]);

  return { ...estado, carregando, recarregar };
}
