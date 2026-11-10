import React, { useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CreditCard,
  QrCode,
  FileText,
  Copy,
  Check,
  Calendar,
  Clock,
  DollarSign,
  Crown,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Hash,
  Receipt,
  Layers,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { brl } from '@/lib/precos';
import { cn } from '@/lib/utils';
import type { SubscriberItem, AsaasPaymentCharge } from '@/types/admin-subscribers';

interface Props {
  subscriber: SubscriberItem | null;
  open: boolean;
  onClose: () => void;
}

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

function formatarDataHoraDetalhada(iso?: string | null): string {
  const d = parseDateSafe(iso);
  if (!d) return '—';
  const hasTime = String(iso || '').includes(':') || String(iso || '').includes('T');
  const dateStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  if (!hasTime) return dateStr;
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} às ${timeStr}`;
}

export const AssinanteDetalheSheet: React.FC<Props> = ({
  subscriber,
  open,
  onClose,
}) => {
  const [payments, setPayments] = useState<AsaasPaymentCharge[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(label);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(`Não foi possível copiar ${label}`);
    }
  };

  const fetchAsaasPayments = useCallback(async () => {
    if (!subscriber) return;
    setLoadingPayments(true);

    try {
      let endpoint = 'payments';
      let params: Record<string, string> = { limit: '50' };

      if (subscriber.asaasSubscriptionId) {
        params.subscription = subscriber.asaasSubscriptionId;
      } else if (subscriber.asaasCustomerId) {
        params.customer = subscriber.asaasCustomerId;
      }

      const { data, error } = await supabase.functions.invoke('admin-asaas-proxy', {
        body: {
          endpoint,
          params,
        },
      });

      if (!error && data?.data && Array.isArray(data.data) && data.data.length > 0) {
        setPayments(data.data);
        return;
      }

      // Se não encontrou por subscription e temos customer, tenta por customer
      if (subscriber.asaasCustomerId && params.subscription) {
        const { data: cusData } = await supabase.functions.invoke('admin-asaas-proxy', {
          body: {
            endpoint: 'payments',
            params: { customer: subscriber.asaasCustomerId, limit: '50' },
          },
        });
        if (cusData?.data && Array.isArray(cusData.data) && cusData.data.length > 0) {
          setPayments(cusData.data);
          return;
        }
      }

      // Fallback: manter dados já disponíveis no assinante
      if (subscriber.livePayments && subscriber.livePayments.length > 0) {
        setPayments(subscriber.livePayments);
      }
    } catch (err: any) {
      console.warn('Exceção ao buscar pagamentos Asaas:', err);
      if (subscriber.livePayments && subscriber.livePayments.length > 0) {
        setPayments(subscriber.livePayments);
      }
    } finally {
      setLoadingPayments(false);
    }
  }, [subscriber]);

  useEffect(() => {
    if (open && subscriber) {
      // Inicia imediatamente com os pagamentos já casados em memória
      setPayments(subscriber.livePayments || []);
      // Atualiza em background
      void fetchAsaasPayments();
    } else {
      setPayments([]);
    }
  }, [open, subscriber, fetchAsaasPayments]);

  if (!subscriber) return null;

  const isVitalicio = subscriber.modalidade === 'vitalicio';
  const isAnual = subscriber.modalidade === 'anual';

  // Cálculos financeiros do assinante específico
  const totalPago = payments
    .filter((p) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase()))
    .reduce((acc, p) => acc + (p.value || 0), 0) || subscriber.totalPagoAcumulado || subscriber.valor;

  const totalLiquido = payments
    .filter((p) => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase()))
    .reduce((acc, p) => acc + (p.netValue ?? p.value ?? 0), 0) || subscriber.valorLiquido || subscriber.valor;

  const totalTaxas = Math.max(0, totalPago - totalLiquido);

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl bg-background border-border p-0 flex flex-col h-full overflow-hidden"
      >
        <SheetHeader className="p-4 sm:p-6 border-b border-border/80 bg-secondary/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {subscriber.avatarUrl ? (
                <img
                  src={subscriber.avatarUrl}
                  alt={subscriber.name}
                  className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground border border-border shrink-0">
                  {subscriber.name.slice(0, 2).toUpperCase() || 'AS'}
                </div>
              )}
              <div className="min-w-0">
                <SheetTitle className="text-lg font-bold text-foreground truncate">
                  {subscriber.name}
                </SheetTitle>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{subscriber.email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2.5 py-1 font-semibold uppercase',
                  subscriber.statusBadgeColor === 'emerald' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                  subscriber.statusBadgeColor === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  subscriber.statusBadgeColor === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  subscriber.statusBadgeColor === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/30',
                  subscriber.statusBadgeColor === 'slate' && 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                )}
              >
                {subscriber.statusLabel}
              </Badge>

              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 font-medium border-border/60 bg-secondary/50 text-muted-foreground"
              >
                {subscriber.statusCasamentoLabel}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Alerta de Transição Oficial para Vitalício */}
          {subscriber.isAnualAntigoTransitado && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">
                  Transição Oficial: Plano Anual Pré-10/11/2026 promovido a Vitalício
                </p>
                <p className="text-emerald-200/80 mt-1">
                  Este assinante contratou o plano Anual antes do marco de 10/11/2026. Pela regra oficial do Direito Prime, o acesso foi convertido em <strong>Vitalício permanente</strong>, sem cobranças futuras recorrentes.
                </p>
              </div>
            </div>
          )}

          {/* Cards Principais do Contrato e Preços */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3 bg-secondary/30 border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Plano / Modalidade
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-sm text-foreground">
                {isVitalicio ? (
                  <>
                    <Crown className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Vitalício</span>
                  </>
                ) : isAnual ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">Anual</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span className="text-sky-400">Mensal</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground/80 mt-0.5 block truncate">
                {subscriber.planoOriginal}
              </span>
            </Card>

            <Card className="p-3 bg-secondary/30 border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Valor Cobrado (Bruto)
              </span>
              <div className="flex items-center gap-1 mt-1 font-bold text-base text-foreground">
                {brl(subscriber.valor)}
              </div>
              <span className="text-[11px] text-muted-foreground/80 mt-0.5 block">
                {isVitalicio ? 'Pagamento único' : isAnual ? 'Por ano' : 'Por mês'}
              </span>
            </Card>

            <Card className="p-3 bg-secondary/30 border-border/60 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Forma de Pagamento
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-sm text-foreground">
                {subscriber.formaPagamento === 'PIX' ? (
                  <>
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>PIX Instantâneo</span>
                  </>
                ) : subscriber.formaPagamento === 'CREDIT_CARD' ? (
                  <>
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Cartão de Crédito</span>
                  </>
                ) : subscriber.formaPagamento === 'BOLETO' ? (
                  <>
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Boleto Bancário</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span>Outro / Loja</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground/80 mt-0.5 block">
                Origem: {subscriber.origem.toUpperCase()}
              </span>
            </Card>
          </div>

          {/* Resumo Financeiro Asaas (Bruto, Líquido, Taxa) */}
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-2">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase block">
              Dossiê Financeiro Asaas
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Total Pago:</span>
                <strong className="text-foreground text-sm font-bold">{brl(totalPago)}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Líquido Asaas:</span>
                <strong className="text-emerald-400 text-sm font-bold">{brl(totalLiquido)}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Taxas Asaas:</span>
                <strong className="text-amber-400 text-sm font-bold">{brl(totalTaxas)}</strong>
              </div>
            </div>
          </div>

          {/* Seção de Datas */}
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase block">
              Datas & Prazos da Assinatura
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Data da Contratação:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {subscriber.dataAssinaturaFormatada}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Próxima Renovação / Expiração:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {subscriber.proximaCobrancaOuExpiracao}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Identificadores Asaas */}
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Identificadores & Cadastro
              </span>
              <a
                href="https://www.asaas.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Painel Asaas <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 text-xs">
              {subscriber.cpfCnpj && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
                  <div className="truncate mr-2">
                    <span className="text-muted-foreground block text-[10px]">CPF / CNPJ:</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {subscriber.cpfCnpj}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(subscriber.cpfCnpj!, 'CPF/CNPJ')}
                    className="h-8 px-2 shrink-0"
                  >
                    {copiedField === 'CPF/CNPJ' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {subscriber.phone && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
                  <div className="truncate mr-2">
                    <span className="text-muted-foreground block text-[10px]">Telefone / WhatsApp:</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {subscriber.phone}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(subscriber.phone!, 'Telefone')}
                    className="h-8 px-2 shrink-0"
                  >
                    {copiedField === 'Telefone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {subscriber.asaasSubscriptionId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
                  <div className="truncate mr-2">
                    <span className="text-muted-foreground block text-[10px]">ID Assinatura (Asaas):</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {subscriber.asaasSubscriptionId}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(subscriber.asaasSubscriptionId!, 'ID da Assinatura')}
                    className="h-8 px-2 shrink-0"
                  >
                    {copiedField === 'ID da Assinatura' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {subscriber.asaasCustomerId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
                  <div className="truncate mr-2">
                    <span className="text-muted-foreground block text-[10px]">ID Cliente (Asaas):</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {subscriber.asaasCustomerId}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(subscriber.asaasCustomerId!, 'ID do Cliente')}
                    className="h-8 px-2 shrink-0"
                  >
                    {copiedField === 'ID do Cliente' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {subscriber.userId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
                  <div className="truncate mr-2">
                    <span className="text-muted-foreground block text-[10px]">User ID (Supabase):</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {subscriber.userId}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(subscriber.userId!, 'User ID')}
                    className="h-8 px-2 shrink-0"
                  >
                    {copiedField === 'User ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Histórico Detalhado de Pagamentos / Cobranças no Asaas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase block">
                  Cobranças & Pagamentos no Asaas ({payments.length})
                </span>
                <span className="text-xs text-muted-foreground/80">
                  Faturas, valores líquidos, taxas e comprovantes
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchAsaasPayments}
                disabled={loadingPayments}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loadingPayments && 'animate-spin')} />
                Atualizar Asaas
              </Button>
            </div>

            {loadingPayments && payments.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Consultando pagamentos em tempo real no Asaas...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground text-xs space-y-1">
                <Receipt className="w-6 h-6 mx-auto opacity-50 mb-2" />
                <p className="font-semibold text-foreground">Nenhuma cobrança avulsa retornada no Asaas</p>
                <p>
                  As informações de contratação constam registradas no banco de dados do aplicativo.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {payments.map((p) => {
                  const isPaid = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase());
                  const isOverdue = p.status === 'OVERDUE';
                  const isPending = p.status === 'PENDING';
                  const taxa = (p.value || 0) - (p.netValue ?? p.value ?? 0);

                  return (
                    <Card
                      key={p.id}
                      className="p-3.5 bg-secondary/30 border-border/60 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-foreground block truncate">
                            {p.id}
                          </span>
                          <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
                            {p.description || 'Cobrança Direito Prime'}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 shrink-0 uppercase',
                            isPaid && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                            isPending && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                            isOverdue && 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          )}
                        >
                          {p.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-y border-border/40">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Valor Bruto:</span>
                          <strong className="text-foreground">{brl(p.value)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Líquido Asaas:</span>
                          <span className="text-emerald-400 font-semibold">{brl(p.netValue ?? p.value)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Método:</span>
                          <span className="text-foreground font-medium uppercase">
                            {p.billingType || '—'}
                            {p.creditCard?.creditCardBrand ? ` (${p.creditCard.creditCardBrand})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Vencimento:</span>
                          <span className="text-foreground font-medium">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground mt-2">
                        {(p.paymentDate || p.clientPaymentDate) ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Pago em: {new Date(p.paymentDate || p.clientPaymentDate!).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Criado em: {formatarDataHoraDetalhada(p.dateCreated)}</span>
                          </div>
                        )}

                        {taxa > 0 && (
                          <span className="text-[10px] text-muted-foreground/70">
                            Taxa Asaas: {brl(taxa)}
                          </span>
                        )}
                      </div>

                      {/* Ações do Pagamento */}
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/30">
                        {p.invoiceUrl && (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Fatura Asaas
                          </a>
                        )}
                        {p.transactionReceiptUrl && (
                          <a
                            href={p.transactionReceiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Comprovante
                          </a>
                        )}
                        {p.bankSlipUrl && (
                          <a
                            href={p.bankSlipUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> Boleto
                          </a>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Sheet */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Direito Prime · Auditoria Asaas & Conciliação
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="min-h-[40px] px-4">
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
