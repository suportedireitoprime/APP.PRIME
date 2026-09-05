import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useFerramentasNavigation() {
  const navigate = useNavigate();
  const [dicionarioOpen, setDicionarioOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [boletinsSheetOpen, setBoletinsSheetOpen] = useState(false);

  const handleToolClick = useCallback((id: string, route?: string) => {
    if (id === 'ranking') {
      setRankingOpen(true);
      return;
    }

    if (id === 'boletins') {
      setBoletinsSheetOpen(true);
      return;
    }

    if (id === 'dicionario-modal') {
      setDicionarioOpen(true);
      return;
    }

    if (route && route !== '#') {
      navigate(route);
      return;
    }

    switch (id) {
      case 'desktop': navigate('/desktop'); break;
      case 'me-explique': navigate('/me-explique'); break;
      case 'vade-mecum': navigate('/vade-mecum'); break;
      case 'peticao-inicial': navigate('/ferramentas/peticao-inicial'); break;
      case 'flashcards': navigate('/flashcards'); break;
      case 'dicionario': navigate('/ferramentas/dicionario'); break;
      case 'radar360': navigate('/radares'); break;
      case 'radares': navigate('/radares'); break;
      case 'leis-cantadas': navigate('/leis-cantadas'); break;
      case 'gravar-aula': navigate('/anotacoes/audio'); break;
      case 'resumos-juridicos': navigate('/resumos-juridicos'); break;
      case 'noticias': navigate('/noticias'); break;
      case 'newsletter': navigate('/newsletter'); break;
      case 'biblioteca': navigate('/biblioteca'); break;
      case 'aprender': navigate('/aprender'); break;
      case 'modo-offline': navigate('/modo-offline'); break;
      case 'tematica': navigate('/tematica-juridica'); break;
      case 'forca': navigate('/gamificacao/forca'); break;
      case 'documentos': navigate('/documentos'); break;
    }
  }, [navigate]);

  return {
    navigate,
    dicionarioOpen,
    setDicionarioOpen,
    rankingOpen,
    setRankingOpen,
    boletinsSheetOpen,
    setBoletinsSheetOpen,
    handleToolClick,
  };
}
