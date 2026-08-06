import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ModuloItem = {
  id: string;
  areaId: string;
  titulo: string;
  resumo: string | null;
  ordem: number;
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
        const { data: raw, error } = await supabase
          .from('aprender_modulos')
          .select('id, area_id, titulo, resumo, ordem')
          .order('ordem');

        if (cancelled || error || !raw) {
          if (!cancelled) setLoadingMap(false);
          return;
        }

        const map = new Map<string, ModuloItem[]>();
        (raw as any[]).forEach((item) => {
          const areaId = item.area_id;
          if (!areaId) return;

          const modulo: ModuloItem = {
            id: item.id,
            areaId,
            titulo: item.titulo,
            resumo: item.resumo,
            ordem: item.ordem,
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
