import { useCallback } from 'react';
import { Headphones } from 'lucide-react';
import AudioOfflinePage from '@/components/offline/AudioOfflinePage';
import type { ItemAudio } from '@/components/offline/ItemDownloadRow';
import { supabase } from '@/integrations/supabase/client';

export default function ModoOfflineAudioaulas() {
  const carregar = useCallback(async (): Promise<ItemAudio[]> => {
    const { data } = await supabase
      .from('audioaulas_acervo')
      .select('id, area, tema, titulo, url_audio, sequencia')
      .order('area', { ascending: true })
      .order('sequencia', { ascending: true });
    return (data ?? [])
      .filter((a: any) => a.url_audio)
      .map((a: any) => ({
        id: `audioaula-${a.id}`,
        titulo: a.titulo,
        subtitulo: a.tema || a.area,
        url: a.url_audio as string,
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
