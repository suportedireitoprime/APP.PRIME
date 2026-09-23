import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Adiciona um pequeno delay para garantir que o React renderize a nova página
    // antes de forçar o scroll para o topo.
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, 10);
  }, [pathname]);

  return null;
}
