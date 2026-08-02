// Funil de áreas: quais telas os usuários realmente abrem.
// Lê `app_events`, que passou a receber os eventos de área (`*_aberta`).

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Linha { evento: string; total: number; usuarios: number }

const bonito = (nome: string) =>
  nome.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export function AreasFunilCard({ dias = 7 }: { dias?: number }) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const desde = new Date(Date.now() - dias * 86400000).toISOString();
    const { data } = await supabase
      .from('app_events' as any)
      .select('event_name, user_id')
      .like('event_name', '%_aberta')
      .gte('created_at', desde)
      .limit(5000);

    const mapa = new Map<string, { total: number; users: Set<string> }>();
    for (const e of (data as any[]) || []) {
      const item = mapa.get(e.event_name) || { total: 0, users: new Set<string>() };
      item.total++;
      if (e.user_id) item.users.add(e.user_id);
      mapa.set(e.event_name, item);
    }
    const arr = [...mapa.entries()]
      .map(([evento, v]) => ({ evento, total: v.total, usuarios: v.users.size }))
      .sort((a, b) => b.total - a.total);
    setLinhas(arr);
    setLoading(false);
  }, [dias]);

  useEffect(() => { load(); }, [load]);

  const max = Math.max(1, ...linhas.map((l) => l.total));

  return (
    <div className="rounded-2xl border border-border/30 bg-secondary/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <BarChart3 className="h-4 w-4 text-primary" /> Áreas mais acessadas · {dias}d
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {linhas.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">
          Sem registros ainda — os eventos de área começam a aparecer conforme os usuários
          atualizarem o app.
        </p>
      ) : (
        <ul className="space-y-2">
          {linhas.slice(0, 12).map((l) => (
            <li key={l.evento}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{bonito(l.evento.replace(/_aberta$/, ''))}</span>
                <span className="tabular-nums text-muted-foreground">
                  {l.total} · {l.usuarios} usuários
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(l.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
