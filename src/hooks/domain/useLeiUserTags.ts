import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { listNumerosFavoritosByTabela, ARTIGOS_FAV_EVENT } from '@/lib/artigosFavoritos';
import { LEIS_FAVORITOS_EVENT } from '@/lib/leisFavoritos';

export function useLeiUserTags(selectedTabelaNome: string | null) {
  const [grifadoNumeros, setGrifadoNumeros] = useState<Set<string>>(new Set());
  const [anotadoNumeros, setAnotadoNumeros] = useState<Set<string>>(new Set());
  const [favArtigoNumeros, setFavArtigoNumeros] = useState<Set<string>>(new Set());
  const [leiFavToggle, setLeiFavToggle] = useState(0);

  // Load user's grifos & anotacoes for the selected lei (for tag indicators)
  useEffect(() => {
    if (!selectedTabelaNome) {
      setGrifadoNumeros(new Set());
      setAnotadoNumeros(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setGrifadoNumeros(new Set());
          setAnotadoNumeros(new Set());
          return;
        }
        const [{ data: grifos }, { data: notas }] = await Promise.all([
          supabase.from('artigos_grifos').select('numero_artigo').eq('tabela_codigo', selectedTabelaNome).eq('user_id', user.id),
          supabase.from('artigos_anotacoes').select('artigo_id').eq('user_id', user.id).like('artigo_id', `${selectedTabelaNome}::%`),
        ]);
        if (cancelled) return;
        setGrifadoNumeros(new Set((grifos || []).map((g: any) => String(g.numero_artigo))));
        setAnotadoNumeros(new Set((notas || []).map((n: any) => String(n.artigo_id).split('::')[1]).filter(Boolean)));
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [selectedTabelaNome]);

  // Hidrata os favoritos (Meus Artigos) do usuário para a lei selecionada.
  useEffect(() => {
    if (!selectedTabelaNome) {
      setFavArtigoNumeros(new Set());
      return;
    }
    let cancelled = false;
    const load = () => {
      listNumerosFavoritosByTabela(selectedTabelaNome).then((nums) => {
        if (!cancelled) setFavArtigoNumeros(new Set(nums));
      }).catch(() => {});
    };
    load();
    const onChange = () => load();
    window.addEventListener(ARTIGOS_FAV_EVENT, onChange);
    return () => { cancelled = true; window.removeEventListener(ARTIGOS_FAV_EVENT, onChange); };
  }, [selectedTabelaNome]);

  // Re-render quando o favorito da própria lei mudar.
  useEffect(() => {
    const bump = () => setLeiFavToggle((n) => n + 1);
    window.addEventListener(LEIS_FAVORITOS_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(LEIS_FAVORITOS_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  return {
    grifadoNumeros,
    anotadoNumeros,
    favArtigoNumeros,
    leiFavToggle,
    setLeiFavToggle,
    setGrifadoNumeros,
    setAnotadoNumeros,
    setFavArtigoNumeros
  };
}
