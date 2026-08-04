import { useCallback } from 'react';
import { Presentation } from 'lucide-react';
import AudioOfflinePage from '@/components/offline/AudioOfflinePage';
import type { ItemAudio } from '@/components/offline/ItemDownloadRow';
import { supabase } from '@/integrations/supabase/client';

export default function ModoOfflineApresentacoes() {
  const carregar = useCallback(async (): Promise<ItemAudio[]> => {
    const { data: aprs } = await supabase
      .from('apresentacoes_narradas')
      .select('id, titulo')
      .eq('publicada', true)
      .order('created_at', { ascending: false })
      .limit(200);

    const lista = aprs ?? [];
    if (lista.length === 0) return [];

    const { data: slides } = await supabase
      .from('apresentacao_slides')
      .select('apresentacao_id, slide_index, audio_url')
      .in('apresentacao_id', lista.map((a: any) => a.id))
      .order('slide_index');

    const itens: ItemAudio[] = [];
    for (const s of (slides ?? []) as any[]) {
      if (!s.audio_url) continue;
      const apr = lista.find((a: any) => a.id === s.apresentacao_id) as any;
      itens.push({
        id: `apresentacao-${s.apresentacao_id}-${s.slide_index}`,
        titulo: `${apr?.titulo ?? 'Apresentação'} — slide ${s.slide_index + 1}`,
        subtitulo: 'Apresentação narrada',
        url: s.audio_url as string,
      });
    }
    return itens;
  }, []);

  return (
    <AudioOfflinePage
      titulo="Apresentações offline"
      subtitulo="Baixe o áudio dos slides"
      icon={Presentation}
      categoria="outro"
      rotulo="áudios"
      carregar={carregar}
    />
  );
}
