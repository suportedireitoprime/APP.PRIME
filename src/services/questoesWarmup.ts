/**
 * Serviço de pré-aquecimento do Cache e Dados de Questões.
 * Garante que cargos, estatísticas de desempenho e rotas principais
 * estejam armazenados em memória e localStorage para abertura 0ms.
 */
import { supabase } from '@/integrations/supabase/client';
import { routePrefetch } from '@/lib/routePrefetch';

let questoesWarmed = false;

export function warmQuestoesStartup(): void {
  if (questoesWarmed || typeof window === 'undefined') return;
  questoesWarmed = true;

  const run = async () => {
    try {
      // 1) Pré-carrega o chunk JS da rota
      try {
        routePrefetch.questoes();
      } catch {
        /* noop */
      }

      // 2) Pré-aquecimento dos cargos de questões
      const cachedCargos = localStorage.getItem('questoes_cargos_cache');
      if (!cachedCargos) {
        const { data: cargos } = await (supabase as any)
          .from('questoes_cargos')
          .select('*')
          .eq('ativo', true)
          .order('ordem');

        if (cargos && cargos.length > 0) {
          try {
            localStorage.setItem('questoes_cargos_cache', JSON.stringify(cargos));
          } catch {
            /* storage quota / privado */
          }
        }
      }

      // 3) Pré-aquecimento das estatísticas de desempenho se houver sessão ativa
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const cacheKey = `questoes_desempenho_cache:${user.id}`;
        const cachedDesempenho = localStorage.getItem(cacheKey);
        if (!cachedDesempenho) {
          const { data: desempenho } = await (supabase as any).rpc('questoes_desempenho');
          if (desempenho) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(desempenho));
            } catch {
              /* storage quota / privado */
            }
          }
        }
      }
    } catch {
      /* falha silenciosa no warmup em background */
    }
  };

  const ric = (window as any).requestIdleCallback;
  if (ric) {
    ric(() => void run(), { timeout: 2500 });
  } else {
    setTimeout(() => void run(), 800);
  }
}
