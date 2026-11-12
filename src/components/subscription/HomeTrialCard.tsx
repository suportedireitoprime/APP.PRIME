import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';

export const HomeTrialCard = memo(function HomeTrialCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();

  // Assinante pago ou admin não vê o retângulo de contagem regressiva
  const isPaidSubscriber =
    sub.isAdminOverride ||
    (sub.isPremium && !sub.isTrial && (sub.source === 'asaas' || sub.source === 'play' || sub.source === 'apple'));

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isPaidSubscriber) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPaidSubscriber]);

  const trialInfo = useMemo(() => {
    return calcTrial(user?.created_at || sub.startedAt);
  }, [user?.created_at, sub.startedAt]);

  const remainingMs = useMemo(() => {
    if (!trialInfo.trialExpiresAt) return 0;
    const expiresTime = new Date(trialInfo.trialExpiresAt).getTime();
    return Math.max(0, expiresTime - now);
  }, [trialInfo.trialExpiresAt, now]);

  const inTrial = remainingMs > 0;
  const isExpired = !inTrial && (trialInfo.trialExpired || sub.isTrialExpired);

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

  if (isPaidSubscriber) {
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
      className="group relative cursor-pointer select-none overflow-hidden rounded-2xl border border-amber-500/40 bg-black/60 p-2.5 sm:p-3 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all duration-200 hover:border-amber-400/70 hover:bg-black/75"
    >
      {/* Luz ambiente dourada sutil de fundo */}
      <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-1.5">
        {/* Topo do Card: Badge e Ícone */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/35 text-[9px] sm:text-[9.5px] font-sans font-black tracking-wider uppercase text-amber-300">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
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
          <span className="text-[10px] text-zinc-400 font-medium leading-none">
            {inTrial ? 'Tempo restante:' : 'Teste finalizado'}
          </span>
          <span className="font-mono font-black text-xs sm:text-[13px] text-white tracking-tight mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {inTrial ? formattedCountdown : '00h 00m 00s'}
          </span>
        </div>

        {/* Botão de Ação / Ver Planos */}
        <div className="mt-0.5 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
          <span>Ver planos</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
});