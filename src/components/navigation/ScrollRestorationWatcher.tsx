import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';

const scrollMemory = new Map<string, { windowY: number; containerY: number }>();

function getSessionSaved(key: string): { windowY: number; containerY: number } | null {
  try {
    const raw = sessionStorage.getItem(`scroll_pos_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setSessionSaved(key: string, pos: { windowY: number; containerY: number }) {
  try {
    sessionStorage.setItem(`scroll_pos_${key}`, JSON.stringify(pos));
  } catch {}
}

/**
 * Observador global de Scroll Restoration (Itens 21 a 25):
 * - Item 21: Centraliza a restauração e o reset de rolagem no nível do roteador.
 * - Item 22: Desbloqueia travas residuais de overflow deixadas por modais/sheets (`resetBodyScrollLock`).
 * - Item 23: Preserva a posição exata de leitura ao navegar de volta (`POP`), evitando volta forçada ao topo.
 * - Item 24: Sincroniza tanto `window` quanto o container interno Desktop (`#desktop-scroll-container`).
 * - Item 25: Aguarda o término da animação de saída de 80ms antes de reposicionar a barra de rolagem,
 *            eliminando saltos visuais abruptos na página que está saindo.
 */
export function ScrollRestorationWatcher() {
  const location = useLocation();
  const navType = useNavigationType();
  const currentKey = `${location.pathname}${location.search}`;
  const prevKeyRef = useRef<string>(currentKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Salva a posição de rolagem ativamente durante a leitura/scroll
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const desktopContainer = document.querySelector<HTMLElement>(
            '#desktop-scroll-container, [data-desktop-scroll="true"]'
          );
          const pos = {
            windowY: window.scrollY || document.documentElement.scrollTop || 0,
            containerY: desktopContainer ? desktopContainer.scrollTop : 0,
          };
          scrollMemory.set(currentKey, pos);
          setSessionSaved(currentKey, pos);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    const desktopContainer = document.querySelector<HTMLElement>(
      '#desktop-scroll-container, [data-desktop-scroll="true"]'
    );
    if (desktopContainer) {
      desktopContainer.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (desktopContainer) {
        desktopContainer.removeEventListener('scroll', onScroll);
      }
    };
  }, [currentKey]);

  // 2. Transição entre rotas
  useEffect(() => {
    const prevKey = prevKeyRef.current;

    // Registra a posição da rota de onde o usuário está saindo
    if (prevKey && prevKey !== currentKey) {
      const desktopContainer = document.querySelector<HTMLElement>(
        '#desktop-scroll-container, [data-desktop-scroll="true"]'
      );
      const pos = {
        windowY: window.scrollY || document.documentElement.scrollTop || 0,
        containerY: desktopContainer ? desktopContainer.scrollTop : 0,
      };
      scrollMemory.set(prevKey, pos);
      setSessionSaved(prevKey, pos);
    }

    // Item 22: Purga qualquer trava de scroll residual
    resetBodyScrollLock();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Item 25: Aguarda os 80ms da animação de saída para reposicionar a barra de rolagem,
    // garantindo que a página saindo não dê salto visual brusco.
    timeoutRef.current = setTimeout(() => {
      const desktopContainer = document.querySelector<HTMLElement>(
        '#desktop-scroll-container, [data-desktop-scroll="true"]'
      );

      // Se a rota possui âncora (#hash), tenta encontrar o elemento destino
      if (location.hash) {
        const targetId = location.hash.replace('#', '');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          prevKeyRef.current = currentKey;
          return;
        }
      }

      // Item 23: Navegação do tipo 'POP' (botão Voltar ou Avançar no histórico)
      if (navType === 'POP') {
        const saved = scrollMemory.get(currentKey) || getSessionSaved(currentKey);
        if (saved && (saved.windowY > 0 || saved.containerY > 0)) {
          window.scrollTo({ top: saved.windowY, left: 0, behavior: 'instant' });
          if (desktopContainer) {
            desktopContainer.scrollTop = saved.containerY;
          }
          prevKeyRef.current = currentKey;
          return;
        }
      }

      // Itens 21 e 24: Navegação PUSH / REPLACE comum reseta ambos para o topo (0, 0)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (desktopContainer) {
        desktopContainer.scrollTop = 0;
      }

      prevKeyRef.current = currentKey;
    }, 85);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentKey, location.hash, navType]);

  return null;
}

export default ScrollRestorationWatcher;
