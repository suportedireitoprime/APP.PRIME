import { useState, useEffect, useCallback } from 'react';
import { APP_ROUTES_CATALOG, AppRouteItem } from '@/data/appRoutesCatalog';

const STORAGE_ACTIVE = 'dp_route_inspector_active';
const STORAGE_CURRENT = 'dp_route_inspector_current';
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

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return sessionStorage.getItem(STORAGE_CURRENT) || '/';
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_MINIMIZED) === 'true';
  });

  useEffect(() => {
    const handleSync = () => {
      setIsActive(sessionStorage.getItem(STORAGE_ACTIVE) === 'true');
      setCurrentPath(sessionStorage.getItem(STORAGE_CURRENT) || '/');
      setIsMinimized(sessionStorage.getItem(STORAGE_MINIMIZED) === 'true');
    };

    window.addEventListener(EVENT_NAME, handleSync);
    return () => window.removeEventListener(EVENT_NAME, handleSync);
  }, []);

  const dispatchUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  };

  const startInspector = useCallback((path: string) => {
    sessionStorage.setItem(STORAGE_ACTIVE, 'true');
    sessionStorage.setItem(STORAGE_CURRENT, path);
    sessionStorage.setItem(STORAGE_MINIMIZED, 'false');
    setIsActive(true);
    setCurrentPath(path);
    setIsMinimized(false);
    dispatchUpdate();
  }, []);

  const setCurrentRoutePath = useCallback((path: string) => {
    sessionStorage.setItem(STORAGE_CURRENT, path);
    setCurrentPath(path);
    dispatchUpdate();
  }, []);

  const closeInspector = useCallback(() => {
    sessionStorage.removeItem(STORAGE_ACTIVE);
    sessionStorage.removeItem(STORAGE_CURRENT);
    setIsActive(false);
    dispatchUpdate();
  }, []);

  const toggleMinimize = useCallback(() => {
    const next = !isMinimized;
    sessionStorage.setItem(STORAGE_MINIMIZED, next ? 'true' : 'false');
    setIsMinimized(next);
    dispatchUpdate();
  }, [isMinimized]);

  // Encontra índice atual na lista ordenada A-Z
  const currentIndex = INSPECTOR_ROUTES.findIndex((r) => r.path === currentPath);
  const currentRouteItem: AppRouteItem | undefined =
    currentIndex >= 0 ? INSPECTOR_ROUTES[currentIndex] : INSPECTOR_ROUTES[0];

  return {
    isActive,
    currentPath,
    currentIndex: Math.max(0, currentIndex),
    totalRoutes: INSPECTOR_ROUTES.length,
    currentRouteItem,
    isMinimized,
    startInspector,
    setCurrentRoutePath,
    closeInspector,
    toggleMinimize,
    routes: INSPECTOR_ROUTES,
  };
}
