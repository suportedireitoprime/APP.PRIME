import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Voltar seguro e inteligente:
 * 1. Se houver `location.state.from`, respeita a rota de origem informada.
 * 2. Caso contrário, navega diretamente para a rota de destino garantida (padrão: início '/').
 *    Elimina comportamento errático de navigate(-1) que prendia o usuário ou ia para fora do app.
 */
export function useGoBack(fallback: string = '/') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // 0. Dispensa o teclado virtual mobile e remove foco de inputs ativos
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 1. Prioriza rota de origem passada explicitamente no state (se diferente da atual)
    const state = location.state as { from?: string } | null;
    if (state?.from && typeof state.from === 'string' && state.from !== location.pathname) {
      navigate(state.from);
      return;
    }

    // 2. Navega com segurança para a rota de destino (Início '/' por padrão)
    navigate(fallback);
  }, [navigate, location, fallback]);
}

export default useGoBack;

