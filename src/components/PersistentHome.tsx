import { useLocation } from "react-router-dom";
import Index from "@/pages/Index";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

/**
 * Mantém a Home montada em memória o tempo todo, apenas alternando
 * display none/block conforme a rota atual. Ao voltar de uma lei (POP),
 * o browser só precisa reexibir o DOM já pintado — sem remount do
 * `MobileHomeSections`/`IndexDesktop`, sem re-fetch, sem re-hidratação.
 *
 * Precisa ficar FORA de <Routes> porque o `<Routes key={pathname}>` do App
 * remonta todo o subárvore a cada navegação.
 */
const PersistentHome = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Só monta depois que a auth resolveu e temos usuário — evita rodar
  // efeitos da Home no fluxo público (auth/landing/etc).
  if (loading || !user) return null;

  // Se o usuário acabou de se cadastrar, a triagem vai assumir a tela.
  // Esconde a Home proativamente para evitar piscar antes do redirecionamento.
  const justSignedUp = typeof window !== 'undefined' && window.sessionStorage.getItem('just_signed_up') === '1';
  if (justSignedUp) return null;

  const publicPaths = new Set([
    "/auth",
    "/landing",
    "/privacidade",
    "/termos",
    "/excluir-conta",
    "/suporte-publico",
    "/reset-password",
    "/onboarding",
  ]);
  const isPublic =
    publicPaths.has(location.pathname) ||
    location.pathname.startsWith("/desktop-link/");

  const [onboardingChecked, setOnboardingChecked] = useState(() => {
    if (!user) return false;
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`onboarding_completed:${user.id}`) === '1';
  });

  useEffect(() => {
    if (!user) return;
    const cacheKey = `onboarding_completed:${user.id}`;
    if (localStorage.getItem(cacheKey) === '1') {
      setOnboardingChecked(true);
      return;
    }
    
    const handleCheck = () => setOnboardingChecked(true);
    window.addEventListener('onboarding_checked', handleCheck);
    return () => window.removeEventListener('onboarding_checked', handleCheck);
  }, [user]);

  if (isPublic) return null;

  if (!onboardingChecked) return null;

  const visible = location.pathname === "/";
  return (
    <div
      style={{ display: visible ? "block" : "none" }}
      aria-hidden={!visible}
    >
      <Index />
    </div>
  );
};

export default PersistentHome;
