import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Lock, Crown } from 'lucide-react';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';

export const HomeTrialCard = memo(function HomeTrialCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();

  // Assinante pago real ativo não precisa ver o card de trial
  const isPaidSubscriber =
    Boolean(sub.isAdminOverride) ||
    Boolean(sub.isPremium && !sub.isTrial) ||
    sub.plano === 'vitalicio';

  if (isPaidSubscriber) {
    return null;
  }

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trialInfo = useMemo(() => {
    let dateStr = user?.created_at || sub.startedAt;
    const userTrialKey = user ? `direitoprime:trial_started:${user.id}` : 'direitoprime:trial_started:guest';
    if (!dateStr && typeof localStorage !== 'undefined') {
      dateStr = localStorage.getItem(userTrialKey) || localStorage.getItem('direitoprime:trial_started');
    }
    if (!dateStr && typeof localStorage !== 'undefined') {
      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem(userTrialKey, nowIso);
        localStorage.setItem('direitoprime:trial_started', nowIso);
      } catch {}
      dateStr = nowIso;
    }
    return calcTrial(dateStr);
  }, [user, sub.startedAt]);

  const remainingMs = useMemo(() => {
    if (!trialInfo.trialExpiresAt) return 0;
    const expiresTime = new Date(trialInfo.trialExpiresAt).getTime();
    return Math.max(0, expiresTime - now);
  }, [trialInfo.trialExpiresAt, now]);

  const inTrial = remainingMs > 0;

  // Formatação do tempo restante (dias, horas, minutos, segundos)
  const formattedCountdown = useMemo(() => {
    const totalSec = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }, [remainingMs]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    navigate('/assinatura');
  };

  return (
    <div
      onClick={handleClick}
      data-allow-trial-click="true"
      role="button"
      tabIndex={0}
      aria-label={inTrial ? `Degustação gratuita: ${formattedCountdown}` : 'Período de teste encerrado'}
      className="group relative cursor-pointer select-none overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1C160C]/95 via-[#130E06]/98 to-[#090703]/99 p-2.5 sm:p-3 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all duration-200 hover:border-amber-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.35)]"
    >
      {/* Luz ambiente dourada sutil de fundo */}
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

      {/* Faixa de reflexo luminoso dinâmico (Shine sweep) passando no card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12 animate-[planos-shine_3.5s_ease-in-out_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.25) 50%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-1.5">
        {/* Topo do Card: Badge e Ícone */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[9.5px] font-sans font-black tracking-wider uppercase text-amber-300">
            {inTrial ? '3 DIAS GRÁTIS' : 'GRATUITO'}
          </span>
          {inTrial ? (
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
        </div>

        {/* Contador Regressivo ou Status */}
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-200/70 font-medium leading-none">
            {inTrial ? 'Tempo restante:' : 'Acesso limitado:'}
          </span>
          <span className="font-mono font-black text-xs sm:text-[13px] text-amber-300 tracking-tight mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {inTrial ? formattedCountdown : 'Seja Prime'}
          </span>
        </div>

        {/* Botão de Ação Assinar Minimalista em Dourado com reflexo */}
        <button
          type="button"
          onClick={handleClick}
          className="btn-attention-shine-loop mt-0.5 w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[10.5px] sm:text-[11px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all shadow-[0_2px_8px_rgba(245,158,11,0.3)] cursor-pointer"
        >
          <span className="relative z-10">Assinar</span>
          <ArrowRight className="relative z-10 w-3 h-3 stroke-[2.8]" />
        </button>
      </div>
    </div>
  );
});
