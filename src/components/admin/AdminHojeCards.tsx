// @ts-nocheck
import { useCallback, useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Radio, UserPlus, Sparkles, Zap, DollarSign, Check, RefreshCw, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { rotaParaFuncao } from '@/lib/rotaFuncoes';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO } from '@/lib/precos';
import { isAnualAntigo } from '@/hooks/useSubscription';
import { isAdminEmail } from '@/lib/adminEmails';
import type { CardId, CountsState, PeriodoId, Row, TotaisData } from './visao-geral/visaoGeralTypes';
import {
  getHojeBrasilia,
  isoDate,
  getBrasiliaDayRange,
  sameDay,
  hora,
  readSeen,
  writeSeen,
} from './visao-geral/visaoGeralUtils';
import { VisaoGeralFunilBar } from './visao-geral/VisaoGeralFunilBar';

const UserDossieSheet = lazy(() =>
  import('./UserDossieSheet').then((m) => ({ default: m.UserDossieSheet })),
);
const VisaoGeralListaSheet = lazy(() => import('./visao-geral/VisaoGeralListaSheet'));
const VisaoGeralTotaisSheet = lazy(() => import('./visao-geral/VisaoGeralTotaisSheet'));

// Cache em memória para métricas de datas passadas (evita recalcular dias imutáveis no Postgres)
const pastDaysMetricasCache = new Map<string, any>();

export function AdminHojeCards() {
  const [counts, setCounts] = useState<Record<CardId | 'trialValor' | 'renovouValor' | 'checkoutPago' | 'checkoutRecusado' | 'checkoutEtapa2' | 'checkoutDesistiu', number>>(() => {
    try {
      const hojeIso = isoDate(getHojeBrasilia());
      const cached = localStorage.getItem(`admin_hoje_counts_cache_${hojeIso}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          online5m: Number(parsed.online5m) || 0,
          online: Number(parsed.online) || 0,
          cadastros: Number(parsed.cadastros) || 0,
          paywall: Number(parsed.paywall) || 0,
          viu_planos: Number(parsed.viu_planos) || 0,
          trial: Number(parsed.trial) || 0,
          trialValor: Number.isFinite(Number(parsed.trialValor)) ? Number(parsed.trialValor) : 0,
          renovou: Number(parsed.renovou) || 0,
          renovouValor: Number.isFinite(Number(parsed.renovouValor)) ? Number(parsed.renovouValor) : 0,
          checkoutPago: Number(parsed.checkoutPago) || 0,
          checkoutRecusado: Number(parsed.checkoutRecusado) || 0,
          checkoutEtapa2: Number(parsed.checkoutEtapa2) || 0,
          checkoutDesistiu: Number(parsed.checkoutDesistiu) || 0,
        };
      }
    } catch {}
    return { 
      online5m: 0, online: 0, cadastros: 0, paywall: 0, viu_planos: 0, trial: 0, trialValor: 0, renovou: 0, renovouValor: 0,
      checkoutPago: 0, checkoutRecusado: 0, checkoutEtapa2: 0, checkoutDesistiu: 0
    };
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
  const [filtroCheckout, setFiltroCheckout] = useState<'todos' | 'pagos' | 'recusados' | 'abandonos'>('todos');
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
  const prevCountsRef = useRef<Record<string, number>>({});
  const [pulsingCards, setPulsingCards] = useState<Record<string, boolean>>({});


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
    // Evita chamadas em background se a aba estiver oculta para poupar requisições e conexões
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    const { data: sessData } = await supabase.auth.getSession();
    if (!sessData?.session?.access_token) {
      return;
    }
    const currentUserId = sessData.session.user?.id;
    const currentUserEmail = (sessData.session.user?.email || '').toLowerCase().trim();

    const isAdminUser = (uid?: string | null, em?: string | null) => {
      const cleanEm = (em || '').toLowerCase().trim();
      if (isAdminEmail(cleanEm)) return true;
      if (currentUserEmail && cleanEm === currentUserEmail) return true;
      if (currentUserId && uid === currentUserId) return true;
      return false;
    };

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
      const hojeIso = isoDate(datas[0]);
      
      const metricasPromises = datas.map(async (d) => {
        const diaIso = isoDate(d);
        if (diaIso !== hojeIso && pastDaysMetricasCache.has(diaIso)) {
          return { data: pastDaysMetricasCache.get(diaIso), error: null };
        }
        const res = await (supabase.rpc('admin_metricas_dia' as any, { _dia: diaIso }) as any);
        if (diaIso !== hojeIso && res && res.data && !res.error) {
          pastDaysMetricasCache.set(diaIso, res.data);
        }
        return res;
      });
      const [metricasResults, list5mResult, listOnlineResult, listCadastrosResult] = await Promise.allSettled([
        Promise.allSettled(metricasPromises),
        supabase.rpc('admin_lista_dia' as any, { _tipo: 'online5m', _dia: isoDate(datas[0]) }),
        supabase.rpc('admin_lista_dia' as any, { _tipo: 'online', _dia: isoDate(datas[0]) }),
        supabase.rpc('admin_lista_dia' as any, { _tipo: 'cadastros', _dia: isoDate(datas[0]) }),
      ]);
      
      const list5m = (list5mResult.status === 'fulfilled' && Array.isArray((list5mResult.value as any)?.data)) ? (list5mResult.value as any).data : [];
      const listOnline = (listOnlineResult.status === 'fulfilled' && Array.isArray((listOnlineResult.value as any)?.data)) ? (listOnlineResult.value as any).data : [];
      const listCadastros = (listCadastrosResult.status === 'fulfilled' && Array.isArray((listCadastrosResult.value as any)?.data)) ? (listCadastrosResult.value as any).data : [];

      let totalOnline5m = 0;
      let totalOnline = 0;
      let totalCadastros = 0;
      let totalPaywall = 0;
      let totalViuPlanos = 0;
      let totalTrial = 0;
      let totalTrialValor = 0;
      let totalRenovou = 0;
      let totalRenovouValor = 0;
      let cPago = 0;
      let cRecusado = 0;
      let cEtapa2 = 0;
      let cDesistiu = 0;

      let rawRpcResponse: any = null;
      if (metricasResults.status === 'fulfilled') {
        metricasResults.value.forEach((res) => {
          if (res.status === 'fulfilled') {
            if (res.value.error) console.error('RPC ERROR', res.value.error);
            const m = (res.value.data as any) || {};
            rawRpcResponse = m;
            totalCadastros += m.cadastros || 0;
          } else {
            console.error('[ADMIN DEBUG] metrica rejected:', res.reason);
          }
        });
      }
      
      (window as any)._adminRpcDebug = rawRpcResponse;

      if (periodo === 'hoje') {
        const processList = (listData: any, defaultSubtitle?: string) => {
          const userMap = new Map();
          (listData || []).forEach((r: any) => {
            const uid = r.user_id || r.id;
            const em = (r.email || '').toLowerCase().trim();
            const isAdmin = isAdminUser(uid, em);
            if (isAdmin) return; // NUNCA inclui o administrador em listas de usuários
            const routeLabel = r.subtitle ? rotaParaFuncao(r.subtitle).label : null;
            const cleanSubtitle = (routeLabel && routeLabel !== 'Desconhecida') ? routeLabel : defaultSubtitle;
            const key = uid || em || r.key;
            if (!userMap.has(key)) {
              userMap.set(key, {
                key,
                userId: uid,
                title: r.title || r.nome || em.split('@')[0] || 'Usuário',
                email: r.email,
                provider: r.avatar_url?.includes('googleusercontent.com') ? 'google' : (r.provider || (r.email ? 'email' : null)),
                subtitle: cleanSubtitle,
                at: r.at || r.last_seen || r.created_at,
                isPremium: r.is_premium ?? r.premium ?? false,
                isAdmin: false,
                avatarUrl: r.avatar_url,
                acessos: typeof r.acessos === 'number' ? r.acessos : 1,
                created_at: r.created_at,
                faixaEtaria: r.faixa_etaria
              });
            }
          });
          return Array.from(userMap.values());
        };

        if (list5m.length > 0) rowsCache.current['online5m'] = processList(list5m);
        if (listOnline.length > 0) rowsCache.current['online'] = processList(listOnline);
        if (listCadastros.length > 0) rowsCache.current['cadastros'] = processList(listCadastros, 'Novo cadastro');
      }

      const count5mFromList = ((list5m as any[]) || []).filter(r => !isAdminUser(r.user_id || r.id, r.email)).length;
      totalOnline5m = count5mFromList;

      const countOnlineFromList = ((listOnline as any[]) || []).filter(r => !isAdminUser(r.user_id || r.id, r.email)).length;
      totalOnline = Math.max(countOnlineFromList, totalOnline5m);

      const countCadastrosFromList = ((listCadastros as any[]) || []).filter(r => !isAdminUser(r.user_id || r.id, r.email)).length;
      totalCadastros = Math.max(totalCadastros, countCadastrosFromList);

      try {
        const { startIso, endIso } = getBrasiliaDayRange(datas);

        // Fallback direto de contagem em profiles e user_activity_log
        try {
          const { count: directCadastros } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startIso)
            .lt('created_at', endIso);
          if (typeof directCadastros === 'number' && directCadastros > 0) {
            totalCadastros = Math.max(totalCadastros, directCadastros);
          }

          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: direct5mRows } = await supabase
            .from('user_activity_log')
            .select('user_id, email, display_name, current_route, last_seen_at')
            .gte('last_seen_at', fiveMinAgo)
            .order('last_seen_at', { ascending: false })
            .limit(100);

          const nonAdmin5m = (direct5mRows || []).filter(r => !isAdminUser(r.user_id, r.email));
          const distinct5m = new Set(nonAdmin5m.map(r => r.user_id || (r.email || '').toLowerCase().trim()).filter(Boolean));
          if (periodo === 'hoje') {
            totalOnline5m = distinct5m.size;
          }

          const { data: directOnlineRows } = await supabase
            .from('user_activity_log')
            .select('user_id, email')
            .gte('last_seen_at', startIso)
            .lt('last_seen_at', endIso);

          const nonAdminOnline = (directOnlineRows || []).filter(r => !isAdminUser(r.user_id, r.email));
          const distinctOnline = new Set(nonAdminOnline.map(r => r.user_id || (r.email || '').toLowerCase().trim()).filter(Boolean));
          totalOnline = Math.max(distinctOnline.size, totalOnline5m);
        } catch {}

        // Visualização de Paywall e Checkout diretamente de app_events excluindo admin (sem inflação artificial)
        let checkoutRawEvents: any[] = [];
        try {
          const [paywallEvsRes, checkoutEvsRes] = await Promise.all([
            supabase
              .from('app_events')
              .select('user_id, email')
              .in('event_name', ['paywall_view', 'assinatura_aberta', 'trial_click'])
              .gte('created_at', startIso)
              .lt('created_at', endIso),
            supabase
              .from('app_events')
              .select('user_id, email, event_name, metadata')
              .in('event_name', [
                'begin_checkout',
                'trial_click', 
                'checkout_etapa1_concluida', 
                'checkout_pix_gerado', 
                'checkout_pix_pago', 
                'checkout_cc_enviado', 
                'checkout_cc_recusado', 
                'checkout_cc_aprovado'
              ])
              .gte('created_at', startIso)
              .lt('created_at', endIso),
          ]);

          checkoutRawEvents = checkoutEvsRes.data || [];

          const distinctPaywall = new Set(
            (paywallEvsRes.data || [])
              .filter(e => !isAdminUser(e.user_id, e.email))
              .map(e => e.user_id || (e.email || '').toLowerCase().trim())
              .filter(Boolean)
          );
          totalPaywall = distinctPaywall.size;

          const distinctCheckout = new Set(
            (checkoutEvsRes.data || [])
              .filter(e => !isAdminUser(e.user_id, e.email))
              .map(e => e.user_id || (e.email || '').toLowerCase().trim())
              .filter(Boolean)
          );
          totalViuPlanos = distinctCheckout.size;
        } catch {}

        // Buscar novas assinaturas no Asaas, Play Store, Apple, Legado e Eventos de Compra
        const inPeriod = (dateStr?: string | null) => {
          if (!dateStr) return false;
          const t = new Date(dateStr).getTime();
          return !isNaN(t) && t >= new Date(startIso).getTime() && t < new Date(endIso).getTime();
        };

        const [asaasRes, playRes, appleRes, legRes, purchaseEvRes, oldLegRes] = await Promise.all([
          supabase
            .from('asaas_subscriptions')
            .select('id, user_id, created_at, started_at, updated_at, plano, status')
            .or(`started_at.gte.${startIso},created_at.gte.${startIso},updated_at.gte.${startIso}`),
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

        // Buscar perfis e assinaturas anteriores dos candidatos para identificar renovações vs novos
        const allCandidateUids = Array.from(new Set([
          ...(asaasRes.data || []).map((s: any) => s.user_id),
          ...(playRes.data || []).map((s: any) => s.user_id),
          ...(appleRes.data || []).map((s: any) => s.user_id),
          ...(purchaseEvRes.data || []).map((e: any) => e.user_id)
        ])).filter(Boolean) as string[];

        const [{ data: asaasProfs }, { data: priorAsaasSubs }] = allCandidateUids.length > 0
          ? await Promise.all([
              supabase.from('profiles').select('id, email, created_at').in('id', allCandidateUids),
              supabase.from('asaas_subscriptions').select('user_id').in('user_id', allCandidateUids).lt('created_at', startIso)
            ])
          : [{ data: [] }, { data: [] }];

        const asaasEmailMap = new Map<string, string>();
        (asaasProfs || []).forEach((p: any) => {
          if (p.id && p.email) asaasEmailMap.set(p.id, p.email.toLowerCase().trim());
        });

        const priorAsaasUids = new Set<string>();
        (priorAsaasSubs || []).forEach((s: any) => {
          if (s.user_id) priorAsaasUids.add(s.user_id);
        });

        const hasPriorSubscription = (uid?: string | null, email?: string | null) => {
          const em = (email || '').toLowerCase().trim();
          if (uid && oldLegUids.has(uid)) return true;
          if (em && oldLegEmails.has(em)) return true;
          if (uid && priorAsaasUids.has(uid)) return true;
          return false;
        };

        const subUsers = new Map<string, { plano: string; valor: number }>();
        const renewUsers = new Map<string, { plano: string; valor: number }>();

        (asaasRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (st !== 'ACTIVE' && st !== 'ACTIVE_GRACE' && st !== 'CONFIRMED' && st !== 'RECEIVED' && st !== 'PAGA') return;
          const uid = s.user_id || s.id;
          const userEmail = asaasEmailMap.get(s.user_id);
          if (isAdminUser(s.user_id, userEmail)) return;

          const plano = (s.plano || 'mensal').toLowerCase();
          const isPromo = plano.includes('promocional') || plano.includes('promo');
          const isAnual = plano.includes('anual');
          const isVit = !isPromo && (plano.includes('vitalicio') || plano.includes('vitalício') || plano.includes('vital'));
          const isMensal = !isVit && !isAnual;
          const valor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (isAnual && isPromo) ? 'anual_promocional' : plano;

          const createdInPeriod = inPeriod(s.created_at);
          const startedInPeriod = inPeriod(s.started_at);
          const updatedInPeriod = inPeriod(s.updated_at);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const startedTime = s.started_at ? new Date(s.started_at).getTime() : createdTime;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();
          const isSegundoMesOuMais = createdTime > 0 && (startedTime - createdTime) >= 20 * 24 * 3600 * 1000;

          // 1. Renovação de HOJE (2º ciclo em diante, mensal ou anual):
          // Assinaturas criadas antes do período de hoje ou com mais de 20 dias de existência que tiveram pagamento no período
          if ((startedInPeriod || updatedInPeriod) && (isCriadaAntes || isSegundoMesOuMais)) {
            renewUsers.set(uid, { plano: planName, valor });
            subUsers.delete(uid);
          }
          // 2. Novo assinante de HOJE (apenas as criadas no período ou ativadas hoje):
          else if (!isCriadaAntes && (createdInPeriod || startedInPeriod || updatedInPeriod)) {
            subUsers.set(uid, { plano: planName, valor });
            renewUsers.delete(uid);
          }
        });

        (playRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (!st.includes('ACTIVE') && !st.includes('GRACE')) return;
          const uid = s.user_id || s.id;
          const userEmail = asaasEmailMap.get(s.user_id);
          if (isAdminUser(s.user_id, userEmail)) return;

          const isAnual = s.product_id?.includes('anual');
          const isVit = s.product_id?.includes('vitalicio') || s.product_id?.includes('vital');
          const isMensal = !isVit && !isAnual;
          const plano = isAnual ? 'anual' : isVit ? 'vitalicio' : 'mensal';
          const valor = isAnual ? PRECO_ANUAL : isVit ? PRECO_VITALICIO : PRECO_MENSAL;

          const createdInPeriod = inPeriod(s.created_at);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();

          if (createdInPeriod && !isCriadaAntes) {
            subUsers.set(uid, { plano, valor });
            renewUsers.delete(uid);
          } else if (createdInPeriod && isCriadaAntes) {
            renewUsers.set(uid, { plano, valor });
          }
        });

        (appleRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toLowerCase();
          if (st !== 'active' && st !== 'in_grace') return;
          const uid = s.user_id || s.id;
          const userEmail = asaasEmailMap.get(s.user_id);
          if (isAdminUser(s.user_id, userEmail)) return;

          const isAnual = s.product_id?.includes('anual');
          const isVit = s.product_id?.includes('vitalicio') || s.product_id?.includes('vital');
          const isMensal = !isVit && !isAnual;
          const plano = isAnual ? 'anual' : isVit ? 'vitalicio' : 'mensal';
          const valor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;

          const createdInPeriod = inPeriod(s.created_at);
          const startedInPeriod = inPeriod(s.start_time);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();

          if (createdInPeriod && !isCriadaAntes) {
            subUsers.set(uid, { plano, valor });
            renewUsers.delete(uid);
          } else if (startedInPeriod && isCriadaAntes) {
            renewUsers.set(uid, { plano, valor });
          }
        });

        (legRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toLowerCase();
          if (st !== 'active' && st !== 'active_grace') return;
          const uid = s.claimed_user_id || s.id;
          if (isAdminUser(s.claimed_user_id, s.email)) return;

          const plano = (s.tipo || 'mensal').toLowerCase();
          const isVit = plano === 'vitalicio' || plano.includes('vital');
          const isAnual = plano.includes('anual');
          const isMensal = !isVit && !isAnual;
          const valor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;

          const createdInPeriod = inPeriod(s.created_at);
          const isCriadaAntes = s.created_at && new Date(s.created_at).getTime() < new Date(startIso).getTime();

          if (createdInPeriod && !isCriadaAntes) {
            subUsers.set(uid, { plano, valor });
            renewUsers.delete(uid);
          }
        });

        (purchaseEvRes.data || []).forEach((e: any) => {
          const em = (e.email || '').toLowerCase().trim();
          if (isAdminUser(e.user_id, em)) return;
          const uid = e.user_id || em;
          if (!uid) return;
          if (!inPeriod(e.created_at)) return;

          const meta = e.metadata || {};
          const valorReal = typeof meta.value === 'number' && meta.value > 0 ? meta.value : 0;
          const isRealFinancialEvent = !!(meta.payment_id || (meta.transaction_id && String(meta.transaction_id).startsWith('pay_')) || valorReal > 0);
          if (!isRealFinancialEvent || valorReal <= 0) return;

          const plano = (meta.plano || 'anual').toLowerCase();
          const isPromo = plano.includes('promocional') || plano.includes('promo');
          const isAnual = plano.includes('anual');
          const isVit = !isPromo && (plano.includes('vitalicio') || plano.includes('vitalício') || plano.includes('vital'));
          const isMensal = !isVit && !isAnual;
          const planName = (isAnual && isPromo) ? 'anual_promocional' : plano;

          const hadPriorSub = hasPriorSubscription(e.user_id, em);

          if (hadPriorSub) {
            if (!renewUsers.has(uid) && !subUsers.has(uid)) {
              renewUsers.set(uid, { plano: planName, valor: valorReal });
            } else if (renewUsers.has(uid) && valorReal > 0) {
              renewUsers.set(uid, { plano: planName, valor: valorReal });
            }
          } else {
            // Nova compra de hoje (1º mês do usuário real sem assinatura prévia)
            renewUsers.delete(uid);
            if (!subUsers.has(uid)) {
              subUsers.set(uid, { plano: planName, valor: valorReal });
            } else if (valorReal > 0) {
              subUsers.set(uid, { plano: planName, valor: valorReal });
            }
          }
        });

        totalTrial = subUsers.size;
        let somaValores = 0;
        subUsers.forEach(({ valor }) => {
          if (typeof valor === 'number' && Number.isFinite(valor)) {
            somaValores += valor;
          }
        });
        totalTrialValor = somaValores;

        totalRenovou = renewUsers.size;
        let somaRenovou = 0;
        renewUsers.forEach(({ valor }) => {
          if (typeof valor === 'number' && Number.isFinite(valor)) {
            somaRenovou += valor;
          }
        });
        totalRenovouValor = somaRenovou;

        // Cálculo analítico do funil de checkout (Pagos, Recusados, Parou na Etapa 2, Desistência Inicial)
        cPago = 0;
        cRecusado = 0;
        cEtapa2 = 0;
        cDesistiu = 0;

        const checkoutUserEvents = new Map<string, string[]>();
        checkoutRawEvents.forEach((e: any) => {
          const em = (e.email || '').toLowerCase().trim();
          if (isAdminUser(e.user_id, em)) return;
          const uid = e.user_id || em;
          if (!uid) return;
          if (!checkoutUserEvents.has(uid)) {
            checkoutUserEvents.set(uid, []);
          }
          checkoutUserEvents.get(uid)!.push(e.event_name);
        });

        checkoutUserEvents.forEach((evList, uid) => {
          const isPaid = subUsers.has(uid) || evList.includes('checkout_pix_pago') || evList.includes('checkout_cc_aprovado');
          if (isPaid) {
            cPago++;
          } else if (evList.includes('checkout_cc_recusado')) {
            cRecusado++;
          } else if (evList.includes('checkout_etapa1_concluida')) {
            cEtapa2++;
          } else {
            cDesistiu++;
          }
        });

      } catch (e: any) {
        console.error('Error fetching today events/subscriptions', e);
      }

      const count5m = periodo === 'hoje' ? totalOnline5m : 0;
      const countOnline = Math.max(totalOnline, count5m);
      const novos: Record<CardId | 'trialValor' | 'renovouValor' | 'checkoutPago' | 'checkoutRecusado' | 'checkoutEtapa2' | 'checkoutDesistiu', number> = {
        online5m: count5m || 0, 
        online: countOnline || 0, 
        cadastros: totalCadastros || 0, 
        paywall: totalPaywall || 0,
        viu_planos: totalViuPlanos || 0,
        trial: totalTrial || 0,
        trialValor: Number.isFinite(totalTrialValor) ? totalTrialValor : 0,
        renovou: totalRenovou || 0,
        renovouValor: Number.isFinite(totalRenovouValor) ? totalRenovouValor : 0,
        checkoutPago: cPago,
        checkoutRecusado: cRecusado,
        checkoutEtapa2: cEtapa2,
        checkoutDesistiu: cDesistiu,
      };

      // Detecta aumento em tempo real para disparar efeito de pulso neon verde nos cards
      const prev = prevCountsRef.current;
      if (Object.keys(prev).length > 0 && periodo === 'hoje') {
        const novosPulsando: Record<string, boolean> = {};
        let teveAumento = false;
        (['online5m', 'online', 'cadastros', 'paywall', 'viu_planos', 'trial', 'renovou'] as CardId[]).forEach((cid) => {
          if (typeof prev[cid] === 'number' && novos[cid] > prev[cid]) {
            novosPulsando[cid] = true;
            teveAumento = true;
          }
        });
        if (teveAumento) {
          setPulsingCards((curr) => ({ ...curr, ...novosPulsando }));
          setTimeout(() => {
            setPulsingCards((curr) => {
              const updated = { ...curr };
              Object.keys(novosPulsando).forEach((k) => delete updated[k]);
              return updated;
            });
          }, 2000);
        }
      }
      prevCountsRef.current = { ...novos };

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
      // Polling a cada 30s apenas com a aba visível para não sobrecarregar o Supabase em background
      const t = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
          return;
        }
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
      const { data: sessData } = await supabase.auth.getSession();
      const currentUserId = sessData?.session?.user?.id;
      const currentUserEmail = (sessData?.session?.user?.email || '').toLowerCase().trim();

      const isAdminUser = (uid?: string | null, em?: string | null) => {
        const cleanEm = (em || '').toLowerCase().trim();
        if (isAdminEmail(cleanEm)) return true;
        if (currentUserEmail && cleanEm === currentUserEmail) return true;
        if (currentUserId && uid === currentUserId) return true;
        return false;
      };

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
              id, user_id, created_at, started_at, updated_at, plano, status, asaas_customer_id, asaas_subscription_id
            `)
            .or(`started_at.gte.${startIso},created_at.gte.${startIso},updated_at.gte.${startIso}`),
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

        const hasPriorSubscription = (uid?: string | null, email?: string | null) => {
          const em = (email || '').toLowerCase().trim();
          if (uid && oldLegUids.has(uid)) return true;
          if (em && oldLegEmails.has(em)) return true;
          if (uid && priorAsaasUids.has(uid)) return true;
          return false;
        };

        // 1. Assinaturas Asaas
        (asaasRes.data || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (st !== 'ACTIVE' && st !== 'ACTIVE_GRACE' && st !== 'CONFIRMED' && st !== 'RECEIVED' && st !== 'PAGA') return;
          if (!inPeriod(s.started_at) && !inPeriod(s.created_at)) return;
          if (s.user_id && existingUserIds.has(s.user_id)) return;

          const profInfo = profMap.get(s.user_id);
          const userEmail = (profInfo?.email || '').toLowerCase().trim();
          if (isAdminUser(s.user_id, userEmail)) return;

          const planoLower = (s.plano || '').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício') || planoLower.includes('vital'));
          const isMensal = !isVit && !isAnual;
          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';

          const createdInPeriod = inPeriod(s.created_at);
          const startedInPeriod = inPeriod(s.started_at);
          const updatedInPeriod = inPeriod(s.updated_at);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const startedTime = s.started_at ? new Date(s.started_at).getTime() : createdTime;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();
          const isSegundoMesOuMais = createdTime > 0 && (startedTime - createdTime) >= 20 * 24 * 3600 * 1000;

          const isRenovacao = (startedInPeriod || updatedInPeriod) && (isCriadaAntes || isSegundoMesOuMais);
          const isNovaAssinatura = !isRenovacao && !isCriadaAntes && (createdInPeriod || startedInPeriod || updatedInPeriod);

          if (isRenovou) {
            if (!isRenovacao) return;
          } else {
            if (!isNovaAssinatura) return;
          }

          allLists.push({
            key: `asaas-${s.id}`,
            user_id: s.user_id,
            title: profInfo?.name || 'Assinante Asaas',
            email: profInfo?.email || null,
            subtitle: isRenovou ? `Renovou via Asaas (${planName})` : `Assinou via Asaas (${planName})`,
            at: isRenovou ? (s.started_at || s.created_at) : s.created_at,
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
          if (isAdminUser(e.user_id, em)) return;
          const uid = e.user_id || em;
          if (!uid || existingUserIds.has(uid)) return;

          const meta = e.metadata || {};
          const valorReal = typeof meta.value === 'number' && meta.value > 0 ? meta.value : 0;
          const isRealFinancialEvent = !!(meta.payment_id || (meta.transaction_id && String(meta.transaction_id).startsWith('pay_')) || valorReal > 0);
          if (!isRealFinancialEvent || valorReal <= 0) return;

          const planoLower = (meta.plano || 'anual').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício') || planoLower.includes('vital'));
          const isMensal = !isVit && !isAnual;
          const planValor = valorReal;
          const planName = (isAnual && isPromo) ? 'Anual Promocional' : isAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';

          const profInfo = profMap.get(e.user_id);
          const hadPriorSub = hasPriorSubscription(e.user_id, em || profInfo?.email);
          const createdInPeriod = inPeriod(e.created_at);

          if (isRenovou) {
            if (!hadPriorSub) return;
          } else {
            if (!createdInPeriod || hadPriorSub) return;
          }

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
          const userEmail = (profInfo?.email || '').toLowerCase().trim();
          if (isAdminUser(s.user_id, userEmail)) return;

          const isAnual = s.product_id?.includes('anual');
          const isVit = s.product_id?.includes('vitalicio') || s.product_id?.includes('vital');
          const isMensal = !isVit && !isAnual;

          const createdInPeriod = inPeriod(s.created_at);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();

          if (isRenovou) {
            if (!createdInPeriod || !isCriadaAntes) return;
          } else {
            if (!createdInPeriod || isCriadaAntes) return;
          }

          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isVit ? 'Vitalício' : isAnual ? 'Anual' : 'Mensal';

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
          const userEmail = (profInfo?.email || '').toLowerCase().trim();
          if (isAdminUser(s.user_id, userEmail)) return;

          const isAnual = s.product_id?.includes('anual');
          const isVit = s.product_id?.includes('vitalicio') || s.product_id?.includes('vital');
          const isMensal = !isVit && !isAnual;

          const createdInPeriod = inPeriod(s.created_at);
          const startedInPeriod = inPeriod(s.start_time);
          const createdTime = s.created_at ? new Date(s.created_at).getTime() : 0;
          const isCriadaAntes = createdTime > 0 && createdTime < new Date(startIso).getTime();

          if (isRenovou) {
            if (!startedInPeriod || !isCriadaAntes) return;
          } else {
            if (!createdInPeriod || isCriadaAntes) return;
          }

          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isVit ? 'Vitalício' : isAnual ? 'Anual' : 'Mensal';

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
          const em = (e.email || '').toLowerCase().trim();
          if (isAdminUser(e.claimed_user_id, em)) return;

          const isVit = e.tipo === 'vitalicio' || (e.tipo || '').toLowerCase().includes('vital');
          const isAnual = (e.tipo || '').toLowerCase().includes('anual');
          const isMensal = !isVit && !isAnual;

          if (isRenovou && !isMensal) return;

          const createdInPeriod = inPeriod(e.created_at);
          const isCriadaAntes = e.created_at && new Date(e.created_at).getTime() < new Date(startIso).getTime();

          if (isRenovou) {
            return;
          } else {
            if (!createdInPeriod || isCriadaAntes) return;
          }

          const planName = isVit ? 'Vitalício' : isAnual ? 'Anual' : 'Mensal';
          const planValor = isVit ? PRECO_VITALICIO : isAnual ? PRECO_ANUAL : PRECO_MENSAL;

          allLists.push({
            key: `leg-${e.id}`,
            user_id: e.claimed_user_id || null,
            title: e.nome || e.email?.split('@')[0] || 'Usuário',
            email: e.email,
            subtitle: isRenovou ? `Renovou via Asaas (${planName})` : `Assinou via Asaas (${planName})`,
            at: e.created_at,
            acessos: null,
            avatar_url: null,
            is_premium: true,
            planValue: planValor,
            planTag: { plano: e.tipo || 'Assinatura', status: e.status, expires_at: null },
          });
        });
      } else if (id === 'cadastros') {
        const { data: rpcCad } = await supabase.rpc('admin_lista_dia' as any, { _tipo: 'cadastros', _dia: isoDate(datas[0]) });
        if (Array.isArray(rpcCad) && rpcCad.length > 0) {
          allLists = rpcCad.map((r: any) => {
            const uid = r.user_id || r.id;
            const isGoogle = r.avatar_url?.includes('googleusercontent.com');
            return {
              key: uid || r.key || Math.random().toString(),
              user_id: uid,
              title: r.title || r.nome || r.email?.split('@')[0] || 'Usuário',
              email: r.email,
              provider: isGoogle ? 'google' : (r.provider || (r.email ? 'email' : null)),
              subtitle: 'Novo cadastro',
              at: r.at || r.created_at,
              is_premium: r.is_premium ?? r.premium ?? false,
              avatar_url: r.avatar_url || null,
              acessos: null,
              created_at: r.created_at || r.at
            };
          });
        } else {
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
        }
      } else if (id === 'online5m' || id === 'online') {
        const minTime = id === 'online5m'
          ? new Date(Date.now() - 5 * 60 * 1000).toISOString()
          : startIso;

        const { data: actRows } = await supabase
          .from('user_activity_log')
          .select('user_id, email, display_name, current_route, last_seen_at')
          .gte('last_seen_at', minTime)
          .order('last_seen_at', { ascending: false })
          .limit(100);

        if (Array.isArray(actRows) && actRows.length > 0) {
          const nonAdminRows = actRows.filter(a => !isAdminUser(a.user_id, a.email));
          const userIds = nonAdminRows.map(a => a.user_id).filter(Boolean);
          const { data: profilesList } = userIds.length > 0
            ? await supabase.from('profiles').select('id, display_name, email, avatar_url, is_premium, created_at').in('id', userIds)
            : { data: [] };

          const profMap = new Map((profilesList || []).map(p => [p.id, p]));

          allLists = nonAdminRows.map((a: any) => {
            const p = profMap.get(a.user_id) || {};
            const email = a.email || p.email;
            const isGoogle = p.avatar_url?.includes('googleusercontent.com');
            const routeLabel = a.current_route ? rotaParaFuncao(a.current_route).label : null;
            return {
              key: a.user_id || email || Math.random().toString(),
              user_id: a.user_id,
              title: p.display_name || a.display_name || email?.split('@')[0] || 'Usuário',
              email: email,
              provider: isGoogle ? 'google' : (email ? 'email' : null),
              subtitle: (routeLabel && routeLabel !== 'Desconhecida') ? routeLabel : (id === 'online5m' ? 'Online nos últimos 5 min' : 'Online hoje'),
              at: a.last_seen_at,
              is_premium: p.is_premium ?? false,
              is_admin: false,
              avatar_url: p.avatar_url || null,
              acessos: 1,
              created_at: p.created_at || null
            };
          });
        }
      } else if (id === 'paywall' || id === 'viu_planos') {
        const eventNames = id === 'viu_planos' 
          ? [
              'begin_checkout',
              'trial_click', 
              'checkout_etapa1_concluida', 
              'checkout_pix_gerado', 
              'checkout_pix_pago', 
              'checkout_cc_enviado', 
              'checkout_cc_recusado', 
              'checkout_cc_aprovado'
            ] 
          : ['trial_click', 'assinatura_aberta', 'paywall_view'];

        const { data: vpEvents } = await supabase
          .from('app_events')
          .select('id, user_id, created_at, email, event_name, metadata')
          .in('event_name', eventNames)
          .gte('created_at', startIso)
          .lt('created_at', endIso)
          .order('created_at', { ascending: false })
          .limit(100);

        if (vpEvents && vpEvents.length > 0) {
          // Busca os perfis correspondentes aos user_id e emails para obter nome, avatar e is_premium
          const userIds = Array.from(new Set(vpEvents.map((e: any) => e.user_id).filter(Boolean))) as string[];
          const emails = Array.from(new Set(vpEvents.map((e: any) => (e.email || '').toLowerCase().trim()).filter(Boolean))) as string[];

          const [profsByIdRes, profsByEmailRes, asaasSubsRes] = await Promise.all([
            userIds.length > 0
              ? supabase.from('profiles').select('id, display_name, email, is_premium, avatar_url').in('id', userIds)
              : { data: [] },
            emails.length > 0
              ? supabase.from('profiles').select('id, display_name, email, is_premium, avatar_url').in('email', emails)
              : { data: [] },
            userIds.length > 0
              ? supabase.from('asaas_subscriptions').select('user_id, status, plano, valor, created_at, started_at').in('user_id', userIds)
              : { data: [] },
          ]);

          const profMap = new Map<string, any>();
          (profsByIdRes.data || []).forEach((p: any) => {
            profMap.set(p.id, p);
            if (p.email) profMap.set(p.email.toLowerCase().trim(), p);
          });
          (profsByEmailRes.data || []).forEach((p: any) => {
            if (p.email) profMap.set(p.email.toLowerCase().trim(), p);
            if (p.id) profMap.set(p.id, p);
          });

          const asaasSubMap = new Map<string, any>();
          (asaasSubsRes.data || []).forEach((s: any) => {
            const st = (s.status || '').toUpperCase();
            if (st === 'ACTIVE' || st === 'ACTIVE_GRACE' || st === 'CONFIRMED' || st === 'RECEIVED' || st === 'PAGA') {
              asaasSubMap.set(s.user_id, s);
            }
          });

          const userEventsMap = new Map<string, any>();
          vpEvents.forEach((e: any) => {
            const em = (e.email || '').toLowerCase().trim();
            if (isAdminUser(e.user_id, em)) return;
            const uid = e.user_id || em;
            if (!uid) return;
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
                plano: e.metadata?.plano,
                payment_id: e.metadata?.payment_id,
                billingType: e.metadata?.billingType,
                valor: e.metadata?.value || e.metadata?.valor,
                cep: e.metadata?.cep,
                cidade: e.metadata?.cidade,
                uf: e.metadata?.uf,
              });
            }
          });

          allLists = Array.from(userEventsMap.values()).map((e: any) => {
            const prof = (e.user_id ? profMap.get(e.user_id) : null) || (e.uemail ? profMap.get(e.uemail.toLowerCase().trim()) : null) || {};
            const finalEmail = e.email || prof.email || (e.uemail !== 'Visitante' ? e.uemail : null);
            const isGoogle = prof.avatar_url?.includes('googleusercontent.com');

            // Ordena logs decrescente
            e.logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Identifica se concluiu pagamento hoje
            const hasCcAprovado = e.logs.some((l: any) => l.event_name === 'checkout_cc_aprovado');
            const paidPixEvent = e.logs.find((l: any) => l.event_name === 'checkout_pix_pago' || (l.event_name === 'purchase' && (l.billingType === 'PIX' || l.plano?.includes('pix'))));
            const hasAsaasActive = Boolean(e.user_id && asaasSubMap.has(e.user_id));
            const isUserPaid = Boolean(hasCcAprovado || paidPixEvent || hasAsaasActive || prof.is_premium);

            let matchedPixIdx = -1;
            if (paidPixEvent) {
              if (paidPixEvent.payment_id) {
                matchedPixIdx = e.logs.findIndex((l: any) => l.event_name === 'checkout_pix_gerado' && l.payment_id === paidPixEvent.payment_id);
              }
              if (matchedPixIdx === -1) {
                const paidTime = new Date(paidPixEvent.created_at).getTime();
                let bestDelta = Infinity;
                e.logs.forEach((l: any, idx: number) => {
                  if (l.event_name === 'checkout_pix_gerado') {
                    const lTime = new Date(l.created_at).getTime();
                    const delta = Math.abs(paidTime - lTime);
                    if (delta < bestDelta) {
                      bestDelta = delta;
                      matchedPixIdx = idx;
                    }
                  }
                });
              }
            } else if (!hasCcAprovado && isUserPaid) {
              matchedPixIdx = e.logs.findIndex((l: any) => l.event_name === 'checkout_pix_gerado');
            }

            e.logs.forEach((l: any, idx: number) => {
              if (l.event_name === 'checkout_pix_gerado') {
                if (idx === matchedPixIdx) {
                  l.pixStatus = 'pago';
                } else if (hasCcAprovado || matchedPixIdx !== -1 || isUserPaid) {
                  l.pixStatus = 'nao_pago';
                } else {
                  l.pixStatus = 'pendente';
                }
              }
            });

            const hasCcRecusado = e.logs.some((l: any) => l.event_name === 'checkout_cc_recusado');
            const lastRecusado = e.logs.find((l: any) => l.event_name === 'checkout_cc_recusado');
            const etapa1Event = e.logs.find((l: any) => l.event_name === 'checkout_etapa1_concluida');
            const hasCcEnviado = e.logs.some((l: any) => l.event_name === 'checkout_cc_enviado');
            const hasPixGerado = e.logs.some((l: any) => l.event_name === 'checkout_pix_gerado');

            let checkoutStatus: 'pago' | 'recusado' | 'enviando' | 'etapa2_parou' | 'desistiu_inicio' = 'desistiu_inicio';
            let checkoutStatusLabel = 'Desistência inicial (Não preencheu)';
            let checkoutDetalhes = '';

            if (isUserPaid) {
              checkoutStatus = 'pago';
              checkoutStatusLabel = paidPixEvent ? 'Pagamento Confirmado (PIX)' : 'Pagamento Confirmado (Cartão)';
              if (paidPixEvent?.valor) {
                checkoutDetalhes = `R$ ${Number(paidPixEvent.valor).toFixed(2)}`;
              } else if (hasAsaasActive) {
                const asSub = asaasSubMap.get(e.user_id);
                checkoutDetalhes = asSub?.plano ? `Plano ${asSub.plano}` : 'Assinante Ativo';
              }
            } else if (hasCcRecusado) {
              checkoutStatus = 'recusado';
              checkoutStatusLabel = 'Pagamento Recusado pelo Banco';
              checkoutDetalhes = lastRecusado?.erro || 'Cartão não autorizado';
            } else if (hasCcEnviado) {
              checkoutStatus = 'enviando';
              checkoutStatusLabel = 'Cartão enviado (Processando)';
            } else if (hasPixGerado) {
              checkoutStatus = 'enviando';
              checkoutStatusLabel = 'PIX Gerado (Aguardando Pagamento)';
            } else if (etapa1Event) {
              checkoutStatus = 'etapa2_parou';
              checkoutStatusLabel = 'Parou na Etapa 2 (Não enviou pagamento)';
              if (etapa1Event.cidade && etapa1Event.uf) {
                checkoutDetalhes = `${etapa1Event.cidade} - ${etapa1Event.uf}`;
              } else if (etapa1Event.cep) {
                checkoutDetalhes = `CEP ${etapa1Event.cep}`;
              }
            } else {
              checkoutStatus = 'desistiu_inicio';
              checkoutStatusLabel = 'Desistência inicial (Não preencheu)';
            }

            // Oculta evento interno 'purchase' da lista visual se já houver checkout_pix_pago ou checkout_cc_aprovado
            const visibleLogs = e.logs.filter((l: any) => l.event_name !== 'purchase');

            return {
              key: e.user_id || e.id,
              user_id: e.user_id || prof.id || null,
              title: prof.display_name || (finalEmail ? finalEmail.split('@')[0] : 'Visitante'),
              email: finalEmail,
              provider: isGoogle ? 'google' : (finalEmail ? 'email' : null),
              subtitle: id === 'viu_planos' ? checkoutStatusLabel : 'Entrou em assinaturas',
              at: e.latestAt || e.created_at,
              acessos: e.acessos || 1,
              avatar_url: prof.avatar_url || null,
              is_premium: isUserPaid,
              created_at: e.created_at,
              checkoutStatus,
              checkoutStatusLabel,
              checkoutDetalhes,
              logsCheckout: visibleLogs
            };
          });
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
          if (!cur.checkoutStatus && r.checkoutStatus) cur.checkoutStatus = r.checkoutStatus;
          if (!cur.checkoutStatusLabel && r.checkoutStatusLabel) cur.checkoutStatusLabel = r.checkoutStatusLabel;
          if (!cur.checkoutDetalhes && r.checkoutDetalhes) cur.checkoutDetalhes = r.checkoutDetalhes;
          if (r.is_premium) cur.is_premium = true;
          if (!cur.user_id && r.user_id) cur.user_id = r.user_id;
        }
      });
      // Preserva enriquecimentos já existentes em cache para evitar flicker ao recarregar a lista
      const cachedMap = new Map<string, any>();
      (rowsCache.current[id] || []).forEach((c) => {
        const k = c.userId || c.key;
        if (k) cachedMap.set(k, c);
      });

      const list = Array.from(uniqueMap.values()).map((r) => {
        const email = (r.email || '').toLowerCase().trim();
        const isAdmin = r.is_admin ?? isAdminUser(r.user_id, email);
        const cached = cachedMap.get(r.user_id || r.key);
        return {
          key: r.key,
          userId: r.user_id,
          title: r.title || 'Usuário',
          email: r.email || null,
          provider: r.provider || null,
          subtitle: (id === 'online' || id === 'online5m') ? rotaParaFuncao(r.subtitle).label : r.subtitle,
          meta: hora(r.at),
          acessos: typeof r.acessos === 'number' ? r.acessos : (cached?.acessos ?? 1),
          avatarUrl: r.avatar_url || cached?.avatarUrl,
          isPremium: r.is_premium || cached?.isPremium,
          isAdmin,
          planValue: r.planValue || cached?.planValue,
          planTag: r.planTag || cached?.planTag,
          created_at: r.created_at || cached?.created_at,
          faixaEtaria: r.faixa_etaria || cached?.faixaEtaria,
          logsCheckout: r.logsCheckout || cached?.logsCheckout,
          checkoutStatus: r.checkoutStatus || cached?.checkoutStatus,
          checkoutStatusLabel: r.checkoutStatusLabel || cached?.checkoutStatusLabel,
          checkoutDetalhes: r.checkoutDetalhes || cached?.checkoutDetalhes,
        };
      }).filter((r) => {
        // NUNCA exibe administradores em nenhuma lista de usuários
        return !isAdminUser(r.userId || r.key, r.email);
      });

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
      if (ids.length && id !== 'viu_planos') {
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
          { data: userPurchaseEvs },
          { data: userLegacySubs }
        ] = await Promise.all([
          supabase.rpc('admin_user_auth_providers' as any, { _ids: ids }),
          supabase.from('user_activity_log').select('user_id, created_at').in('user_id', ids).gte('created_at', minD.toISOString()).lt('created_at', maxD.toISOString()).order('created_at', { ascending: true }),
          (id === 'paywall' || id === 'viu_planos')
            ? supabase.from('app_events').select('user_id, email, created_at').in('event_name', id === 'viu_planos' ? ['trial_click', 'checkout_pix_gerado', 'checkout_cc_enviado', 'checkout_cc_recusado', 'checkout_cc_aprovado'] : ['assinatura_aberta', 'paywall_view', 'trial_click']).in('user_id', ids).gte('created_at', minD.toISOString()).lt('created_at', maxD.toISOString())
            : Promise.resolve({ data: [] }),
          supabase.from('user_sessions').select('user_id, initial_route, started_at').in('user_id', ids).gte('started_at', minD.toISOString()).lt('started_at', maxD.toISOString()),
          supabase.from('profiles').select('id, created_at, faixa_etaria, is_premium, avatar_url, display_name, email').in('id', ids),
          supabase.from('asaas_subscriptions').select('user_id, plano, status, expires_at, started_at, created_at').in('user_id', ids),
          supabase.from('play_subscriptions').select('user_id, product_id, status, expires_at, created_at').in('user_id', ids),
          supabase.from('apple_subscriptions').select('user_id, product_id, status, expires_at, start_time, created_at').in('user_id', ids),
          supabase.from('app_events').select('user_id, metadata, event_name, created_at').in('user_id', ids).in('event_name', ['purchase', 'checkout_cc_aprovado', 'subscription_started']).order('created_at', { ascending: false }),
          supabase.from('legacy_subscribers').select('claimed_user_id, email, tipo, status, expires_at, created_at').in('claimed_user_id', ids)
        ]);

        const provMap = new Map<string, { provider: string; avatar_url?: string }>(
          ((provs as any[]) || []).map((p) => [p.user_id || p.id, { provider: p.provider, avatar_url: p.avatar_url }])
        );
        const profMap = new Map<string, { created_at?: string; faixa_etaria?: string; is_premium?: boolean; avatar_url?: string; display_name?: string }>(
          ((profs as any[]) || []).map((p: any) => [p.id, { created_at: p.created_at, faixa_etaria: p.faixa_etaria, is_premium: p.is_premium, avatar_url: p.avatar_url, display_name: p.display_name }])
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
          const isExplicitVit = !isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'));

          // Regra oficial unificada: Qualquer assinatura anual adquirida antes de 10/11/2026 é tratada como vitalícia
          const isAnualAnt = isAnualAntigo(s.plano, s.started_at, s.expires_at, s.created_at);
          const isVit = isExplicitVit || isAnualAnt;
          const effectiveAnual = isAnual && !isAnualAnt;
          const planValor = isVit ? PRECO_VITALICIO : effectiveAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = (effectiveAnual && isPromo) ? 'Anual Promocional' : effectiveAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
          const finalStatus = isAnualAnt ? 'ACTIVE' : (isAtivo ? 'ACTIVE' : s.status);
          const finalExpiresAt = isVit ? null : s.expires_at;

          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: finalStatus, expires_at: finalExpiresAt }
          });
        });

        (userPlaySubs || []).forEach((s: any) => {
          if (!s.user_id || subInfoMap.has(s.user_id)) return;
          const isAnual = s.product_id?.includes('anual');
          const isExplicitVit = s.product_id?.includes('vitalicio');
          const isAnualAnt = isAnualAntigo(s.product_id, null, s.expires_at, s.created_at);
          const isVit = isExplicitVit || isAnualAnt;
          const effectiveAnual = isAnual && !isAnualAnt;
          const planValor = isVit ? PRECO_VITALICIO : effectiveAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isVit ? 'Vitalício' : effectiveAnual ? 'Anual' : 'Mensal';
          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: isAnualAnt ? 'ACTIVE' : s.status, expires_at: isVit ? null : s.expires_at }
          });
        });

        (userAppleSubs || []).forEach((s: any) => {
          if (!s.user_id || subInfoMap.has(s.user_id)) return;
          const isAnual = s.product_id?.includes('anual');
          const isExplicitVit = s.product_id?.includes('vitalicio');
          const isAnualAnt = isAnualAntigo(s.product_id, s.start_time, s.expires_at, s.created_at);
          const isVit = isExplicitVit || isAnualAnt;
          const effectiveAnual = isAnual && !isAnualAnt;
          const planValor = isVit ? PRECO_VITALICIO : effectiveAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isVit ? 'Vitalício' : effectiveAnual ? 'Anual' : 'Mensal';
          subInfoMap.set(s.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: isAnualAnt ? 'ACTIVE' : s.status, expires_at: isVit ? null : s.expires_at }
          });
        });

        (userLegacySubs || []).forEach((l: any) => {
          if (!l.claimed_user_id || subInfoMap.has(l.claimed_user_id)) return;
          const tipoLower = (l.tipo || '').toLowerCase();
          const isAnual = tipoLower.includes('anual');
          const isExplicitVit = tipoLower === 'vitalicio' || tipoLower.includes('vital');
          const isAnualAnt = isAnualAntigo(l.tipo, null, l.expires_at, l.created_at);
          const isVit = isExplicitVit || isAnualAnt;
          const effectiveAnual = isAnual && !isAnualAnt;
          const planValor = isVit ? PRECO_VITALICIO : effectiveAnual ? PRECO_ANUAL : PRECO_MENSAL;
          const planName = isVit ? 'Vitalício' : effectiveAnual ? 'Anual' : 'Mensal';
          subInfoMap.set(l.claimed_user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: (isVit || l.status === 'active') ? 'ACTIVE' : l.status, expires_at: isVit ? null : l.expires_at }
          });
        });

        (userPurchaseEvs || []).forEach((e: any) => {
          if (!e.user_id || subInfoMap.has(e.user_id)) return;
          const meta = e.metadata || {};
          const planoLower = (meta.plano || 'anual').toLowerCase();
          const isPromo = planoLower.includes('promocional') || planoLower.includes('promo');
          const isAnual = planoLower.includes('anual');
          const isAnualAnt = isAnualAntigo(planoLower, e.created_at, meta.expires_at);
          const isVit = (!isPromo && (planoLower === 'vitalicio' || planoLower.includes('vitalício'))) || isAnualAnt;
          const effectiveAnual = isAnual && !isAnualAnt;
          const planValor = typeof meta.value === 'number' && meta.value > 0
            ? meta.value
            : (isVit ? PRECO_VITALICIO : effectiveAnual ? PRECO_ANUAL : PRECO_MENSAL);
          const planName = (effectiveAnual && isPromo) ? 'Anual Promocional' : effectiveAnual ? 'Anual' : isVit ? 'Vitalício' : 'Mensal';
          subInfoMap.set(e.user_id, {
            planValue: planValor,
            planTag: { plano: planName, status: 'ACTIVE', expires_at: isVit ? null : meta.expires_at }
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
            const rProvInfo = provMap.get(rUid);
            const profData = profMap.get(rUid);
            const finalAvatar = r.avatarUrl || profData?.avatar_url || rProvInfo?.avatar_url || null;
            const rProv = rProvInfo?.provider || (finalAvatar?.includes('googleusercontent.com') ? 'google' : r.provider);
            const calcAcessos = acessosMap.get(rUid) || (rEm ? acessosMap.get(rEm) : undefined);
            const subData = subInfoMap.get(rUid);
            const isSubInPeriod = subData?.planTag?.expires_at ? new Date(subData.planTag.expires_at).getTime() > Date.now() : false;
            const isSubAtiva = subData
              ? (['ACTIVE', 'ACTIVE_GRACE', 'CONFIRMED', 'RECEIVED', 'PAGA'].includes(
                  String(subData.planTag?.status || '').toUpperCase().trim()
                ) || isSubInPeriod)
              : false;
            // A coroa 👑 e o status de assinante ativo são concedidos se a assinatura estiver ATIVA ou dentro do período pago (expires_at no futuro) ou se profiles.is_premium for true.
            const isUserPrem = Boolean(profData?.is_premium || isSubAtiva);
            let finalPlanTag = r.planTag || subData?.planTag;
            let finalPlanValue = r.planValue || subData?.planValue;
            if (isUserPrem && !finalPlanTag) {
              finalPlanTag = { plano: 'Vitalício', status: 'ACTIVE', expires_at: null };
              finalPlanValue = finalPlanValue || PRECO_VITALICIO;
            }

            return { 
              ...r, 
              provider: rProv,
              avatarUrl: finalAvatar,
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
    } catch (err) {
      console.error('[AdminHojeCards fetchRows error]', id, err);
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
    renovou: 'Renovaram (Mensal)',
  };

  const rotuloPeriodo = {
    hoje: `Hoje (${dataHojePtBr})`,
    ontem: 'Ontem',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
  }[periodo];

  const filteredRows = (open === 'online' || open === 'online5m')
    ? rows.filter(r => {
        if (filtroUser === 'gratuitos') return !r.isPremium && !r.isAdmin;
        if (filtroUser === 'assinantes') return r.isPremium;
        return true;
      })
    : open === 'viu_planos'
    ? rows.filter(r => {
        if (filtroCheckout === 'pagos') return r.checkoutStatus === 'pago';
        if (filtroCheckout === 'recusados') return r.checkoutStatus === 'recusado';
        if (filtroCheckout === 'abandonos') return r.checkoutStatus === 'etapa2_parou' || r.checkoutStatus === 'desistiu_inicio';
        return true;
      })
    : rows;

  const renderCardButton = ({ id, label, icon: Icon }: typeof CARDS[0], isBottomRow = false) => {
    const cardCount = typeof counts[id] === 'number' && Number.isFinite(counts[id]) ? counts[id] : 0;
    const isZero = cardCount === 0;
    const isFinancial = id === 'trial' || id === 'renovou';
    const rawVal = id === 'trial' ? counts.trialValor : counts.renovouValor;
    const valorFinanceiro = typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : 0;
    const isPulsing = !!pulsingCards[id];

    return (
      <button
        key={id}
        onClick={() => openCard(id)}
        className={cn(
          "group relative rounded-xl border text-left transition-all duration-300 flex flex-col justify-between overflow-hidden",
          "p-2 sm:p-2.5 min-h-[66px] sm:min-h-[72px]",
          isPulsing
            ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/60 scale-[1.02]"
            : "border-border/60 bg-secondary/30 hover:bg-secondary/60 active:scale-[0.98]"
        )}
      >
        <div className="flex items-start justify-between w-full gap-0.5 sm:gap-1">
          <div className={cn(
            "rounded-md flex items-center justify-center transition-colors shrink-0",
            isBottomRow ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6",
            isPulsing
              ? "bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 animate-pulse"
              : "bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20"
          )}>
            <Icon className={isBottomRow ? "w-2.5 h-2.5 sm:w-3 sm:h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"} />
          </div>

          <div className="text-right flex flex-col items-end min-w-0">
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {cardCount - (seenCounts[id] || 0) > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/40 font-body font-bold text-emerald-400 animate-pulse shrink-0 px-1 py-[0.5px] text-[7.5px] sm:text-[8.5px]">
                  +{cardCount - (seenCounts[id] || 0)}
                </span>
              )}
              <span className={cn(
                "font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight leading-none tabular-nums shrink-0",
                "text-[15px] sm:text-[19px]",
                isPulsing ? "text-emerald-300" : isZero ? "text-zinc-500" : "text-foreground"
              )}>
                {cardCount}
              </span>
            </div>
            {isFinancial && valorFinanceiro > 0 && (
              <span className="block font-['Plus_Jakarta_Sans',sans-serif] font-bold mt-0.5 leading-none whitespace-nowrap text-[7.5px] sm:text-[8.5px] text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorFinanceiro)}
              </span>
            )}
            {id === 'viu_planos' && (
              <div className="flex items-center gap-1 mt-0.5 leading-none text-[7.5px] sm:text-[8px] font-bold whitespace-nowrap">
                {counts.checkoutRecusado > 0 ? (
                  <span className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
                    {counts.checkoutRecusado} recusado{counts.checkoutRecusado > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    <strong className="text-emerald-400">{counts.checkoutPago}</strong> pago · {counts.checkoutEtapa2 + counts.checkoutDesistiu} aband.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "font-body leading-[1.15] mt-auto font-medium whitespace-normal break-words",
          isBottomRow ? "text-[8px] xs:text-[8.5px] sm:text-[9.5px] line-clamp-1 xs:line-clamp-2" : "text-[9px] sm:text-[10.5px]",
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
        {CARDS.slice(0, 3).map(c => renderCardButton(c, false))}
      </div>

      {/* Linha 2: 4 cards de Conversão, Vendas e Renovações na mesma linha */}
      <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2 mb-2">
        {CARDS.slice(3).map(c => renderCardButton(c, true))}
      </div>

      <VisaoGeralFunilBar counts={counts} />

      <Suspense fallback={null}>
        {open && (
          <VisaoGeralListaSheet
            open={open}
            onClose={() => setOpen(null)}
            rotuloPeriodo={rotuloPeriodo}
            loading={loading}
            rows={rows}
            filteredRows={filteredRows}
            novosKeys={novosKeys}
            filtroCheckout={filtroCheckout}
            setFiltroCheckout={setFiltroCheckout}
            filtroUser={filtroUser}
            setFiltroUser={setFiltroUser}
            onOpenTotais={abrirTotais}
            onSelectDossie={setDossie}
          />
        )}

        {(totaisOpen || !!provOpen) && (
          <VisaoGeralTotaisSheet
            openCard={open}
            totaisOpen={totaisOpen}
            onTotaisOpenChange={setTotaisOpen}
            totais={totais as TotaisData | null}
            totaisLoading={totaisLoading}
            onOpenProvider={abrirProvider}
            provOpen={provOpen}
            onCloseProv={() => setProvOpen(null)}
            provRows={provRows}
            provLoading={provLoading}
            onSelectDossie={setDossie}
          />
        )}

        {dossie && (
          <UserDossieSheet
            userId={dossie.userId || null}
            nome={dossie.title}
            email={dossie.email}
            provider={dossie.provider}
            avatarUrl={dossie.avatarUrl}
            onClose={() => setDossie(null)}
          />
        )}
      </Suspense>
    </>
  );
}

