import { useCallback, useEffect, useState } from 'react';
import { Radio, UserPlus, Sparkles, Loader2, Mail, BarChart3, ChevronRight, Crown, Zap, DollarSign } from 'lucide-react';
import { SiGoogle, SiApple } from 'react-icons/si';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { UserDossieSheet } from './UserDossieSheet';
import { rotaParaFuncao } from '@/lib/rotaFuncoes';

type CardId = 'online5m' | 'online' | 'cadastros' | 'paywall' | 'trial';
type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d';

interface Row {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  userId?: string | null;
  email?: string | null;
  provider?: string | null;
  acessos?: number | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  funcaoPreferida?: string | null;
}

const ProviderTag = ({ provider }: { provider?: string | null }) => {
  if (!provider) return null;
  const p = provider.toLowerCase();
  const cfg = p.includes('google')
    ? {
        label: 'Google',
        node: <SiGoogle className="w-3 h-3" />,
        bg: 'bg-[hsl(var(--provider-google))]',
        fg: 'text-[hsl(var(--provider-google-foreground))]',
        border: 'border-[hsl(var(--provider-google))]/30',
      }
    : p.includes('apple')
      ? {
          label: 'Apple',
          node: <SiApple className="w-3 h-3" />,
          bg: 'bg-[hsl(var(--provider-apple))]',
          fg: 'text-[hsl(var(--provider-apple-foreground))]',
          border: 'border-[hsl(var(--provider-apple))]/30',
        }
      : {
          label: 'E-mail',
          node: <Mail className="w-3 h-3" />,
          bg: 'bg-[hsl(var(--provider-email))]',
          fg: 'text-[hsl(var(--provider-email-foreground))]',
          border: 'border-[hsl(var(--provider-email))]/30',
        };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] font-body text-[10px] shrink-0',
        cfg.bg,
        cfg.fg,
        cfg.border,
      )}
    >
      {cfg.node}
      {cfg.label}
    </span>
  );
};

const dayRange = (d: Date) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

type Seen = { count: number; keys: string[] };

const seenStorageKey = (id: CardId, d: Date) => `admin_hoje_seen_${id}_${isoDate(d)}`;

const readSeen = (id: CardId, d: Date): Seen => {
  try {
    const raw = localStorage.getItem(seenStorageKey(id, d));
    if (!raw) return { count: 0, keys: [] };
    const parsed = JSON.parse(raw);
    return { count: parsed.count || 0, keys: Array.isArray(parsed.keys) ? parsed.keys : [] };
  } catch {
    return { count: 0, keys: [] };
  }
};

const writeSeen = (id: CardId, d: Date, seen: Seen) => {
  try {
    localStorage.setItem(seenStorageKey(id, d), JSON.stringify(seen));
  } catch {
    /* ignore */
  }
};

export function AdminHojeCards() {
  const [counts, setCounts] = useState<Record<CardId | 'trialValor', number>>({ online5m: 0, online: 0, cadastros: 0, paywall: 0, trial: 0, trialValor: 0 });
  const [seenCounts, setSeenCounts] = useState<Record<CardId, number>>(() => {
    const hoje = new Date();
    return {
      online5m: readSeen('online5m', hoje).count,
      online: readSeen('online', hoje).count,
      cadastros: readSeen('cadastros', hoje).count,
      paywall: readSeen('paywall', hoje).count,
      trial: readSeen('trial', hoje).count,
    };
  });
  const [novosKeys, setNovosKeys] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<CardId | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [filtroUser, setFiltroUser] = useState<'todos' | 'gratuitos' | 'assinantes'>('todos');
  const [loading, setLoading] = useState(false);
  const [dossie, setDossie] = useState<Row | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoId>('hoje');
  const [dia, setDia] = useState<Date>(() => new Date());
  const [totaisOpen, setTotaisOpen] = useState(false);
  const [totais, setTotais] = useState<any>(null);
  const [totaisLoading, setTotaisLoading] = useState(false);
  const [provOpen, setProvOpen] = useState<string | null>(null);
  const [provRows, setProvRows] = useState<Row[]>([]);
  const [provLoading, setProvLoading] = useState(false);


  const abrirProvider = useCallback(
    async (p: string) => {
      setProvOpen(p);
      setProvLoading(true);
      setProvRows([]);
      try {
        const { data } = await supabase.rpc('admin_lista_provider' as any, {
          _tipo: open || 'cadastros',
          _provider: p,
        });
        setProvRows(
          ((data as any[]) || []).map((r) => ({
            key: r.user_id,
            userId: r.user_id,
            title: r.nome || 'Usuário',
            email: r.email,
            subtitle: r.email,
            provider: r.provider,
            meta: r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '',
          })),
        );
      } finally {
        setProvLoading(false);
      }
    },
    [open],
  );

  const abrirTotais = useCallback(async () => {
    if (!open) return;
    setTotaisOpen(true);
    setTotaisLoading(true);
    setTotais(null);
    try {
      const { data } = await supabase.rpc('admin_totais' as any, { _tipo: open });
      setTotais(data as any);
    } finally {
      setTotaisLoading(false);
    }
  }, [open]);

  const getDatasPeriodo = useCallback((p: PeriodoId) => {
    const hoje = new Date();
    if (p === 'hoje') return [hoje];
    if (p === 'ontem') {
      const ontem = new Date(); ontem.setDate(hoje.getDate() - 1); return [ontem];
    }
    const dias = p === '7d' ? 7 : 30;
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(); d.setDate(hoje.getDate() - i); return d;
    });
  }, []);

  const load = useCallback(async () => {
    const datas = getDatasPeriodo(periodo);
    
    // Fetch metrics and trials for all dates in the period
    const metricasPromises = datas.map(d => supabase.rpc('admin_metricas_dia' as any, { _dia: isoDate(d) }));
    const list5mPromise = supabase.rpc('admin_lista_dia' as any, { _tipo: 'online5m', _dia: isoDate(datas[0]) }); // only makes sense for 'hoje', but we pass datas[0] anyway
    const listOnlinePromise = supabase.rpc('admin_lista_dia' as any, { _tipo: 'online', _dia: isoDate(datas[0]) });
    const trialPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: 'trial', _dia: isoDate(d) }));

    const metricasResults = await Promise.all(metricasPromises);
    const { data: list5m } = await list5mPromise;
    const { data: listOnline } = await listOnlinePromise;
    const trialResults = await Promise.all(trialPromises);
    
    let totalCadastros = 0;
    let totalPaywall = 0;
    let totalTrial = 0;
    let totalTrialValor = 0;

    metricasResults.forEach(({ data }) => {
      const m = (data as any) || {};
      totalCadastros += m.cadastros || 0;
      totalPaywall += m.paywall || 0;
      totalTrial += m.trial || 0;
    });

    trialResults.forEach(({ data }) => {
      const trials = (data as any[]) || [];
      trials.forEach(r => {
        const subtitle = r.subtitle || '';
        const title = r.title || '';
        const combined = (subtitle + ' ' + title).toLowerCase();
        
        if (combined.includes('anual')) {
          totalTrialValor += 297;
        } else if (combined.includes('mensal')) {
          totalTrialValor += 39.90;
        } else {
          // If we can't tell (e.g. base_plan_id is null and display_name hides product_id),
          // assume Annual since the main CTA in PremiumGate forces ?plano=anual&trial=1
          totalTrialValor += 297;
        }
      });
    });

    // online and online5m only make sense for 'hoje' conceptually, but we sum them if it's multiple days? 
    // Actually, distinct users online over 7 days is hard to calculate without a distinct query.
    // For now, if not 'hoje', we'll just show 0 or the last known for online.
    const count5m = periodo === 'hoje' ? ((list5m as any[]) || []).filter(r => r.email !== 'wn7corporation@gmail.com' && r.email !== 'suporte@direitoprime.com.br' && r.email !== 'wn7juridico@gmail.com').length : 0;
    const countOnline = periodo === 'hoje' ? ((listOnline as any[]) || []).filter(r => r.email !== 'wn7corporation@gmail.com' && r.email !== 'suporte@direitoprime.com.br' && r.email !== 'wn7juridico@gmail.com').length : 0;

    const novos: Record<CardId | 'trialValor', number> = { 
      online5m: count5m, 
      online: countOnline, 
      cadastros: totalCadastros, 
      paywall: totalPaywall,
      trial: totalTrial,
      trialValor: totalTrialValor
    };
    setCounts(novos);
    
    if (periodo === 'hoje') {
      (['online5m', 'online', 'cadastros', 'paywall', 'trial'] as CardId[]).forEach((id) => {
        if (!localStorage.getItem(seenStorageKey(id, datas[0]))) {
          writeSeen(id, datas[0], { count: novos[id], keys: [] });
          setSeenCounts((c) => ({ ...c, [id]: novos[id] }));
        }
      });
    } else {
      setSeenCounts({ online5m: 0, online: 0, cadastros: 0, paywall: 0, trial: 0 });
    }
  }, [periodo, getDatasPeriodo]);


  useEffect(() => {
    load();
    if (periodo === 'hoje') {
      const t = setInterval(load, 30_000);
      return () => clearInterval(t);
    }
  }, [load, periodo]);

  const fetchRows = useCallback(async (id: CardId, date: Date) => {
    // If period is not 'hoje' or 'ontem', we'd need to fetch multiple days for the list as well.
    // To keep it simple, if they open the card, we fetch the first day of the period, OR we fetch all days.
    // Let's fetch all days if possible.
    setLoading(true);
    setRows([]);
    try {
      const datas = getDatasPeriodo(periodo);
      const listPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: id, _dia: isoDate(d) }));
      const results = await Promise.all(listPromises);
      
      let allLists: any[] = [];
      results.forEach(({ data }) => {
        allLists = allLists.concat((data as any[]) || []);
      });

      // Deduplicate by key (since same user could be online on multiple days)
      const uniqueMap = new Map();
      allLists.forEach(r => {
        if (!uniqueMap.has(r.key)) uniqueMap.set(r.key, r);
      });
      const list = Array.from(uniqueMap.values()).map((r) => ({
        key: r.key,
        userId: r.user_id,
        title: r.title || 'Usuário',
        email: r.email || null,
        subtitle: (id === 'online' || id === 'online5m') ? rotaParaFuncao(r.subtitle).label : r.subtitle,
        meta: hora(r.at),
        acessos: typeof r.acessos === 'number' ? r.acessos : null,
        avatarUrl: r.avatar_url,
        isPremium: r.is_premium,
      })).filter(r => r.email !== 'wn7corporation@gmail.com' && r.email !== 'suporte@direitoprime.com.br' && r.email !== 'wn7juridico@gmail.com');
      setRows(list);
      if (sameDay(date, new Date())) {
        const seen = readSeen(id, date);
        const anteriores = new Set(seen.keys);
        const novos = seen.keys.length === 0 ? new Set<string>() : new Set(list.filter((r) => !anteriores.has(r.key)).map((r) => r.key));
        setNovosKeys(novos);
        writeSeen(id, date, { count: list.length, keys: list.map((r) => r.key) });
        setSeenCounts((c) => ({ ...c, [id]: list.length }));
      } else {
        setNovosKeys(new Set());
      }
      const ids = Array.from(new Set(list.map((r) => r.userId).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: provs } = await supabase.rpc('admin_user_auth_providers' as any, { _ids: ids });
        const map = new Map<string, string>(((provs as any[]) || []).map((p) => [p.user_id, p.provider]));

        // Fetch favorite function (most frequent initial_route in user_sessions)
        const { data: sessions } = await supabase.from('user_sessions')
          .select('user_id, initial_route')
          .in('user_id', ids);

        const mapFav = new Map<string, string>();
        if (sessions && sessions.length > 0) {
          ids.forEach(uid => {
            const userSessions = sessions.filter(s => s.user_id === uid && s.initial_route);
            if (userSessions.length > 0) {
              const freq: Record<string, number> = {};
              userSessions.forEach(s => { freq[s.initial_route!] = (freq[s.initial_route!] || 0) + 1; });
              const fav = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
              mapFav.set(uid, rotaParaFuncao(fav).label);
            }
          });
        }

        setRows((current) => current.map((r) => ({ 
          ...r, 
          provider: map.get(r.userId || r.key) || r.provider,
          funcaoPreferida: mapFav.get(r.userId || r.key)
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [periodo, getDatasPeriodo]);


  const openCard = useCallback((id: CardId) => {
    setOpen(id);
    fetchRows(id, new Date()); // Date argument is mostly ignored now, uses getDatasPeriodo
  }, [fetchRows]);

  // Deep link vindo do push do admin: /admin-funcoes?card=cadastros|trial|online
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const card = params.get('card');
    if (card === 'cadastros' || card === 'trial' || card === 'online' || card === 'online5m' || card === 'paywall') {
      openCard(card as CardId);
      params.delete('card');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
  }, [openCard]);




  const selecionarPeriodo = (p: PeriodoId) => {
    setPeriodo(p);
    setOpen(null); // Fechar a aba atual se mudar o período
  };

  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  });


  const CARDS: { id: CardId; label: string; icon: any }[] = [
    { id: 'online5m', label: 'Online 5 min', icon: Zap },
    { id: 'online', label: 'Online hoje', icon: Radio },
    { id: 'cadastros', label: 'Cadastrados', icon: UserPlus },
    { id: 'paywall', label: 'Viu planos', icon: Sparkles },
    { id: 'trial', label: 'Iniciou teste', icon: DollarSign },
  ];

  const titles: Record<CardId, string> = {
    online5m: 'Online (Últimos 5 min)',
    online: 'Online',
    cadastros: 'Cadastrados',
    paywall: 'Visualizaram Planos',
    trial: 'Iniciaram assinatura teste',
  };

  const rotuloPeriodo = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
  }[periodo];

  const filteredRows = rows.filter(r => {
    if (filtroUser === 'gratuitos') return !r.isPremium;
    if (filtroUser === 'assinantes') return r.isPremium;
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase opacity-70">Visão Geral</h2>
        <select 
          value={periodo} 
          onChange={(e) => selecionarPeriodo(e.target.value as PeriodoId)}
          className="bg-secondary/40 border border-border/60 text-foreground text-xs font-semibold py-1.5 px-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-secondary/60 focus:border-primary/50 transition-colors"
        >
          <option value="hoje">Hoje</option>
          <option value="ontem">Ontem</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {CARDS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => openCard(id)}
            className="relative rounded-2xl border border-border/60 bg-secondary/30 px-2.5 py-3 text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
          >
            {counts[id] - (seenCounts[id] || 0) > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-[1px] font-body text-[10px] font-bold text-emerald-400 animate-pulse">
                +{counts[id] - (seenCounts[id] || 0)}
              </span>
            )}
            <Icon className="w-4 h-4 text-primary mb-1.5" />
            <div className="font-display text-xl font-bold text-foreground leading-none">
              {counts[id]}
              {id === 'trial' && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-1 opacity-90 truncate">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(counts.trialValor)}
                </span>
              )}
            </div>
            <div className="font-body text-[10.5px] text-muted-foreground mt-1 leading-tight">{label}</div>
          </button>

        ))}
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <div className="flex items-start justify-between gap-3 pr-9">
              <div className="min-w-0">
                <SheetTitle className="font-display text-base font-bold text-foreground">
                  {open ? `${titles[open]} · ${rotuloPeriodo}` : ''}
                </SheetTitle>
                <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
                  {loading ? 'Carregando…' : `${filteredRows.length} registro${filteredRows.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={abrirTotais}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 font-body text-[12px] font-semibold text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Totais
              </button>
            </div>

            <div className="flex bg-secondary/50 p-1 rounded-xl mt-4 w-full">
              {(['todos', 'gratuitos', 'assinantes'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroUser(t)}
                  className={cn(
                    'flex-1 text-[11.5px] font-semibold py-1.5 rounded-lg capitalize transition-all',
                    filtroUser === t 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </SheetHeader>




          <div className="p-3">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredRows.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">
                Nenhum registro encontrado.
              </p>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {filteredRows.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => r.userId && setDossie(r)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 active:bg-secondary transition-colors',
                      novosKeys.has(r.key) && 'bg-emerald-500/10',
                    )}
                  >
                    {r.avatarUrl && r.avatarUrl !== 'null' ? (
                      <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                        <img src={r.avatarUrl} alt={r.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                        {r.isPremium && (
                          <Crown className="w-4 h-4 text-[#FFD700] fill-[#FFD700] drop-shadow-md shrink-0" />
                        )}
                        {typeof r.acessos === 'number' && r.acessos > 0 && (
                          <span
                            title={`${r.acessos} acesso${r.acessos === 1 ? '' : 's'} no dia`}
                            className="shrink-0 font-body text-[10.5px] font-bold text-rose-400"
                          >
                            {r.acessos}x
                          </span>
                        )}
                        {novosKeys.has(r.key) && (
                          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-[1px] font-body text-[9.5px] font-bold text-emerald-400">
                            NOVO
                          </span>
                        )}
                      </div>
                      <div className="font-body text-[11.5px] text-muted-foreground truncate mt-0.5">
                        {r.email && <span className="mr-1.5 opacity-80">{r.email}</span>}
                        {r.subtitle}
                      </div>
                    </div>
                    <ProviderTag provider={r.provider} />
                    <div className="font-body text-[11px] text-muted-foreground shrink-0">{r.meta}</div>
                  </button>
                ))}

              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={totaisOpen} onOpenChange={setTotaisOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[92vh] max-h-[92vh] overflow-y-auto p-0 bg-background border-border">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <SheetTitle className="font-display text-base font-bold text-foreground">
              {open ? `Totais · ${titles[open]}` : 'Totais'}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">Métricas gerais acumuladas</p>
          </SheetHeader>

          <div className="p-3 space-y-3">
            {totaisLoading || !totais ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : totais.error ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">Acesso restrito a administradores.</p>
            ) : (
              <>
                <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-5 text-center">
                  <div className="font-display text-4xl font-bold text-primary leading-none">{totais.total ?? 0}</div>
                  <div className="font-body text-[12px] text-muted-foreground mt-1.5">Total acumulado</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Hoje', v: totais.hoje },
                    { l: '7 dias', v: totais.d7 },
                    { l: '30 dias', v: totais.d30 },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-foreground leading-none">{x.v ?? 0}</div>
                      <div className="font-body text-[11px] text-muted-foreground mt-1">{x.l}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="font-body text-[13px] font-semibold text-foreground mb-3">Origem da conta</div>
                  <div className="space-y-2.5">
                    {(['google', 'apple', 'email'] as const).map((p) => {
                      const v = Number(totais.providers?.[p] || 0);
                      const tot = Math.max(1, Number(totais.total || 1));
                      const pct = Math.round((v / tot) * 100);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => abrirProvider(p)}
                          className="w-full text-left rounded-xl px-1 py-1 hover:bg-secondary/60 active:bg-secondary transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <ProviderTag provider={p} />
                            <span className="font-body text-[12.5px] text-foreground inline-flex items-center gap-1">
                              {v} <span className="text-muted-foreground">({pct}%)</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Premium', v: totais.premium },
                    { l: 'Com número', v: totais.com_telefone },
                    { l: 'Onboarding', v: totais.onboarding },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-foreground leading-none">{x.v ?? 0}</div>
                      <div className="font-body text-[11px] text-muted-foreground mt-1">{x.l}</div>
                    </div>
                  ))}
                </div>

                {Array.isArray(totais.paises) && totais.paises.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                    <div className="px-4 py-3 font-body text-[13px] font-semibold text-foreground">Países</div>
                    {totais.paises.map((p: any) => (
                      <div key={p.pais} className="flex items-center justify-between px-4 py-2.5">
                        <span className="font-body text-[13px] text-foreground truncate">{p.pais}</span>
                        <span className="font-body text-[13px] text-muted-foreground">{p.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!provOpen} onOpenChange={(v) => !v && setProvOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <SheetTitle className="font-display text-base font-bold text-foreground">
              Contas · {provOpen === 'google' ? 'Google' : provOpen === 'apple' ? 'Apple' : 'E-mail'}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
              {provLoading ? 'Carregando…' : `${provRows.length} usuário${provRows.length === 1 ? '' : 's'}`}
            </p>
          </SheetHeader>
          <div className="p-3">
            {provLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : provRows.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">Nenhum usuário.</p>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {provRows.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setDossie(r)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 active:bg-secondary transition-colors"
                  >
                    {r.avatarUrl && r.avatarUrl !== 'null' ? (
                      <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                        <img src={r.avatarUrl} alt={r.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                      {r.subtitle && (
                        <div className="font-body text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                      )}
                    </div>
                    <ProviderTag provider={r.provider} />
                    <div className="font-body text-[11px] text-muted-foreground shrink-0">{r.meta}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>


      <UserDossieSheet
        userId={dossie?.userId || null}
        nome={dossie?.title}
        email={dossie?.email}
        provider={dossie?.provider}
        onClose={() => setDossie(null)}
      />
    </>
  );
}
