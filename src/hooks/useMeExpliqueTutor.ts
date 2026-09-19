import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { speakNative, stopNativeSpeech } from '@/lib/nativeTts';
import { useMeExpliqueCota } from './useMeExpliqueCota';
import { haptic } from '@/lib/nativo';

export interface TermoDestrinchado {
  termo: string;
  emPortuguesClaro: string;
}

export interface MeExpliqueResultado {
  titulo: string;
  oQueSignifica: string;
  exemploPratico: string;
  termosDestrinchados?: TermoDestrinchado[];
  perguntasSugeridas?: string[];
  dicaOabConcurso?: string;
}

export function useMeExpliqueTutor() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MeExpliqueResultado | null>(null);
  const [falando, setFalando] = useState(false);
  const cota = useMeExpliqueCota();

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      void stopNativeSpeech();
    };
  }, []);

  const pararAudio = useCallback(async () => {
    cota.pararTimer();
    setFalando(false);
    await stopNativeSpeech();
    void haptic.light();
  }, [cota]);

  const tocarAudio = useCallback(async (textoParaFalar?: string) => {
    if (cota.limiteAtingido) {
      cota.setLimiteModalAberto(true);
      return;
    }

    if (falando) {
      await pararAudio();
      return;
    }

    const texto = textoParaFalar || (resultado
      ? `${resultado.titulo}. ${resultado.oQueSignifica}. Exemplo prático: ${resultado.exemploPratico}. ${resultado.dicaOabConcurso ? `Dica de prova: ${resultado.dicaOabConcurso}` : ''}`
      : '');

    if (!texto.trim()) return;

    setFalando(true);
    cota.iniciarTimer();
    void haptic.medium();

    try {
      const ok = await speakNative(texto, { lang: 'pt-BR', rate: 1.05 });
      if (!ok && isMounted.current) {
        setFalando(false);
        cota.pararTimer();
      }
    } catch {
      if (isMounted.current) {
        setFalando(false);
        cota.pararTimer();
      }
    }
  }, [cota, falando, resultado, pararAudio]);

  const invocarTutor = useCallback(async (payload: Record<string, unknown>): Promise<MeExpliqueResultado | null> => {
    if (cota.limiteAtingido) {
      cota.setLimiteModalAberto(true);
      return null;
    }

    setLoading(true);
    setErro(null);
    await pararAudio();

    try {
      // Debita uma pequena fração (ex: 5 segundos de cota de IA)
      cota.consumirSegundos(5);

      const { data, error } = await supabase.functions.invoke('me-explique-tutor', {
        body: payload,
      });

      if (error) throw new Error(error.message || 'Falha ao consultar o tutor.');
      if (!data?.sucesso || !data?.dados) {
        throw new Error(data?.error || 'Não foi possível gerar a explicação no momento.');
      }

      const res = data.dados as MeExpliqueResultado;
      if (isMounted.current) {
        setResultado(res);
      }
      return res;
    } catch (e: any) {
      console.error('[useMeExpliqueTutor] Erro:', e);
      const msg = e?.message || 'Erro ao conectar ao tutor. Verifique sua conexão.';
      if (isMounted.current) setErro(msg);
      return null;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [cota, pararAudio]);

  const explicarLivro = useCallback((params: {
    titulo: string;
    autor?: string;
    capituloTitulo?: string;
    capituloNumero?: number | string;
    sobre?: string;
  }) => {
    return invocarTutor({
      modo: 'livro',
      livro: params,
    });
  }, [invocarTutor]);

  const explicarTermo = useCallback((params: {
    nome: string;
    definicaoBase?: string;
  }) => {
    return invocarTutor({
      modo: 'termo',
      termo: params,
    });
  }, [invocarTutor]);

  const explicarLei = useCallback((params: {
    leiNome: string;
    artigoNumero: string;
    textoArtigo?: string;
  }) => {
    return invocarTutor({
      modo: 'lei',
      lei: params,
    });
  }, [invocarTutor]);

  const explicarLivre = useCallback((pergunta: string, historico?: any[]) => {
    return invocarTutor({
      modo: 'livre',
      pergunta,
      historico,
    });
  }, [invocarTutor]);

  return {
    loading,
    erro,
    resultado,
    setResultado,
    falando,
    tocarAudio,
    pararAudio,
    explicarLivro,
    explicarTermo,
    explicarLei,
    explicarLivre,
    cota,
  };
}
