// Saúde dos canais de lembrete (push x WhatsApp) nas últimas 24h.
// Nasceu de um problema real: 241 disparos de WhatsApp falhando com
// "no active session found" sem ninguém perceber. Aqui isso vira alerta.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanalSaude {
  canal: string;
  sent: number;
  error: number;
  taxa: number;
  ultimoErro?: string;
}

const rotulo = (canal: string) =>
  canal.startsWith('horus') ? 'WhatsApp' : canal === 'push' ? 'Push' : canal;

export function CanaisSaudeCard() {
  const [linhas, setLinhas] = useState<CanalSaude[]>([]);
  const [tokens, setTokens] = useState({ ativos: 0, mortos: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [{ data: logs }, { data: tk }] = await Promise.all([
      supabase
        .from('reminder_dispatch_log')
        .select('canal, status, error, created_at')
        .gte('created_at', desde)
        .limit(2000),
      supabase.from('device_tokens').select('invalidated_at').limit(2000),
    ]);

    const mapa = new Map<string, CanalSaude>();
    for (const l of logs || []) {
      const canal = (l as any).canal || '?';
      const item: CanalSaude = mapa.get(canal) || { canal, sent: 0, error: 0, taxa: 0 };
      if ((l as any).status === 'sent') item.sent++;
      else {
        item.error++;
        if (!item.ultimoErro && (l as any).error) item.ultimoErro = String((l as any).error).slice(0, 120);
      }
      mapa.set(canal, item);
    }
    const arr = [...mapa.values()].map((i) => ({
      ...i,
      taxa: i.sent + i.error === 0 ? 0 : Math.round((i.sent / (i.sent + i.error)) * 100),
    }));
    arr.sort((a, b) => b.sent + b.error - (a.sent + a.error));
    setLinhas(arr);

    const lista = (tk as any[]) || [];
    setTokens({
      ativos: lista.filter((t) => !t.invalidated_at).length,
      mortos: lista.filter((t) => t.invalidated_at).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const degradado = linhas.some((l) => l.sent + l.error >= 5 && l.taxa < 70);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-body text-sm font-bold">Saúde dos canais · 24h</h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {degradado && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs">
            Um canal está degradado (menos de 70% de sucesso). Os lembretes caem automaticamente
            para push, mas vale reconectar a instância do WhatsApp.
          </p>
        </div>
      )}

      {linhas.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">Nenhum disparo nas últimas 24h.</p>
      ) : (
        <ul className="space-y-2">
          {linhas.map((l) => (
            <li key={l.canal} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {l.taxa >= 70 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {rotulo(l.canal)}
                </span>
                <span className="text-sm tabular-nums">
                  {l.taxa}% <span className="text-muted-foreground">({l.sent}/{l.sent + l.error})</span>
                </span>
              </div>
              {l.ultimoErro && (
                <p className="mt-1 break-words text-[11px] text-muted-foreground">último erro: {l.ultimoErro}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Tokens de push: <strong>{tokens.ativos}</strong> ativos · {tokens.mortos} invalidados
      </p>
    </div>
  );
}
