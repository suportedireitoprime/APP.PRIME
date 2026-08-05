import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const PASSOS_GERACAO = [
  'Lendo o capítulo do livro',
  'Escrevendo a aula com IA',
  'Criando flashcards',
  'Montando as questões',
  'Pronto',
];

export const RANGES_GERACAO: Array<[number, number]> = [
  [0, 12],
  [12, 62],
  [62, 82],
  [82, 99],
  [100, 100],
];

type Resultado = { aulaId: string } | null;

/**
 * Geração de aula sob demanda: teoria + flashcards + questões.
 * O usuário dispara; o conteúdo fica salvo para todos (e aparece no admin).
 */
export function useGerarAulaDemanda() {
  const [gerando, setGerando] = useState(false);
  const [passo, setPasso] = useState(0);
  const [titulo, setTitulo] = useState<string>('');
  const emAndamento = useRef(false);

  const gerar = useCallback(async (sumarioId: string, areaId: string, tituloAula?: string): Promise<Resultado> => {
    if (emAndamento.current) return null;
    emAndamento.current = true;
    setGerando(true);
    setPasso(0);
    setTitulo(tituloAula ?? '');
    try {
      setPasso(1);
      const { data, error } = await supabase.functions.invoke('gerar-aula-do-livro', {
        body: { sumario_id: sumarioId, area_id: areaId },
      });
      if (error) throw new Error(error.message || 'Falha ao gerar a aula');
      if ((data as any)?.error) throw new Error((data as any).error);
      const aulaId = (data as any)?.aula_id as string | undefined;
      if (!aulaId) throw new Error('Aula não retornada');

      // Flashcards e questões — se falharem, a teoria já está salva.
      setPasso(2);
      await supabase.functions
        .invoke('gerar-flashcards-aula', { body: { aula_id: aulaId } })
        .catch(() => null);
      setPasso(3);
      await supabase.functions
        .invoke('gerar-questoes-aula', { body: { aula_id: aulaId } })
        .catch(() => null);

      setPasso(4);
      return { aulaId };
    } catch (e: any) {
      toast.error(e?.message || 'Não consegui gerar a aula agora.');
      return null;
    } finally {
      emAndamento.current = false;
      setGerando(false);
    }
  }, []);

  return { gerar, gerando, passo, titulo };
}
