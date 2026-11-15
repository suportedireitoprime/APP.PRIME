import { useCallback } from 'react';
import { Headphones } from 'lucide-react';
import AudioOfflinePage from '@/components/offline/AudioOfflinePage';
import type { ItemAudio } from '@/components/offline/ItemDownloadRow';
import { supabase } from '@/integrations/supabase/client';
import { safeStorageUrl } from '@/lib/cdnImg';
import { get as idbGet } from 'idb-keyval';
import { AUDIOAULAS_CACHE_KEY } from '@/contexts/AudioaulasPlayerContext';

export default function ModoOfflineAudioaulas() {
  const carregar = useCallback(async (): Promise<ItemAudio[]> => {
    try {
      const cached = await idbGet<any[]>(AUDIOAULAS_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached
          .filter((a: any) => a.url_audio)
          .map((a: any) => ({
            id: `audioaula-${a.id}`,
            titulo: a.titulo,
            subtitulo: a.tema || a.area,
            url: (safeStorageUrl(a.url_audio) || a.url_audio) as string,
          }));
      }
    } catch {
      /* ignore idb error */
    }

    const todasAulas: any[] = [];
    const batchSize = 1000;
    for (let from = 0; ; from += batchSize) {
      const { data, error } = await supabase
        .from('audioaulas_acervo')
        .select('id, area, tema, titulo, url_audio, sequencia')
        .order('id', { ascending: true })
        .range(from, from + batchSize - 1);
      if (error) break;
      if (data && data.length > 0) {
        todasAulas.push(...data);
      }
      if (!data || data.length < batchSize) break;
    }
    todasAulas.sort((a, b) => {
      const comp = (a.area || '').localeCompare(b.area || '', 'pt-BR');
      if (comp !== 0) return comp;
      return (a.sequencia ?? 0) - (b.sequencia ?? 0);
    });
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
