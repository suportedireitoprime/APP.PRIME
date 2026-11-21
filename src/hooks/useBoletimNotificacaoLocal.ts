import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { agendarBoletimProntoLocal } from '@/lib/nativo/notificacaoLocalManager';
import radarLeisLocal from '@/assets/radares/radar-leis.webp';

/**
 * Hook global que monitora os boletins diários de notícias.
 * Assim que um novo boletim fica pronto (ou ao abrir o app),
 * agenda automaticamente a notificação local para disparar no chip
 * do celular exatamente 10 minutos após a sua conclusão.
 */
export function useBoletimNotificacaoLocal() {
  useEffect(() => {
    let ativo = true;

    // 1. Checagem inicial do boletim de hoje
    const checarUltimoBoletim = async () => {
      try {
        const { data, error } = await supabase
          .from('boletins_juridicos')
          .select('id, titulo, subtitulo, created_at, status, roteiro_json')
          .in('status', ['pronto', 'sem_audio'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data || !ativo) return;

        // Extrai a imagem da primeira cena da notícia ou fallback do radar
        let capaUrl: string | undefined = undefined;
        if (Array.isArray(data.roteiro_json)) {
          const cenaComImg = data.roteiro_json.find(
            (s: any) => s.kind !== 'intro' && s.imagem_url && !s.imagem_url.includes('00-slide.jpg')
          );
          capaUrl = cenaComImg?.imagem_url || data.roteiro_json[0]?.imagem_url;
        }

        await agendarBoletimProntoLocal({
          id: data.id,
          titulo: data.titulo || 'Boletim de Notícias Jurídicas',
          subtitulo: data.subtitulo,
          createdAt: data.created_at,
          capaUrl: capaUrl || radarLeisLocal,
          delayMinutos: 10,
        });
      } catch (err) {
        console.warn('[useBoletimNotificacaoLocal] Erro ao sincronizar boletim:', err);
      }
    };

    void checarUltimoBoletim();

    // 2. Realtime Listener: escuta novas publicações no Supabase
    const canal = supabase
      .channel('notif-local-boletim-stream')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boletins_juridicos',
        },
        (payload) => {
          const novo = payload.new as any;
          if (novo && (novo.status === 'pronto' || novo.status === 'sem_audio')) {
            let capaUrl: string | undefined = undefined;
            if (Array.isArray(novo.roteiro_json)) {
              const cena = novo.roteiro_json.find(
                (s: any) => s.kind !== 'intro' && s.imagem_url && !s.imagem_url.includes('00-slide.jpg')
              );
              capaUrl = cena?.imagem_url || novo.roteiro_json[0]?.imagem_url;
            }

            void agendarBoletimProntoLocal({
              id: novo.id,
              titulo: novo.titulo || 'Boletim de Notícias Jurídicas',
              subtitulo: novo.subtitulo,
              createdAt: novo.created_at || new Date().toISOString(),
              capaUrl: capaUrl || radarLeisLocal,
              delayMinutos: 10,
            });
          }
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
    };
  }, []);
}
