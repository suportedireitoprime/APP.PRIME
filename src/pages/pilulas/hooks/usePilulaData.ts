import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { directImg } from '@/lib/cdnImg';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';

export function usePilulaData(id: string | undefined, globalLivro: LivroNormalizado | undefined, tocar: (livro: LivroNormalizado) => void) {
  const [loading, setLoading] = useState(true);
  const [livroVisual, setLivroVisual] = useState<LivroNormalizado | null>(null);

  useEffect(() => {
    async function fetchPilula() {
      if (!id) return;
      
      try {
        const cacheKey = `pilula_data_v2_${id}`;
        const cached = await get(cacheKey);
        
        let normalizado: LivroNormalizado | null = cached || null;

        if (!normalizado) {
          const searchParams = new URLSearchParams(window.location.search);
          const type = searchParams.get('type');

          if (type === 'cp') {
             const { data, error } = await supabase
              .from('vade_mecum_artigos')
              .select('id, numero, texto, audio_pilula_url, audio_transcricao, audio_grafo')
              .eq('id', id)
              .single();
              
             if (error) throw error;
             
             normalizado = {
                id: data.id,
                titulo: `Artigo ${data.numero}`,
                autor: 'Código Penal',
                capa: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_square.jpg'),
                audioResumoUrl: data.audio_pilula_url,
                analiseDetalhada: data.texto,
                sobre: data.texto,
                numero: data.numero,
                audio_grafo: data.audio_grafo,
                transcricaoAudio: data.audio_transcricao,
                isCP: true
             } as any;
          } else {
            const classicosCol = COLECOES.find((c) => c.id === 'classicos');
            if (classicosCol) {
              const { data, error } = await supabase
                .from(classicosCol.table as any)
                .select(classicosCol.select)
                .eq('id', id)
                .single();

              if (!error && data) {
                normalizado = normalizeLivro(data, classicosCol);
              }
            }
          }
        }

        if (normalizado) {
          if (normalizado.audioResumoUrl) {
            await set(cacheKey, normalizado);
          }
          setLivroVisual(normalizado);
          
          if (!normalizado.audioResumoUrl) {
             toast.error('O áudio desta pílula ainda não está disponível.');
          } else {
             // Inicia a reprodução no contexto global
             if (globalLivro?.id !== normalizado.id) {
               tocar(normalizado);
             }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar pílula:', error);
      } finally {
        setLoading(false);
      }
    }
    
    // Como a dependência 'tocar' e 'globalLivro' não alteram o fetch da pílula, vamos engatilhar apenas quando ID mudar.
    // Usaremos ref para a função tocar
    fetchPilula();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { loading, livroVisual };
}
