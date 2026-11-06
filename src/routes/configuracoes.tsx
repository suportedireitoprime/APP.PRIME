import { createFileRoute, redirect } from "@tanstack/react-router";

// Redireciona permanentemente para o Perfil (a rota de configurações foi extinta)
export const Route = createFileRoute("/configuracoes")({
  beforeLoad: () => {
    throw redirect({ to: "/perfil" });
  },
  component: () => null,
});
