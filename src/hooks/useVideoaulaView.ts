import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCatalogo } from '@/lib/videoaulasCatalogos';
import { getCachedAula } from '@/lib/videoaulasStore';
import {
  getCachedVideoaulaBundle,
  setCachedVideoaulaBundle,
  prefetchProximasAulas,
} from '@/lib/videoaulaPrefetch';
import { preaquecerYoutubeApi } from '@/hooks/useYoutubePlayer';
import { toast } from 'sonner';
import { Aula } from '@/types/videoaula';

interface UseVideoaulaViewProps {
  catalogoId: string | undefined;
  videoId: string | undefined;
  userId: string | null;
  setTocandoState: (v: boolean) => void;
}

export function useVideoaulaView({ catalogoId, videoId, userId, setTocandoState }: UseVideoaulaViewProps) {
  const catalogo = getCatalogo(catalogoId);

  const cachedBundle = catalogo && videoId ? getCachedVideoaulaBundle(catalogo.tabela, videoId) : undefined;
  
  const [aula, setAula] = useState<Aula | null>(() =>
    cachedBundle?.aula ?? (catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null),
  );
  const [aulasDaArea, setAulasDaArea] = useState<Aula[]>([]);
  const [favorito, setFavorito] = useState(() => cachedBundle?.favorito ?? false);
  const [concluida, setConcluida] = useState(() => cachedBundle?.progresso?.concluida ?? false);
  const [carregado, setCarregado] = useState(() => !!cachedBundle?.aula);
  
  const [inicio, setInicio] = useState(() => cachedBundle?.progresso?.tempo_atual ?? 0);
  const [showResumePrompt, setShowResumePrompt] = useState<{ show: boolean; tempo: number }>({ show: false, tempo: 0 });

  useEffect(() => {
    if (!catalogo || !videoId) return;
    let alive = true;

    const bundle = getCachedVideoaulaBundle(catalogo.tabela, videoId);
    if (bundle?.aula) {
      setAula(bundle.aula);
      setFavorito(!!bundle.favorito);
      if (bundle.progresso) {
        setConcluida(!!bundle.progresso.concluida);
        setInicio(bundle.progresso.tempo_atual || 0);
      }
      setCarregado(true);
    } else {
      setAula(getCachedAula(catalogo.id, videoId) as Aula | null);
    }

    setShowResumePrompt({ show: false, tempo: 0 });
    preaquecerYoutubeApi();

    const carregarDados = async () => {
      try {
        const cols = `id, video_id, titulo, descricao, sobre_aula, duracao_segundos, ${catalogo.thumbCol}${
          catalogo.temAreas ? ', area' : ''
        }`;

        const [aulaRes, progRes, favRes] = await Promise.all([
          supabase.from(catalogo.tabela as any).select(cols).eq('video_id', videoId).maybeSingle(),
          userId
            ? supabase
                .from('videoaulas_progresso')
                .select('tempo_atual, concluida')
                .eq('user_id', userId)
                .eq('tabela', catalogo.tabela)
                .eq('video_id', videoId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          userId
            ? supabase
                .from('videoaulas_favoritos')
                .select('id')
                .eq('user_id', userId)
                .eq('tabela', catalogo.tabela)
                .eq('video_id', videoId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (aulaRes.error) throw aulaRes.error;
        if (progRes.error) throw progRes.error;
        if (favRes.error) throw favRes.error;

        if (!alive) return;
        
        const aulaData = aulaRes.data as Aula | null;
        if (aulaData) {
          setAula(aulaData);
          setCachedVideoaulaBundle(catalogo.tabela, videoId, {
            aula: aulaData,
            progresso: progRes?.data
              ? {
                  tempo_atual: Number(progRes.data.tempo_atual) || 0,
                  concluida: !!progRes.data.concluida,
                }
              : null,
            favorito: !!favRes?.data,
          });
        }
        setCarregado(true);
        
        const prog = progRes?.data;
        if (prog) {
          const t = Number(prog.tempo_atual) || 0;
          setConcluida(!!prog.concluida);
          if (t > 15 && !prog.concluida) {
            setTocandoState(false);
            setShowResumePrompt({ show: true, tempo: t });
          } else {
            setInicio(t);
          }
        }
        
        setFavorito(!!favRes?.data);

        let qArea = supabase.from(catalogo.tabela as any).select(cols);
        if (catalogo.temAreas && aulaData?.area) {
          qArea = qArea.eq('area', aulaData.area);
        }
        
        const areaRes = await qArea.limit(60);
        if (areaRes.error) throw areaRes.error;
        
        if (alive && areaRes.data) {
          const listaArea = areaRes.data as Aula[];
          setAulasDaArea(listaArea);
          // Pré-carrega metadados e capas das próximas aulas da trilha
          prefetchProximasAulas(listaArea, videoId, catalogo, userId, 3);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da aula:", error);
        toast.error("Ocorreu um erro ao carregar os dados da aula. Tente novamente.");
      }
    };

    void carregarDados();

    return () => {
      alive = false;
    };
  }, [catalogo, videoId, userId, setTocandoState]);

  // Sempre que a lista de aulas da área estiver disponível, garante o prefetch das próximas
  useEffect(() => {
    if (!aulasDaArea.length || !videoId || !catalogo) return;
    prefetchProximasAulas(aulasDaArea, videoId, catalogo, userId, 2);
  }, [aulasDaArea, videoId, catalogo, userId]);

  return {
    catalogo,
    aula,
    setAula,
    aulasDaArea,
    favorito,
    setFavorito,
    concluida,
    setConcluida,
    carregado,
    inicio,
    setInicio,
    showResumePrompt,
    setShowResumePrompt
  };
}
