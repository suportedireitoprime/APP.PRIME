// @ts-nocheck
import { useCallback, useEffect, useState, useRef } from 'react';
import { Radio, UserPlus, Sparkles, Loader2, Mail, BarChart3, ChevronRight, Crown, Zap, DollarSign, Check, RefreshCw, Timer, Target, Repeat } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { UserDossieSheet } from './UserDossieSheet';
import { rotaParaFuncao, formatarDuracao } from '@/lib/rotaFuncoes';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO } from '@/lib/precos';

type CardId = 'online5m' | 'online' | 'cadastros' | 'paywall' | 'viu_planos' | 'trial' | 'renovou';
type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d';

const ADMIN_EMAILS = ['wn7corporation@gmail.com', 'suporte@direitoprime.com.br', 'wn7juridico@gmail.com'];

interface Row {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  userId?: string | null;
  email?: string | null;
  provider?: string | null;
  acessos?: number | null;
  tempo_tela?: number | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  funcaoPreferida?: string | null;
  planValue?: number;
  planTag?: { plano: string, status: string, expires_at: string | null };
  googleId?: string | null;
  created_at?: string | null;
  faixaEtaria?: string | null;
  logsCheckout?: { event_name: string; created_at: string; erro?: string; plano?: string }[];
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

function renderTrialCountdown(createdAt?: string | null, isPremium?: boolean) {
  if (isPremium) {
    return (
      <span className="inline-flex items-center rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-[1px] text-[9.5px] font-bold text-emerald-400">
        ASSINANTE ATIVO
      </span>
    );
  }

  if (!createdAt) return <>{formatTempoCadastro(createdAt, null)}</>;
  
  const dataCad = new Date(createdAt);
  if (isNaN(dataCad.getTime())) return <>{formatTempoCadastro(createdAt, null)}</>;
  
  // 3 dias de acesso liberado
  const expiresAt = new Date(dataCad.getTime() + 3 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-[1px] text-[9.5px] font-bold text-rose-400">
        ACESSO EXPIRADO
      </span>
    );
  }
  
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return (
    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-[1px] text-[9.5px]">
      <Timer className="w-2.5 h-2.5" />
      {hours}h {minutes}m restantes
    </span>
  );
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

const getHojeBrasilia = (): Date => {
  const spStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [mes, dia, ano] = spStr.split('/');
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
};

const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getBrasiliaDayRange = (datas: Date[]) => {
  const dataMin = datas[datas.length - 1];
  const dataMax = datas[0];
  const isoMin = isoDate(dataMin);
  const isoMax = isoDate(dataMax);
  const startIso = new Date(`${isoMin}T00:00:00-03:00`).toISOString();
  const nextDay = new Date(`${isoMax}T00:00:00-03:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const endIso = nextDay.toISOString();
  return { startIso, endIso };
};

const dayRange = (d: Date) => {
  const iso = isoDate(d);
  const startIso = new Date(`${iso}T00:00:00-03:00`).toISOString();
  const nextDay = new Date(`${iso}T00:00:00-03:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return { start: startIso, end: nextDay.toISOString() };
};

const sameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b);

const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : '';

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
  const [counts, setCounts] = useState<Record<CardId | 'trialValor' | 'renovouValor', number>>(() => {
    try {
      const hojeIso = isoDate(getHojeBrasilia());
      const cached = localStorage.getItem(`admin_hoje_counts_cache_${hojeIso}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return { online5m: 0, online: 0, cadastros: 0, paywall: 0, viu_planos: 0, trial: 0, trialValor: 0, renovou: 0, renovouValor: 0 };
  });
  const [seenCounts, setSeenCounts] = useState<Record<CardId, number>>(() => {
    const hoje = getHojeBrasilia();
    return {
      online5m: readSeen('online5m', hoje).count,
      online: readSeen('online', hoje).count,
      cadastros: readSeen('cadastros', hoje).count,
      paywall: readSeen('paywall', hoje).count,
      viu_planos: readSeen('viu_planos', hoje).count,
      trial: readSeen('trial', hoje).count,
      renovou: readSeen('renovou', hoje).count,
    };
  });
  const [novosKeys, setNovosKeys] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<CardId | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [filtroUser, setFiltroUser] = useState<'gratuitos' | 'assinantes' | 'todos'>('gratuitos');
  const [loading, setLoading] = useState(false);
  const [dossie, setDossie] = useState<Row | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoId>('hoje');
  const [dia, setDia] = useState<Date>(() => getHojeBrasilia());
  const [totaisOpen, setTotaisOpen] = useState(false);
  const [totais, setTotais] = useState<any>(null);
  const [totaisLoading, setTotaisLoading] = useState(false);
  const isFetching = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentDayRef = useRef(isoDate(getHojeBrasilia()));
  const [isUpdating, setIsUpdating] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(() => new Date());
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
    const hoje = getHojeBrasilia();
    if (p === 'hoje') return [hoje];
    if (p === 'ontem') {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      return [ontem];
    }
    const dias = p === '7d' ? 7 : 30;
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      return d;
    });
  }, []);

  const load = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsUpdating(true);

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    // Timeout de segurança: nunca deixa isFetching travado por mais de 8s
    fetchTimeoutRef.current = setTimeout(() => {
      isFetching.current = false;
      setIsUpdating(false);
    }, 8000);

    try {
      const datas = getDatasPeriodo(periodo);
      
      const metricasPromises = datas.map(d => supabase.rpc('admin_metricas_dia' as any, { _dia: isoDate(d) }));
      const metricasResults = await Promise.allSettled(metricasPromises);
      
      let totalOnline5m = 0;
      let totalOnline = 0;
      let totalCadastros = 0;
      let totalPaywall = 0;
      let totalViuPlanos = 0;
      let totalTrial = 0;
      let totalTrialValor = 0;

      let rawRpcResponse: any = null;
      metricasResults.forEach((res) => {
        if (res.status === 'fulfilled') {
          if (res.value.error) console.error('RPC ERROR', res.value.error);
          const m = (res.value.data as any) || {};
          rawRpcResponse = m;
          totalOnline5m = Math.max(totalOnline5m, m.online5m || 0);
          totalOnline = Math.max(totalOnline, m.online || 0, totalOnline5m);
          totalCadastros += m.cadastros || 0;
          totalPaywall = Math.max(totalPaywall, m.paywall || 0);
          totalViuPlanos = Math.max(totalViuPlanos, m.checkout || 0);
        } else {
          console.error('[ADMIN DEBUG] metrica rejected:', res.reason);
        }
      });
      
      (window as any)._adminRpcDebug = rawRpcResponse;

      try {
        const { startIso, endIso } = getBrasiliaDayRange(datas);

        // Buscar novas assinaturas no Asaas, Play Store, Apple, Legado e Eventos de Compra
        const inPeriod = (dateStr?: string | null) => {
          if (!dateStr) return false;
          const t = new Date(dateStr).getTime();
          return !isNaN(t) && t >= new Date(startIso).getTime() && t < new Date(endIso).getTime();
        };

        const [asaasRes, playRes, appleRes, legRes, purchaseEvRes, oldLegRes] = await Promise.all([
          supabase
            .from('asaas_subscriptions')
            .select('id, user_id, created_at, started_at, plano, status')
            .or(`started_at.gte.${startIso},created_at.gte.${startIso}`),
          supabase
            .from('play_subscriptions')
            .select('id, user_id, created_at, product_id, status')
            .gte('created_at', startIso)
            .lt('created_at', endIso),
          supabase
            .from('apple_subscriptions')
            .select('id, user_id, created_at, start_time, product_id, status')
            .or(`created_at.gte.${startIso},start_time.gte.${startIso}`),
          supabase
            .from('legacy_subscribers')
            .select('id, created_at, email, tipo, status, claimed_user_id')
            .gte('created_at', startIso)
            .lt('created_at', endIso),
          supabase
            .from('app_events')
            .select('user_id, email, created_at, event_name, metadata')
            .eq('event_name', 'purchase')
            .gte('created_at', startIso)
            .lt('created_at', endIso),
          supabase
            .from('legacy_subscribers')
            .select('email, claimed_user_id')
            .lt('created_at', startIso)
        ]);

        const oldLegEmails = new Set<string>();
        const oldLegUids = new Set<string>();
        (oldLegRes?.data || []).forEach((l: any) => {
          if (l.claimed_user_id) oldLegUids.add(l.claimed_user_id);
          if (l.email) oldLegEmails.add(l.email.toLowerCase().trim());
        });

        // Buscar perfis e assinaturas anteriores dos candidatos do Asaas para identificar renovações vs novos
        const asaasCandidateUids = (asaasRes.data || []).map((s: any) => s.user_id).filter(Boolean);
        const [{ data: asaasProfs }, { data: priorAsaasSubs }] = asaasCandidateUids.length > 0
          ? await Promise.all([
              supabase.from('profiles').select('id, email, created_at').in('id', asaasCandidateUids),
              supabase.from('asaas_subscriptions').select('user_id').in('user_id', asaasCandidateUids).lt('created_at', startIso)
            ])
          : [{ data: [] }, { data: [] }];

        const asaasEmailMap = new Map<string, string>();
        const profileCreatedMap = new Map<string, string>();
        (asaasProfs || []).forEach((p: any) => {
          if (p.id && p.email) asaasEmailMap.set(p.id, p.email.toLowerCase().trim());
          if (p.id && p.created_at) profileCreatedMap.set(p.id, p.created_at);
        });

        const priorAsaasUids = new Set<string>();
        (priorAsaasSubs || []).forEach((s: any) => {
          if (s.user_id) priorAsaasUids.add(s.user_id);
        });

        const isAntigo = (uid?: string | null, email?: string | null, createdAt?: string | null) => {
          const em = (email || '').toLowerCase().trim();
          if (uid && oldLegUids.has(uid)) return true;
          if (em && oldLegEmails.has(em)) return true;
          if (uid && priorAsaasUids.has(uid)) return true;
          if (uid && profileCreatedMap.has(uid)) {
            const pTime = new Date(profileCreatedMap.get(uid)!).getTime();
            const sTime = new Date(startIso).getTime();
            if (!isNaN(pTime) && pTime < sTime) return true;
          }
          if (createdAt) {
            const createdTime = new Date(createdAt).getTime();
            const startTime = new Date(startIso).getTime();
            if (!isNaN(createdTime) && createdTime < startTime) return true;
          }
          return false;
        };

        const subUsers = new Map<string, { plano: string; valor: number }>();
        const renewUsers = new Map<string, { plano: string; valor: number }>();

        (asaasRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (st !== 'ACTIVE' && st !== 'ACTIVE_GRACE' && st !== 'CONFIRMED' && st !== 'RECEIVED' && st !== 'PAGA') return;
          if (!inPeriod(s.started_at) && !inPeriod(s.created_at)) return;
          const uid = s.user_id || s.id;
          const userEmail = asaasEmailMap.get(s.user_id);
          const userIsAntigo = isAntigo(s.user_id, userEmail, s.created_at);

          const plano = (s.plano || 'mensal').toLowerCase();
          const isPromo = plano.includes('promocional') || plano.includes('promo');
          const isAnual = plano.includes('anual');
          const isVit = !isPromo && (plano.includes('vitalicio') || plano.includes('vitalício'));
          const valor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (isAnual && isPromo) ? 'anual_promocional' : plano;

          if (userIsAntigo) {
            renewUsers.set(uid, { plano: planName, valor });
          } else {
            subUsers.set(uid, { plano: planName, valor });
          }
        });

        (playRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (!st.includes('ACTIVE') && !st.includes('GRACE')) return;
          const uid = s.user_id || s.id;
          const userIsAntigo = isAntigo(s.user_id, null, s.created_at);
          const plano = s.product_id?.includes('anual') ? 'anual' : s.product_id?.includes('vitalicio') ? 'vitalicio' : 'mensal';
          const valor = plano === 'anual' ? PRECO_ANUAL : plano === 'vitalicio' ? PRECO_VITALICIO : PRECO_MENSAL;
          if (userIsAntigo) {
            if (!renewUsers.has(uid) && !subUsers.has(uid)) {
              renewUsers.set(uid, { plano, valor });
            }
          } else {
            if (!subUsers.has(uid) && !renewUsers.has(uid)) {
              subUsers.set(uid, { plano, valor });
            }
          }
        });

        (appleRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toLowerCase();
          if (st !== 'active' && st !== 'in_grace') return;
          const uid = s.user_id || s.id;
          const userIsAntigo = isAntigo(s.user_id, null, s.created_at);
          const plano = s.product_id?.includes('anual') ? 'anual' : 'mensal';
          const valor = plano === 'anual' ? PRECO_ANUAL : PRECO_MENSAL;
          if (userIsAntigo) {
            if (!renewUsers.has(uid) && !subUsers.has(uid)) {
              renewUsers.set(uid, { plano, valor });
            }
          } else {
            if (!subUsers.has(uid) && !renewUsers.has(uid)) {
              subUsers.set(uid, { plano, valor });
            }
          }
        });

        (legRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toLowerCase();
          if (st !== 'active' && st !== 'active_grace') return;
          const uid = s.claimed_user_id || s.id;
          const userIsAntigo = isAntigo(s.claimed_user_id, s.email, s.created_at);
          const plano = s.tipo || 'mensal';
          const valor = plano === 'vitalicio' ? PRECO_VITALICIO : plano === 'anual' ? PRECO_ANUAL : PRECO_MENSAL;
          if (userIsAntigo) {
            if (!renewUsers.has(uid) && !subUsers.has(uid)) {
              renewUsers.set(uid, { plano, valor });
            }
          } else {
            if (!subUsers.has(uid) && !renewUsers.has(uid)) {
              subUsers.set(uid, { plano, valor });
            }
          }
        });

        (purchaseEvRes.data || []).forEach((e: any) => {
          const em = (e.email || '').toLowerCase().trim();
          if (ADMIN_EMAILS.includes(em)) return;
          const uid = e.user_id || em;
          if (!uid) return;
          const userIsAntigo = isAntigo(e.user_id, em, null);

          const meta = e.metadata || {};
          const plano = (meta.plano || 'anual').toLowerCase();
          const isPromo = plano.includes('promocional') || plano.includes('promo');
          const isAnual = plano.includes('anual');
          const isVit = !isPromo && (plano.includes('vitalicio') || plano.includes('vitalício'));
          const valor = typeof meta.value === 'number' && meta.value > 0
            ? meta.value
            : (isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL);
          const planName = (isAnual && isPromo) ? 'anual_promocional' : plano;

          if (userIsAntigo) {
            if (!renewUsers.has(uid) && !subUsers.has(uid)) {
              renewUsers.set(uid, { plano: planName, valor });
            } else if (renewUsers.has(uid) && typeof meta.value === 'number' && meta.value > 0) {
              renewUsers.set(uid, { plano: planName, valor });
            }
          } else {
            if (!subUsers.has(uid) && !renewUsers.has(uid)) {
              subUsers.set(uid, { plano: planName, valor });
            } else if (subUsers.has(uid) && typeof meta.value === 'number' && meta.value > 0) {
              subUsers.set(uid, { plano: planName, valor });
            }
          }
        });

        totalTrial = subUsers.size;
        let somaValores = 0;
        subUsers.forEach(({ valor }) => {
          somaValores += valor;
        });
        totalTrialValor = somaValores;

        const totalRenovou = renewUsers.size;
        let somaRenovou = 0;
        renewUsers.forEach(({ valor }) => {
          somaRenovou += valor;
        });
        const totalRenovouValor = somaRenovou;

      } catch (e: any) {
        console.error('Error fetching today events/subscriptions', e);
      }

      // Ensure viu_planos (Checkout) is at least equal to assinantes (trial)
      totalViuPlanos = Math.max(totalViuPlanos, totalTrial);
      // Ensure paywall (Tela de Assinatura) is at least equal to viu_planos
      totalPaywall = Math.max(totalPaywall, totalViuPlanos);

      const count5mFromList = periodo === 'hoje' ? ((list5m as any[]) || []).filter(r => !ADMIN_EMAILS.includes((r.email || '').toLowerCase().trim())).length : 0;
      const count5m = periodo === 'hoje' ? Math.max(totalOnline5m, count5mFromList) : 0;
      
      // Para online (dia inteiro), pega o totalOnline extraído do RPC (se disponível) ou da lista
      const countOnlineFromList = ((listOnline as any[]) || []).filter(r => !ADMIN_EMAILS.includes((r.email || '').toLowerCase().trim())).length;
      const countOnline = Math.max(totalOnline, countOnlineFromList, count5m);
      const novos: Record<CardId | 'trialValor' | 'renovouValor', number> = {
        online5m: count5m, 
        online: countOnline, 
        cadastros: totalCadastros, 
        paywall: totalPaywall,
        viu_planos: totalViuPlanos,
        trial: totalTrial,
        trialValor: totalTrialValor,
        renovou: totalRenovou,
        renovouValor: totalRenovouValor,
      };
      setCounts(novos);
    
    if (periodo === 'hoje') {
      const hojeIso = isoDate(datas[0]);
      try {
        localStorage.setItem(`admin_hoje_counts_cache_${hojeIso}`, JSON.stringify(novos));
        // Remove caches de dias anteriores para manter o storage limpo
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('admin_hoje_counts_cache_') && !k.endsWith(hojeIso)) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      (['online5m', 'online', 'cadastros', 'paywall', 'viu_planos', 'trial', 'renovou'] as CardId[]).forEach((id) => {
        const seenKey = seenStorageKey(id, datas[0]);
        if (!localStorage.getItem(seenKey)) {
          writeSeen(id, datas[0], { count: novos[id], keys: [] });
          setSeenCounts((c) => ({ ...c, [id]: novos[id] }));
        }
      });
    } else {
      setSeenCounts({ online5m: 0, online: 0, cadastros: 0, paywall: 0, viu_planos: 0, trial: 0, renovou: 0 });
    }
  } catch (err) {
    console.error('Erro em AdminHojeCards load():', err);
  } finally {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    isFetching.current = false;
    setIsUpdating(false);
    setUltimaAtualizacao(new Date());
  }
  }, [periodo, getDatasPeriodo]);


  // Polling automático e detector de virada de meia-noite
  useEffect(() => {
    void load();
    if (periodo === 'hoje') {
      // Polling a cada 30s para manter dados atualizados com baixo consumo de conexões
      const t = setInterval(() => {
        const hojeAtual = isoDate(getHojeBrasilia());
        if (currentDayRef.current !== hojeAtual) {
          currentDayRef.current = hojeAtual;
          setDia(getHojeBrasilia());
        }
        void load();
      }, 30_000);
      return () => clearInterval(t);
    }
  }, [load, periodo]);

  // Atualização instantânea ao retomar visibilidade da aba ou foco
  useEffect(() => {
    const handleReactivate = () => {
      if (document.visibilityState === 'visible') {
        const hojeAtual = isoDate(getHojeBrasilia());
        if (currentDayRef.current !== hojeAtual) {
          currentDayRef.current = hojeAtual;
          setDia(getHojeBrasilia());
        }
        void load();
      }
    };

    document.addEventListener('visibilitychange', handleReactivate);
    window.addEventListener('focus', handleReactivate);
    window.addEventListener('online', handleReactivate);
    return () => {
      document.removeEventListener('visibilitychange', handleReactivate);
      window.removeEventListener('focus', handleReactivate);
      window.removeEventListener('online', handleReactivate);
    };
  }, [load]);

  // Supabase Realtime: atualiza dashboard instantaneamente em novos cadastros e assinaturas
  useEffect(() => {
    if (periodo !== 'hoje') return;

    let debounceTimer: NodeJS.Timeout | null = null;
    const triggerDebouncedLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void load();
      }, 2000);
    };

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        triggerDebouncedLoad
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'legacy_subscribers' },
        triggerDebouncedLoad
      )
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'play_subscriptions' },
        triggerDebouncedLoad
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'apple_subscriptions' },
        triggerDebouncedLoad
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'asaas_subscriptions' },
        triggerDebouncedLoad
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          triggerDebouncedLoad();
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
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
      const { startIso, endIso } = getBrasiliaDayRange(datas);
      let allLists: any[] = [];

      if (id === 'trial' || id === 'renovou') {
        const isRenovou = id === 'renovou';

        const inPeriod = (dateStr?: string | null) => {
          if (!dateStr) return false;
          const t = new Date(dateStr).getTime();
          return !isNaN(t) && t >= new Date(startIso).getTime() && t < new Date(endIso).getTime();
        };

        const [asaasRes, playRes, appleRes, legRes, purchaseEvRes, oldLegRes] = await Promise.all([
          supabase
            .from('asaas_subscriptions')
            .select(`
              id, user_id, created_at, started_at, plano, status, asaas_customer_id, asaas_subscription_id
            `)
            .or(`started_at.gte.${startIso},created_at.gte.${startIso}`),
          supabase
            .from('play_subscriptions')
            .select(`
              id, user_id, created_at, product_id, status
            `)
            .gte('created_at', startIso)
            .lt('created_at', endIso)
            .order('created_at', { ascending: false }),
          supabase
            .from('apple_subscriptions')
            .select(`
              id, user_id, created_at, start_time, product_id, status
            `)
            .or(`created_at.gte.${startIso},start_time.gte.${startIso}`),
          supabase
            .from('legacy_subscribers')
            .select('id, created_at, email, tipo, status, claimed_user_id, asaas_customer_id, nome')
            .gte('created_at', startIso)
            .lt('created_at', endIso)
            .order('created_at', { ascending: false }),
          supabase
            .from('app_events')
            .select('id, user_id, email, created_at, event_name, metadata')
            .eq('event_name', 'purchase')
            .gte('created_at', startIso)
            .lt('created_at', endIso)
            .order('created_at', { ascending: false }),
          supabase
            .from('legacy_subscribers')
            .select('email, claimed_user_id')
            .lt('created_at', startIso)
        ]);

        const oldLegEmails = new Set<string>();
        const oldLegUids = new Set<string>();
        (oldLegRes?.data || []).forEach((l: any) => {
          if (l.claimed_user_id) oldLegUids.add(l.claimed_user_id);
          if (l.email) oldLegEmails.add(l.email.toLowerCase().trim());
        });

        const existingUserIds = new Set<string>();

        // Buscar perfis para preencher nomes/emails e identificar se conta já existia antes de hoje
        const allUids = Array.from(new Set([
          ...(asaasRes.data || []).map((s: any) => s.user_id),
          ...(playRes.data || []).map((s: any) => s.user_id),
          ...(appleRes.data || []).map((s: any) => s.user_id),
          ...(purchaseEvRes.data || []).map((e: any) => e.user_id)
        ])).filter(Boolean) as string[];

        const [{ data: profs }, { data: legUsers }, { data: userEvents }, { data: priorAsaasSubs }] = await Promise.all([
          allUids.length > 0 ? supabase.from('profiles').select('id, display_name, email, created_at, avatar_url').in('id', allUids) : { data: [] },
          allUids.length > 0 ? supabase.from('legacy_subscribers').select('claimed_user_id, email, nome').in('claimed_user_id', allUids) : { data: [] },
          allUids.length > 0 ? supabase.from('app_events').select('user_id, email').in('user_id', allUids).not('email', 'is', null) : { data: [] },
          allUids.length > 0 ? supabase.from('asaas_subscriptions').select('user_id').in('user_id', allUids).lt('created_at', startIso) : { data: [] }
        ]);

        const profMap = new Map<string, { name?: string; email?: string; created_at?: string; avatar_url?: string }>();
        if (profs) {
          profs.forEach((p: any) => {
            profMap.set(p.id, { name: p.display_name, email: p.email, created_at: p.created_at, avatar_url: p.avatar_url });
          });
        }
        if (legUsers) {
          legUsers.forEach((l: any) => {
            if (l.claimed_user_id) {
              const cur = profMap.get(l.claimed_user_id) || {};
              profMap.set(l.claimed_user_id, {
                ...cur,
                name: cur.name || l.nome,
                email: l.email || cur.email
              });
            }
          });
        }
        if (userEvents) {
          userEvents.forEach((e: any) => {
            if (e.user_id && e.email) {
              const cur = profMap.get(e.user_id) || {};
              if (!cur.email) cur.email = e.email;
              profMap.set(e.user_id, cur);
            }
          });
        }

        const priorAsaasUids = new Set<string>();
        (priorAsaasSubs || []).forEach((s: any) => {
          if (s.user_id) priorAsaasUids.add(s.user_id);
        });

        const isAntigo = (uid?: string | null, email?: string | null, createdAt?: string | null) => {
          const em = (email || '').toLowerCase().trim();
          if (uid && oldLegUids.has(uid)) return true;
          if (em && oldLegEmails.has(em)) return true;
          if (uid && priorAsaasUids.has(uid)) return true;
          if (uid && profMap.has(uid)) {
            const pTime = new Date(profMap.get(uid)?.created_at || 0).getTime();
            const sTime = new Date(startIso).getTime();
            if (!isNaN(pTime) && pTime > 0 && pTime < sTime) return true;
          }
          if (createdAt) {
            const createdTime = new Date(createdAt).getTime();
            const startTime = new Date(startIso).getTime();
            if (!isNaN(createdTime) && createdTime < startTime) return true;
          }
          return false;
        };

        // 1. Assinaturas Asaas
        (asaasRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (st !== 'ACTIVE' && st !== 'ACTIVE_GRACE' && st !== 'CONFIRMED' && st !== 'RECEIVED' && st !== 'PAGA') return;
          if (!inPeriod(s.started_at) && !inPeriod(s.created_at)) return;
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const profInfo = profMap.get(s.user_id);
          const userIsAntigo = isAntigo(s.user_id, profInfo?.email, s.created_at);
          if (isRenovou ? !userIsAntigo : userIsAntigo) return;

          const planoLower = (s.plano || '').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));
          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';

          allLists.push({
            key: `asaas-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante Asaas',
            email: profInfo?.email || null,
            subtitle: isRenovou ? `Renovou via Asaas (${planName})` : `Assinou via Asaas (${planName})`,
            at: s.started_at || s.created_at,
            acessos: null,
            avatar_url: profInfo?.avatar_url || null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: 'Ativo', expires_at: s.expires_at },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // 2. Eventos de Checkout/Compra confirmados hoje
        (purchaseEvRes.data || []).forEach((e: any) => {
          const em = (e.email || '').toLowerCase().trim();
          if (ADMIN_EMAILS.includes(em)) return;
          const uid = e.user_id || em;
          if (!uid || existingUserIds.has(uid)) return;
          const profInfo = profMap.get(e.user_id);
          const userIsAntigo = isAntigo(e.user_id, em || profInfo?.email, null);
          if (isRenovou ? !userIsAntigo : userIsAntigo) return;

          const meta = e.metadata || {};
          const planoLower = (meta.plano || 'anual').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));
          const planValor = typeof meta.value === 'number' && meta.value > 0
            ? meta.value
            : (isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL);
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';

          allLists.push({
            key: `event-${e.id}`,
            user_id: e.user_id || null,
            title: profInfo?.name || em.split('@')[0] || 'Assinante',
            email: em || profInfo?.email || null,
            subtitle: isRenovou ? `Renovou via Asaas (${planName})` : `Assinou via Checkout (${planName})`,
            at: e.created_at,
            acessos: null,
            avatar_url: profInfo?.avatar_url || null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: 'Ativo', expires_at: null },
          });
          existingUserIds.add(uid);
        });

        // 3. Play Store
        (playRes.data || []).forEach((s: any) => {
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const profInfo = profMap.get(s.user_id);
          const userIsAntigo = isAntigo(s.user_id, profInfo?.email, s.created_at);
          if (isRenovou ? !userIsAntigo : userIsAntigo) return;
          const isAnualOrVit = s.product_id?.includes('anual') || s.product_id?.includes('vitalicio');
          const planValor = isAnualOrVit ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isAnualOrVit ? 'Anual/Vitalício' : 'Mensal';

          allLists.push({
            key: `play-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante Play Store',
            email: profInfo?.email || null,
            subtitle: isRenovou ? `Renovou via Google Play (${planName})` : `Assinou via Google Play (${planName})`,
            at: s.created_at,
            acessos: null,
            avatar_url: profInfo?.avatar_url || null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: null },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // 4. Apple Store
        (appleRes.data || []).forEach((s: any) => {
          if (s.user_id && existingUserIds.has(s.user_id)) return;
          const profInfo = profMap.get(s.user_id);
          const userIsAntigo = isAntigo(s.user_id, profInfo?.email, s.created_at);
          if (isRenovou ? !userIsAntigo : userIsAntigo) return;
          const isAnual = s.product_id?.includes('anual');
          const planValor = isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isAnual ? 'Anual' : 'Mensal';

          allLists.push({
            key: `apple-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante App Store',
            email: profInfo?.email || null,
            subtitle: isRenovou ? `Renovou via Apple (${planName})` : `Assinou via Apple (${planName})`,
            at: s.created_at || s.start_time,
            acessos: null,
            avatar_url: profInfo?.avatar_url || null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: null },
          });
          if (s.user_id) existingUserIds.add(s.user_id);
        });

        // 5. Legados
        (legRes.data || []).forEach((e: any) => {
          const userIsAntigo = isAntigo(e.claimed_user_id, e.email, e.created_at);
          if (isRenovou ? !userIsAntigo : userIsAntigo) return;
          allLists.push({
            key: `leg-${e.id}`,
            user_id: e.claimed_user_id || null,
            title: e.nome || e.email?.split('@')[0] || 'Usuário',
            email: e.email,
            subtitle: isRenovou ? `Renovou via Asaas (${e.status})` : `Assinou via Asaas (${e.status})`,
            at: e.created_at,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: e.tipo === 'vitalicio' ? PRECO_VITALICIO : PRECO_MENSAL,
            planTag: { plano: e.tipo || 'Assinatura', status: e.status, expires_at: null },
          });
        });
      } else if (id === 'cadastros') {
        const { data: cadProfs } = await supabase
          .from('profiles')
          .select('id, email, display_name, created_at, avatar_url, is_premium')
          .gte('created_at', startIso)
          .lt('created_at', endIso)
          .order('created_at', { ascending: false })
          .limit(100);

        allLists = (cadProfs || []).map((p: any) => {
          const isGoogle = p.avatar_url?.includes('googleusercontent.com');
          return {
            key: p.id,
            user_id: p.id,
            title: p.display_name || p.email?.split('@')[0] || 'Usuário',
            email: p.email,
            provider: isGoogle ? 'google' : (p.email ? 'email' : null),
            subtitle: 'Novo cadastro',
            at: p.created_at,
            is_premium: p.is_premium ?? false,
            avatar_url: p.avatar_url || null,
            acessos: null,
            created_at: p.created_at
          };
        });
      } else if (id === 'online5m' || id === 'online') {
        const minTime = id === 'online5m'
          ? new Date(Date.now() - 5 * 60 * 1000).toISOString()
          : startIso;

        const { data: actRows } = await supabase
          .from('user_activity_log')
          .select(`
            user_id, last_seen_at, last_route,
            profiles:user_id ( id, display_name, email, avatar_url, is_premium )
          `)
          .gte('last_seen_at', minTime)
          .order('last_seen_at', { ascending: false })
          .limit(100);

        allLists = (actRows || []).map((a: any) => {
          const p = a.profiles || {};
          const isGoogle = p.avatar_url?.includes('googleusercontent.com');
          const routeLabel = a.last_route ? rotaParaFuncao(a.last_route).label : null;
          return {
            key: a.user_id,
            user_id: a.user_id,
            title: p.display_name || p.email?.split('@')[0] || 'Usuário',
            email: p.email,
            provider: isGoogle ? 'google' : (p.email ? 'email' : null),
            subtitle: (routeLabel && routeLabel !== 'Desconhecida') ? routeLabel : (id === 'online5m' ? 'Online nos últimos 5 min' : 'Online hoje'),
            at: a.last_seen_at,
            is_premium: p.is_premium ?? false,
            avatar_url: p.avatar_url || null,
            acessos: null,
            created_at: null
          };
        });
      } else if (id === 'paywall' || id === 'viu_planos') {
        const eventNames = id === 'viu_planos' 
          ? ['trial_click', 'checkout_pix_gerado', 'checkout_cc_enviado', 'checkout_cc_recusado', 'checkout_cc_aprovado'] 
          : ['trial_click', 'assinatura_aberta', 'paywall_view'];

        const { data: vpEvents } = await supabase
          .from('app_events')
          .select(`
            id, user_id, created_at, email, event_name, metadata,
            profiles:user_id ( display_name, is_premium )
          `)
          .in('event_name', eventNames)
          .gte('created_at', startIso)
          .lt('created_at', endIso)
          .order('created_at', { ascending: false })
          .limit(100);

        if (vpEvents) {
          const userEventsMap = new Map<string, any>();
          vpEvents.forEach((e: any) => {
            const em = (e.email || '').toLowerCase().trim();
            if (ADMIN_EMAILS.includes(em)) return;
            const uid = e.user_id || em;
            if (!userEventsMap.has(uid)) {
              userEventsMap.set(uid, {
                ...e,
                uemail: e.email || 'Visitante',
                logs: [],
                acessos: 0,
                latestAt: e.created_at
              });
            }
            const userObj = userEventsMap.get(uid);
            userObj.acessos = (userObj.acessos || 0) + 1;
            if (new Date(e.created_at).getTime() > new Date(userObj.latestAt).getTime()) {
              userObj.latestAt = e.created_at;
            }
            if (e.event_name !== 'trial_click' && e.event_name !== 'assinatura_aberta' && e.event_name !== 'paywall_view') {
              userObj.logs.push({
                event_name: e.event_name,
                created_at: e.created_at,
                erro: e.metadata?.erro,
                plano: e.metadata?.plano
              });
            }
          });

          allLists = Array.from(userEventsMap.values()).map((e: any) => ({
            key: e.user_id || e.id,
            user_id: e.user_id,
            title: e.profiles?.display_name || e.uemail.split('@')[0],
            email: e.uemail,
            subtitle: id === 'viu_planos' ? 'Abriu checkout (Clicou)' : 'Abriu planos',
            at: e.latestAt || e.created_at,
            acessos: e.acessos || 1,
            avatar_url: null,
            is_premium: e.profiles?.is_premium || false,
            created_at: e.created_at,
            logsCheckout: e.logs
          }));
        }
      }

      // Deduplicate by user (since same user could be online or trigger multiple events)
      const uniqueMap = new Map();
      allLists.forEach(r => {
        const uid = r.user_id || r.userId;
        const em = (r.email || '').toLowerCase().trim();
        const dedupeKey = uid || em || r.key;
        if (!uniqueMap.has(dedupeKey)) {
          uniqueMap.set(dedupeKey, { ...r, acessos: typeof r.acessos === 'number' && r.acessos > 0 ? r.acessos : 1 });
        } else {
          const cur = uniqueMap.get(dedupeKey);
          cur.acessos = Math.max(cur.acessos || 1, (cur.acessos || 0) + (typeof r.acessos === 'number' && r.acessos > 0 ? r.acessos : 1));
          const thisAt = new Date(r.at || r.last_seen || r.created_at || 0).getTime();
          const curAt = new Date(cur.at || cur.last_seen || cur.created_at || 0).getTime();
          if (thisAt > curAt) {
            cur.at = r.at || r.last_seen || r.created_at;
          }
          if (!cur.avatar_url && r.avatar_url) cur.avatar_url = r.avatar_url;
          if (!cur.logsCheckout && r.logsCheckout) cur.logsCheckout = r.logsCheckout;
          if (r.is_premium) cur.is_premium = true;
          if (!cur.user_id && r.user_id) cur.user_id = r.user_id;
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
        acessos: typeof r.acessos === 'number' ? r.acessos : 1,
        avatarUrl: r.avatar_url,
        isPremium: r.is_premium,
        planValue: r.planValue,
        planTag: r.planTag,
        created_at: r.created_at,
        faixaEtaria: r.faixa_etaria,
        logsCheckout: r.logsCheckout,
      })).filter(r => !ADMIN_EMAILS.includes((r.email || '').toLowerCase().trim()));

      if (id === 'trial' && list.length > 0) {
        // Agora tratamos "trial" como "Assinou via Asaas". Não vamos chamar o endpoint antigo de Google/Apple.
        // Já mapeamos o isPremium e o planValue na lista acima.
      }

      setRows(list);
      setLoading(false); // Show list immediately; enrichment happens in background
      if (periodo === 'hoje') rowsCache.current[id] = list;

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
        const minD = new Date(datas[datas.length - 1]);
        minD.setHours(0, 0, 0, 0);
        const maxD = new Date(datas[0]);
        maxD.setDate(maxD.getDate() + 1);
        maxD.setHours(0, 0, 0, 0);

        // Buscar acessos específicos e dados de assinatura para os usuários:
        const [
          { data: provs },
          { data: acts },
          { data: pwEvents },
          { data: userSessionsPeriodo },
          { data: profs },
          { data: userAsaasSubs },
          { data: userPlaySubs },
          { data: userAppleSubs },
          { data: userPurchaseEvs }
        ] = await Promise.all([
          supabase.rpc('admin_user_auth_providers' as any, { _ids: ids }),
          supabase.from('user_activity_log').select('user_id, created_at').in('user_id', ids).gte('created_at', minD.toISOString()).lt('created_at', maxD.toISOString()).order('created_at', { ascending: true }),
          (id === 'paywall' || id === 'viu_planos')
            ? supabase.from('app_events').select('user_id, email, created_at').in('event_name', id === 'viu_planos' ? ['trial_click', 'checkout_pix_gerado', 'checkout_cc_enviado', 'checkout_cc_recusado', 'checkout_cc_aprovado'] : ['assinatura_aberta', 'paywall_view']).in('user_id', ids).gte('created_at', minD.toISOString()).lt('created_at', maxD.toISOString())
            : Promise.resolve({ data: [] }),
          supabase.from('user_sessions').select('user_id, initial_route, started_at').in('user_id', ids).gte('started_at', minD.toISOString()).lt('started_at', maxD.toISOString()),
          supabase.from('profiles').select('id, created_at, faixa_etaria, is_premium').in('id', ids),
          supabase.from('asaas_subscriptions').select('user_id, plano, status, expires_at, started_at').in('user_id', ids),
          supabase.from('play_subscriptions').select('user_id, product_id, status, expires_at').in('user_id', ids),
          supabase.from('apple_subscriptions').select('user_id, product_id, status, expires_at').in('user_id', ids),
          supabase.from('app_events').select('user_id, metadata, event_name').in('user_id', ids).in('event_name', ['purchase', 'checkout_cc_aprovado', 'subscription_started']).order('created_at', { ascending: false })
        ]);

        const map = new Map<string, string>(((provs as any[]) || []).map((p) => [p.user_id || p.id, p.provider]));
        const profMap = new Map<string, { created_at?: string; faixa_etaria?: string; is_premium?: boolean }>(
          ((profs as any[]) || []).map((p: any) => [p.id, { created_at: p.created_at, faixa_etaria: p.faixa_etaria, is_premium: p.is_premium }])
        );

        // Mapear plano e preço de cada usuário para exibir na lista
        const subInfoMap = new Map<string, { planValue: number; planTag: { plano: string; status: string; expires_at: string | null } }>();

        (userAsaasSubs || []).forEach((s: any) => {
          if (!s.user_id) return;
          const st = (s.status || '').toUpperCase();
          const isAtivo = st === 'ACTIVE' || st === 'ACTIVE_GRACE' || st === 'CONFIRMED' || st === 'RECEIVED' || st === 'PAGA';
          const planoLower = (s.plano || '').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));
          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: isAtivo ? 'ACTIVE' : s.status, expires_at: s.expires_at }
          });
        });

        (userPlaySubs || []).forEach((s: any) => {
          if (!s.user_id || subInfoMap.has(s.user_id)) return;
          const isAnualOrVit = s.product_id?.includes('anual') || s.product_id?.includes('vitalicio');
          const planValor = isAnualOrVit ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isAnualOrVit ? 'Anual/Vitalício' : 'Mensal';
          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: s.expires_at }
          });
        });

        (userAppleSubs || []).forEach((s: any) => {
          if (!s.user_id || subInfoMap.has(s.user_id)) return;
          const isAnual = s.product_id?.includes('anual');
          const planValor = isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isAnual ? 'Anual' : 'Mensal';
          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: s.status, expires_at: s.expires_at }
          });
        });

        (userPurchaseEvs || []).forEach((e: any) => {
          if (!e.user_id || subInfoMap.has(e.user_id)) return;
          const meta = e.metadata || {};
          const planoLower = (meta.plano || 'anual').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));
          const planValor = typeof meta.value === 'number' && meta.value > 0
            ? meta.value
            : (isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL);
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
          subInfoMap.set(e.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: 'ACTIVE', expires_at: null }
          });
        });
        
        const tempoMap = new Map<string, number>();
        const acessosMap = new Map<string, number>();

        if (acts) {
          const logsByUser: Record<string, string[]> = {};
          acts.forEach((log: any) => {
            if (!logsByUser[log.user_id]) logsByUser[log.user_id] = [];
            logsByUser[log.user_id].push(log.created_at);
          });
          Object.keys(logsByUser).forEach(uid => {
            const logs = logsByUser[uid];
            let segundos = 0;
            for (let i = 1; i < logs.length; i++) {
              const prev = new Date(logs[i - 1]).getTime();
              const curr = new Date(logs[i]).getTime();
              let delta = (curr - prev) / 1000;
              if (delta > 30 * 60) delta = 60; 
              segundos += delta;
            }
            tempoMap.set(uid, segundos);
          });
        }

        if ((id === 'paywall' || id === 'viu_planos') && pwEvents) {
          // Conta exatamente quantas vezes o usuário abriu a tela de assinaturas ou checkout no período
          const pwByUser: Record<string, number> = {};
          pwEvents.forEach((pw: any) => {
            if (pw.user_id) pwByUser[pw.user_id] = (pwByUser[pw.user_id] || 0) + 1;
            const em = (pw.email || '').toLowerCase().trim();
            if (em) pwByUser[em] = (pwByUser[em] || 0) + 1;
          });
          Object.keys(pwByUser).forEach(uid => {
            acessosMap.set(uid, pwByUser[uid]);
          });
        } else if (userSessionsPeriodo) {
          // Conta quantas sessões reais de abertura do aplicativo no período
          const sessByUser: Record<string, number> = {};
          userSessionsPeriodo.forEach((s: any) => {
            if (s.user_id) sessByUser[s.user_id] = (sessByUser[s.user_id] || 0) + 1;
          });
          Object.keys(sessByUser).forEach(uid => {
            acessosMap.set(uid, sessByUser[uid]);
          });
        }

        const mapFav = new Map<string, string>();
        if (userSessionsPeriodo && userSessionsPeriodo.length > 0) {
          ids.forEach(uid => {
            const userSessions = userSessionsPeriodo.filter((s: any) => s.user_id === uid && s.initial_route);
            if (userSessions.length > 0) {
              const freq: Record<string, number> = {};
              userSessions.forEach((s: any) => { freq[s.initial_route!] = (freq[s.initial_route!] || 0) + 1; });
              const fav = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
              mapFav.set(uid, rotaParaFuncao(fav).label);
            }
          });
        }

        setRows((current) => {
          const updated = current.map((r) => {
            const rUid = r.userId || r.key;
            const rEm = (r.email || '').toLowerCase().trim();
            const rProv = map.get(rUid) || (r.avatarUrl?.includes('googleusercontent.com') ? 'google' : r.provider);
            const calcAcessos = acessosMap.get(rUid) || (rEm ? acessosMap.get(rEm) : undefined);
            const profData = profMap.get(rUid);
            const subData = subInfoMap.get(rUid);
            const isUserPrem = Boolean(r.isPremium || profData?.is_premium || subData);
            let finalPlanTag = r.planTag || subData?.planTag;
            let finalPlanValue = r.planValue || subData?.planValue;
            if (isUserPrem && !finalPlanTag) {
              finalPlanTag = { plano: 'Anual', status: 'ACTIVE', expires_at: null };
              finalPlanValue = finalPlanValue || PRECO_ANUAL;
            }

            return { 
              ...r, 
              provider: rProv,
              funcaoPreferida: mapFav.get(rUid),
              tempo_tela: tempoMap.get(rUid) || null,
              acessos: (calcAcessos !== undefined && calcAcessos > 0) ? calcAcessos : (r.acessos || 1),
              created_at: r.created_at || profData?.created_at || null,
              faixaEtaria: r.faixaEtaria || profData?.faixa_etaria || null,
              isPremium: isUserPrem,
              planTag: finalPlanTag,
              planValue: finalPlanValue,
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
    if (id === 'online' || id === 'online5m') {
      setFiltroUser('gratuitos');
    }
    const hoje = getHojeBrasilia();
    // Ao abrir o card, limpa o indicador de novas notificações
    writeSeen(id, hoje, { count: counts[id] || 0, keys: [] });
    setSeenCounts((c) => ({ ...c, [id]: counts[id] || 0 }));

    if (rowsCache.current[id] && periodo === 'hoje') {
      setRows(rowsCache.current[id]);
      setLoading(false);
    }

    fetchRows(id, hoje);
  }, [fetchRows, counts, periodo]);

  // Deep link vindo do push do admin: /admin-funcoes?card=cadastros|trial|renovou|online
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const card = params.get('card');
    if (card === 'cadastros' || card === 'trial' || card === 'renovou' || card === 'online' || card === 'online5m' || card === 'paywall' || card === 'viu_planos') {
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
    const d = getHojeBrasilia();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  });

  const dataHojePtBr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(dia);
  const horaAtualizacao = ultimaAtualizacao.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const CARDS: { id: CardId; label: string; icon: any }[] = [
    { id: 'online5m', label: 'Online 5 min', icon: Zap },
    { 
      id: 'online', 
      label: periodo === 'ontem' ? 'Online ontem' : periodo === '7d' ? 'Online (7 dias)' : periodo === '30d' ? 'Online (30 dias)' : `Online hoje`, 
      icon: Radio 
    },
    { id: 'cadastros', label: 'Cadastrados', icon: UserPlus },
    { id: 'paywall', label: 'Tela de Assinaturas', icon: Sparkles },
    { id: 'viu_planos', label: 'Checkout', icon: Check },
    { id: 'trial', label: 'Assinou', icon: DollarSign },
    { id: 'renovou', label: 'Renovou', icon: Repeat },
  ];

  const titles: Record<CardId, string> = {
    online5m: 'Online (Últimos 5 min)',
    online: 'Online',
    cadastros: 'Cadastrados',
    paywall: 'Entraram em Assinaturas',
    viu_planos: 'Abriram Checkout',
    trial: 'Assinaram',
    renovou: 'Renovaram',
  };

  const rotuloPeriodo = {
    hoje: `Hoje (${dataHojePtBr})`,
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

  const renderCardButton = ({ id, label, icon: Icon }: typeof CARDS[0]) => {
    const isZero = counts[id] === 0;
    const isFinancial = id === 'trial' || id === 'renovou';
    const valorFinanceiro = id === 'trial' ? counts.trialValor : counts.renovouValor;

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
            {isFinancial && (
              <span className={cn(
                "block font-['Plus_Jakarta_Sans',sans-serif] text-[9.5px] font-bold mt-0.5 truncate",
                valorFinanceiro === 0 ? "text-zinc-600" : "text-emerald-400"
              )}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorFinanceiro)}
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
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase opacity-70">
            Visão Geral
          </h2>
          {periodo === 'hoje' && (
            <span 
              title={`Atualização automática ativa · Última: ${horaAtualizacao}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AO VIVO
            </span>
          )}
          {isUpdating && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select 
            value={periodo} 
            onChange={(e) => selecionarPeriodo(e.target.value as PeriodoId)}
            className="bg-secondary/40 border border-border/60 text-foreground text-xs font-semibold py-1.5 px-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-secondary/60 focus:border-primary/50 transition-colors"
          >
            <option value="hoje">Hoje ({dataHojePtBr})</option>
            <option value="ontem">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={isUpdating}
            title={`Atualizar agora · Última sincronização: ${horaAtualizacao}`}
            className="p-1.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/60 active:opacity-70 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isUpdating && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* Linha 1: 3 cards de Tráfego e Cadastros */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-2 sm:mb-2.5">
        {CARDS.slice(0, 3).map(renderCardButton)}
      </div>

      {/* Linha 2: 4 cards de Conversão, Vendas e Renovações */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-3">
        {CARDS.slice(3).map(renderCardButton)}
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
                {(['gratuitos', 'assinantes', 'todos'] as const).map((t) => (
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
                    {t === 'gratuitos' ? 'Gratuitos' : t === 'assinantes' ? 'Assinantes' : 'Todos'}
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
                        {typeof r.acessos === 'number' && r.acessos > 1 && (
                          <span
                            title={`${r.acessos} acessos no dia`}
                            className="shrink-0 font-body text-[10.5px] font-bold text-rose-400"
                          >
                            {r.acessos}x
                          </span>
                        )}
                        {typeof r.tempo_tela === 'number' && r.tempo_tela > 0 && (
                          <span
                            title="Tempo de tela"
                            className="shrink-0 font-body text-[10.5px] font-bold text-emerald-500"
                          >
                            · {formatarDuracao(r.tempo_tela)}
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
                            {(open === 'online' || open === 'online5m') ? (
                              renderTrialCountdown(r.created_at, (r as any).isPremium ?? r.is_premium)
                            ) : (
                              formatTempoCadastro(r.created_at, null)
                            )}
                            {r.faixaEtaria && (
                              <>
                                <span>·</span>
                                <span>{r.faixaEtaria}</span>
                              </>
                            )}
                          </div>
                        )}
                        {(open === 'online' || open === 'online5m') && r.subtitle && r.subtitle !== 'Desconhecida' && r.subtitle !== 'App aberto' && (
                          <div className="font-body text-[10.5px] text-emerald-400 font-medium truncate mt-0.5">
                            Em {r.subtitle}
                          </div>
                        )}
                        {(open === 'online' || open === 'online5m') && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[9.5px] font-semibold text-purple-300 hover:bg-purple-500/25 transition-colors"
                              title="Clique para ver o dossiê e o status detalhado de uso"
                            >
                              <Target className="w-2.5 h-2.5 text-purple-400" />
                              Uso de Recursos
                            </span>
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
                        {r.logsCheckout && r.logsCheckout.length > 0 && (
                          <div className="mt-2 space-y-1">
                             {r.logsCheckout.map((log, idx) => (
                               <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                 <span className="text-muted-foreground/60">{hora(log.created_at)}</span>
                                 {log.event_name === 'checkout_pix_gerado' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded uppercase font-bold text-[9px]">PIX GERADO</span>}
                                 {log.event_name === 'checkout_cc_enviado' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-bold text-[9px]">CC ENVIADO</span>}
                                 {log.event_name === 'checkout_cc_recusado' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded uppercase font-bold text-[9px]">CC RECUSADO</span>}
                                 {log.event_name === 'checkout_cc_aprovado' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded uppercase font-bold text-[9px]">CC APROVADO</span>}
                                 {log.plano && <span className="text-muted-foreground ml-1">({log.plano.replace('_', ' ')})</span>}
                                 {log.erro && <span className="text-rose-400 ml-1 truncate max-w-[120px]" title={log.erro}>- {log.erro}</span>}
                               </div>
                             ))}
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

