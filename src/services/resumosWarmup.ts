/**
 * Serviço de pré-aquecimento do Cache de Resumos Jurídicos.
 * Garante abertura instantânea (0ms) das matérias, temas e listas.
 */
import { supabase } from '@/integrations/supabase/client';
import type { AreaRow } from '@/components/resumos/resumosStyles';

let resumosWarmed = false;

export async function warmResumosCache(): Promise<void> {
  if (resumosWarmed || typeof window === 'undefined') return;
  resumosWarmed = true;

  try {
    // 1) Checa se já temos cache persistente
    const stored = localStorage.getItem('resumos_areas_temas_cache');
    let hasValidCache = false;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].temas) {
          hasValidCache = true;
        }
      } catch {
        hasValidCache = false;
      }
    }

    // 2) Se não há cache válido, tenta carregar do bundle offline nativo primeiro (0ms)
    if (!hasValidCache) {
      try {
        const { bundle } = await import('@/services/offlineBundle');
        const bundleRows = await bundle.resumos<{ area: string; tema: string }>();
        if (bundleRows && bundleRows.length > 0) {
          const map = new Map<string, Set<string>>();
          const totalMap = new Map<string, number>();

          for (const r of bundleRows) {
            if (!r.area) continue;
            if (!map.has(r.area)) map.set(r.area, new Set());
            if (r.tema) map.get(r.area)!.add(r.tema);
            totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
          }

          const list: AreaRow[] = Array.from(map.entries())
            .map(([area, temasSet]) => ({
              area,
              total: totalMap.get(area) || 0,
              temas: Array.from(temasSet).sort((a, b) => a.localeCompare(b)),
            }))
            .sort((a, b) => a.area.localeCompare(b.area));

          if (list.length > 0) {
            localStorage.setItem('resumos_areas_temas_cache', JSON.stringify(list));
            hasValidCache = true;
          }
        }
      } catch {
        /* fallback para a rede */
      }
    }

    // 3) Em background idle, atualiza do Supabase para manter tudo fresco sem bloquear nada
    const atualizarRede = async () => {
      try {
        const map = new Map<string, Set<string>>();
        const totalMap = new Map<string, number>();
        let from = 0;
        const step = 1000;
        let gotAny = false;

        while (true) {
          const { data, error } = await (supabase as any)
            .from('resumos_juridicos')
            .select('area, tema')
            .not('area', 'is', null)
            .range(from, from + step - 1);

          if (error) break;
          if (!data || data.length === 0) break;

          gotAny = true;
          for (const r of data as { area: string; tema: string }) {
            if (!map.has(r.area)) map.set(r.area, new Set());
            if (r.tema) map.get(r.area)!.add(r.tema);
            totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
          }

          if (data.length < step) break;
          from += step;
        }

        if (gotAny) {
          const list: AreaRow[] = Array.from(map.entries())
            .map(([area, temasSet]) => ({
              area,
              total: totalMap.get(area) || 0,
              temas: Array.from(temasSet).sort((a, b) => a.localeCompare(b)),
            }))
            .sort((a, b) => a.area.localeCompare(b.area));

          if (list.length > 0) {
            localStorage.setItem('resumos_areas_temas_cache', JSON.stringify(list));
          }
        }
      } catch {
        /* sem internet, mantém cache local */
      }
    };

    const ric = (window as any).requestIdleCallback;
    if (ric) {
      ric(() => void atualizarRede(), { timeout: 3000 });
    } else {
      setTimeout(() => void atualizarRede(), 1500);
    }
  } catch {
    /* falha silenciosa em warmup */
  }
}
