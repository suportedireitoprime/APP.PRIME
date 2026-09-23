import { ReactNode } from "react";
import { useNavigationType } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  instant?: boolean;
  fallback?: ReactNode;
}

/**
 * Transição de página CSS-only nativa (idêntica ao VACATIO-APP).
 * Em navegações POP (voltar do browser/gesto/botão voltar nativo) ou instant,
 * pula a animação de entrada para resposta instantânea a 0ms (comportamento nativo puro).
 * Em PUSH/REPLACE utiliza a animação acelerada por GPU `animate-page-in`.
 *
 * Elimina o framer-motion na troca de rotas e remove o <Suspense> aninhado,
 * impedindo o piscar de esqueletos durante a navegação.
 */
const PageTransition = ({ children, className, instant }: PageTransitionProps) => {
  const navType = useNavigationType();
  const isInstant = navType === "POP" || Boolean(instant);
  const cls = isInstant
    ? `min-h-dvh w-full max-w-full overflow-x-hidden ${className || ""}`.trim()
    : `min-h-dvh w-full max-w-full overflow-x-hidden animate-page-in ${className || ""}`.trim();

  return <div className={cls}>{children}</div>;
};

export default PageTransition;
