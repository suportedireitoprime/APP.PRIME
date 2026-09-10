import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ModuloItem = {
  id: string;
  areaId: string;
  titulo: string;
  resumo: string | null;
  ordem: number;
  primeiraAulaId?: string | null;
  totalAulas?: number;
};

let cacheModulesMap: Map<string, ModuloItem[]> | null = null;
let cacheModulesMapTimestamp = 0;
const MODULES_MAP_TTL_MS = 5 * 60 * 1000;

export function invalidateAprenderAreaModulesMap() {
  cacheModulesMap = null;
  cacheModulesMapTimestamp = 0;
}

export function useAprenderAreaModulesMap() {
  const isFresh = cacheModulesMap && (Date.now() - cacheModulesMapTimestamp < MODULES_MAP_TTL_MS);
  const [modulesMap, setModulesMap] = useState<Map<string, ModuloItem[]>>(isFresh ? cacheModulesMap! : new Map());
  const [loadingMap, setLoadingMap] = useState(!isFresh);

  useEffect(() => {
    if (cacheModulesMap && (Date.now() - cacheModulesMapTimestamp < MODULES_MAP_TTL_MS)) {
      setLoadingMap(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
          setTimeout(() => resolve({ timeout: true }), 10000)
        );

        const fetchPromise = Promise.all([
          supabase
            .from('aprender_modulos')
            .select('id, area_id, titulo, resumo, ordem')
            .order('ordem'),
          supabase
            .from('aprender_aulas')
            .select('id, modulo_id, ordem')
            .eq('status', 'published')
            .order('ordem'),
        ]);

        const raced = await Promise.race([fetchPromise, timeoutPromise]);
        if ('timeout' in raced) {
          if (!cancelled) setLoadingMap(false);
          return;
        }

        const [{ data: rawModulos, error: errMod }, { data: rawAulas }] = raced;

        if (cancelled || errMod || !rawModulos) {
          if (!cancelled) setLoadingMap(false);
          return;
        }

        // Mapear primeira aula por modulo
        const firstLessonByModulo = new Map<string, string>();
        const totalLessonsByModulo = new Map<string, number>();

        (rawAulas ?? []).forEach((aula: { id: string; modulo_id: string; ordem: number }) => {
          if (!aula.modulo_id) return;
          if (!firstLessonByModulo.has(aula.modulo_id)) {
            firstLessonByModulo.set(aula.modulo_id, aula.id);
          }
          totalLessonsByModulo.set(aula.modulo_id, (totalLessonsByModulo.get(aula.modulo_id) ?? 0) + 1);
        });

        const map = new Map<string, ModuloItem[]>();
        (rawModulos as any[]).forEach((item) => {
          const areaId = item.area_id;
          if (!areaId) return;

          const modulo: ModuloItem = {
            id: item.id,
            areaId,
            titulo: item.titulo,
            resumo: item.resumo,
            ordem: item.ordem,
            primeiraAulaId: firstLessonByModulo.get(item.id) ?? null,
            totalAulas: totalLessonsByModulo.get(item.id) ?? 0,
          };

          const existing = map.get(areaId) ?? [];
          existing.push(modulo);
          map.set(areaId, existing);
        });

        if (!cancelled) {
          cacheModulesMap = map;
          cacheModulesMapTimestamp = Date.now();
          setModulesMap(map);
          setLoadingMap(false);
        }
      } catch {
        if (!cancelled) setLoadingMap(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { modulesMap, loadingMap };
}
