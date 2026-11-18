import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Lock } from 'lucide-react';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';

export const HomeTrialCard = memo(function HomeTrialCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();

  // Assinante pago, vitalício ou admin não vê o retângulo de contagem regressiva
  const isPaidSubscriber =
    sub.isAdminOverride ||
    (sub.isPremium && !sub.isTrial) ||
    sub.plano === 'vitalicio';

  // Blindagem contra flash de renderização no carregamento inicial (somente se não for trial)
  const isKnownPaid = typeof localStorage !== 'undefined' && (() => {
    if (localStorage.getItem('direitoprime:last_user_is_paid') === 'true') return true;
    if (!user) return false;
    try {
      const raw = localStorage.getItem(`direitoprime:sub:${user.id}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed.isPremium && !parsed.isTrial && parsed.plano !== 'trial_3dias');
    } catch {
      return false;
    }
  })();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isPaidSubscriber || isKnownPaid) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPaidSubscriber, isKnownPaid]);

  const trialInfo = useMemo(() => {
    let dateStr = user?.created_at || sub.startedAt;
    if (!dateStr && typeof localStorage !== 'undefined') {
      dateStr = localStorage.getItem('direitoprime:trial_started');
    }
    if (!dateStr && typeof localStorage !== 'undefined') {
      const nowIso = new Date().toISOString();
      localStorage.setItem('direitoprime:trial_started', nowIso);
      dateStr = nowIso;
    }
    return calcTrial(dateStr);
  }, [user?.created_at, sub.startedAt]);

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

  // Se o usuário já é pago, admin ou o status ainda está sendo validado, não exibe o card de trial
  if (isPaidSubscriber || isKnownPaid) {
    return null;
  }

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
      className="group relative cursor-pointer select-none overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1E190E]/90 via-[#141008]/95 to-[#0A0804]/98 p-2.5 sm:p-3 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all duration-200 hover:border-amber-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.35)]"
    >
      {/* Luz ambiente dourada sutil de fundo */}
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-1.5">
        {/* Topo do Card: Badge e Ícone */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[9.5px] font-sans font-black tracking-wider uppercase text-amber-300">
            {inTrial ? '3 DIAS GRÁTIS' : 'EXPIRADO'}
          </span>
          {inTrial ? (
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>

        {/* Contador Regressivo ou Status */}
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-200/70 font-medium leading-none">
            {inTrial ? 'Tempo restante:' : 'Teste finalizado'}
          </span>
          <span className="font-mono font-black text-xs sm:text-[13px] text-amber-300 tracking-tight mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {inTrial ? formattedCountdown : '00h 00m 00s'}
          </span>
        </div>

        {/* Botão de Ação Assinar Minimalista em Dourado */}
        <button
          type="button"
          onClick={handleClick}
          className="mt-0.5 w-full py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <span>Assinar</span>
          <ArrowRight className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
});
