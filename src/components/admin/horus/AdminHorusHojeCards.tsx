import { useEffect, useState, useCallback } from 'react';
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
  const [periodo, setPeriodo] = useState<'hoje' | 'ontem' | '7d' | '30d' | '90d'>('hoje');
  const [counts, setCounts] = useState({ users: 0, msgs: 0, proactive: 0 });
  const [loading, setLoading] = useState(true);
  
  const [intentLogs, setIntentLogs] = useState<any[]>([]);
  const [proactiveLogs, setProactiveLogs] = useState<any[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  const [openModal, setOpenModal] = useState<'users' | 'msgs' | 'proactive' | null>(null);

  const getDatasPeriodo = useCallback((p: 'hoje' | 'ontem' | '7d' | '30d' | '90d') => {
    const hoje = getHojeBrasilia();
    if (p === 'hoje') return [hoje];
    if (p === 'ontem') {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      return [ontem];
    }
    const dias = p === '7d' ? 7 : p === '30d' ? 30 : 90;
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      return d;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const datas = getDatasPeriodo(periodo);
      const dataMin = datas[datas.length - 1];
      const dataMax = datas[0];

      const isoMin = isoDate(dataMin);
      const isoMax = isoDate(dataMax);

      const startIso = new Date(`${isoMin}T00:00:00-03:00`).toISOString();
      const nextDay = new Date(`${isoMax}T00:00:00-03:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const endIso = nextDay.toISOString();

      // Get all intent logs for today
      const { data: logs } = await supabase
        .from('horus_intent_logs')
        .select('*')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('created_at', { ascending: false });

      const msgs = logs ? logs.length : 0;
      const uniquePhonesList = Array.from(new Set(logs?.map(l => l.telefone).filter(Boolean)));
      setIntentLogs(logs || []);

      const { data: prologs } = await supabase
        .from('horus_proactive_log')
        .select('*')
        .gte('enviada_em', startIso)
        .lt('enviada_em', endIso)
        .order('enviada_em', { ascending: false });

      setProactiveLogs(prologs || []);
      setCounts({
        users: uniquePhonesList.length,
        msgs,
        proactive: prologs?.length || 0
      });
      
      // Fetch users info
      if (uniquePhonesList.length > 0) {
        const { data: wpUsers } = await supabase
          .from('horus_whatsapp_users')
          .select('user_id, phone_e164, nome_preferido, display_name')
          .in('phone_e164', uniquePhonesList);
          
        if (wpUsers && wpUsers.length > 0) {
          const uids = wpUsers.map(u => u.user_id).filter(Boolean);
          try {
            const res = await supabase.functions.invoke('horus', {
              body: { fn: 'admin', action: 'users_info', user_ids: uids }
            });
            if (res.data?.users) {
              const dict: Record<string, any> = {};
              const uidToInfo: Record<string, any> = {};
              res.data.users.forEach((u: any) => { uidToInfo[u.id] = u; });
              
              wpUsers.forEach(u => {
                const ui = uidToInfo[u.user_id] || {};
                dict[u.phone_e164] = {
                  name: ui.name || u.nome_preferido || u.display_name || null,
                  email: ui.email || null,
                  avatar_url: ui.avatar_url || null
                };
              });
              setUsersInfo(dict);
            }
          } catch (e) {
            console.error('Falha ao buscar infos', e);
          }
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [periodo, getDatasPeriodo]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const labels = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    '7d': '7 Dias',
    '30d': '30 Dias',
    '90d': '3 Meses'
  };

  const CARDS = [
    { id: 'users' as const, label: `Pessoas (${labels[periodo]})`, icon: Users, value: counts.users },
    { id: 'msgs' as const, label: `Mensagens (${labels[periodo]})`, icon: MessageSquare, value: counts.msgs },
    { id: 'proactive' as const, label: `Pró-ativas (${labels[periodo]})`, icon: Send, value: counts.proactive },
  ];

  const uniqueUsers = Array.from(new Set(intentLogs.map(l => l.telefone))).map(telefone => {
    const userMsgs = intentLogs.filter(l => l.telefone === telefone);
    return {
      telefone,
      count: userMsgs.length,
      lastMsg: userMsgs[0]
    };
  });

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
        
        <div className="flex items-center gap-1.5">
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="bg-secondary/40 border border-border/60 text-foreground text-xs font-semibold py-1.5 px-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-secondary/60 transition-colors"
          >
            <option value="hoje">Hoje</option>
            <option value="ontem">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 3 meses</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {CARDS.map(({ id, label, icon: Icon, value }) => {
          const isZero = value === 0;
          return (
            <button
              key={id}
              onClick={() => {
                if (!isZero) setOpenModal(id);
              }}
              className={cn(
                "group relative rounded-xl border border-border/60 bg-secondary/30 p-2.5 sm:p-3 text-left overflow-hidden flex flex-col justify-between min-h-[76px] transition-colors",
                !isZero && "hover:bg-secondary/50 cursor-pointer active:opacity-70"
              )}
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
            </button>
          );
        })}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-end sm:items-center justify-center p-4" onClick={() => setOpenModal(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {openModal === 'users' ? 'Pessoas' : openModal === 'msgs' ? 'Mensagens' : 'Pró-ativas'} ({labels[periodo]})
              </h3>
              <button onClick={() => setOpenModal(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {openModal === 'users' && uniqueUsers.map((u, i) => {
                const ui = usersInfo[u.telefone] || {};
                const displayName = ui.name || u.telefone;
                return (
                  <div key={i} className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      {ui.avatar_url ? (
                        <img src={ui.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold truncate">{displayName}</span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0">{u.count} msgs</span>
                        </div>
                        {displayName !== u.telefone && <div className="text-xs text-muted-foreground truncate">{u.telefone}</div>}
                        {ui.email && <div className="text-xs text-muted-foreground truncate">{ui.email}</div>}
                      </div>
                    </div>
                    {u.lastMsg && <div className="text-xs text-muted-foreground line-clamp-2 mt-2 italic">Última: "{u.lastMsg.mensagem}"</div>}
                  </div>
                );
              })}
              
              {openModal === 'msgs' && intentLogs.map((l) => {
                const ui = usersInfo[l.telefone] || {};
                const displayName = ui.name || l.telefone;
                return (
                  <div key={l.id} className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {ui.avatar_url && <img src={ui.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" />}
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-sm mt-1">{l.mensagem}</div>
                    <div className="text-xs mt-2 opacity-70">Intenção: {l.intent} {l.confidence ? `(${(l.confidence * 100).toFixed(1)}%)` : ''}</div>
                  </div>
                );
              })}

              {openModal === 'proactive' && proactiveLogs.map((l) => {
                const ui = usersInfo[l.telefone] || {};
                const displayName = ui.name || l.telefone;
                return (
                  <div key={l.id} className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {ui.avatar_url && <img src={ui.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" />}
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(l.enviada_em).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider">{l.motivo}</div>
                    <div className="text-sm mt-1">{l.mensagem_enviada}</div>
                    <div className="text-xs mt-2 opacity-70">Respondida: {l.respondida ? 'Sim' : 'Não'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
