import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisualizacaoRow {
  animacao_slug: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

let vistasMemorySet = new Set<string>();
let vistasLoadedUserId: string | null = null;
const vistasListeners = new Set<() => void>();

function notifyVistas() {
  for (const fn of vistasListeners) fn();
}

export function useAnimacoesVistas() {
  const [userId, setUserId] = useState<string | null>(vistasLoadedUserId);
  const [vistasSet, setVistasSet] = useState<Set<string>>(() => vistasMemorySet);

  useEffect(() => {
    const sync = () => setVistasSet(new Set(vistasMemorySet));
    vistasListeners.add(sync);
    return () => {
      vistasListeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const schedule = (fn: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = window.requestIdleCallback(fn, { timeout: 600 });
        return () => window.cancelIdleCallback(id);
      }
      const t = setTimeout(fn, 120);
      return () => clearTimeout(t);
    };

    const cancel = schedule(() => {
      supabase.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        const uid = data?.session?.user?.id ?? null;
        setUserId(uid);
        if (!uid) {
          if (vistasLoadedUserId !== null) {
            vistasMemorySet = new Set();
            vistasLoadedUserId = null;
            notifyVistas();
          }
          return;
        }
        if (vistasLoadedUserId === uid) return;
        const { data: rows, error } = await db
          .from('animacoes_visualizacoes')
          .select('animacao_slug')
          .eq('user_id', uid);
        if (!active) return;
        if (!error && Array.isArray(rows)) {
          vistasMemorySet = new Set((rows as VisualizacaoRow[]).map((r) => r.animacao_slug));
          vistasLoadedUserId = uid;
          notifyVistas();
        }
      });
    });

    return () => {
      active = false;
      cancel();
    };
  }, []);

  const marcarComoVista = useCallback(
    async (slug: string) => {
      if (!slug || vistasMemorySet.has(slug)) return;
      vistasMemorySet = new Set(vistasMemorySet).add(slug);
      notifyVistas();

      if (!userId) return;
      await db.from('animacoes_visualizacoes').upsert(
        { animacao_slug: slug, user_id: userId, visto_em: new Date().toISOString() },
        { onConflict: 'animacao_slug,user_id' }
      );
    },
    [userId]
  );

  return { userId, vistasSet, marcarComoVista };
}
