import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LEIS_SUPABASE_URL, leisAuthHeaders } from '@/lib/legislacaoBackend';

export function useLeiData(
  selectedLeiId: string | null,
  selectedTabelaNome: string | null,
  overlayPanel: string | null
) {
  const [selectedLeiEmenta, setSelectedLeiEmenta] = useState<string>('');
  
  const [dbAlteracoes, setDbAlteracoes] = useState<{ artigo_numero: string; tipo_alteracao: string; texto_anterior: string | null; texto_atual: string | null; detectado_em: string }[]>([]);
  const [loadingDbAlteracoes, setLoadingDbAlteracoes] = useState(false);
  
  const [playlistNarracoes, setPlaylistNarracoes] = useState<Record<string, string>>({});
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);

  // Busca a ementa oficial da lei selecionada
  useEffect(() => {
    if (!selectedLeiId) {
      setSelectedLeiEmenta('');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('vade_mecum_leis')
        .select('ementa')
        .eq('slug', selectedLeiId)
        .maybeSingle();
      if (!cancelled) setSelectedLeiEmenta((data?.ementa as string) || '');
    })();
    return () => { cancelled = true; };
  }, [selectedLeiId]);

  // Fetch DB alteracoes when novidades panel opens
  useEffect(() => {
    if (overlayPanel !== 'novidades' || !selectedTabelaNome) return;
    
    setLoadingDbAlteracoes(true);
    fetch(
      `${LEIS_SUPABASE_URL}/functions/v1/vademecum-scraper?tabela_nome=${encodeURIComponent(selectedTabelaNome)}`,
      { headers: leisAuthHeaders() }
    )
      .then(async (res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setDbAlteracoes(Array.isArray(data) ? data : []);
        setLoadingDbAlteracoes(false);
      })
      .catch((e) => {
        console.error('Erro ao carregar alterações legislativas:', e);
        setDbAlteracoes([]);
        setLoadingDbAlteracoes(false);
      });
  }, [overlayPanel, selectedTabelaNome]);

  // Fetch narrations when playlist tab is active
  useEffect(() => {
    if (overlayPanel !== 'playlist' || !selectedTabelaNome) return;
    let cancelled = false;
    setLoadingPlaylist(true);
    fetch(
      `${LEIS_SUPABASE_URL}/rest/v1/narracoes_artigos?tabela_nome=eq.${encodeURIComponent(selectedTabelaNome)}&select=artigo_numero,audio_url`,
      { headers: leisAuthHeaders() }
    )
      .then(async (res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((rows) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        (Array.isArray(rows) ? rows : []).forEach((row: any) => {
          if (row?.artigo_numero && row?.audio_url) map[row.artigo_numero] = row.audio_url;
        });
        setPlaylistNarracoes(map);
      })
      .catch((e) => {
        if (!cancelled) console.error('Erro ao carregar playlist:', e);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlaylist(false);
      });
    return () => { cancelled = true; };
  }, [overlayPanel, selectedTabelaNome]);

  return {
    selectedLeiEmenta,
    setSelectedLeiEmenta,
    dbAlteracoes,
    loadingDbAlteracoes,
    playlistNarracoes,
    loadingPlaylist,
    setDbAlteracoes,
    setLoadingDbAlteracoes,
    setPlaylistNarracoes,
    setLoadingPlaylist
  };
}
