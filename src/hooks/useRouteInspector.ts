import { useState, useEffect, useCallback } from 'react';
import { APP_ROUTES_CATALOG, AppRouteItem } from '@/data/appRoutesCatalog';

const STORAGE_ACTIVE = 'dp_route_inspector_active';
const STORAGE_CURRENT = 'dp_route_inspector_current';
const STORAGE_INDEX = 'dp_route_inspector_index';
const STORAGE_MINIMIZED = 'dp_route_inspector_minimized';
const EVENT_NAME = 'dp-route-inspector-update';

// Lista de rotas ativas (excluindo wildcard '*') ordenadas em ordem alfabética (A-Z)
export const INSPECTOR_ROUTES = APP_ROUTES_CATALOG.filter((r) => r.path !== '*').sort((a, b) =>
  a.path.localeCompare(b.path)
);

export function useRouteInspector() {
  const [isActive, setIsActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_ACTIVE) === 'true';
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const storedIdx = sessionStorage.getItem(STORAGE_INDEX);
    if (storedIdx !== null) {
      const parsed = parseInt(storedIdx, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < INSPECTOR_ROUTES.length) {
        return parsed;
      }
    }
    const storedPath = sessionStorage.getItem(STORAGE_CURRENT);
    if (storedPath) {
      const idx = INSPECTOR_ROUTES.findIndex((r) => r.path === storedPath);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_MINIMIZED) === 'true';
  });

  useEffect(() => {
    const handleSync = () => {
      setIsActive(sessionStorage.getItem(STORAGE_ACTIVE) === 'true');
      setIsMinimized(sessionStorage.getItem(STORAGE_MINIMIZED) === 'true');

      const storedIdx = sessionStorage.getItem(STORAGE_INDEX);
      if (storedIdx !== null) {
        const parsed = parseInt(storedIdx, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < INSPECTOR_ROUTES.length) {
          setCurrentIndex(parsed);
          return;
        }
      }
      const storedPath = sessionStorage.getItem(STORAGE_CURRENT);
      if (storedPath) {
        const idx = INSPECTOR_ROUTES.findIndex((r) => r.path === storedPath);
        if (idx >= 0) {
          setCurrentIndex(idx);
        }
      }
    };

    window.addEventListener(EVENT_NAME, handleSync);
    return () => window.removeEventListener(EVENT_NAME, handleSync);
  }, []);

  const dispatchUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  };

  const setRouteByIndex = useCallback((index: number) => {
    const safeIndex = ((index % INSPECTOR_ROUTES.length) + INSPECTOR_ROUTES.length) % INSPECTOR_ROUTES.length;
    const target = INSPECTOR_ROUTES[safeIndex];
    if (!target) return;
    sessionStorage.setItem(STORAGE_INDEX, safeIndex.toString());
    sessionStorage.setItem(STORAGE_CURRENT, target.path);
    setCurrentIndex(safeIndex);
    dispatchUpdate();
  }, []);

  const startInspector = useCallback((path?: string) => {
    let index = 0;
    if (path) {
      const foundIdx = INSPECTOR_ROUTES.findIndex((r) => r.path === path || r.exampleUrl === path);
      if (foundIdx >= 0) index = foundIdx;
    }
    const target = INSPECTOR_ROUTES[index];
    sessionStorage.setItem(STORAGE_ACTIVE, 'true');
    sessionStorage.setItem(STORAGE_INDEX, index.toString());
    sessionStorage.setItem(STORAGE_CURRENT, target ? target.path : '/');
    sessionStorage.setItem(STORAGE_MINIMIZED, 'false');
    setIsActive(true);
    setCurrentIndex(index);
    setIsMinimized(false);
    dispatchUpdate();
  }, []);

  const setCurrentRoutePath = useCallback(
    (path: string) => {
      const foundIdx = INSPECTOR_ROUTES.findIndex((r) => r.path === path);
      if (foundIdx >= 0) {
        setRouteByIndex(foundIdx);
      } else {
        sessionStorage.setItem(STORAGE_CURRENT, path);
        dispatchUpdate();
      }
    },
    [setRouteByIndex]
  );

  const closeInspector = useCallback(() => {
    sessionStorage.removeItem(STORAGE_ACTIVE);
    sessionStorage.removeItem(STORAGE_CURRENT);
    sessionStorage.removeItem(STORAGE_INDEX);
    setIsActive(false);
    dispatchUpdate();
  }, []);

  const toggleMinimize = useCallback(() => {
    const next = !isMinimized;
    sessionStorage.setItem(STORAGE_MINIMIZED, next ? 'true' : 'false');
    setIsMinimized(next);
    dispatchUpdate();
  }, [isMinimized]);

  const safeIndex = Math.max(0, Math.min(currentIndex, INSPECTOR_ROUTES.length - 1));
  const currentRouteItem: AppRouteItem = INSPECTOR_ROUTES[safeIndex] || INSPECTOR_ROUTES[0];
  const currentPath = currentRouteItem.path;

  return {
    isActive,
    currentPath,
    currentIndex: safeIndex,
    totalRoutes: INSPECTOR_ROUTES.length,
    currentRouteItem,
    isMinimized,
    startInspector,
    setCurrentRoutePath,
    setRouteByIndex,
    closeInspector,
    toggleMinimize,
    routes: INSPECTOR_ROUTES,
  };
}
