import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCatalogo } from '@/lib/videoaulasCatalogos';
import { getCachedAula, invalidarFavoritos } from '@/lib/videoaulasStore';
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
  
  const [aula, setAula] = useState<Aula | null>(() =>
    catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null,
  );
  const [aulasDaArea, setAulasDaArea] = useState<Aula[]>([]);
  const [favorito, setFavorito] = useState(false);
  const [concluida, setConcluida] = useState(false);
  const [carregado, setCarregado] = useState(false);
  
  const [inicio, setInicio] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState<{ show: boolean; tempo: number }>({ show: false, tempo: 0 });

  useEffect(() => {
    if (!catalogo || !videoId) return;
    let alive = true;
    
    setAula(getCachedAula(catalogo.id, videoId) as Aula | null);
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
        if (aulaData) setAula(aulaData);
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
          setAulasDaArea(areaRes.data as Aula[]);
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
