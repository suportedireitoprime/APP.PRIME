import { useState, useEffect, useCallback, useRef } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativo';

export const LIMITE_PREMIUM_SEG = 300; // 5 minutos por dia
export const LIMITE_FREE_SEG = 60;     // 1 minuto por mês

function getCotaStorageKey(isPremium: boolean): string {
  const d = new Date();
  if (isPremium) {
    const hoje = d.toISOString().slice(0, 10);
    return `me_explique_uso_dia_${hoje}`;
  }
  // Plano Free: 1 minuto por mês
  const mesAno = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `me_explique_uso_mes_${mesAno}`;
}

function lerTempoUsado(isPremium: boolean): number {
  try {
    const raw = localStorage.getItem(getCotaStorageKey(isPremium));
    if (!raw) return 0;
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  } catch {
    return 0;
  }
}

function salvarTempoUsado(isPremium: boolean, segundos: number): void {
  try {
    localStorage.setItem(getCotaStorageKey(isPremium), String(Math.max(0, segundos)));
  } catch {
    // Ignora erro em modo privado
  }
}

export function useMeExpliqueCota() {
  const { isPremium, loading: carregandoPlano } = useSubscription();
  const [tempoUsado, setTempoUsado] = useState<number>(() => lerTempoUsado(isPremium));
  const [limiteModalAberto, setLimiteModalAberto] = useState(false);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const limiteSegundos = isPremium ? LIMITE_PREMIUM_SEG : LIMITE_FREE_SEG;
  const tempoRestante = Math.max(0, limiteSegundos - tempoUsado);
  // Enquanto o plano não foi confirmado, nunca bloqueia (evita tratar assinante como grátis)
  const limiteAtingido = !carregandoPlano && tempoRestante <= 0;

  // Sincroniza com outros componentes
  useEffect(() => {
    setTempoUsado(lerTempoUsado(isPremium));
    const onSync = () => {
      setTempoUsado(lerTempoUsado(isPremium));
    };
    window.addEventListener('me-explique-cota-updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener('me-explique-cota-updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, [isPremium]);

  const consumirSegundos = useCallback((qtd: number) => {
    setTempoUsado((atual) => {
      const novo = atual + qtd;
      salvarTempoUsado(isPremium, novo);
      window.dispatchEvent(new CustomEvent('me-explique-cota-updated'));
      if (!carregandoPlano && novo >= limiteSegundos) {
        setLimiteModalAberto(true);
        void haptic.heavy();
      }
      return novo;
    });
  }, [isPremium, limiteSegundos, carregandoPlano]);

  const iniciarTimer = useCallback(() => {
    if (carregandoPlano) return;
    setTimerAtivo(true);
  }, [carregandoPlano]);

  const pararTimer = useCallback(() => {
    setTimerAtivo(false);
  }, []);

  // Timer quando está em áudio/câmera/interação contínua
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!timerAtivo || limiteAtingido || carregandoPlano) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTempoUsado((prev) => {
        const next = prev + 1;
        salvarTempoUsado(isPremium, next);
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
  }, [timerAtivo, limiteAtingido, limiteSegundos, isPremium, carregandoPlano]);

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
