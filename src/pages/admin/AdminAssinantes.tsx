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
  Receipt,
  Percent,
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
  StatusCasamentoType,
  AssinantesMetricas,
  AsaasPaymentCharge,
  AsaasCustomerItem,
} from '@/types/admin-subscribers';
import { AssinantesMetricasCards } from '@/components/admin/assinantes/AssinantesMetricasCards';
import { AssinanteDetalheSheet } from '@/components/admin/assinantes/AssinanteDetalheSheet';

function parseDateSafe(raw?: string | null): Date | null {
  if (!raw) return null;
  const str = String(raw).trim();
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }
  const cleaned = str.replace(' ', 'T');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function formatarDataHora(iso?: string | null): string {
  const d = parseDateSafe(iso);
  if (!d) return '—';
  const rawStr = String(iso || '');
  const hasTime = rawStr.includes(':') || rawStr.includes('T');
  const dataStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  if (!hasTime) return dataStr;
  const horaStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (horaStr === '00:00' && !rawStr.includes(':')) {
    return dataStr;
  }
  return `${dataStr} às ${horaStr}`;
}

function formatarExpiracao(modalidade: SubscriberPlanType, expiresAt?: string | null): string {
  if (modalidade === 'vitalicio') {
    return 'Vitalício · Sem expiração';
  }
  const d = parseDateSafe(expiresAt);
  if (!d) return 'Renovação contínua';
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
  if (s === 'ACTIVE' || s === 'ATIVO' || s === 'CONFIRMED' || s === 'RECEIVED' || s === 'PAGA' || s === 'RECEIVED_IN_CASH') {
    return { label: 'Ativa', badgeColor: 'emerald' };
  }
  if (s === 'ACTIVE_GRACE' || s === 'GRACE_PERIOD') {
    return { label: 'Período de Graça', badgeColor: 'amber' };
  }
  if (s === 'OVERDUE' || s === 'ATRASADA' || s === 'INADIMPLENTE') {
    return { label: 'Atrasada', badgeColor: 'amber' };
  }
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCELADA' || s === 'INACTIVE' || s === 'EXPIRED') {
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
  const [matchFilter, setMatchFilter] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<'recente' | 'antigo' | 'valor' | 'nome'>('recente');

  // Estado dos dados
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberItem | null>(null);

  // Carregamento principal e conciliação unificada (Supabase + Asaas)
  const carregarAssinantes = useCallback(async () => {
    try {
      // 1. Carregar tabelas do Supabase em paralelo (SEM app_events de telemetria)
      const [
        asaasRes,
        legacyRes,
        playRes,
        appleRes,
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
          .from('profiles')
          .select('id, name, email, avatar_url, created_at, phone'),
      ]);

      // Mapear perfis por ID e por e-mail
      const profileById = new Map<string, any>();
      const profileByEmail = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => {
        if (p.id) profileById.set(p.id, p);
        if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p);
      });

      // 2. Consulta ao Asaas via Edge Function Proxy (com fallback seguro)
      let asaasLiveSubs: any[] = [];
      let asaasLivePayments: AsaasPaymentCharge[] = [];
      let asaasLiveCustomers: AsaasCustomerItem[] = [];

      try {
        // Tenta buscar no modo overview (1 única requisição rápida)
        const overviewRes = await supabase.functions.invoke('admin-asaas-proxy', {
          body: { action: 'overview' },
        });

        if (overviewRes?.data?.subscriptions && Array.isArray(overviewRes.data.subscriptions)) {
          asaasLiveSubs = overviewRes.data.subscriptions;
          asaasLivePayments = overviewRes.data.payments || [];
          asaasLiveCustomers = overviewRes.data.customers || [];
        } else {
          // Fallback para chamadas individuais se o gateway não responder overview
          const [liveSubsRes, livePaymentsRes, liveCustsRes] = await Promise.allSettled([
            supabase.functions.invoke('admin-asaas-proxy', {
              body: { endpoint: 'subscriptions', params: { limit: '100' } },
            }),
            supabase.functions.invoke('admin-asaas-proxy', {
              body: { endpoint: 'payments', params: { limit: '100' } },
            }),
            supabase.functions.invoke('admin-asaas-proxy', {
              body: { endpoint: 'customers', params: { limit: '100' } },
            }),
          ]);

          if (liveSubsRes.status === 'fulfilled' && liveSubsRes.value?.data?.data) {
            asaasLiveSubs = liveSubsRes.value.data.data;
          }
          if (livePaymentsRes.status === 'fulfilled' && livePaymentsRes.value?.data?.data) {
            asaasLivePayments = livePaymentsRes.value.data.data;
          }
          if (liveCustsRes.status === 'fulfilled' && liveCustsRes.value?.data?.data) {
            asaasLiveCustomers = liveCustsRes.value.data.data;
          }
        }
      } catch (errProxy) {
        console.warn('Asaas proxy sync warning:', errProxy);
      }

      // Indexação de dados do Asaas por múltiplos critérios para conciliação ("case")
      const asaasCustomerById = new Map<string, AsaasCustomerItem>();
      const asaasCustomerByEmail = new Map<string, AsaasCustomerItem>();
      asaasLiveCustomers.forEach((c) => {
        if (c.id) asaasCustomerById.set(c.id, c);
        if (c.email) asaasCustomerByEmail.set(c.email.toLowerCase().trim(), c);
      });

      const asaasSubById = new Map<string, any>();
      const asaasSubsByCustomer = new Map<string, any>();
      const asaasSubsByEmail = new Map<string, any>();
      asaasLiveSubs.forEach((s) => {
        if (s.id) asaasSubById.set(s.id, s);
        if (s.customer) {
          asaasSubsByCustomer.set(s.customer, s);
          const cust = asaasCustomerById.get(s.customer);
          if (cust?.email) asaasSubsByEmail.set(cust.email.toLowerCase().trim(), s);
        }
      });

      const paymentsBySub = new Map<string, AsaasPaymentCharge[]>();
      const paymentsByCustomer = new Map<string, AsaasPaymentCharge[]>();
      const paymentsByEmail = new Map<string, AsaasPaymentCharge[]>();
      const paymentsById = new Map<string, AsaasPaymentCharge>();

      asaasLivePayments.forEach((p) => {
        if (p.id) paymentsById.set(p.id, p);

        if (p.subscription) {
          const arr = paymentsBySub.get(p.subscription) || [];
          arr.push(p);
          paymentsBySub.set(p.subscription, arr);
        }

        if (p.customer) {
          const arr = paymentsByCustomer.get(p.customer) || [];
          arr.push(p);
          paymentsByCustomer.set(p.customer, arr);

          const cust = asaasCustomerById.get(p.customer);
          if (cust?.email) {
            const emailKey = cust.email.toLowerCase().trim();
            const arrE = paymentsByEmail.get(emailKey) || [];
            arrE.push(p);
            paymentsByEmail.set(emailKey, arrE);
          }
        }
      });

      const listaUnificada: SubscriberItem[] = [];
      const seenAsaasSubIds = new Set<string>();
      const seenAsaasPaymentIds = new Set<string>();

      // Função auxiliar para juntar e deduplicar pagamentos de um assinante
      const gatherPayments = (
        subId?: string | null,
        cusId?: string | null,
        email?: string | null
      ): AsaasPaymentCharge[] => {
        const result: AsaasPaymentCharge[] = [];
        const seen = new Set<string>();

        if (subId && paymentsBySub.has(subId)) {
          paymentsBySub.get(subId)!.forEach((p) => {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              result.push(p);
              seenAsaasPaymentIds.add(p.id);
            }
          });
        }

        if (cusId && paymentsByCustomer.has(cusId)) {
          paymentsByCustomer.get(cusId)!.forEach((p) => {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              result.push(p);
              seenAsaasPaymentIds.add(p.id);
            }
          });
        }

        if (email && paymentsByEmail.has(email.toLowerCase().trim())) {
          paymentsByEmail.get(email.toLowerCase().trim())!.forEach((p) => {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              result.push(p);
              seenAsaasPaymentIds.add(p.id);
            }
          });
        }

        return result;
      };

      // Localizador unificado de identidade para evitar duplicações de assinantes
      const findExistingIndex = (item: {
        userId?: string | null;
        email?: string | null;
        asaasCustomerId?: string | null;
        asaasSubscriptionId?: string | null;
      }): number => {
        const emailNorm = item.email ? item.email.toLowerCase().trim() : null;
        const isEmailValido = emailNorm && emailNorm !== 'sem e-mail' && emailNorm.includes('@');

        return listaUnificada.findIndex((s) => {
          if (item.userId && s.userId && s.userId === item.userId) return true;
          if (isEmailValido && s.email && s.email.toLowerCase().trim() === emailNorm) return true;
          if (
            item.asaasSubscriptionId &&
            s.asaasSubscriptionId &&
            s.asaasSubscriptionId === item.asaasSubscriptionId
          )
            return true;
          if (
            item.asaasCustomerId &&
            s.asaasCustomerId &&
            s.asaasCustomerId === item.asaasCustomerId
          )
            return true;
          return false;
        });
      };

      // Inserção ou fusão inteligente de assinante (Single Source of Truth)
      const mergeSubscriber = (newItem: SubscriberItem) => {
        // Descartar registros sem e-mail e sem customer Asaas (falsos positivos anônimos)
        const emailNorm = newItem.email ? newItem.email.toLowerCase().trim() : '';
        const isEmailValido = emailNorm && emailNorm !== 'sem e-mail' && emailNorm.includes('@');
        if (!isEmailValido && !newItem.asaasCustomerId && !newItem.userId) {
          return; // Descarte de registros órfãos ou telemetria
        }

        const existingIdx = findExistingIndex({
          userId: newItem.userId,
          email: isEmailValido ? emailNorm : null,
          asaasCustomerId: newItem.asaasCustomerId,
          asaasSubscriptionId: newItem.asaasSubscriptionId,
        });

        if (existingIdx === -1) {
          listaUnificada.push(newItem);
          return;
        }

        const existing = listaUnificada[existingIdx];

        // 1. Prioridade de Modalidade: Vitalício > Anual > Mensal
        if (newItem.modalidade === 'vitalicio' || existing.modalidade === 'vitalicio') {
          existing.modalidade = 'vitalicio';
          existing.isAnualAntigoTransitado =
            existing.isAnualAntigoTransitado || newItem.isAnualAntigoTransitado;
        } else if (newItem.modalidade === 'anual') {
          existing.modalidade = 'anual';
        }

        // 2. Mesclar Pagamentos do Asaas
        const mergedPaymentsMap = new Map<string, AsaasPaymentCharge>();
        (existing.livePayments || []).forEach((p) => mergedPaymentsMap.set(p.id, p));
        (newItem.livePayments || []).forEach((p) => mergedPaymentsMap.set(p.id, p));
        const mergedPayments = Array.from(mergedPaymentsMap.values());
        existing.livePayments = mergedPayments.length > 0 ? mergedPayments : undefined;
        existing.quantidadePagamentos = Math.max(
          existing.quantidadePagamentos,
          newItem.quantidadePagamentos,
          mergedPayments.length
        );

        // Recalcular total acumulado confirmado
        const totalConfirmado = mergedPayments
          .filter((p) =>
            ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase())
          )
          .reduce((sum, p) => sum + (p.value || 0), 0);
        if (totalConfirmado > 0) {
          existing.totalPagoAcumulado = totalConfirmado;
        }

        // 3. Status: Se o novo item for Ativo ('emerald'), promover status
        if (newItem.statusBadgeColor === 'emerald' && existing.statusBadgeColor !== 'emerald') {
          existing.status = newItem.status;
          existing.statusLabel = newItem.statusLabel;
          existing.statusBadgeColor = newItem.statusBadgeColor;
        }

        // 4. Completar Dados Cadastrais se o item atual tiver dados mais ricos
        if (
          (!existing.name || existing.name === 'Assinante Asaas' || existing.name.includes('@')) &&
          newItem.name &&
          newItem.name !== 'Assinante Asaas'
        ) {
          existing.name = newItem.name;
        }
        if ((!existing.email || existing.email === 'Sem e-mail') && isEmailValido) {
          existing.email = newItem.email;
        }
        if (!existing.phone && newItem.phone) existing.phone = newItem.phone;
        if (!existing.cpfCnpj && newItem.cpfCnpj) existing.cpfCnpj = newItem.cpfCnpj;
        if (!existing.avatarUrl && newItem.avatarUrl) existing.avatarUrl = newItem.avatarUrl;
        if (!existing.userId && newItem.userId) existing.userId = newItem.userId;
        if (!existing.asaasCustomerId && newItem.asaasCustomerId)
          existing.asaasCustomerId = newItem.asaasCustomerId;
        if (!existing.asaasSubscriptionId && newItem.asaasSubscriptionId)
          existing.asaasSubscriptionId = newItem.asaasSubscriptionId;

        // 5. Casamento: priorizar casamento total
        if (
          newItem.statusCasamento === 'casado_total' ||
          (existing.statusCasamento === 'local_somente' && newItem.statusCasamento !== 'local_somente')
        ) {
          existing.statusCasamento = newItem.statusCasamento;
          existing.statusCasamentoLabel = newItem.statusCasamentoLabel;
        }

        // 6. Atualizar valor líquido e taxa
        if (newItem.valorLiquido !== null && existing.valorLiquido === null) {
          existing.valorLiquido = newItem.valorLiquido;
          existing.taxaAsaas = newItem.taxaAsaas;
        }
      };

      // A. Processar asaas_subscriptions (Supabase)
      (asaasRes.data || []).forEach((sub: any) => {
        const uid = sub.user_id;
        const prof = profileById.get(uid);
        const email = (prof?.email || '').toLowerCase().trim();

        // Conciliação ("case") com Asaas
        const liveSub =
          (sub.asaas_subscription_id ? asaasSubById.get(sub.asaas_subscription_id) : null) ||
          (sub.asaas_customer_id ? asaasSubsByCustomer.get(sub.asaas_customer_id) : null) ||
          (email ? asaasSubsByEmail.get(email) : null);

        if (liveSub?.id) seenAsaasSubIds.add(liveSub.id);
        if (sub.asaas_subscription_id) seenAsaasSubIds.add(sub.asaas_subscription_id);

        const liveCust =
          (sub.asaas_customer_id ? asaasCustomerById.get(sub.asaas_customer_id) : null) ||
          (liveSub?.customer ? asaasCustomerById.get(liveSub.customer) : null) ||
          (email ? asaasCustomerByEmail.get(email) : null);

        const livePayments = gatherPayments(
          sub.asaas_subscription_id || liveSub?.id,
          sub.asaas_customer_id || liveSub?.customer,
          email
        );

        // Status de casamento
        let statusCasamento: StatusCasamentoType = 'local_somente';
        let statusCasamentoLabel = 'Local Supabase';
        if (sub.asaas_subscription_id && liveSub) {
          statusCasamento = 'casado_total';
          statusCasamentoLabel = '✓ Casado no Asaas';
        } else if (sub.asaas_customer_id || liveCust) {
          statusCasamento = 'casado_cliente';
          statusCasamentoLabel = '✓ Cliente Casado Asaas';
        } else if (livePayments.length > 0) {
          statusCasamento = 'casado_email';
          statusCasamentoLabel = '✓ Casado por Faturas';
        }

        const planoLower = (sub.plano || '').toLowerCase();
        const isVitExplicit =
          planoLower.includes('vitalicio') || planoLower.includes('vitalício') || planoLower.includes('vital');

        // Regra de transição oficial: anuais anteriores a 10/11/2026 são Vitalícios!
        const isAnualLegado =
          !isVitExplicit && isAnualAntigo(sub.plano, sub.started_at, sub.expires_at, sub.created_at);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (planoLower.includes('anual') || liveSub?.cycle === 'YEARLY') {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        // Valor financeiro real do Asaas se disponível
        const latestPayment = livePayments[0];
        let valor =
          liveSub?.value ??
          latestPayment?.value ??
          (modalidade === 'vitalicio'
            ? PRECO_VITALICIO
            : modalidade === 'anual'
            ? PRECO_ANUAL
            : PRECO_MENSAL);

        const valorLiquido = latestPayment?.netValue ?? null;
        const taxaAsaas = valorLiquido !== null ? Math.max(0, valor - valorLiquido) : null;
        const totalPagoAcumulado = livePayments
          .filter((p) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase()))
          .reduce((sum, p) => sum + (p.value || 0), 0);

        const billingType = latestPayment?.billingType || liveSub?.billingType || sub.origem;
        const forma = normalizarFormaPagamento(billingType, sub.plano, sub.origem);
        const statusNorm = normalizarStatus(liveSub?.status || latestPayment?.status || sub.status);

        const dataAssinatura = sub.started_at || sub.created_at || liveSub?.dateCreated || latestPayment?.dateCreated;

        mergeSubscriber({
          id: `asaas-${sub.id}`,
          userId: uid,
          name: liveCust?.name || prof?.name || email.split('@')[0] || 'Assinante Asaas',
          email: email || liveCust?.email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: liveCust?.phone || liveCust?.mobilePhone || prof?.phone || null,
          cpfCnpj: liveCust?.cpfCnpj || null,
          modalidade,
          planoOriginal: sub.plano || 'mensal',
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          valorLiquido,
          taxaAsaas,
          totalPagoAcumulado: totalPagoAcumulado > 0 ? totalPagoAcumulado : valor,
          quantidadePagamentos: livePayments.length,
          formaPagamento: forma,
          billingTypeRaw: billingType,
          statusCasamento,
          statusCasamentoLabel,
          dataAssinatura,
          dataAssinaturaFormatada: formatarDataHora(dataAssinatura),
          dataExpiracao: sub.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, liveSub?.nextDueDate || sub.expires_at),
          status: liveSub?.status || sub.status || 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: sub.asaas_customer_id || liveSub?.customer || liveCust?.id || null,
          asaasSubscriptionId: sub.asaas_subscription_id || liveSub?.id || null,
          origem: 'asaas',
          asaasCycle: liveSub?.cycle,
          asaasNextDueDate: liveSub?.nextDueDate,
          livePayments: livePayments.length > 0 ? livePayments : undefined,
        });
      });

      // B. Processar legacy_subscribers (Supabase)
      (legacyRes.data || []).forEach((leg: any) => {
        const email = (leg.email || '').toLowerCase().trim();
        // Descartar registros órfãos sem identificação
        if (!email && !leg.claimed_user_id) return;

        const prof = leg.claimed_user_id
          ? profileById.get(leg.claimed_user_id)
          : profileByEmail.get(email);

        const liveSub =
          (leg.asaas_subscription_id ? asaasSubById.get(leg.asaas_subscription_id) : null) ||
          (leg.asaas_customer_id ? asaasSubsByCustomer.get(leg.asaas_customer_id) : null) ||
          (email ? asaasSubsByEmail.get(email) : null);

        if (liveSub?.id) seenAsaasSubIds.add(liveSub.id);
        if (leg.asaas_subscription_id) seenAsaasSubIds.add(leg.asaas_subscription_id);

        const liveCust =
          (leg.asaas_customer_id ? asaasCustomerById.get(leg.asaas_customer_id) : null) ||
          (email ? asaasCustomerByEmail.get(email) : null);

        const livePayments = gatherPayments(
          leg.asaas_subscription_id || liveSub?.id,
          leg.asaas_customer_id || liveSub?.customer,
          email
        );

        let statusCasamento: StatusCasamentoType = 'local_somente';
        let statusCasamentoLabel = 'Legado Migrado';
        if (leg.asaas_subscription_id && liveSub) {
          statusCasamento = 'casado_total';
          statusCasamentoLabel = '✓ Casado no Asaas';
        } else if (leg.asaas_customer_id || liveCust) {
          statusCasamento = 'casado_cliente';
          statusCasamentoLabel = '✓ Cliente Casado Asaas';
        } else if (livePayments.length > 0) {
          statusCasamento = 'casado_email';
          statusCasamentoLabel = '✓ Casado por E-mail';
        }

        const tipoLower = (leg.tipo || '').toLowerCase();
        const isVitExplicit =
          tipoLower.includes('vitalicio') || tipoLower.includes('vitalício') || tipoLower.includes('vital');

        const isAnualLegado =
          !isVitExplicit && isAnualAntigo(leg.tipo, null, leg.expires_at, leg.created_at);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (tipoLower.includes('anual')) {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        const latestPayment = livePayments[0];
        const valor =
          liveSub?.value ??
          latestPayment?.value ??
          (modalidade === 'vitalicio'
            ? PRECO_VITALICIO
            : modalidade === 'anual'
            ? PRECO_ANUAL
            : PRECO_MENSAL);

        const valorLiquido = latestPayment?.netValue ?? null;
        const taxaAsaas = valorLiquido !== null ? Math.max(0, valor - valorLiquido) : null;
        const totalPagoAcumulado = livePayments
          .filter((p) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase()))
          .reduce((sum, p) => sum + (p.value || 0), 0);

        const statusNorm = normalizarStatus(liveSub?.status || leg.status);
        const forma = normalizarFormaPagamento(latestPayment?.billingType || liveSub?.billingType, leg.tipo, 'legacy');

        mergeSubscriber({
          id: `leg-${leg.id}`,
          userId: leg.claimed_user_id || prof?.id || null,
          name: liveCust?.name || leg.nome || prof?.name || email.split('@')[0] || 'Assinante Migrado',
          email: email || liveCust?.email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: liveCust?.phone || prof?.phone || null,
          cpfCnpj: liveCust?.cpfCnpj || null,
          modalidade,
          planoOriginal: leg.tipo || 'migrado',
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          valorLiquido,
          taxaAsaas,
          totalPagoAcumulado: totalPagoAcumulado > 0 ? totalPagoAcumulado : valor,
          quantidadePagamentos: livePayments.length,
          formaPagamento: forma,
          statusCasamento,
          statusCasamentoLabel,
          dataAssinatura: leg.created_at,
          dataAssinaturaFormatada: formatarDataHora(leg.created_at),
          dataExpiracao: leg.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, leg.expires_at),
          status: liveSub?.status || leg.status || 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: leg.asaas_customer_id || null,
          asaasSubscriptionId: leg.asaas_subscription_id || null,
          origem: 'legacy',
          livePayments: livePayments.length > 0 ? livePayments : undefined,
        });
      });

      // C. Processar Play Store & App Store
      (playRes.data || []).forEach((play: any) => {
        const uid = play.user_id;
        const prof = profileById.get(uid);
        const email = (prof?.email || '').toLowerCase().trim();
        if (!uid && !email) return;

        const key = `play-${play.id || uid}`;

        const prod = (play.product_id || '').toLowerCase();
        const isVit = prod.includes('vitalicio') || prod.includes('lifetime');
        const isAnual = prod.includes('anual') || prod.includes('year');
        const isAnualLegado = isAnual && isAnualAntigo(play.product_id, play.start_time, play.expires_at, play.created_at);
        const modalidade: SubscriberPlanType = (isVit || isAnualLegado) ? 'vitalicio' : isAnual ? 'anual' : 'mensal';
        const dataAssinatura = play.start_time || play.created_at;

        mergeSubscriber({
          id: key,
          userId: uid,
          name: prof?.name || email.split('@')[0] || 'Google Play Store',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          modalidade,
          planoOriginal: play.product_id || 'play_store',
          isAnualAntigoTransitado: isAnualLegado,
          valor: modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL,
          formaPagamento: 'CREDIT_CARD',
          statusCasamento: 'local_somente',
          statusCasamentoLabel: 'Google Play Store',
          dataAssinatura,
          dataAssinaturaFormatada: formatarDataHora(dataAssinatura),
          dataExpiracao: play.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, play.expires_at),
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
        if (!uid && !email) return;

        const key = `apple-${app.id || uid}`;

        const prod = (app.product_id || '').toLowerCase();
        const isVit = prod.includes('vitalicio') || prod.includes('lifetime');
        const isAnual = prod.includes('anual') || prod.includes('year');
        const isAnualLegado = isAnual && isAnualAntigo(app.product_id, app.start_time, app.expires_at, app.created_at);
        const modalidade: SubscriberPlanType = (isVit || isAnualLegado) ? 'vitalicio' : isAnual ? 'anual' : 'mensal';
        const dataAssinatura = app.start_time || app.created_at;

        mergeSubscriber({
          id: key,
          userId: uid,
          name: prof?.name || email.split('@')[0] || 'Apple App Store',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          modalidade,
          planoOriginal: app.product_id || 'apple_store',
          isAnualAntigoTransitado: isAnualLegado,
          valor: modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL,
          formaPagamento: 'CREDIT_CARD',
          statusCasamento: 'local_somente',
          statusCasamentoLabel: 'Apple App Store',
          dataAssinatura,
          dataAssinaturaFormatada: formatarDataHora(dataAssinatura),
          dataExpiracao: app.expires_at,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, app.expires_at),
          status: app.status || 'ACTIVE',
          statusLabel: 'Ativa (App Store)',
          statusBadgeColor: 'emerald',
          origem: 'apple_store',
        });
      });

      // D. CONCILIAÇÃO COMPLETA: Assinaturas em tempo real no Asaas
      asaasLiveSubs.forEach((s) => {
        if (!s.id || seenAsaasSubIds.has(s.id)) return;
        seenAsaasSubIds.add(s.id);

        const cust = s.customer ? asaasCustomerById.get(s.customer) : null;
        const email = (cust?.email || '').toLowerCase().trim();
        const prof = email ? profileByEmail.get(email) : null;

        const livePayments = gatherPayments(s.id, s.customer, email);
        const latestPayment = livePayments[0];

        const isYearly = s.cycle === 'YEARLY';
        const desc = (s.description || '').toLowerCase();
        const isVitExplicit = desc.includes('vitalicio') || desc.includes('vitalício');
        const isAnualLegado = isYearly && isAnualAntigo(s.description || 'anual', s.dateCreated, s.nextDueDate);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (isYearly) {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        const valor = s.value || latestPayment?.value || (modalidade === 'vitalicio' ? PRECO_VITALICIO : modalidade === 'anual' ? PRECO_ANUAL : PRECO_MENSAL);
        const valorLiquido = latestPayment?.netValue ?? null;
        const taxaAsaas = valorLiquido !== null ? Math.max(0, valor - valorLiquido) : null;
        const totalPagoAcumulado = livePayments
          .filter((p) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase()))
          .reduce((sum, p) => sum + (p.value || 0), 0);

        const forma = normalizarFormaPagamento(s.billingType || latestPayment?.billingType, s.description, 'asaas');
        const statusNorm = normalizarStatus(s.status);

        mergeSubscriber({
          id: `asaas-live-${s.id}`,
          userId: prof?.id || null,
          name: cust?.name || prof?.name || email.split('@')[0] || 'Assinante Asaas',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: cust?.phone || cust?.mobilePhone || prof?.phone || null,
          cpfCnpj: cust?.cpfCnpj || null,
          modalidade,
          planoOriginal: s.description || (isYearly ? 'anual' : 'mensal'),
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          valorLiquido,
          taxaAsaas,
          totalPagoAcumulado: totalPagoAcumulado > 0 ? totalPagoAcumulado : valor,
          quantidadePagamentos: Math.max(1, livePayments.length),
          formaPagamento: forma,
          statusCasamento: prof ? 'casado_email' : 'direto_asaas',
          statusCasamentoLabel: prof ? '✓ Casado com Perfil' : '⚡ Direto Asaas',
          dataAssinatura: s.dateCreated,
          dataAssinaturaFormatada: formatarDataHora(s.dateCreated),
          dataExpiracao: s.nextDueDate,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, s.nextDueDate),
          status: s.status || 'ACTIVE',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: s.customer || null,
          asaasSubscriptionId: s.id,
          origem: 'asaas',
          asaasCycle: s.cycle,
          asaasNextDueDate: s.nextDueDate,
          livePayments: livePayments.length > 0 ? livePayments : undefined,
        });
      });

      // E. Cobranças avulsas no Asaas (apenas pagamentos confirmados/recebidos, sem falsos positivos)
      asaasLivePayments.forEach((p) => {
        if (!p.id || seenAsaasPaymentIds.has(p.id)) return;
        // Aceita apenas cobranças pagas com valor positivo
        if (!p.value || p.value <= 0) return;
        const statusUpper = (p.status || '').toUpperCase();
        const isConfirmado = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(statusUpper);
        if (!isConfirmado) return;

        seenAsaasPaymentIds.add(p.id);

        const cust = p.customer ? asaasCustomerById.get(p.customer) : null;
        const email = (cust?.email || '').toLowerCase().trim();
        const prof = email ? profileByEmail.get(email) : null;

        // Se este pagamento já puder ser anexado a um assinante existente, anexa sem criar card duplicado
        const existingIdx = findExistingIndex({
          userId: prof?.id,
          email: email || null,
          asaasCustomerId: p.customer || null,
          asaasSubscriptionId: p.subscription || null,
        });

        if (existingIdx !== -1) {
          const existing = listaUnificada[existingIdx];
          const payments = existing.livePayments || [];
          if (!payments.some((x) => x.id === p.id)) {
            payments.push(p);
            existing.livePayments = payments;
            existing.quantidadePagamentos = payments.length;
            const totalConfirmado = payments
              .filter((x) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((x.status || '').toUpperCase()))
              .reduce((sum, x) => sum + (x.value || 0), 0);
            existing.totalPagoAcumulado = totalConfirmado;
          }
          return;
        }

        // Criar novo assinante apenas se for um pagador identificado no Asaas
        if (!cust && !email) return;

        const desc = (p.description || '').toLowerCase();
        const isVitExplicit = desc.includes('vitalicio') || desc.includes('vitalício') || p.value >= 140;
        const isAnual = desc.includes('anual') || (p.value >= 70 && p.value < 120);
        const isAnualLegado = isAnual && isAnualAntigo(desc || 'anual', p.dateCreated || p.paymentDate, p.dueDate);

        let modalidade: SubscriberPlanType;
        if (isVitExplicit || isAnualLegado) {
          modalidade = 'vitalicio';
        } else if (isAnual) {
          modalidade = 'anual';
        } else {
          modalidade = 'mensal';
        }

        const valor = p.value;
        const valorLiquido = p.netValue ?? null;
        const taxaAsaas = valorLiquido !== null ? Math.max(0, valor - valorLiquido) : null;
        const forma = normalizarFormaPagamento(p.billingType, p.description, 'asaas');
        const statusNorm = normalizarStatus(p.status);
        const dataAssinatura = p.paymentDate || p.clientPaymentDate || p.dateCreated;

        mergeSubscriber({
          id: `asaas-pay-${p.id}`,
          userId: prof?.id || null,
          name: cust?.name || prof?.name || email.split('@')[0] || 'Pagador Asaas',
          email: email || 'Sem e-mail',
          avatarUrl: prof?.avatar_url || null,
          phone: cust?.phone || cust?.mobilePhone || prof?.phone || null,
          cpfCnpj: cust?.cpfCnpj || null,
          modalidade,
          planoOriginal: p.description || `Cobrança ${modalidade}`,
          isAnualAntigoTransitado: isAnualLegado,
          valor,
          valorLiquido,
          taxaAsaas,
          totalPagoAcumulado: valor,
          quantidadePagamentos: 1,
          formaPagamento: forma,
          statusCasamento: prof ? 'casado_email' : 'direto_asaas',
          statusCasamentoLabel: prof ? '✓ Cobrança com Perfil' : '⚡ Cobrança Asaas',
          dataAssinatura,
          dataAssinaturaFormatada: formatarDataHora(dataAssinatura),
          dataExpiracao: p.dueDate,
          proximaCobrancaOuExpiracao: formatarExpiracao(modalidade, p.dueDate),
          status: p.status || 'CONFIRMED',
          statusLabel: statusNorm.label,
          statusBadgeColor: statusNorm.badgeColor,
          asaasCustomerId: p.customer || null,
          asaasSubscriptionId: p.subscription || null,
          asaasPaymentId: p.id,
          origem: 'asaas',
          livePayments: [p],
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

  // Cálculo de Métricas Financeiras Rigorosas (Base Ativa Real vs Cadastrados)
  const metricas: AssinantesMetricas = useMemo(() => {
    let totalAtivos = 0;
    let totalPendentes = 0;
    let totalInadimplentes = 0;
    let totalCancelados = 0;
    let mensaisCount = 0;
    let mensaisMRR = 0;
    let anuaisCount = 0;
    let anuaisARR = 0;
    let vitaliciosCount = 0;
    let vitaliciosReceita = 0;
    let totalLiquidoRecebido = 0;
    let totalTaxasAsaas = 0;
    let totalFaturasPagas = 0;
    let totalCasadosAsaas = 0;

    const countedPaymentIds = new Set<string>();

    subscribers.forEach((s) => {
      const isAtiva = s.statusBadgeColor === 'emerald';
      const isPendente = s.statusBadgeColor === 'sky';
      const isInadimplente = s.statusBadgeColor === 'amber';
      const isCancelada = s.statusBadgeColor === 'rose';

      if (isAtiva) totalAtivos++;
      else if (isPendente) totalPendentes++;
      else if (isInadimplente) totalInadimplentes++;
      else if (isCancelada) totalCancelados++;

      if (
        s.statusCasamento === 'casado_total' ||
        s.statusCasamento === 'casado_cliente' ||
        s.statusCasamento === 'casado_email'
      ) {
        totalCasadosAsaas++;
      }

      // Somar faturas reais confirmadas (deduplicando por ID da fatura)
      if (s.livePayments && s.livePayments.length > 0) {
        s.livePayments.forEach((p) => {
          if (!p.id || countedPaymentIds.has(p.id)) return;
          const isPago = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(
            (p.status || '').toUpperCase()
          );
          if (isPago) {
            countedPaymentIds.add(p.id);
            totalFaturasPagas++;
            const net = p.netValue ?? p.value ?? 0;
            totalLiquidoRecebido += net;
            totalTaxasAsaas += Math.max(0, (p.value || 0) - net);
          }
        });
      }

      // IMPORTANTE: Apenas assinantes ATIVOS contam para MRR / ARR / Receita de Base Ativa!
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
      totalAssinantes: subscribers.length,
      totalAtivos,
      totalPendentes,
      totalInadimplentes,
      totalCancelados,
      mensaisCount,
      mensaisMRR,
      anuaisCount,
      anuaisARR,
      vitaliciosCount,
      vitaliciosReceita,
      receitaTotalGeral,
      totalLiquidoRecebido: totalLiquidoRecebido > 0 ? totalLiquidoRecebido : receitaTotalGeral,
      totalTaxasAsaas,
      totalFaturasPagas,
      totalCasadosAsaas,
    };
  }, [subscribers]);

  // Contagem por aba para os seletores
  const contagensAbas = useMemo(() => {
    let m = 0;
    let a = 0;
    let v = 0;
    subscribers.forEach((s) => {
      if (s.modalidade === 'mensal') m++;
      else if (s.modalidade === 'anual') a++;
      else if (s.modalidade === 'vitalicio') v++;
    });
    return { mensal: m, anual: a, vitalicio: v };
  }, [subscribers]);

  // Filtragem e Ordenação
  const filteredSubscribers = useMemo(() => {
    return subscribers
      .filter((s) => {
        // 1. Aba selecionada (Mensal, Anual, Vitalício)
        if (s.modalidade !== activeTab) return false;

        // 2. Busca por texto (nome, email, asaas id, customer id, cpf, telefone)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchEmail = s.email.toLowerCase().includes(q);
          const matchSub = (s.asaasSubscriptionId || '').toLowerCase().includes(q);
          const matchCus = (s.asaasCustomerId || '').toLowerCase().includes(q);
          const matchPay = (s.asaasPaymentId || '').toLowerCase().includes(q);
          const matchCpf = (s.cpfCnpj || '').toLowerCase().includes(q);
          const matchPhone = (s.phone || '').toLowerCase().includes(q);
          const matchPlano = s.planoOriginal.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchSub && !matchCus && !matchPay && !matchCpf && !matchPhone && !matchPlano) {
            return false;
          }
        }

        // 3. Filtro de Status
        if (statusFilter !== 'todos') {
          if (statusFilter === 'ativos' && s.statusBadgeColor !== 'emerald') return false;
          if (statusFilter === 'atrasados' && s.statusBadgeColor !== 'amber') return false;
          if (statusFilter === 'cancelados' && s.statusBadgeColor !== 'rose') return false;
          if (statusFilter === 'pendentes' && s.statusBadgeColor !== 'sky') return false;
        }

        // 4. Filtro de Forma de Pagamento
        if (methodFilter !== 'todos') {
          if (s.formaPagamento !== methodFilter) return false;
        }

        // 5. Filtro de Casamento
        if (matchFilter !== 'todos') {
          if (matchFilter === 'casados' && !(s.statusCasamento === 'casado_total' || s.statusCasamento === 'casado_cliente' || s.statusCasamento === 'casado_email')) return false;
          if (matchFilter === 'direto_asaas' && s.statusCasamento !== 'direto_asaas') return false;
          if (matchFilter === 'lojas' && !(s.origem === 'play_store' || s.origem === 'apple_store')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'recente') {
          const dateA = parseDateSafe(a.dataAssinatura)?.getTime() || 0;
          const dateB = parseDateSafe(b.dataAssinatura)?.getTime() || 0;
          return dateB - dateA;
        }
        if (sortOrder === 'antigo') {
          const dateA = parseDateSafe(a.dataAssinatura)?.getTime() || 0;
          const dateB = parseDateSafe(b.dataAssinatura)?.getTime() || 0;
          return dateA - dateB;
        }
        if (sortOrder === 'valor') {
          return b.valor - a.valor;
        }
        if (sortOrder === 'nome') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscribers, activeTab, searchQuery, statusFilter, methodFilter, matchFilter, sortOrder]);

  // Exportar para CSV
  const exportarCSV = () => {
    if (filteredSubscribers.length === 0) {
      toast.error('Nenhum assinante para exportar.');
      return;
    }

    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'CPF/CNPJ',
      'Modalidade',
      'Plano Original',
      'Valor Bruto (R$)',
      'Valor Liquido Asaas (R$)',
      'Forma Pagamento',
      'Status',
      'Casamento Asaas',
      'Data Contratacao',
      'Expiracao',
      'ID Assinatura Asaas',
      'ID Cliente Asaas',
      'Origem',
    ];

    const rows = filteredSubscribers.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.cpfCnpj || ''}"`,
      s.modalidade,
      `"${s.planoOriginal}"`,
      s.valor.toFixed(2),
      s.valorLiquido ? s.valorLiquido.toFixed(2) : '',
      s.formaPagamento,
      s.statusLabel,
      `"${s.statusCasamentoLabel}"`,
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
          subtitle="Mensais, Anuais e Vitalícios com histórico e conciliação Asaas"
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
                  {contagensAbas.mensal}
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
                  {contagensAbas.anual}
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
                  {contagensAbas.vitalicio}
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
                placeholder="Buscar por nome, e-mail, CPF, ID Asaas..."
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
                <SelectTrigger className="w-[125px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="atrasados">Atrasados</SelectItem>
                  <SelectItem value="cancelados">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Pagamento */}
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[125px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Formas</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Casamento */}
              <Select value={matchFilter} onValueChange={setMatchFilter}>
                <SelectTrigger className="w-[135px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
                  <SelectValue placeholder="Conciliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Origens</SelectItem>
                  <SelectItem value="casados">Casados Asaas</SelectItem>
                  <SelectItem value="direto_asaas">Direto Asaas</SelectItem>
                  <SelectItem value="lojas">Play/App Store</SelectItem>
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[135px] h-11 bg-secondary/30 border-border/60 text-xs rounded-xl">
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

          {/* Chips de Filtro Rápido de Status da Aba Atual */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 select-none',
                statusFilter === 'todos'
                  ? 'bg-foreground text-background font-bold shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              )}
            >
              Todos ({subscribers.filter((s) => s.modalidade === activeTab).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ativos')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none',
                statusFilter === 'ativos'
                  ? 'bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-secondary/40 text-emerald-400 hover:bg-secondary/70'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ativos ({subscribers.filter((s) => s.modalidade === activeTab && s.statusBadgeColor === 'emerald').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none',
                statusFilter === 'pendentes'
                  ? 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/20'
                  : 'bg-secondary/40 text-sky-400 hover:bg-secondary/70'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Pendentes ({subscribers.filter((s) => s.modalidade === activeTab && s.statusBadgeColor === 'sky').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('atrasados')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none',
                statusFilter === 'atrasados'
                  ? 'bg-amber-500 text-black font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-secondary/40 text-amber-400 hover:bg-secondary/70'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Atrasados ({subscribers.filter((s) => s.modalidade === activeTab && s.statusBadgeColor === 'amber').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cancelados')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none',
                statusFilter === 'cancelados'
                  ? 'bg-rose-500 text-white font-bold shadow-sm shadow-rose-500/20'
                  : 'bg-secondary/40 text-rose-400 hover:bg-secondary/70'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Cancelados ({subscribers.filter((s) => s.modalidade === activeTab && s.statusBadgeColor === 'rose').length})
            </button>
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

            <span className="text-xs text-muted-foreground hidden sm:inline">
              Toque em qualquer card para inspecionar dossiê financeiro e cobranças Asaas
            </span>
          </div>

          {/* Lista de Assinantes */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Carregando e conciliando assinantes com o Asaas...</p>
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
              {(searchQuery || statusFilter !== 'todos' || methodFilter !== 'todos' || matchFilter !== 'todos') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('todos');
                    setMethodFilter('todos');
                    setMatchFilter('todos');
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

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 uppercase',
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

                            <span className="text-[9px] text-muted-foreground/80 font-mono">
                              {subscriber.statusCasamentoLabel}
                            </span>
                          </div>
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
                            {subscriber.valorLiquido !== null && subscriber.valorLiquido !== undefined && (
                              <span className="text-[10px] text-emerald-400 block mt-0.5">
                                Líq: {brl(subscriber.valorLiquido)}
                              </span>
                            )}
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
                            {subscriber.quantidadePagamentos ? (
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {subscriber.quantidadePagamentos} cobrança(s) Asaas
                              </span>
                            ) : null}
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
                          {subscriber.asaasSubscriptionId || subscriber.asaasCustomerId || subscriber.asaasPaymentId || subscriber.id}
                        </span>

                        <div className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Ver Dossiê</span>
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
