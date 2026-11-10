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

export const AssinanteDetalheSheet: React.FC<Props> = ({
  subscriber,
  open,
  onClose,
}) => {
  const [payments, setPayments] = useState<AsaasPaymentCharge[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchAsaasPayments = useCallback(async () => {
    if (!subscriber) return;
    setLoadingPayments(true);

    try {
      // 1. Tentar buscar cobranças pela assinatura no Asaas
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

      if (error) {
        console.warn('Erro ao consultar pagamentos Asaas via proxy:', error);
      } else if (data?.data && Array.isArray(data.data)) {
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
        if (cusData?.data && Array.isArray(cusData.data)) {
          setPayments(cusData.data);
          return;
        }
      }

      // Fallback: usar dados cacheados do próprio item
      if (subscriber.livePayments && subscriber.livePayments.length > 0) {
        setPayments(subscriber.livePayments);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.warn('Exceção ao buscar pagamentos Asaas:', err);
      if (subscriber.livePayments) {
        setPayments(subscriber.livePayments);
      }
    } finally {
      setLoadingPayments(false);
    }
  }, [subscriber]);

  useEffect(() => {
    if (open && subscriber) {
      fetchAsaasPayments();
    } else {
      setPayments([]);
    }
  }, [open, subscriber, fetchAsaasPayments]);

  if (!subscriber) return null;

  const isVitalicio = subscriber.modalidade === 'vitalicio';
  const isAnual = subscriber.modalidade === 'anual';

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

            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-xs px-2.5 py-1 font-semibold uppercase',
                subscriber.statusBadgeColor === 'emerald' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                subscriber.statusBadgeColor === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                subscriber.statusBadgeColor === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                subscriber.statusBadgeColor === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/30',
                subscriber.statusBadgeColor === 'slate' && 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              )}
            >
              {subscriber.statusLabel}
            </Badge>
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

          {/* Cards Principais do Contrato */}
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
                Valor Cobrado
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

          {/* Identificadores Asaas */}
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Identificadores no Asaas & Sistema
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
                  Cobranças & Pagamentos no Asaas
                </span>
                <span className="text-xs text-muted-foreground/80">
                  Detalhamento de faturas, valores líquidos e comprovantes
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

            {loadingPayments ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Consultando pagamentos em tempo real no Asaas...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground text-xs space-y-1">
                <Receipt className="w-6 h-6 mx-auto opacity-50 mb-2" />
                <p className="font-semibold text-foreground">Nenhuma cobrança avulsa retornada no Asaas</p>
                <p>
                  As informações de contratação constam registradas no banco de dados e nos eventos de assinatura.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {payments.map((p) => {
                  const isPaid = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes((p.status || '').toUpperCase());
                  const isOverdue = p.status === 'OVERDUE';
                  const isPending = p.status === 'PENDING';

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
                        {p.netValue !== undefined && (
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Valor Líquido:</span>
                            <span className="text-emerald-400 font-semibold">{brl(p.netValue)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Método:</span>
                          <span className="text-foreground font-medium uppercase">{p.billingType || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Vencimento:</span>
                          <span className="text-foreground font-medium">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                      </div>

                      {(p.paymentDate || p.clientPaymentDate) && (
                        <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Pago em: {new Date(p.paymentDate || p.clientPaymentDate!).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}

                      {/* Ações do Pagamento */}
                      <div className="flex items-center gap-2 mt-3 pt-2">
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
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 ml-3"
                          >
                            <Receipt className="w-3 h-3" /> Comprovante
                          </a>
                        )}
                        {p.bankSlipUrl && (
                          <a
                            href={p.bankSlipUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1 ml-3"
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
            Direito Prime · Auditoria Asaas
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="min-h-[40px] px-4">
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
