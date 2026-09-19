import { useState, useEffect, useCallback, useRef } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativo';

export const LIMITE_PREMIUM_SEG = 300; // 5 minutos por dia
export const LIMITE_FREE_SEG = 60;     // 1 minuto de degustação

function getTodayStorageKey(): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `me_explique_uso_${hoje}`;
}

function lerTempoUsadoHoje(): number {
  try {
    const raw = localStorage.getItem(getTodayStorageKey());
    if (!raw) return 0;
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  } catch {
    return 0;
  }
}

function salvarTempoUsadoHoje(segundos: number): void {
  try {
    localStorage.setItem(getTodayStorageKey(), String(Math.max(0, segundos)));
  } catch {
    // Ignora erro em modo privado
  }
}

export function useMeExpliqueCota() {
  const { isPremium, loading: carregandoPlano } = useSubscription();
  const [tempoUsado, setTempoUsado] = useState<number>(lerTempoUsadoHoje);
  const [limiteModalAberto, setLimiteModalAberto] = useState(false);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const limiteSegundos = isPremium ? LIMITE_PREMIUM_SEG : LIMITE_FREE_SEG;
  const tempoRestante = Math.max(0, limiteSegundos - tempoUsado);
  const limiteAtingido = tempoRestante <= 0;

  // Sincroniza com outros componentes
  useEffect(() => {
    const onSync = () => {
      setTempoUsado(lerTempoUsadoHoje());
    };
    window.addEventListener('me-explique-cota-updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener('me-explique-cota-updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const consumirSegundos = useCallback((qtd: number) => {
    setTempoUsado((atual) => {
      const novo = atual + qtd;
      salvarTempoUsadoHoje(novo);
      window.dispatchEvent(new CustomEvent('me-explique-cota-updated'));
      if (novo >= limiteSegundos) {
        setLimiteModalAberto(true);
        void haptic.heavy();
      }
      return novo;
    });
  }, [limiteSegundos]);

  const iniciarTimer = useCallback(() => {
    setTimerAtivo(true);
  }, []);

  const pararTimer = useCallback(() => {
    setTimerAtivo(false);
  }, []);

  // Timer quando está em áudio/câmera/interação contínua
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!timerAtivo || limiteAtingido) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTempoUsado((prev) => {
        const next = prev + 1;
        salvarTempoUsadoHoje(next);
        if (next % 5 === 0) {
          window.dispatchEvent(new CustomEvent('me-explique-cota-updated'));
        }
        if (next >= limiteSegundos) {
          setTimerAtivo(false);
          setLimiteModalAberto(true);
          void haptic.heavy();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerAtivo, limiteAtingido, limiteSegundos]);

  const minutosRestantes = Math.floor(tempoRestante / 60);
  const segundosRestantes = tempoRestante % 60;
  const tempoFormatado = `${minutosRestantes}:${segundosRestantes.toString().padStart(2, '0')}`;
  const porcentagemRestante = Math.min(100, Math.max(0, (tempoRestante / limiteSegundos) * 100));

  return {
    isPremium,
    carregandoPlano,
    tempoUsado,
    tempoRestante,
    tempoFormatado,
    minutosRestantes,
    segundosRestantes,
    limiteSegundos,
    limiteAtingido,
    porcentagemRestante,
    limiteModalAberto,
    setLimiteModalAberto,
    consumirSegundos,
    iniciarTimer,
    pararTimer,
    timerAtivo,
  };
}
