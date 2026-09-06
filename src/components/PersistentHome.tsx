import { useLocation } from "react-router-dom";
import Index from "@/pages/Index";
import { useAuth } from "@/hooks/useAuth";

/**
 * Mantém a Home montada em memória o tempo todo.
 * Não utiliza `display: none` para preservar os backing stores da GPU (composite layers)
 * e evitar o 'piscar preto' ao retornar ao início do aplicativo.
 * A transição é suave (opacity + subtle scale) a 120fps.
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

  if (isPublic) return null;

  const visible = location.pathname === "/";

  return (
    <div
      className="persistent-home-root"
      style={{
        width: "100%",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        visibility: visible ? "visible" : "hidden",
        position: visible ? "relative" : "absolute",
        top: 0,
        left: 0,
        zIndex: visible ? 1 : 0,
        transform: visible ? "none" : "scale(0.994) translateY(6px)",
        transition: "opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: visible ? "auto" : "opacity, transform",
      }}
      aria-hidden={!visible}
    >
      <Index />
    </div>
  );
};

export default PersistentHome;
