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
        const roteiroArr = Array.isArray(data.roteiro_json) ? (data.roteiro_json as any[]) : null;
        if (roteiroArr && roteiroArr.length > 0) {
          const cenaComImg = roteiroArr.find(
            (s: any) => s && s.kind !== 'intro' && s.imagem_url && typeof s.imagem_url === 'string' && !s.imagem_url.includes('00-slide.jpg')
          );
          capaUrl = cenaComImg?.imagem_url || roteiroArr[0]?.imagem_url;
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

    return () => {
      ativo = false;
    };
  }, []);
}
