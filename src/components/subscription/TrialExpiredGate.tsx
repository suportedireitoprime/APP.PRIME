import React, { useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';
import { haptic } from '@/lib/nativeHaptics';

export const TrialExpiredGate = memo(function TrialExpiredGate() {
  const { user } = useAuth();
  const location = useLocation();
  const sub = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  // Se for assinante pago ou admin, nunca bloqueia
  const isPaidSubscriber =
    sub.isAdminOverride ||
    (sub.isPremium && !sub.isTrial && (sub.source === 'asaas' || sub.source === 'play' || sub.source === 'apple'));

  // Rotas isentas de bloqueio para permitir cadastro, login e pagamento
  const isExemptRoute =
    location.pathname === '/auth' ||
    location.pathname === '/landing' ||
    location.pathname === '/assinatura' ||
    location.pathname === '/planos/ativos';

  // Verifica expiração dos 3 dias
  const trialInfo = calcTrial(user?.created_at || sub.startedAt);
  const isExpired = !!user && !isPaidSubscriber && (trialInfo.trialExpired || sub.isTrialExpired);

  useEffect(() => {
    if (!isExpired || isExemptRoute) return;

    const handleGlobalClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Permite cliques dentro de elementos marcados explicitamente com data-allow-trial-click
      // ou elementos dentro de diálogos e modais de checkout
      if (
        target.closest('[data-allow-trial-click="true"]') ||
        target.closest('[role="dialog"]') ||
        target.closest('.trial-modal-content') ||
        target.closest('[data-radix-portal]') ||
        target.closest('button[aria-label="Fechar"]')
      ) {
        return;
      }

      // Intercepta qualquer clique em elementos interativos ou conteúdo
      const interactive = target.closest('button, a, input, select, textarea, [role="button"], [data-track], .cursor-pointer');
      if (interactive) {
        e.preventDefault();
        e.stopPropagation();
        haptic.impact('medium');
        setModalOpen(true);
      }
    };

    window.addEventListener('click', handleGlobalClickCapture, true);
    return () => {
      window.removeEventListener('click', handleGlobalClickCapture, true);
    };
  }, [isExpired, isExemptRoute]);

  if (!isExpired || isExemptRoute) {
    return null;
  }

  return (
    <div data-allow-trial-click="true">
      <TrialExpiredModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
});

