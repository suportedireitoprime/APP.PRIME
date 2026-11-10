import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  Sparkles,
  Crown,
  CreditCard,
  QrCode,
  FileText,
  ChevronRight,
  Clock,
  ShieldCheck,
  Filter,
  DollarSign,
  UserCheck,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO, brl } from '@/lib/precos';
import { isAnualAntigo } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import type {
  SubscriberItem,
  SubscriberPlanType,
  PaymentMethodType,
  AssinantesMetricas,
  AsaasPaymentCharge,
} from '@/types/admin-subscribers';
import { AssinantesMetricasCards } from '@/components/admin/assinantes/AssinantesMetricasCards';
import { AssinanteDetalheSheet } from '@/components/admin/assinantes/AssinanteDetalheSheet';

function formatarDataHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatarExpiracao(modalidade: SubscriberPlanType, expiresAt?: string | null): string {
  if (modalidade === 'vitalicio') {
    return 'Vitalício · Sem expiração';
  }
  if (!expiresAt) return 'Renovação contínua';
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return 'Renovação contínua';
  return (
    'Próxima cobrança: ' +
    d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  );
}

function normalizarFormaPagamento(
  billingType?: string | null,
  plano?: string | null,
  origem?: string | null
): PaymentMethodType {
  const b = (billingType || '').toUpperCase();
  const p = (plano || '').toLowerCase();
  const o = (origem || '').toLowerCase();

  if (b === 'PIX' || p.includes('pix') || o === 'pix') return 'PIX';
  if (b === 'CREDIT_CARD' || p.includes('cartao') || p.includes('card') || o === 'cartao') return 'CREDIT_CARD';
  if (b === 'BOLETO' || p.includes('boleto')) return 'BOLETO';
  return 'OUTRO';
}

function normalizarStatus(status?: string | null): {
  label: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
} {
  const s = (status || '').toUpperCase().trim();
  if (s === 'ACTIVE' || s === 'ATIVO' || s === 'CONFIRMED' || s === 'RECEIVED' || s === 'PAGA') {
    return { label: 'Ativa', badgeColor: 'emerald' };
  }
  if (s === 'ACTIVE_GRACE' || s === 'GRACE_PERIOD') {
    return { label: 'Período de Graça', badgeColor: 'amber' };
  }
  if (s === 'OVERDUE' || s === 'ATRASADA' || s === 'INADIMPLENTE') {
    return { label: 'Atrasada', badgeColor: 'amber' };
  }
  if (s === 'CANCELLED' || s === 'CANCELADA' || s === 'INACTIVE' || s === 'EXPIRED') {
    return { label: 'Cancelada', badgeColor: 'rose' };
  }
  if (s === 'PENDING' || s === 'PENDENTE' || s === 'AGUARDANDO') {
    return { label: 'Pendente', badgeColor: 'sky' };
  }
  return { label: s || 'Ativa', badgeColor: 'slate' };
}

export default function AdminAssinantes() {
  const navigate = useNavigate();

  // 3 Opções principais (Mensais, Anuais, Vitalícios)
  const [activeTab, setActiveTab] = useState<SubscriberPlanType>('mensal');

  // Filtros secundários e busca
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [methodFilter, setMethodFilter] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<'recente' | 'antigo' | 'valor' | 'nome'>('recente');

  // Estado dos dados
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberItem | null>(null);

  // Carregamento principal e unificação de fontes (Supabase + Asaas)
  const carregarAssinantes = useCallback(async () => {
    try {
      // 1. Carregar do Supabase em paralelo
      const [
        asaasRes,
        legacyRes,
        playRes,
        appleRes,
        eventsRes,
        profilesRes,
      ] = await Promise.all([
        supabase
          .from('asaas_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('legacy_subscribers')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('play_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('apple_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('app_events')
          .select('*')
          .eq('event_name', 'purchase')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('profiles')
          .select('id, name, email, avatar_url, created_at, phone'),
      ]);

      // Mapa de perfis por ID e por Email
      const profileById = new Map<string, any>();
      const profileByEmail = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => {
        if (p.id) profileById.set(p.id, p);
        if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p);
      });

      // 2. Consulta ao Asaas via Edge Function Proxy (em segundo plano sem travar se falhar)
      let asaasLiveSubsMap = new Map<string, any>();
      let asaasPaymentsBySub = new Map<string, AsaasPaymentCharge[]>();

      try {
        const [liveSubsRes, livePaymentsRes] = await Promise.all([
          supabase.functions.invoke('admin-asaas-proxy', {
            body: { endpoint: 'subscriptions', params: { limit: '100' } },
          }),
          supabase.functions.invoke('admin-asaas-proxy', {
            body: { endpoint: 'payments', params: { limit: '100' } },
          }),
        ]);

        if (liveSubsRes?.data?.data && Array.isArray(liveSubsRes.data.data)) {
          liveSubsRes.data.data.forEach((s: any) => {
            if (s.id) asaasLiveSubsMap.set(s.id, s);
            if (s.customer) asaasLiveSubsMap.set(`cus_${s.customer}`, s);
          });
        }

        if (livePaymentsRes?.data?.data && Array.isArray(livePaymentsRes.data.data)) {
          livePaymentsRes.data.data.forEach((p: any) => {
            if (p.subscription) {
              const arr = asaasPaymentsBySub.get(p.subscription) || [];
              arr.push(p);
              asaasPaymentsBySub.set(p.subscription, arr);
            }
          });
        }
      } catch (errProxy) {
        console.warn('Asaas proxy sync info:', errProxy);
      }

      const listaUnificada: SubscriberItem[] = [];
      const seenKeys = new Set<string>();

      // A. Processar asaas_subscriptions
      (asaasRes.data || []).forEach((sub: any) => {
        const uid = sub.user_id;
        const prof = profileById.get(uid);
        const email = (prof?.email || '').toLowerCase().trim();
        const key = sub.asaas_subscription_id || sub.id || uid;

        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const liveAsaas = sub.asaas_subscription_id ? asaasLiveSubsMap.get(sub.asaas_subscription_id) : null;
        const livePayments = sub.asaas_subscription_id ? asaasPaymentsBySub.get(sub.asaas_subscription_id) : undefined;

        const planoLower = (sub.plano || '').toLowerCase();
        const isVitExplicit =
          planoLower.includes('vitalicio') || planoLower.includes('vitalício') || planoLower.includes('vital');

        // Regra de transição oficial: anuais anteriores a 10/11/2026 são Vitalícios!
        const isAnualLegado =
          !isVitExplicit && isAnualAntigo(sub.plano, sub.started_at || sub.created_at, sub.expires_at);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (planoLower.includes('anual') || liveAsaas?.cycle === 'YEARLY') {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        // Valor
        let valor =
          liveAsaas?.value ??
          (modalidade === 'vitalicio'
            ? PRECO_VITALICIO
            : modalidade === 'anual'
            ? PRECO_ANUAL
            : PRECO_MENSAL);

        const billingType = liveAsaas?.billingType || sub.origem;
        const forma = normalizarFormaPagamento(billingType, sub.plano, sub.origem);
        const statusNorm = normalizarStatus(liveAsaas?.status || sub.status);

        const dataAssinatura = sub.started_at || sub.created_at;

        listaUnificada.push({
          id: `asaas-${sub.id}`,
          userId: uid,
          name: prof?.name || email.split('@')[0] || 'Assinante Asaas',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: prof?.phone || liveAsaas?.customerPhone || null,
          cpfCnpj: liveAsaas?.customerCpfCnpj || null,
          modalidade,
          planoOriginal: sub.plano || 'mensal',
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          formaPagamento: forma,
          billingTypeRaw: billingType,
          dataAssinatura,
          dataAssinaturaFormatada: formatarDataHora(dataAssinatura),
          dataExpiracao: sub.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, liveAsaas?.nextDueDate || sub.expires_at),
          status: liveAsaas?.status || sub.status || 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: sub.asaas_customer_id || liveAsaas?.customer || null,
          asaasSubscriptionId: sub.asaas_subscription_id || liveAsaas?.id || null,
          origem: 'asaas',
          asaasCycle: liveAsaas?.cycle,
          asaasNextDueDate: liveAsaas?.nextDueDate,
          livePayments,
        });
      });

      // B. Processar legacy_subscribers
      (legacyRes.data || []).forEach((leg: any) => {
        const email = (leg.email || '').toLowerCase().trim();
        const key = leg.asaas_subscription_id || leg.id || email;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const prof = leg.claimed_user_id
          ? profileById.get(leg.claimed_user_id)
          : profileByEmail.get(email);

        const liveAsaas = leg.asaas_subscription_id ? asaasLiveSubsMap.get(leg.asaas_subscription_id) : null;
        const livePayments = leg.asaas_subscription_id ? asaasPaymentsBySub.get(leg.asaas_subscription_id) : undefined;

        const tipoLower = (leg.tipo || '').toLowerCase();
        const isVitExplicit =
          tipoLower.includes('vitalicio') || tipoLower.includes('vitalício') || tipoLower.includes('vital');

        const isAnualLegado =
          !isVitExplicit && isAnualAntigo(leg.tipo, leg.created_at, leg.expires_at);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (tipoLower.includes('anual')) {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        const valor =
          liveAsaas?.value ??
          (modalidade === 'vitalicio'
            ? PRECO_VITALICIO
            : modalidade === 'anual'
            ? PRECO_ANUAL
            : PRECO_MENSAL);

        const statusNorm = normalizarStatus(liveAsaas?.status || leg.status);
        const forma = normalizarFormaPagamento(liveAsaas?.billingType, leg.tipo, 'legacy');

        listaUnificada.push({
          id: `leg-${leg.id}`,
          userId: leg.claimed_user_id || prof?.id || null,
          name: leg.nome || prof?.name || email.split('@')[0] || 'Assinante Migrado',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: prof?.phone || null,
          modalidade,
          planoOriginal: leg.tipo || 'migrado',
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          formaPagamento: forma,
          dataAssinatura: leg.created_at,
          dataAssinaturaFormatada: formatarDataHora(leg.created_at),
          dataExpiracao: leg.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, leg.expires_at),
          status: liveAsaas?.status || leg.status || 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: leg.asaas_customer_id || null,
          asaasSubscriptionId: leg.asaas_subscription_id || null,
          origem: 'legacy',
          livePayments,
        });
      });

      // C. Processar app_events com compras Pix / Checkout
      (eventsRes.data || []).forEach((ev: any) => {
        const email = (ev.email || '').toLowerCase().trim();
        const uid = ev.user_id;
        const meta = ev.metadata || {};
        const key = meta.subscription_id || meta.asaas_payment_id || `ev-${ev.id || uid || email}`;

        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const prof = uid ? profileById.get(uid) : profileByEmail.get(email);
        const planoLower = (meta.plano || '').toLowerCase();
        const isVitExplicit =
          planoLower.includes('vitalicio') || planoLower.includes('vitalício') || planoLower.includes('vital');
        const isAnualLegado =
          !isVitExplicit && isAnualAntigo(meta.plano, ev.created_at, null);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (planoLower.includes('anual')) {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        const valor = typeof meta.value === 'number' && meta.value > 0
          ? meta.value
          : (modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL);

        const forma = normalizarFormaPagamento(meta.forma_pagamento || meta.billingType, meta.plano, 'checkout');
        const statusNorm = normalizarStatus('ACTIVE');

        listaUnificada.push({
          id: `ev-${ev.id || key}`,
          userId: uid || prof?.id || null,
          name: prof?.name || email.split('@')[0] || 'Assinante Checkout',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: prof?.phone || null,
          modalidade,
          planoOriginal: meta.plano || 'checkout',
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          formaPagamento: forma,
          dataAssinatura: ev.created_at,
          dataAssinaturaFormatada: formatarDataHora(ev.created_at),
          dataExpiracao: null,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, null),
          status: 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: meta.asaas_customer_id || null,
          asaasSubscriptionId: meta.subscription_id || null,
          origem: 'checkout',
        });
      });

      // D. Processar Play Store & Apple se houver
      (playRes.data || []).forEach((play: any) => {
        const uid = play.user_id;
        const prof = profileById.get(uid);
        const email = (prof?.email || '').toLowerCase().trim();
        const key = `play-${play.id || uid}`;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const prod = (play.product_id || '').toLowerCase();
        const isVit = prod.includes('vitalicio') || prod.includes('lifetime');
        const isAnual = prod.includes('anual') || prod.includes('year');
        const modalidade: SubscriberPlanType = isVit ? 'vitalicio' : isAnual ? 'anual' : 'mensal';

        listaUnificada.push({
          id: key,
          userId: uid,
          name: prof?.name || email.split('@')[0] || 'Google Play Store',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          modalidade,
          planoOriginal: play.product_id || 'play_store',
          valor: modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL,
          formaPagamento: 'CREDIT_CARD',
          dataAssinatura: play.created_at,
          dataAssinaturaFormatada: formatarDataHora(play.created_at),
          dataExpiracao: null,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, null),
          status: play.status || 'ACTIVE',
          statusLabel: 'Ativa (Play Store)',
          statusBadgeColor: 'emerald',
          origem: 'play_store',
        });
      });

      (appleRes.data || []).forEach((app: any) => {
        const uid = app.user_id;
        const prof = profileById.get(uid);
        const email = (prof?.email || '').toLowerCase().trim();
        const key = `apple-${app.id || uid}`;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        const prod = (app.product_id || '').toLowerCase();
        const isVit = prod.includes('vitalicio') || prod.includes('lifetime');
        const isAnual = prod.includes('anual') || prod.includes('year');
        const modalidade: SubscriberPlanType = isVit ? 'vitalicio' : isAnual ? 'anual' : 'mensal';

        listaUnificada.push({
          id: key,
          userId: uid,
          name: prof?.name || email.split('@')[0] || 'Apple App Store',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          modalidade,
          planoOriginal: app.product_id || 'apple_store',
          valor: modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL,
          formaPagamento: 'CREDIT_CARD',
          dataAssinatura: app.start_time || app.created_at,
          dataAssinaturaFormatada: formatarDataHora(app.start_time || app.created_at),
          dataExpiracao: null,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, null),
          status: app.status || 'ACTIVE',
          statusLabel: 'Ativa (App Store)',
          statusBadgeColor: 'emerald',
          origem: 'apple_store',
        });
      });

      setSubscribers(listaUnificada);
    } catch (error: any) {
      console.error('Erro ao carregar assinantes:', error);
      toast.error('Erro ao consultar assinantes: ' + (error.message || 'Falha de conexão'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarAssinantes();
  }, [carregarAssinantes]);

  // Sincronizar Asaas manualmente
  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('Sincronizando cobranças e assinaturas com o Asaas...');
    await carregarAssinantes();
    toast.success('Assinantes e pagamentos atualizados com sucesso!');
  };

  // Cálculo de Métricas
  const metricas: AssinantesMetricas = useMemo(() => {
    let mensaisCount = 0;
    let mensaisMRR = 0;
    let anuaisCount = 0;
    let anuaisARR = 0;
    let vitaliciosCount = 0;
    let vitaliciosReceita = 0;

    subscribers.forEach((s) => {
      const isAtiva = s.statusBadgeColor === 'emerald' || s.statusBadgeColor === 'sky' || s.statusBadgeColor === 'amber';
      if (!isAtiva) return;

      if (s.modalidade === 'mensal') {
        mensaisCount++;
        mensaisMRR += s.valor;
      } else if (s.modalidade === 'anual') {
        anuaisCount++;
        anuaisARR += s.valor;
      } else if (s.modalidade === 'vitalicio') {
        vitaliciosCount++;
        vitaliciosReceita += s.valor;
      }
    });

    const receitaTotalGeral = mensaisMRR + anuaisARR + vitaliciosReceita;

    return {
      totalAssinantes: mensaisCount + anuaisCount + vitaliciosCount,
      mensaisCount,
      mensaisMRR,
      anuaisCount,
      anuaisARR,
      vitaliciosCount,
      vitaliciosReceita,
      receitaTotalGeral,
    };
  }, [subscribers]);

  // Filtragem e Ordenação
  const filteredSubscribers = useMemo(() => {
    return subscribers
      .filter((s) => {
        // 1. Aba selecionada (Mensal, Anual, Vitalício)
        if (s.modalidade !== activeTab) return false;

        // 2. Busca por texto (nome, email, asaas id, customer id)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchEmail = s.email.toLowerCase().includes(q);
          const matchSub = (s.asaasSubscriptionId || '').toLowerCase().includes(q);
          const matchCus = (s.asaasCustomerId || '').toLowerCase().includes(q);
          const matchPlano = s.planoOriginal.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchSub && !matchCus && !matchPlano) return false;
        }

        // 3. Filtro de Status
        if (statusFilter !== 'todos') {
          if (statusFilter === 'ativos' && s.statusBadgeColor !== 'emerald') return false;
          if (statusFilter === 'atrasados' && s.statusBadgeColor !== 'amber') return false;
          if (statusFilter === 'cancelados' && s.statusBadgeColor !== 'rose') return false;
        }

        // 4. Filtro de Forma de Pagamento
        if (methodFilter !== 'todos') {
          if (s.formaPagamento !== methodFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'recente') {
          return new Date(b.dataAssinatura).getTime() - new Date(a.dataAssinatura).getTime();
        }
        if (sortOrder === 'antigo') {
          return new Date(a.dataAssinatura).getTime() - new Date(b.dataAssinatura).getTime();
        }
        if (sortOrder === 'valor') {
          return b.valor - a.valor;
        }
        if (sortOrder === 'nome') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscribers, activeTab, searchQuery, statusFilter, methodFilter, sortOrder]);

  // Exportar para CSV
  const exportarCSV = () => {
    if (filteredSubscribers.length === 0) {
      toast.error('Nenhum assinante para exportar.');
      return;
    }

    const headers = [
      'Nome',
      'Email',
      'Modalidade',
      'Plano Original',
      'Valor (R$)',
      'Forma Pagamento',
      'Status',
      'Data Contratacao',
      'Expiracao',
      'ID Assinatura Asaas',
      'ID Cliente Asaas',
      'Origem',
    ];

    const rows = filteredSubscribers.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      s.modalidade,
      `"${s.planoOriginal}"`,
      s.valor.toFixed(2),
      s.formaPagamento,
      s.statusLabel,
      `"${s.dataAssinaturaFormatada}"`,
      `"${s.proximaCobrancaOuExpiracao}"`,
      `"${s.asaasSubscriptionId || ''}"`,
      `"${s.asaasCustomerId || ''}"`,
      s.origem,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assinantes_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV baixado com sucesso!');
  };

  return (
    <div className="min-h-dvh bg-background text-foreground relative pb-16">
      {/* Fundo Padrão Oficial ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Gestão de Assinantes"
          subtitle="Mensais, Anuais e Vitalícios com histórico Asaas"
          onBack={() => navigate('/admin-funcoes')}
          rightAction={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 px-3 text-xs gap-1.5 border-border/80 bg-secondary/40 backdrop-blur-sm active:scale-95"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Sincronizar Asaas</span>
            </Button>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Métricas Financeiras e Indicadores */}
          <AssinantesMetricasCards
            metricas={metricas}
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            isLoading={loading}
          />

          {/* Seletor das 3 Opções de Assinantes (Mensais, Anuais, Vitalícios) */}
          <div className="w-full bg-secondary/40 p-1.5 rounded-2xl border border-border/60 backdrop-blur-md">
            <div className="grid grid-cols-3 gap-1.5">
              {/* Opção 1: Mensais */}
              <button
                type="button"
                onClick={() => setActiveTab('mensal')}
                className={cn(
                  'py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] select-none',
                  activeTab === 'mensal'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Mensais</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-bold ml-1',
                    activeTab === 'mensal'
                      ? 'bg-white/25 text-white'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {metricas.mensaisCount}
                </span>
              </button>

              {/* Opção 2: Anuais */}
              <button
                type="button"
                onClick={() => setActiveTab('anual')}
                className={cn(
                  'py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] select-none',
                  activeTab === 'anual'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Anuais</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-bold ml-1',
                    activeTab === 'anual'
                      ? 'bg-black/20 text-black'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {metricas.anuaisCount}
                </span>
              </button>

              {/* Opção 3: Vitalícios */}
              <button
                type="button"
                onClick={() => setActiveTab('vitalicio')}
                className={cn(
                  'py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] select-none',
                  activeTab === 'vitalicio'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Vitalícios</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-bold ml-1',
                    activeTab === 'vitalicio'
                      ? 'bg-white/25 text-white'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {metricas.vitaliciosCount}
                </span>
              </button>
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Buscar por nome, e-mail, ID Asaas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-secondary/30 border-border/60 focus:border-primary text-sm rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filtros em linha */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="atrasados">Atrasados</SelectItem>
                  <SelectItem value="cancelados">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Pagamento */}
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[130px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Formas</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[140px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recente">Mais Recentes</SelectItem>
                  <SelectItem value="antigo">Mais Antigos</SelectItem>
                  <SelectItem value="valor">Maior Valor</SelectItem>
                  <SelectItem value="nome">Nome A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Botão Exportar CSV */}
              <Button
                variant="outline"
                onClick={exportarCSV}
                className="h-11 px-3 text-xs gap-1.5 rounded-xl border-border/60 bg-secondary/30 hover:bg-secondary/60"
                title="Exportar lista atual para planilha CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">CSV</span>
              </Button>
            </div>
          </div>

          {/* Título da Seção Atual e Quantidade */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <span>
                {activeTab === 'mensal'
                  ? 'Assinantes Mensais'
                  : activeTab === 'anual'
                  ? 'Assinantes Anuais'
                  : 'Assinantes Vitalícios'}
              </span>
              <span className="text-foreground">({filteredSubscribers.length})</span>
            </h2>

            <span className="text-xs text-muted-foreground">
              Toque em qualquer card para ver o histórico de cobranças Asaas
            </span>
          </div>

          {/* Lista de Assinantes */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Carregando assinantes e sincronizando com Asaas...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-border/60 bg-secondary/20 space-y-3">
              <UserCheck className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
              <h3 className="text-base font-semibold text-foreground">
                Nenhum assinante encontrado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Não foram localizados assinantes na modalidade{' '}
                <strong>{activeTab.toUpperCase()}</strong> com os filtros aplicados.
              </p>
              {(searchQuery || statusFilter !== 'todos' || methodFilter !== 'todos') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('todos');
                    setMethodFilter('todos');
                  }}
                  className="mt-2 text-xs"
                >
                  Limpar Filtros
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSubscribers.map((subscriber) => {
                const isVit = subscriber.modalidade === 'vitalicio';
                const isAnual = subscriber.modalidade === 'anual';

                return (
                  <button
                    key={subscriber.id}
                    type="button"
                    onClick={() => setSelectedSubscriber(subscriber)}
                    className="w-full text-left group focus:outline-none"
                  >
                    <Card
                      className={cn(
                        'p-4 rounded-2xl transition-all duration-200 border bg-secondary/30 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]',
                        'hover:bg-secondary/60 hover:border-primary/50 hover:shadow-lg',
                        isVit && 'border-emerald-500/20 hover:border-emerald-500/50',
                        isAnual && 'border-amber-500/20 hover:border-amber-500/50',
                        !isVit && !isAnual && 'border-sky-500/20 hover:border-sky-500/50'
                      )}
                    >
                      {/* Topo do Card: Avatar, Nome, Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {subscriber.avatarUrl ? (
                              <img
                                src={subscriber.avatarUrl}
                                alt={subscriber.name}
                                className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground border border-border shrink-0">
                                {subscriber.name.slice(0, 2).toUpperCase() || 'AS'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {subscriber.name}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {subscriber.email}
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 shrink-0 uppercase',
                              subscriber.statusBadgeColor === 'emerald' &&
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                              subscriber.statusBadgeColor === 'amber' &&
                                'bg-amber-500/10 text-amber-400 border-amber-500/30',
                              subscriber.statusBadgeColor === 'rose' &&
                                'bg-rose-500/10 text-rose-400 border-rose-500/30',
                              subscriber.statusBadgeColor === 'sky' &&
                                'bg-sky-500/10 text-sky-400 border-sky-500/30',
                              subscriber.statusBadgeColor === 'slate' &&
                                'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            )}
                          >
                            {subscriber.statusLabel}
                          </Badge>
                        </div>

                        {/* Badge de Transição Anual Antigo -> Vitalício */}
                        {subscriber.isAnualAntigoTransitado && (
                          <div className="mt-2.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">⭐ Vitalício (Anual pré-10/11/2026)</span>
                          </div>
                        )}

                        {/* Informações Financeiras */}
                        <div className="grid grid-cols-2 gap-2 mt-3.5 p-2.5 rounded-xl bg-background/50 border border-border/40 text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Valor Contratado:</span>
                            <span className="font-bold text-foreground text-sm">
                              {brl(subscriber.valor)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-muted-foreground block">Forma de Pagamento:</span>
                            <div className="flex items-center gap-1 font-semibold text-foreground mt-0.5">
                              {subscriber.formaPagamento === 'PIX' ? (
                                <>
                                  <QrCode className="w-3.5 h-3.5 text-teal-400" />
                                  <span>PIX</span>
                                </>
                              ) : subscriber.formaPagamento === 'CREDIT_CARD' ? (
                                <>
                                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Cartão</span>
                                </>
                              ) : subscriber.formaPagamento === 'BOLETO' ? (
                                <>
                                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Boleto</span>
                                </>
                              ) : (
                                <>
                                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Outro</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Datas e Prazos */}
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="truncate">
                              Assinado em: <strong className="text-foreground">{subscriber.dataAssinaturaFormatada}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="truncate">
                              {subscriber.proximaCobrancaOuExpiracao}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card com Ação */}
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[170px]">
                          {subscriber.asaasSubscriptionId || subscriber.asaasCustomerId || subscriber.id}
                        </span>

                        <div className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Ver Asaas</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Sheet / Drawer de Detalhes Asaas do Assinante */}
      <AssinanteDetalheSheet
        subscriber={selectedSubscriber}
        open={Boolean(selectedSubscriber)}
        onClose={() => setSelectedSubscriber(null)}
      />
    </div>
  );
}
