import React, { useState, useEffect, memo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { TelaPosTrialView } from '@/components/subscription/TelaPosTrialView';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

export const TrialExpiredGate = memo(function TrialExpiredGate() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Estado para controlar a exibição do painel na Home ('/')
  const [showModalOnHome, setShowModalOnHome] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Trava scroll da tela somente enquanto o modal estiver aberto sobre a Home
  useBodyScrollLock(showModalOnHome);

  // Se o usuário mudar de rota (por exemplo para /assinatura), fecha o modal da Home
  useEffect(() => {
    if (location.pathname !== '/') {
      setShowModalOnHome(false);
    }
  }, [location.pathname]);

  // Intercepta qualquer toque/clique em funções na Home ('/') quando o trial estiver expirado
  useEffect(() => {
    if (!isExpired || location.pathname !== '/') return;

    const handleWindowClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Se o modal já estiver aberto e o clique for dentro dele (ex: botão "Ver Planos" ou "X"), deixa interagir normalmente
      if (modalContainerRef.current && modalContainerRef.current.contains(target)) {
        return;
      }

      // 2. Se o clique for no card ou botão direto de assinatura ("Seja Prime" / "Assinar"), deixa navegar
      const isAssinaturaTarget = Boolean(
        target.closest('[data-trial-card="true"], [data-allow-trial-click="true"], a[href="/assinatura"], [data-to="/assinatura"]')
      );
      if (isAssinaturaTarget) {
        return;
      }

      // 3. Verifica se o clique foi em alguma função interativa da Home
      // (qualquer botão, link, card de lei, categoria, aba, carrossel, item de navegação, busca ou atalho)
      const isFunction = Boolean(
        target.closest(
          'button, a, [role="button"], [role="tab"], input, select, textarea, [tabindex], [data-track], [data-interactive], .cursor-pointer, nav, [class*="cursor-pointer"], [class*="clickable"]'
        )
      );

      if (isFunction) {
        // Bloqueia a execução da função/navegação
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Abre o painel informando que os 3 dias terminaram
        setShowModalOnHome(true);
      }
    };

    const handleWindowKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModalOnHome) {
        setShowModalOnHome(false);
        return;
      }

      if (modalContainerRef.current && modalContainerRef.current.contains(e.target as Node)) {
        return;
      }

      if ((e.key === 'Enter' || e.key === ' ') && !showModalOnHome) {
        const target = e.target as HTMLElement | null;
        const isFunction = Boolean(
          target?.closest('button, a, [role="button"], [role="tab"], [tabindex], .cursor-pointer')
        );
        if (isFunction) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setShowModalOnHome(true);
        }
      }
    };

    window.addEventListener('click', handleWindowClickCapture, true);
    window.addEventListener('keydown', handleWindowKeyDownCapture, true);
    return () => {
      window.removeEventListener('click', handleWindowClickCapture, true);
      window.removeEventListener('keydown', handleWindowKeyDownCapture, true);
    };
  }, [isExpired, location.pathname, showModalOnHome]);

  // Se não estiver expirado ou se for rota isenta (ex: /assinatura), não bloqueia nada
  if (!isExpired || isExemptRoute) {
    return null;
  }

  // NA ROTA HOME ('/'):
  // Mostra a tela inicial normal e permite que a pessoa role a página livremente.
  // Somente abre o painel quando ela clicar em alguma função (controlado por showModalOnHome).
  if (location.pathname === '/') {
    if (!showModalOnHome) {
      return null;
    }
    return (
      <div ref={modalContainerRef}>
        <TelaPosTrialView onVoltar={() => setShowModalOnHome(false)} />
      </div>
    );
  }

  // EM QUALQUER OUTRA ROTA INTERNA (ex: /vademecum, /artigo/..., /questoes, /audio):
  // Bloqueia diretamente e oferece voltar para a Home ('/') ou ir para os Planos
  return (
    <div ref={modalContainerRef}>
      <TelaPosTrialView onVoltar={() => navigate('/')} />
    </div>
  );
});
