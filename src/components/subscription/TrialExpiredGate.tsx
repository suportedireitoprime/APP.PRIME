import React, { useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { TelaPosTrialView } from '@/components/subscription/TelaPosTrialView';

export const TrialExpiredGate = memo(function TrialExpiredGate() {
  const { user } = useAuth();
  const location = useLocation();
  const sub = useSubscription();

  // Assinante pago ou administrador nunca é bloqueado
  const isPaidSubscriber =
    sub.isAdminOverride ||
    isAdminEmail(user?.email) ||
    (sub.isPremium && !sub.isTrial);

  // Rotas isentas de bloqueio para permitir cadastro, login e pagamento
  const isExemptRoute =
    location.pathname === '/auth' ||
    location.pathname === '/landing' ||
    location.pathname === '/assinatura' ||
    location.pathname === '/planos/ativos' ||
    location.pathname === '/termos' ||
    location.pathname === '/privacidade' ||
    location.pathname.startsWith('/admin');

  // Monitoramento contínuo do relógio para acionar no segundo exato dos 3 dias
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isPaidSubscriber || !user) return;
    const trial = calcTrial(user?.created_at || sub.startedAt);
    if (trial.inTrial && trial.trialRemainingMs > 0) {
      const timer = setTimeout(() => {
        setTick((t) => t + 1);
      }, trial.trialRemainingMs + 100);
      return () => clearTimeout(timer);
    }
  }, [isPaidSubscriber, user, sub.startedAt]);

  // Recálculo do status de trial (3 dias = 72 horas)
  const trialInfo = calcTrial(user?.created_at || sub.startedAt);
  const isExpired = !!user && !isPaidSubscriber && (trialInfo.trialExpired || sub.isTrialExpired);

  // Se não estiver expirado, se for assinante, ou se estiver na tela de assinatura/auth, não bloqueia
  if (!isExpired || isExemptRoute) {
    return null;
  }

  // Apresenta a tela pós-trial oficial diretamente para o usuário expirado
  return <TelaPosTrialView />;
});
