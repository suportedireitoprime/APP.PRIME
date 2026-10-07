import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESKTOP_TOOLS_FLAT } from '@/config/desktopTools';

export function useFerramentasNavigation() {
  const navigate = useNavigate();
  const [dicionarioOpen, setDicionarioOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const handleToolClick = useCallback((id: string, route?: string) => {
    if (id === 'ranking') {
      setRankingOpen(true);
      return;
    }

    if (id === 'boletins') {
      navigate('/boletins');
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

    // Fallback if route is missing but id matches a known tool
    const tool = DESKTOP_TOOLS_FLAT.find((t) => t.id === id);
    if (tool?.route && tool.route !== '#') {
      navigate(tool.route);
      return;
    }
  }, [navigate]);

  return {
    navigate,
    dicionarioOpen,
    setDicionarioOpen,
    rankingOpen,
    setRankingOpen,
    handleToolClick,
  };
}
