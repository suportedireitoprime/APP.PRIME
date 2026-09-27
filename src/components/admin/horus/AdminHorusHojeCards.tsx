import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const getHojeBrasilia = (): Date => {
  const agora = new Date();
  const spStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
  const [ano, mes, dia] = spStr.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

const isoDate = (d: Date) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
};

export function AdminHorusHojeCards() {
  const [counts, setCounts] = useState({ users: 0, msgs: 0, proactive: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const hoje = getHojeBrasilia();
      const iso = isoDate(hoje);
      const startIso = new Date(`${iso}T00:00:00-03:00`).toISOString();
      const nextDay = new Date(`${iso}T00:00:00-03:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const endIso = nextDay.toISOString();

      // Get all intent logs for today
      const { data: logs } = await supabase
        .from('horus_intent_logs')
        .select('telefone, id')
        .gte('created_at', startIso)
        .lt('created_at', endIso);

      const msgs = logs ? logs.length : 0;
      const uniquePhones = new Set(logs?.map(l => l.telefone) || []).size;

      const { count: proactive } = await supabase
        .from('horus_proactive_log')
        .select('id', { count: 'exact', head: true })
        .gte('enviada_em', startIso)
        .lt('enviada_em', endIso);

      setCounts({
        users: uniquePhones,
        msgs,
        proactive: proactive || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const CARDS = [
    { id: 'users', label: 'Pessoas (Hoje)', icon: Users, value: counts.users },
    { id: 'msgs', label: 'Mensagens (Hoje)', icon: MessageSquare, value: counts.msgs },
    { id: 'proactive', label: 'Pró-ativas (Hoje)', icon: Send, value: counts.proactive },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase opacity-70">
            Visão Geral do Horus
          </h2>
          {loading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {CARDS.map(({ id, label, icon: Icon, value }) => {
          const isZero = value === 0;
          return (
            <div
              key={id}
              className="group relative rounded-xl border border-border/60 bg-secondary/30 p-2.5 sm:p-3 text-left overflow-hidden flex flex-col justify-between min-h-[76px]"
            >
              <div className="flex items-start justify-between w-full">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-[22px] font-extrabold tracking-tight leading-none tabular-nums",
                      isZero ? "text-zinc-600" : "text-foreground"
                    )}>
                      {value}
                    </span>
                  </div>
                </div>
              </div>
              <div className="font-body text-[10px] sm:text-[11px] font-semibold text-muted-foreground mt-2 leading-tight">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
