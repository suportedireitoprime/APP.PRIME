import { useLocation } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import Index from "@/pages/Index";
import { useAuth } from "@/hooks/useAuth";

const HEAVY_GPU_PATHS = new Set([
  "/grafo-artigos",
  "/apresentacoes",
  "/modo-offline/apresentacoes",
  "/admin/laboratorio",
  "/admin-laboratorio",
]);

/**
 * Mantém a Home montada em memória o tempo todo.
 * Não utiliza `display: none` em rotas normais para preservar os backing stores da GPU
 * e evitar o 'piscar preto' ao retornar ao início do aplicativo.
 * Em rotas 3D pesadas (WebGL / Three.js), alterna para `display: none` para liberar
 * completamente a VRAM e evitar travamentos por Out-Of-Memory (OOM).
 * A transição é equalizada com o PageTransition a 80ms e 120fps puros.
 */
const PersistentHome = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

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

  // Em rotas com Three.js / WebGL pesado, libera a VRAM do compositor mantendo o estado React
  const isHeavyGpuRoute =
    HEAVY_GPU_PATHS.has(location.pathname) ||
    location.pathname.startsWith("/apresentacoes/") ||
    location.pathname.startsWith("/grafo-artigos");

  if (isHeavyGpuRoute) {
    return (
      <div
        className="persistent-home-root"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        <Index />
      </div>
    );
  }

  const visible = location.pathname === "/";

  const transitionStyle = shouldReduceMotion
    ? "none"
    : visible
      ? "opacity 0.08s cubic-bezier(0.16, 1, 0.3, 1)"
      : "opacity 0.08s cubic-bezier(0.32, 0, 0.67, 0)";

  return (
    <div
      className="persistent-home-root"
      style={{
        width: "100%",
        height: visible ? "auto" : 0,
        maxHeight: visible ? "none" : 0,
        overflow: visible ? "visible" : "hidden",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        visibility: visible ? "visible" : "hidden",
        position: visible ? "relative" : "absolute",
        top: 0,
        left: 0,
        zIndex: visible ? 1 : -1,
        transform: "none",
        transition: transitionStyle,
        willChange: visible ? "auto" : "opacity",
      }}
      aria-hidden={!visible}
    >
      <Index />
    </div>
  );
};

export default PersistentHome;

