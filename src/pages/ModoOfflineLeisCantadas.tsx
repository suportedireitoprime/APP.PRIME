import { useCallback } from 'react';
import { Music } from 'lucide-react';
import AudioOfflinePage from '@/components/offline/AudioOfflinePage';
import type { ItemAudio } from '@/components/offline/ItemDownloadRow';
import { fetchTodasLeisCantadas } from '@/lib/leisCantadasApi';

export default function ModoOfflineLeisCantadas() {
  const carregar = useCallback(async (): Promise<ItemAudio[]> => {
    const faixas = await fetchTodasLeisCantadas();
    return faixas
      .filter(f => Boolean(f.audio_url))
      .map(f => ({
        id: f.id,
        titulo: f.titulo || `Art. ${f.numero_artigo}`,
        subtitulo: f.lei_nome ?? undefined,
        url: f.audio_url,
      }));
  }, []);

  return (
    <AudioOfflinePage
      titulo="Leis cantadas offline"
      subtitulo="Baixe as faixas para ouvir sem internet"
      icon={Music}
      categoria="leis-cantadas"
      rotulo="faixas"
      carregar={carregar}
    />
  );
}
