import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AulaCarouselItem = {
  id: string;
  moduloId: string;
  areaId: string;
  titulo: string;
  objetivo: string | null;
  duracaoMin: number;
  ordem: number;
  moduloTitulo?: string;
};

let cacheMap: Map<string, AulaCarouselItem[]> | null = null;

export function useAprenderHomeLessonsMap() {
  const [lessonsMap, setLessonsMap] = useState<Map<string, AulaCarouselItem[]>>(cacheMap ?? new Map());
  const [loadingMap, setLoadingMap] = useState(!cacheMap);

  useEffect(() => {
    if (cacheMap) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: raw, error } = await supabase
          .from('aprender_aulas')
          .select('id, modulo_id, titulo, objetivo, duracao_est_min, ordem, status, modulo:aprender_modulos!inner(id, area_id, titulo)')
          .eq('status', 'published')
          .order('ordem');

        if (cancelled || error || !raw) {
          if (!cancelled) setLoadingMap(false);
          return;
        }

        const map = new Map<string, AulaCarouselItem[]>();
        (raw as any[]).forEach((item) => {
          const areaId = item.modulo?.area_id;
          if (!areaId) return;

          const aula: AulaCarouselItem = {
            id: item.id,
            moduloId: item.modulo_id,
            areaId,
            titulo: item.titulo,
            objetivo: item.objetivo,
            duracaoMin: item.duracao_est_min || 15,
            ordem: item.ordem,
            moduloTitulo: item.modulo?.titulo,
          };

          const existing = map.get(areaId) ?? [];
          existing.push(aula);
          map.set(areaId, existing);
        });

        if (!cancelled) {
          cacheMap = map;
          setLessonsMap(map);
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

  return { lessonsMap, loadingMap };
}
