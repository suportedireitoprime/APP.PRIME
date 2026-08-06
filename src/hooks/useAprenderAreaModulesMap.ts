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

export function useAprenderAreaModulesMap() {
  const [modulesMap, setModulesMap] = useState<Map<string, ModuloItem[]>>(cacheModulesMap ?? new Map());
  const [loadingMap, setLoadingMap] = useState(!cacheModulesMap);

  useEffect(() => {
    if (cacheModulesMap) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ data: rawModulos, error: errMod }, { data: rawAulas }] = await Promise.all([
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
