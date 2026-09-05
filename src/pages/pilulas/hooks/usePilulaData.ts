import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { directImg } from '@/lib/cdnImg';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';

interface LawCodeConfig {
  autor: string;
  capa: string;
  isCP?: boolean;
}

const LAW_CODES_META: Record<string, LawCodeConfig> = {
  cp: {
    autor: 'Código Penal',
    capa: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_square.jpg'),
    isCP: true,
  },
  cf: {
    autor: 'Constituição Federal',
    capa: '/pilulas/cf_square.jpg',
    isCP: false,
  },
  cc: {
    autor: 'Código Civil',
    capa: '/pilulas/cc_square.png',
    isCP: false,
  },
  cpp: {
    autor: 'Código de Processo Penal',
    capa: '/pilulas/cpp_portrait.jpg',
    isCP: false,
  },
  clt: {
    autor: 'Consolidação das Leis do Trabalho',
    capa: '/pilulas/clt_portrait.jpg',
    isCP: false,
  },
};

export function usePilulaData(
  id: string | undefined,
  globalLivro: LivroNormalizado | undefined,
  tocar: (livro: LivroNormalizado) => void
) {
  const [loading, setLoading] = useState(true);
  const [livroVisual, setLivroVisual] = useState<LivroNormalizado | null>(null);
  const tocarRef = useRef(tocar);
  tocarRef.current = tocar;
  const globalLivroRef = useRef(globalLivro);
  globalLivroRef.current = globalLivro;

  useEffect(() => {
    let isMounted = true;

    async function fetchPilula() {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const cacheKey = `pilula_data_v3_${id}`;
        const cached = await get<LivroNormalizado>(cacheKey);

        let normalizado: LivroNormalizado | null = cached || null;

        if (!normalizado) {
          const searchParams = new URLSearchParams(window.location.search);
          const type = searchParams.get('type')?.toLowerCase();

          const isLawCode = type && LAW_CODES_META[type];

          if (isLawCode) {
            const meta = LAW_CODES_META[type!];
            const { data, error } = await supabase
              .from('vade_mecum_artigos')
              .select('id, numero, texto, audio_pilula_url, audio_transcricao, audio_grafo')
              .eq('id', id)
              .single();

            if (error) throw error;

            if (data) {
              normalizado = {
                id: data.id,
                titulo: `Artigo ${data.numero}`,
                autor: meta.autor,
                capa: meta.capa,
                audioResumoUrl: data.audio_pilula_url,
                analiseDetalhada: data.texto,
                sobre: data.texto,
                numero: data.numero,
                audio_grafo: data.audio_grafo,
                transcricaoAudio: data.audio_transcricao,
                isCP: meta.isCP ?? false,
              };
            }
          } else {
            // Primeiro busca na coleção de clássicos
            const classicosCol = COLECOES.find((c) => c.id === 'classicos');
            if (classicosCol) {
              const { data, error } = await supabase
                .from(classicosCol.table as any)
                .select(classicosCol.select)
                .eq('id', id)
                .maybeSingle();

              if (!error && data) {
                normalizado = normalizeLivro(data, classicosCol);
              }
            }

            // Fallback: se não estiver em clássicos, verifica em vade_mecum_artigos
            if (!normalizado) {
              const { data: artData } = await supabase
                .from('vade_mecum_artigos')
                .select('id, numero, texto, audio_pilula_url, audio_transcricao, audio_grafo')
                .eq('id', id)
                .maybeSingle();

              if (artData) {
                normalizado = {
                  id: artData.id,
                  titulo: `Artigo ${artData.numero}`,
                  autor: 'Vade Mecum',
                  capa: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_square.jpg'),
                  audioResumoUrl: artData.audio_pilula_url,
                  analiseDetalhada: artData.texto,
                  sobre: artData.texto,
                  numero: artData.numero,
                  audio_grafo: artData.audio_grafo,
                  transcricaoAudio: artData.audio_transcricao,
                  isCP: false,
                };
              }
            }
          }
        }

        if (!isMounted) return;

        if (normalizado) {
          if (normalizado.audioResumoUrl) {
            await set(cacheKey, normalizado);
          }
          setLivroVisual(normalizado);

          if (!normalizado.audioResumoUrl) {
            toast.error('O áudio desta pílula ainda não está disponível.');
          } else {
            if (globalLivroRef.current?.id !== normalizado.id) {
              tocarRef.current(normalizado);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar pílula:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPilula();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { loading, livroVisual };
}
