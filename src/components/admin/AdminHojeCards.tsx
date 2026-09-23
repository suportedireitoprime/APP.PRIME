import { useCallback, useEffect, useState, useRef } from 'react';
import { Radio, UserPlus, Sparkles, Loader2, Mail, BarChart3, ChevronRight, Crown, Zap, DollarSign, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { UserDossieSheet } from './UserDossieSheet';
import { rotaParaFuncao } from '@/lib/rotaFuncoes';

type CardId = 'online5m' | 'online' | 'cadastros' | 'paywall' | 'viu_planos' | 'trial';
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
  planValue?: number;
  planTag?: { plano: string, status: string, expires_at: string | null };
  googleId?: string | null;
  created_at?: string | null;
}

function formatTempoCadastro(createdAt?: string | null, fallbackSubtitle?: string | null): string {
  if (createdAt) {
    const dataCad = new Date(createdAt);
    if (!isNaN(dataCad.getTime())) {
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const inicioCad = new Date(dataCad.getFullYear(), dataCad.getMonth(), dataCad.getDate());
      const diffDias = Math.floor((inicioHoje.getTime() - inicioCad.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias <= 0) return 'Cadastrado hoje';
      if (diffDias === 1) return 'Cadastrado há 1 dia';
      if (diffDias < 30) return `Cadastrado há ${diffDias} dias`;
      const meses = Math.floor(diffDias / 30);
      if (meses === 1) return 'Cadastrado há 1 mês';
      if (meses < 12) return `Cadastrado há ${meses} meses`;
      const anos = (diffDias / 365).toFixed(1).replace('.0', '');
      return `Cadastrado há ${anos} ${anos === '1' ? 'ano' : 'anos'}`;
    }
  }
  if (fallbackSubtitle && fallbackSubtitle !== 'Desconhecida' && fallbackSubtitle !== 'App aberto') {
    return fallbackSubtitle;
  }
  return 'Cadastrado recentemente';
}

function formatStatusPt(status?: string | null): string {
  if (!status) return 'ATIVO';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'ativo') return 'ATIVO';
  if (s.includes('cancel')) return 'CANCELADO';
  if (s.includes('pend')) return 'PENDENTE';
  if (s.includes('overdue') || s.includes('atras')) return 'ATRASADO';
  if (s.includes('trial')) return 'TESTE';
  return status.toUpperCase();
}

function formatPlanoTag(plano?: string | null): string {
  if (!plano) return '';
  const p = plano.toLowerCase();
  if (p.includes('anual') && (p.includes('promo') || p.includes('promocional'))) {
    return 'ANUAL PROMO';
  }
  if (p.includes('vital') || p === 'vitalicio') {
    return 'VITALÍCIO';
  }
  if (p.includes('anual')) {
    return 'ANUAL';
  }
  if (p.includes('mensal')) {
    return 'MENSAL';
  }
  return plano.toUpperCase();
}

const ProviderTag = ({ provider }: { provider?: string | null }) => {
  if (!provider) return null;
  const p = provider.toLowerCase();
  const cfg = p.includes('google')
    ? {
        label: 'Google',
        node: <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>,
        bg: 'bg-[hsl(var(--provider-google))]',
        fg: 'text-[hsl(var(--provider-google-foreground))]',
        border: 'border-[hsl(var(--provider-google))]/30',
      }
    : p.includes('apple')
      ? {
          label: 'Apple',
          node: <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.43.987 3.96.948 1.565-.027 2.613-1.508 3.611-2.973 1.157-1.69 1.636-3.327 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z"/></svg>,
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
  const [counts, setCounts] = useState<Record<CardId | 'trialValor', number>>(() => {
    try {
      const cached = localStorage.getItem('admin_hoje_counts_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { online5m: 0, online: 0, cadastros: 0, paywall: 0, viu_planos: 0, trial: 0, trialValor: 0 };
  });
  const [seenCounts, setSeenCounts] = useState<Record<CardId, number>>(() => {
    const hoje = new Date();
    return {
      online5m: readSeen('online5m', hoje).count,
      online: readSeen('online', hoje).count,
      cadastros: readSeen('cadastros', hoje).count,
      paywall: readSeen('paywall', hoje).count,
      viu_planos: readSeen('viu_planos', hoje).count,
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
  const isFetching = useRef(false);
  const [provOpen, setProvOpen] = useState<string | null>(null);
  const [provRows, setProvRows] = useState<Row[]>([]);
  const [provLoading, setProvLoading] = useState(false);
  const rowsCache = useRef<Record<string, Row[]>>({});


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
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const datas = getDatasPeriodo(periodo);
      
      const metricasPromises = datas.map(d => supabase.rpc('admin_metricas_dia' as any, { _dia: isoDate(d) }));
      const list5mPromise = supabase.rpc('admin_lista_dia' as any, { _tipo: 'online5m', _dia: isoDate(datas[0]) });
      const listOnlinePromise = supabase.rpc('admin_lista_dia' as any, { _tipo: 'online', _dia: isoDate(datas[0]) });
      const trialPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: 'trial', _dia: isoDate(d) }));

      const [metricasResults, list5mResult, listOnlineResult, trialResults] = await Promise.allSettled([
        Promise.allSettled(metricasPromises),
        list5mPromise,
        listOnlinePromise,
        Promise.allSettled(trialPromises)
      ]);



      // === FIM DIAGNÓSTICO ===
      
      const list5m = list5mResult.status === 'fulfilled' ? list5mResult.value.data : [];
      const listOnline = listOnlineResult.status === 'fulfilled' ? listOnlineResult.value.data : [];
      
      let totalOnline5m = 0;
      let totalOnline = 0;
      let totalCadastros = 0;
      let totalPaywall = 0;
      let totalViuPlanos = 0;
      let totalTrial = 0;
      let totalTrialValor = 0;

      let rawRpcResponse: any = null;
      if (metricasResults.status === 'fulfilled') {
        metricasResults.value.forEach((res) => {
          if (res.status === 'fulfilled') {
            if (res.value.error) console.error('RPC ERROR', res.value.error);
            const m = (res.value.data as any) || {};
            rawRpcResponse = m;
            totalOnline5m = Math.max(totalOnline5m, m.online5m || 0);
            totalOnline = Math.max(totalOnline, m.online || 0, totalOnline5m);
            totalCadastros += m.cadastros || 0;
            totalTrial += m.trial || 0;
            totalPaywall = Math.max(totalPaywall, m.paywall || 0);
            totalViuPlanos = Math.max(totalViuPlanos, m.checkout || 0);
          }
        });
      }
      
      // Store raw response in a ref for debug rendering
      (window as any)._adminRpcDebug = rawRpcResponse;

      try {
        const minDateStr = new Date(datas[datas.length - 1]);
        minDateStr.setHours(0, 0, 0, 0);
        
        const maxDateStr = new Date(datas[0]);
        maxDateStr.setDate(maxDateStr.getDate() + 1);
        maxDateStr.setHours(0, 0, 0, 0);

        // Buscar eventos de paywall e checkout
        const { data: events, error } = await supabase
          .from('app_events')
          .select('user_id, id, email, event_name')
          .in('event_name', ['trial_click', 'assinatura_aberta', 'paywall_view'])
          .gte('created_at', minDateStr.toISOString())
          .lt('created_at', maxDateStr.toISOString());
          
        if (error) throw error;
          
        if (events) {
          const allPwEvents = events.filter((e: any) => e.event_name === 'assinatura_aberta' || e.event_name === 'paywall_view');
          const uniquePw = new Set(allPwEvents.map((e: any) => e.email || e.user_id || 'anonymous'));
          totalPaywall = Math.max(totalPaywall, uniquePw.size);

          const filteredEvents = events.filter((e: any) => e.profiles?.is_premium !== true);
          const vpEvents = filteredEvents.filter((e: any) => e.event_name === 'trial_click');
          const uniqueVp = new Set(vpEvents.map((e: any) => e.email || e.user_id || 'anonymous'));
          totalViuPlanos = Math.max(totalViuPlanos, uniqueVp.size);
        }

        // Buscar novas assinaturas no Asaas, Play Store, Apple e Legado por data de criação/início
        const [asaasRes, playRes, appleRes, legRes] = await Promise.all([
          supabase
            .from('asaas_subscriptions')
            .select('id, user_id, created_at, started_at, plano, status')
            .or(`created_at.gte.${minDateStr.toISOString()},started_at.gte.${minDateStr.toISOString()}`)
            .lt('created_at', maxDateStr.toISOString())
            .eq('status', 'ACTIVE'),
          supabase
            .from('play_subscriptions')
            .select('id, user_id, created_at, product_id, status')
            .gte('created_at', minDateStr.toISOString())
            .lt('created_at', maxDateStr.toISOString()),
          supabase
            .from('apple_subscriptions')
            .select('id, user_id, created_at, start_time, product_id, status')
            .or(`created_at.gte.${minDateStr.toISOString()},start_time.gte.${minDateStr.toISOString()}`)
            .lt('created_at', maxDateStr.toISOString())
            .in('status', ['active', 'in_grace']),
          supabase
            .from('legacy_subscribers')
            .select('id, created_at, email, tipo, status, claimed_user_id')
            .gte('created_at', minDateStr.toISOString())
            .lt('created_at', maxDateStr.toISOString())
        ]);

        const subUsers = new Map<string, { plano: string; valor: number }>();

        (asaasRes.data || []).forEach((s: any) => {
          const uid = s.user_id || s.id;
          const plano = (s.plano || 'mensal').toLowerCase();
          const isPromo = plano.includes('promocional') || plano.includes('promo');
          const isAnual = plano.includes('anual');
          const isVit = !isPromo && (plano.includes('vitalicio') || plano.includes('vitalício'));
          const valor = (isAnual && isPromo) ? 149.90 : isAnual ? 199.90 : isVit ? 149.90 : 29.90;
          subUsers.set(uid, { plano: (isAnual && isPromo) ? 'anual_promocional' : plano, valor });
        });

        (playRes.data || []).forEach((s: any) => {
          const uid = s.user_id || s.id;
          const plano = s.product_id?.includes('anual') ? 'anual' : s.product_id?.includes('vitalicio') ? 'vitalicio' : 'mensal';
          const valor = plano === 'anual' ? 199.90 : plano === 'vitalicio' ? 149.90 : 29.90;
          if (!subUsers.has(uid)) {
            subUsers.set(uid, { plano, valor });
          }
        });

        (appleRes.data || []).forEach((s: any) => {
          const uid = s.user_id || s.id;
          const plano = s.product_id?.includes('anual') ? 'anual' : 'mensal';
          const valor = plano === 'anual' ? 199.90 : 29.90;
          if (!subUsers.has(uid)) {
            subUsers.set(uid, { plano, valor });
          }
        });

        (legRes.data || []).forEach((s: any) => {
          const uid = s.claimed_user_id || s.id;
          const plano = s.tipo || 'mensal';
          const valor = plano === 'vitalicio' ? 149.90 : plano === 'anual' ? 199.90 : 29.90;
          if (!subUsers.has(uid)) {
            subUsers.set(uid, { plano, valor });
          }
        });

        totalTrial = Math.max(totalTrial, subUsers.size);

        // Soma real da receita dos assinantes
        let somaValores = 0;
        subUsers.forEach(({ valor }) => {
          somaValores += valor;
        });
        if (totalTrial > subUsers.size) {
          somaValores += (totalTrial - subUsers.size) * 29.90;
        }
        totalTrialValor = somaValores;

      } catch (e: any) {
        console.error('Error fetching today events/subscriptions', e);
      }

      // Ensure viu_planos (Checkout) is at least equal to assinantes (trial)
      totalViuPlanos = Math.max(totalViuPlanos, totalTrial);
      // Ensure paywall (Tela de Assinatura) is at least equal to viu_planos
      totalPaywall = Math.max(totalPaywall, totalViuPlanos);

      const adminEmails = ['wn7corporation@gmail.com', 'suporte@direitoprime.com.br', 'wn7juridico@gmail.com'];
      const count5mFromList = periodo === 'hoje' ? ((list5m as any[]) || []).filter(r => !adminEmails.includes(r.email)).length : 0;
      const count5m = periodo === 'hoje' ? Math.max(totalOnline5m, count5mFromList) : 0;
      
      // Para online (dia inteiro), pega o totalOnline extraído do RPC (se disponível) ou da lista
      const countOnlineFromList = ((listOnline as any[]) || []).filter(r => !adminEmails.includes(r.email)).length;
      const countOnline = Math.max(totalOnline, countOnlineFromList);
      const novos: Record<CardId | 'trialValor', number> = {
        online5m: count5m, 
        online: countOnline, 
        cadastros: totalCadastros, 
        paywall: totalPaywall,
        viu_planos: totalViuPlanos,
        trial: totalTrial,
        trialValor: totalTrialValor
      };
      setCounts(novos);
    
    if (periodo === 'hoje') {
      try {
        localStorage.setItem('admin_hoje_counts_cache', JSON.stringify(novos));
      } catch {}

      (['online5m', 'online', 'cadastros', 'paywall', 'viu_planos', 'trial'] as CardId[]).forEach((id) => {
        if (!localStorage.getItem(seenStorageKey(id, datas[0]))) {
          writeSeen(id, datas[0], { count: novos[id], keys: [] });
          setSeenCounts((c) => ({ ...c, [id]: novos[id] }));
        }
      });
    } else {
      setSeenCounts({ online5m: 0, online: 0, cadastros: 0, paywall: 0, viu_planos: 0, trial: 0 });
    }
  } catch (err) {
    console.error('Erro em AdminHojeCards load():', err);
  } finally {
    isFetching.current = false;
  }
  }, [periodo, getDatasPeriodo]);


  useEffect(() => {
    load();
    if (periodo === 'hoje') {
      // Polling a cada 15s para manter Online 5 min responsivo
      const t = setInterval(load, 15_000);
      return () => clearInterval(t);
    }
  }, [load, periodo]);

  // Supabase Realtime: atualiza dashboard instantaneamente quando há mudanças
  useEffect(() => {
    if (periodo !== 'hoje') return;

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'user_activity_log' },
        () => { void load(); }
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => { void load(); }
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'app_events' },
        () => { void load(); }
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'legacy_subscribers' },
        () => { void load(); }
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'play_subscriptions' },
        () => { void load(); }
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'asaas_subscriptions' },
        () => { void load(); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [periodo, load]);

  const fetchRows = useCallback(async (id: CardId, date: Date) => {
    // If we have cached rows for this id and period is 'hoje', show them instantly
    if (rowsCache.current[id] && periodo === 'hoje') {
      setRows(rowsCache.current[id]);
      setLoading(false); // don't show spinner if we have cached data
    } else {
      setLoading(true);
      setRows([]);
    }
    
    try {
      const datas = getDatasPeriodo(periodo);
      
      let allLists: any[] = [];
      let listPromises: any[] = [];
      
      if (id === 'trial') {
        const minDate = new Date(datas[datas.length - 1]);
        minDate.setHours(0, 0, 0, 0);
        
        const maxDate = new Date(datas[0]);
        maxDate.setDate(maxDate.getDate() + 1);
        maxDate.setHours(0, 0, 0, 0);

        // 1. Chamar admin_lista_dia para todos os dias do período
        const rpcPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: 'trial', _dia: isoDate(d) }));

        // 2. Buscar também diretamente no asaas_subscriptions, play_subscriptions, apple_subscriptions e legacy_subscribers
        const [rpcResults, asaasRes, playRes, appleRes, legRes] = await Promise.all([
          Promise.all(rpcPromises),
          supabase
            .from('asaas_subscriptions')
            .select(`
              id, user_id, created_at, started_at, plano, status, asaas_customer_id, asaas_subscription_id
            `)
            .or(`created_at.gte.${minDate.toISOString()},started_at.gte.${minDate.toISOString()}`)
            .lt('created_at', maxDate.toISOString())
            .order('created_at', { ascending: false }),
          supabase
            .from('play_subscriptions')
            .select(`
              id, user_id, created_at, product_id, status
            `)
            .gte('created_at', minDate.toISOString())
            .lt('created_at', maxDate.toISOString())
            .order('created_at', { ascending: false }),
          supabase
            .from('apple_subscriptions')
            .select(`
              id, user_id, created_at, start_time, product_id, status
            `)
            .or(`created_at.gte.${minDate.toISOString()},start_time.gte.${minDate.toISOString()}`)
            .lt('created_at', maxDate.toISOString())
            .order('created_at', { ascending: false }),
          supabase
            .from('legacy_subscribers')
            .select('id, created_at, email, tipo, status, claimed_user_id, asaas_customer_id, nome')
            .gte('created_at', minDate.toISOString())
            .lt('created_at', maxDate.toISOString())
            .order('created_at', { ascending: false })
        ]);

        const existingUserIds = new Set<string>();

        // Processa os dados retornados pela RPC (já contém display_name, email e avatar)
        rpcResults.forEach(({ data }) => {
          ((data as any[]) || []).forEach(r => {
            const subText = (r.subtitle || '').toLowerCase();
            const titleText = (r.title || '').toLowerCase();
            const isPromo = subText.includes('promocional') || subText.includes('promo') || titleText.includes('promocional');
            const isAnual = subText.includes('anual') || titleText.includes('anual');
            const isVit = !isPromo && (subText.includes('vitalicio') || subText.includes('vitalício') || titleText.includes('vitalicio'));
            const planValor = (isAnual && isPromo) ? 149.90 : isAnual ? 199.90 : isVit ? 149.90 : 29.90;
            const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
            const uid = r.user_id || r.id;
            if (uid) existingUserIds.add(uid);

            allLists.push({
              key: r.key || uid || r.email || Math.random().toString(),
              user_id: uid,
              title: r.title || r.nome || 'Assinante',
              email: r.email || null,
              subtitle: r.subtitle || `Assinatura ${planName}`,
              at: r.at || r.created_at,
              acessos: null,
              avatar_url: r.avatar_url || null,
              is_premium: true,
              planValue: planValor,
              planTag: { plano: planName, status: 'ACTIVE', expires_at: null },
            });
          });
        });

        // Buscar perfis para preencher nomes/emails de eventuais assinaturas não capturadas pela RPC
        const missingUids = Array.from(new Set([
          ...(asaasRes.data || []).map((s: any) => s.user_id),
          ...(playRes.data || []).map((s: any) => s.user_id),
          ...(appleRes.data || []).map((s: any) => s.user_id)
        ])).filter(uid => Boolean(uid) && !existingUserIds.has(uid)) as string[];

        const profMap = new Map<string, { name?: string; email?: string }>();
        if (missingUids.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, display_name, email').in('id', missingUids);
          if (profs) {
            profs.forEach((p: any) => {
              profMap.set(p.id, { name: p.display_name, email: p.email });
            });
          }
        }

        // Complementa com Asaas faltantes
        (asaasRes.data || []).forEach((s: any) => {
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const planoLower = (s.plano || '').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));
          const planValor = (isAnual && isPromo) ? 149.90 : isAnual ? 199.90 : isVit ? 149.90 : 29.90;
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
          const profInfo = profMap.get(s.user_id);

          allLists.push({
            key: `asaas-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante Asaas',
            email: profInfo?.email || null,
            subtitle: `Assinou via Asaas (${planName} - ${s.status})`,
            at: s.created_at || s.started_at,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: s.expires_at },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // Complementa com Play Store faltantes
        (playRes.data || []).forEach((s: any) => {
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const isAnualOrVit = s.product_id?.includes('anual') || s.product_id?.includes('vitalicio');
          const planValor = isAnualOrVit ? 199.90 : 29.90;
          const planName = isAnualOrVit ? 'Anual/Vitalício' : 'Mensal';
          const profInfo = profMap.get(s.user_id);

          allLists.push({
            key: `play-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante Play Store',
            email: profInfo?.email || null,
            subtitle: `Assinou via Google Play (${planName})`,
            at: s.created_at,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: null },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // Complementa com Apple Store faltantes
        (appleRes.data || []).forEach((s: any) => {
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const isAnual = s.product_id?.includes('anual');
          const planValor = isAnual ? 199.90 : 29.90;
          const planName = isAnual ? 'Anual' : 'Mensal';
          const profInfo = profMap.get(s.user_id);

          allLists.push({
            key: `apple-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante App Store',
            email: profInfo?.email || null,
            subtitle: `Assinou via Apple (${planName})`,
            at: s.created_at || s.start_time,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: null },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // Complementa com Legados se houver
        (legRes.data || []).forEach((e: any) => {
          allLists.push({
            key: `leg-${e.id}`,
            user_id: e.claimed_user_id || null,
            title: e.nome || e.email?.split('@')[0] || 'Usuário',
            email: e.email,
            subtitle: `Assinou via Asaas (${e.status})`,
            at: e.created_at,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: e.tipo === 'vitalicio' ? 149.90 : 29.90,
            planTag: { plano: e.tipo || 'Assinatura', status: e.status, expires_at: null },
          });
        });
      } else {
        listPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: id, _dia: isoDate(d) }));
        let extraPromises: any[] = [];
        
        if (id === 'paywall' || id === 'viu_planos') {
          // "Tela de assinaturas" also implicitly includes anyone who clicked a plan (viu_planos/trial)
          // But we will just pull the raw app_events for trial_click plus the trial list to make sure the counts reflect Math.max
          extraPromises = datas.map(d => supabase.rpc('admin_lista_dia' as any, { _tipo: 'trial', _dia: isoDate(d) }));
          const minDate = new Date(datas[datas.length - 1]);
          minDate.setHours(0, 0, 0, 0);
          const maxDate = new Date(datas[0]);
          maxDate.setDate(maxDate.getDate() + 1);
          maxDate.setHours(0, 0, 0, 0);
          
          const { data: vpEvents } = await supabase
            .from('app_events')
            .select(`
              id, user_id, created_at, email,
              profiles:user_id ( display_name, is_premium ),
              users:user_id ( email, raw_user_meta_data )
            `)
            .in('event_name', ['trial_click', 'assinatura_aberta'])
            .gte('created_at', minDate.toISOString())
            .lt('created_at', maxDate.toISOString());
            
          if (vpEvents) {
            // Remove Premium do Modal
            const vpMapped = vpEvents
              .filter((e: any) => e.profiles?.is_premium !== true)
              .map((e: any) => {
                const uemail = e.users?.email || e.email || 'Visitante';
                return {
                  key: e.id,
                  user_id: e.user_id,
                  title: e.profiles?.display_name || uemail.split('@')[0],
                  email: uemail,
                  subtitle: 'Abriu planos (Clicou)',
                  at: e.created_at,
                  acessos: null,
                  avatar_url: e.users?.raw_user_meta_data?.avatar_url || e.users?.raw_user_meta_data?.picture,
                  is_premium: false,
                  created_at: e.created_at
                };
            });
            allLists = allLists.concat(vpMapped);
          }
        }

        const [results, extraResults] = await Promise.all([
          Promise.all(listPromises),
          Promise.all(extraPromises)
        ]);

        const allUids = Array.from(new Set(
          results.flatMap(({ data }) => ((data as any[]) || []).map(r => r.user_id || r.id)).filter(Boolean)
        ));
        const profilesDict: Record<string, any> = {};
        if (allUids.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, created_at').in('id', allUids);
          if (profs) {
            profs.forEach(p => { profilesDict[p.id] = p.created_at; });
          }
        }
        
        results.forEach(({ data }) => {
          const mapped = ((data as any[]) || []).map(r => {
            const isGoogleAvatar = r.avatar_url?.includes('googleusercontent.com');
            const uid = r.user_id || r.id;
            const routeLabel = r.subtitle ? rotaParaFuncao(r.subtitle).label : null;
            const cleanSubtitle = (routeLabel && routeLabel !== 'Desconhecida') ? routeLabel : (id === 'cadastros' ? 'Novo cadastro' : null);
            return {
              key: r.key || uid || r.email || Math.random().toString(),
              user_id: uid,
              title: r.title || r.nome || r.email?.split('@')[0] || 'Usuário',
              email: r.email,
              provider: isGoogleAvatar ? 'google' : (r.provider || (r.email ? 'email' : null)),
              subtitle: cleanSubtitle,
              at: r.at || r.last_seen || r.created_at,
              is_premium: r.is_premium ?? r.premium ?? false,
              avatar_url: r.avatar_url || null,
              acessos: typeof r.acessos === 'number' ? r.acessos : null,
              created_at: r.created_at || profilesDict[uid] || null
            };
          });
          allLists = allLists.concat(mapped);
        });
        
        if (id === 'paywall') {
          extraResults.forEach(({ data }) => {
            const trials = ((data as any[]) || []).map(r => {
              const isGoogleAvatar = r.avatar_url?.includes('googleusercontent.com');
              const uid = r.user_id || r.id;
              return {
                key: r.key || uid || r.email || Math.random().toString(),
                user_id: uid,
                title: r.title || r.nome || r.email?.split('@')[0] || 'Usuário',
                email: r.email,
                subtitle: 'Abriu planos (Iniciou teste)',
                at: r.at || r.created_at || r.last_seen,
                is_premium: r.is_premium ?? r.premium ?? false,
                avatar_url: r.avatar_url || null,
                provider: isGoogleAvatar ? 'google' : (r.provider || 'email'),
                acessos: null,
                created_at: profilesDict[uid] || r.created_at || r.at
              };
            });
            allLists = allLists.concat(trials);
          });
        }
      }

      // Deduplicate by user (since same user could be online on multiple days)
      const uniqueMap = new Map();
      allLists.forEach(r => {
        const dedupeKey = r.email || r.user_id || r.key;
        if (!uniqueMap.has(dedupeKey)) {
          uniqueMap.set(dedupeKey, r);
        }
      });
      const list = Array.from(uniqueMap.values()).map((r) => ({
        key: r.key,
        userId: r.user_id,
        title: r.title || 'Usuário',
        email: r.email || null,
        provider: r.provider || null,
        subtitle: (id === 'online' || id === 'online5m') ? rotaParaFuncao(r.subtitle).label : r.subtitle,
        meta: hora(r.at),
        acessos: typeof r.acessos === 'number' ? r.acessos : null,
        avatarUrl: r.avatar_url,
        isPremium: r.is_premium,
        planValue: r.planValue,
        planTag: r.planTag,
        created_at: r.created_at,
      })).filter(r => r.email !== 'wn7corporation@gmail.com' && r.email !== 'suporte@direitoprime.com.br' && r.email !== 'wn7juridico@gmail.com');

      if (id === 'trial' && list.length > 0) {
        // Agora tratamos "trial" como "Assinou via Asaas". Não vamos chamar o endpoint antigo de Google/Apple.
        // Já mapeamos o isPremium e o planValue na lista acima.
      }

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
        const map = new Map<string, string>(((provs as any[]) || []).map((p) => [p.user_id || p.id, p.provider]));

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

        setRows((current) => {
          const updated = current.map((r) => {
            const rUid = r.userId || r.key;
            const rProv = map.get(rUid) || (r.avatarUrl?.includes('googleusercontent.com') ? 'google' : r.provider);
            return { 
              ...r, 
              provider: rProv,
              funcaoPreferida: mapFav.get(rUid)
            };
          });
          if (periodo === 'hoje') rowsCache.current[id] = updated;
          return updated;
        });
      } else {
        if (periodo === 'hoje') rowsCache.current[id] = list;
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
    if (card === 'cadastros' || card === 'trial' || card === 'online' || card === 'online5m' || card === 'paywall' || card === 'viu_planos') {
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
    { 
      id: 'online', 
      label: periodo === 'ontem' ? 'Online ontem' : periodo === '7d' ? 'Online (7 dias)' : periodo === '30d' ? 'Online (30 dias)' : 'Online hoje', 
      icon: Radio 
    },
    { id: 'cadastros', label: 'Cadastrados', icon: UserPlus },
    { id: 'paywall', label: 'Tela de Assinaturas', icon: Sparkles },
    { id: 'viu_planos', label: 'Checkout', icon: Check },
    { id: 'trial', label: 'Assinou', icon: DollarSign },
  ];

  const titles: Record<CardId, string> = {
    online5m: 'Online (Últimos 5 min)',
    online: 'Online',
    cadastros: 'Cadastrados',
    paywall: 'Entraram em Assinaturas',
    viu_planos: 'Abriram Checkout',
    trial: 'Assinaram',
  };

  const rotuloPeriodo = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
  }[periodo];

  const filteredRows = (open === 'online' || open === 'online5m')
    ? rows.filter(r => {
        if (filtroUser === 'gratuitos') return !r.isPremium;
        if (filtroUser === 'assinantes') return r.isPremium;
        return true;
      })
    : rows;

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

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-3">
        {CARDS.map(({ id, label, icon: Icon }) => {
          const isZero = counts[id] === 0;
          return (
            <button
              key={id}
              onClick={() => openCard(id)}
              className="group relative rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 active:scale-[0.98] p-2.5 sm:p-3 text-left transition-all overflow-hidden flex flex-col justify-between min-h-[76px]"
            >
              <div className="flex items-start justify-between w-full">
                <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {counts[id] - (seenCounts[id] || 0) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-[0.5px] font-body text-[9px] font-bold text-emerald-400 animate-pulse">
                        +{counts[id] - (seenCounts[id] || 0)}
                      </span>
                    )}
                    <span className={cn(
                      "font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-[22px] font-extrabold tracking-tight leading-none tabular-nums",
                      isZero ? "text-zinc-600" : "text-foreground"
                    )}>
                      {counts[id]}
                    </span>
                  </div>
                  {id === 'trial' && (
                    <span className={cn(
                      "block font-['Plus_Jakarta_Sans',sans-serif] text-[9.5px] font-bold mt-0.5 truncate",
                      counts.trialValor === 0 ? "text-zinc-600" : "text-emerald-400"
                    )}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(counts.trialValor)}
                    </span>
                  )}
                </div>
              </div>

              <div className={cn(
                "font-body text-[10.5px] sm:text-[11px] leading-tight mt-2 font-medium line-clamp-2",
                isZero ? "text-muted-foreground/60" : "text-muted-foreground"
              )}>
                {label}
              </div>
            </button>
          );
        })}
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

            {(open === 'online' || open === 'online5m') && (
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
            )}
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
                      'w-full text-left flex items-center gap-3 px-4 py-2.5 min-h-[76px] hover:bg-secondary/60 active:bg-secondary transition-colors',
                      novosKeys.has(r.key) && 'bg-emerald-500/10',
                    )}
                  >
                    {r.avatarUrl && r.avatarUrl !== 'null' ? (
                      <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                        <img src={r.avatarUrl} alt={r.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
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
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {r.email ? (
                          <div className="font-body text-xs text-muted-foreground/90 truncate">
                            {r.email}
                          </div>
                        ) : (
                          <div className="font-body text-xs text-muted-foreground/40 italic truncate">
                            {r.subtitle || 'Usuário'}
                          </div>
                        )}
                        {!r.planTag && (
                          <div className="font-body text-[10.5px] text-muted-foreground/60 truncate flex items-center gap-1.5">
                            {formatTempoCadastro(r.created_at, r.subtitle)}
                          </div>
                        )}
                        {r.planTag && (
                          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mt-0.5">
                            <span 
                              className="shrink-0 inline-flex items-center rounded-md bg-secondary border border-border/50 px-1.5 py-0.5 text-[9px] font-bold text-foreground"
                              title={r.planTag.plano}
                            >
                              {formatPlanoTag(r.planTag.plano)}
                            </span>
                            <span className="shrink-0 inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.planValue || 0)}
                            </span>
                            <span className={cn(
                              "shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold",
                              r.planTag.status?.toLowerCase() === 'ativo' || r.planTag.status?.toLowerCase() === 'active'
                                ? 'bg-secondary/60 border-border/50 text-emerald-400'
                                : r.planTag.status?.toLowerCase() === 'cancelado'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : 'bg-secondary/50 border-border/50 text-muted-foreground'
                            )}>
                              {formatStatusPt(r.planTag.status)}
                            </span>
                            {r.planTag.expires_at && (
                              <span className="shrink-0 inline-flex items-center text-[9.5px] font-medium text-muted-foreground opacity-80 truncate" title={`Expira em: ${r.planTag.expires_at}`}>
                                Até {r.planTag.expires_at}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end justify-center gap-1 text-right min-w-[65px]">
                      <ProviderTag provider={r.provider} />
                      {r.meta && (
                        <span className="font-body text-[10.5px] font-medium text-muted-foreground/80">
                          {r.meta}
                        </span>
                      )}
                      {r.googleId && (
                        <div className="text-[9px] opacity-70 uppercase" title="Google Subscription ID / Token">
                          {r.googleId.slice(0, 15)}...
                        </div>
                      )}
                    </div>
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
        avatarUrl={dossie?.avatarUrl}
        onClose={() => setDossie(null)}
      />
    </>
  );
}
