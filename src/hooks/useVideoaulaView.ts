// @ts-nocheck
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
import { findVideoaulaByVideoId, VIDEOAULAS_INICIANTES, VIDEOAULAS_AREAS } from '@/data/videoaulas/videoaulasDriveData';

interface UseVideoaulaViewProps {
  catalogoId: string | undefined;
  videoId: string | undefined;
  userId: string | null;
  setTocandoState: (v: boolean) => void;
}

export function useVideoaulaView({ catalogoId, videoId, userId, setTocandoState }: UseVideoaulaViewProps) {
  const catalogo = getCatalogo(catalogoId);

  const cachedBundle = catalogo && videoId ? getCachedVideoaulaBundle(catalogo.tabela, videoId) : undefined;
  
  const driveItem = findVideoaulaByVideoId(videoId);
  const driveAula: Aula | null = driveItem ? {
    id: driveItem.id,
    video_id: driveItem.video_id,
    titulo: driveItem.titulo,
    area: driveItem.categoria === 'iniciantes' ? 'Fundamentos do Direito' : 'Áreas do Direito',
    descricao: `Aula completa: ${driveItem.titulo} (${driveItem.canal})`,
    sobre_aula: `Canal: ${driveItem.canal} | Duração: ${driveItem.duracao}. Inclui resumos, mapa mental, flashcards e questões comentadas.`,
    duracao_segundos: driveItem.duracao_seg,
    thumb: driveItem.thumb,
    thumbnail: driveItem.thumb,
  } : null;

  const [aula, setAula] = useState<Aula | null>(() =>
    cachedBundle?.aula ?? driveAula ?? (catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null),
  );
  const [aulasDaArea, setAulasDaArea] = useState<Aula[]>(() => {
    if (driveItem) {
      const srcList = driveItem.categoria === 'iniciantes' ? VIDEOAULAS_INICIANTES : VIDEOAULAS_AREAS;
      return srcList.map((item) => ({
        id: item.id,
        video_id: item.video_id,
        titulo: item.titulo,
        area: driveItem.categoria === 'iniciantes' ? 'Fundamentos do Direito' : 'Áreas do Direito',
        duracao_segundos: item.duracao_seg,
        thumb: item.thumb,
        thumbnail: item.thumb,
      })) as Aula[];
    }
    return [];
  });
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
          supabase.from(catalogo.tabela as any).select(cols).eq('video_id', videoId).limit(1).maybeSingle(),
          userId
            ? supabase
                .from('videoaulas_progresso')
                .select('tempo_atual, concluida')
                .eq('user_id', userId)
                .eq('tabela', catalogo.tabela)
                .eq('video_id', videoId)
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          userId
            ? supabase
                .from('videoaulas_favoritos')
                .select('id')
                .eq('user_id', userId)
                .eq('tabela', catalogo.tabela)
                .eq('video_id', videoId)
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (!alive) return;
        
        const aulaData = (aulaRes?.data as Aula | null) || driveAula;
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
        
        if (alive) {
          if (areaRes?.data && areaRes.data.length > 0) {
            const listaArea = areaRes.data as Aula[];
            setAulasDaArea(listaArea);
            prefetchProximasAulas(listaArea, videoId, catalogo, userId, 3);
          } else if (driveItem) {
            const srcList = driveItem.categoria === 'iniciantes' ? VIDEOAULAS_INICIANTES : VIDEOAULAS_AREAS;
            const driveList = srcList.map((item) => ({
              id: item.id,
              video_id: item.video_id,
              titulo: item.titulo,
              area: driveItem.categoria === 'iniciantes' ? 'Fundamentos do Direito' : 'Áreas do Direito',
              duracao_segundos: item.duracao_seg,
              thumb: item.thumb,
              thumbnail: item.thumb,
            })) as Aula[];
            setAulasDaArea(driveList);
          }
        }
      } catch (error) {
        if (!driveItem) {
          console.error("Erro ao carregar dados da aula:", error);
          toast.error(`Erro ao carregar aula: ${(error as any)?.message || (error as any)?.details || 'Falha na conexão'}. Tente novamente.`);
        }
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
