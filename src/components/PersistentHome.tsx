import { useLocation } from "react-router-dom";
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
 * Mantém a Home montada em memória o tempo todo, alternando `display: block` / `none`
 * conforme a rota atual (engenharia do VACATIO-APP).
 * Ao navegar de volta (POP), o navegador reexibe instantaneamente o DOM já pintado na GPU
 * a 0ms, sem remount, sem re-fetch e sem reflows de layout ou transições que atrasam a pintura.
 *
 * Em rotas 3D pesadas (WebGL / Three.js), mantém `display: none` para liberar a VRAM.
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

  return (
    <div
      className="persistent-home-root"
      style={{ display: visible ? "block" : "none" }}
      aria-hidden={!visible}
    >
      <Index />
    </div>
  );
};

export default PersistentHome;
