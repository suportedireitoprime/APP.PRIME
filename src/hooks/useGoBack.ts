import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Voltar seguro e inteligente:
 * 1. Se houver `location.state.from`, respeita a rota de origem informada.
 * 2. Se houver histórico do React Router (`idx > 0`), navega -1.
 * 3. Se houver histórico nativo do navegador (`window.history.length > 2`), navega -1.
 * 4. Caso contrário (aberto via deep link, iframe preview ou refresh), navega para a rota de fallback segura.
 */
export function useGoBack(fallback: string = '/') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // 0. Dispensa o teclado virtual mobile e remove foco de inputs ativos
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 1. Prioriza rota de origem passada explicitamente no state
    const state = location.state as { from?: string } | null;
    if (state?.from && typeof state.from === 'string') {
      navigate(state.from);
      return;
    }

    // 2. Verifica se o React Router possui histórico de sessão
    const idx =
      typeof window !== 'undefined'
        ? (window.history.state as { idx?: number } | null)?.idx
        : undefined;

    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }

    // 3. Fallback para histórico do browser em iframes ou webviews
    if (typeof window !== 'undefined' && window.history.length > 2) {
      navigate(-1);
      return;
    }

    // 4. Fallback padrão seguro (evita quebrar ou ficar travado na tela)
    navigate(fallback, { replace: true });
  }, [navigate, location, fallback]);
}

export default useGoBack;

