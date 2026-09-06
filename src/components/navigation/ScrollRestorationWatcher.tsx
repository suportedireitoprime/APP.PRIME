import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { cancelMouseDragScroll } from '@/lib/enableMouseDragScroll';
import { haptic } from '@/lib/nativeHaptics';

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
 * Observador global de Scroll Restoration (Itens 21 a 35):
 * - Item 21: Centraliza a restauração e o reset de rolagem no nível do roteador.
 * - Item 22: Desbloqueia travas residuais de overflow deixadas por modais/sheets (`resetBodyScrollLock`).
 * - Item 23: Preserva a posição exata de leitura ao navegar de volta (`POP`), evitando volta forçada ao topo.
 * - Item 24: Sincroniza tanto `window` quanto o container interno Desktop (`#desktop-scroll-container`).
 * - Item 25: Aguarda o término da animação de saída de 80ms antes de reposicionar a barra de rolagem.
 * - Item 27: Observador assíncrono (MutationObserver) para âncoras/hash (#art-5).
 * - Item 28: Cancela arraste de mouse residual na transição de rotas (`cancelMouseDragScroll`).
 * - Item 29: Força o blur de campos de texto focados para restaurar o viewport mobile.
 * - Item 31: Dispara micro-feedback háptico ao concluir a rolagem/transição (`haptic.light()`).
 * - Item 34: Recalcula offsets e âncoras na mudança de orientação (portrait/landscape) em tablets.
 * - Item 35: Estanca o momentum scrolling inercial no iOS durante os 80ms de transição de rota.
 */
export function ScrollRestorationWatcher() {
  const location = useLocation();
  const navType = useNavigationType();
  const currentKey = `${location.pathname}${location.search}`;
  const prevKeyRef = useRef<string>(currentKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

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

  // Item 34: Recalcula posicionamento ao alternar orientação (Portrait / Landscape em Tablets/iPads)
  useEffect(() => {
    const handleOrientationChange = () => {
      requestAnimationFrame(() => {
        if (location.hash) {
          const targetId = location.hash.replace('#', '');
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY > maxScroll && maxScroll > 0) {
          window.scrollTo({ top: maxScroll, behavior: 'instant' });
        }
      });
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange, { passive: true });
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [location.hash]);

  // 2. Transição entre rotas
  useEffect(() => {
    const prevKey = prevKeyRef.current;

    // Item 29: Força o blur de qualquer input ativo para colapsar teclado virtual e restaurar o viewport móvel
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Item 28: Cancela qualquer estado de clique e arraste horizontal ativo
    cancelMouseDragScroll();

    // Limpa observer de âncora anterior se ainda ativo
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

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

    // Item 35: Estanca o momentum scrolling inercial no iOS durante a janela de transição de 80ms
    const htmlEl = document.documentElement;
    const prevOverflow = htmlEl.style.overflow;
    htmlEl.style.overflow = 'hidden';

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Item 25: Aguarda os 80ms da animação de saída para reposicionar a barra de rolagem,
    // garantindo que a página saindo não dê salto visual brusco.
    timeoutRef.current = setTimeout(() => {
      // Restaura overflow do documento após o término do exit de 80ms
      htmlEl.style.overflow = prevOverflow;

      const desktopContainer = document.querySelector<HTMLElement>(
        '#desktop-scroll-container, [data-desktop-scroll="true"]'
      );

      // Item 27: Se a rota possui âncora (#hash), rola até ela ou aguarda montagem assíncrona
      if (location.hash) {
        const targetId = location.hash.replace('#', '');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          haptic.light(); // Item 31
          prevKeyRef.current = currentKey;
          return;
        }

        // Aguarda montagem dinâmica (ex: artigos ou súmulas carregados assincronamente)
        const obs = new MutationObserver(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            haptic.light(); // Item 31
            obs.disconnect();
            if (observerRef.current === obs) observerRef.current = null;
          }
        });
        observerRef.current = obs;
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          obs.disconnect();
          if (observerRef.current === obs) observerRef.current = null;
        }, 2500);

        prevKeyRef.current = currentKey;
        return;
      }

      // Item 23: Navegação do tipo 'POP' (botão Voltar ou Avançar no histórico)
      if (navType === 'POP') {
        const saved = scrollMemory.get(currentKey) || getSessionSaved(currentKey);
        if (saved && (saved.windowY > 0 || saved.containerY > 0)) {
          window.scrollTo({ top: saved.windowY, left: 0, behavior: 'instant' });
          if (desktopContainer) {
            desktopContainer.scrollTop = saved.containerY;
          }
          haptic.light(); // Item 31
          prevKeyRef.current = currentKey;
          return;
        }
      }

      // Itens 21 e 24: Navegação PUSH / REPLACE comum reseta ambos para o topo (0, 0)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (desktopContainer) {
        desktopContainer.scrollTop = 0;
      }
      haptic.light(); // Item 31

      prevKeyRef.current = currentKey;
    }, 85);

    return () => {
      htmlEl.style.overflow = prevOverflow;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [currentKey, location.hash, navType]);

  return null;
}

export default ScrollRestorationWatcher;
