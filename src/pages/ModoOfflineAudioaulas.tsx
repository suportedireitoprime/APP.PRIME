import { useCallback } from 'react';
import { Headphones } from 'lucide-react';
import AudioOfflinePage from '@/components/offline/AudioOfflinePage';
import type { ItemAudio } from '@/components/offline/ItemDownloadRow';
import { supabase } from '@/integrations/supabase/client';
import { safeStorageUrl } from '@/lib/cdnImg';

export default function ModoOfflineAudioaulas() {
  const carregar = useCallback(async (): Promise<ItemAudio[]> => {
    const todasAulas: any[] = [];
    const batchSize = 1000;
    for (let from = 0; ; from += batchSize) {
      const { data, error } = await supabase
        .from('audioaulas_acervo')
        .select('id, area, tema, titulo, url_audio, sequencia')
        .order('area', { ascending: true })
        .order('sequencia', { ascending: true })
        .range(from, from + batchSize - 1);
      if (error) break;
      if (data && data.length > 0) {
        todasAulas.push(...data);
      }
      if (!data || data.length < batchSize) break;
    }
    return todasAulas
      .filter((a: any) => a.url_audio)
      .map((a: any) => ({
        id: `audioaula-${a.id}`,
        titulo: a.titulo,
        subtitulo: a.tema || a.area,
        url: (safeStorageUrl(a.url_audio) || a.url_audio) as string,
      }));
  }, []);

  return (
    <AudioOfflinePage
      titulo="Audioaulas offline"
      subtitulo="Escolha as aulas para baixar"
      icon={Headphones}
      categoria="audioaulas"
      rotulo="aulas"
      carregar={carregar}
    />
  );
}
