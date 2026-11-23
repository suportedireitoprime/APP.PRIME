import React, { useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { TelaPosTrialView } from '@/components/subscription/TelaPosTrialView';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

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
    location.pathname === '/suporte' ||
    location.pathname.startsWith('/admin');

  // Monitoramento contínuo do relógio para acionar no segundo exato dos 3 dias
  const [, setTick] = useState(0);

  const userCreatedAt = 
    user?.created_at || 
    sub.startedAt || 
    (user?.id && typeof localStorage !== 'undefined' ? localStorage.getItem(`direitoprime:user_created_at:${user.id}`) : null);

  useEffect(() => {
    if (isPaidSubscriber || !user) return;
    const trial = calcTrial(userCreatedAt);
    if (trial.inTrial && trial.trialRemainingMs > 0) {
      const timer = setTimeout(() => {
        setTick((t) => t + 1);
      }, trial.trialRemainingMs + 100);
      return () => clearTimeout(timer);
    }
  }, [isPaidSubscriber, user, userCreatedAt]);

  // Recálculo estrito do status de trial (3 dias = 72 horas)
  const trialInfo = calcTrial(userCreatedAt);
  const isExpired = !!user && !isPaidSubscriber && (trialInfo.trialExpired || sub.isTrialExpired);

  // Trava scroll da tela 100% quando o trial estiver expirado e rota não for isenta
  const shouldBlock100 = isExpired && !isExemptRoute;
  useBodyScrollLock(shouldBlock100);

  // Se não estiver expirado ou se for rota isenta (ex: /assinatura), libera normalmente
  if (!shouldBlock100) {
    return null;
  }

  // BLOQUEIO TOTAL 100% INTRANSPONÍVEL (FECHAMENTO COMPLETO):
  // O usuário não pode fechar o aviso para navegar no app de graça.
  // Deve obrigatoriamente escolher um plano em /assinatura ou trocar de conta.
  return (
    <TelaPosTrialView canDismiss={false} />
  );
});
