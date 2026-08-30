import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';

export function useFlashcardsMix(areasRaw: { area: string }[] | undefined) {
  const [loadingMix, setLoadingMix] = useState(false);
  const navigate = useNavigate();

  const handleMixRapido = useCallback(async () => {
    if (!areasRaw || areasRaw.length === 0) return;
    
    haptic.selection();
    setLoadingMix(true);
    
    try {
      const promises = areasRaw.map(a => 
        supabase.rpc('flashcards_temas', { _area: a.area })
          .then(res => res.error ? [] : (res.data || []))
      );
      
      const results = await Promise.all(promises);
      const allTemas = results.flat();
      const MIX_KEYWORDS = [
        'filosofia', 'filósofo', 'platão', 'aristóteles', 'sócrates', 'kant', 'hegel', 'habermas', 'rawls', 'dworkin', 'alexy',
        'sociologia', 'sociólogo', 'foucault', 'weber', 'marx', 'durkheim',
        'teoria geral', 'tgd', 'kelsen', 'radbruch', 'reale', 'bobbio',
        'doutrina penal', 'penalista', 'nucci', 'capez', 'bitencourt', 'sanches', 'mirabete', 'zaffaroni', 'lopes jr', 'pacelli', 'távora',
        'doutrina civil', 'civilista', 'tartuce', 'rosenvald', 'farias', 'gagliano', 'gonçalves', 'venosa', 'diniz', 'tepedino', 'marinoni', 'didier', 'neves', 'theodoro',
        'doutrina constitucional', 'administrativista', 'barroso', 'mendes', 'canotilho', 'carvalho', 'meirelles', 'di pietro', 'carvalho filho', 'alexandrino', 'moraes', 'novelino',
        'doutrina', 'autor', 'jurista', 'entendimento doutrinário', 'segundo a doutrina', 'posição majoritária',
        'prazo', 'dias', 'horas', 'meses', 'anos', 'prescrição', 'decadência',
        'exceção', 'salvo', 'exceto', 'regra geral', 'ressalva',
        'classificação', 'espécies', 'tipos de', 'modalidades', 'requisitos', 'elementos'
      ];

      const temasValidos = allTemas
        .filter(t => MIX_KEYWORDS.some(k => t.tema.toLowerCase().includes(k)))
        .map(t => t.tema);

      if (temasValidos.length === 0) {
        toast.error('Nenhum card especial encontrado.');
        return;
      }

      // Randomize e pega até 20 temas para a URL não ficar gigante
      const shuffled = temasValidos.sort(() => 0.5 - Math.random()).slice(0, 20);
      const temasParam = encodeURIComponent(shuffled.join('|'));
      
      navigate(`/flashcards/estudar?temas=${temasParam}&modo=revisar&limite=50&ordem=embaralhado`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar mix.');
    } finally {
      setLoadingMix(false);
    }
  }, [areasRaw, navigate]);

  return { handleMixRapido, loadingMix };
}
