import {
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Layers,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { brl } from '@/lib/precos';
import { cn } from '@/lib/utils';
import type { SubscriberItem } from '@/types/admin-subscribers';

type Props = {
  subscriber: SubscriberItem;
  onSelect: (subscriber: SubscriberItem) => void;
};

export function AssinanteRowCard({ subscriber, onSelect }: Props) {
  const isVit = subscriber.modalidade === 'vitalicio';
  const isAnual = subscriber.modalidade === 'anual';

  return (
    <button
      type="button"
      onClick={() => onSelect(subscriber)}
      className="w-full text-left group focus:outline-none"
    >
      <Card
        className={cn(
          'p-4 rounded-2xl transition-all duration-200 border bg-secondary/30 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]',
          'hover:bg-secondary/60 hover:border-primary/50 hover:shadow-lg',
          isVit && 'border-emerald-500/20 hover:border-emerald-500/50',
          isAnual && 'border-amber-500/20 hover:border-amber-500/50',
          !isVit && !isAnual && 'border-sky-500/20 hover:border-sky-500/50',
        )}
      >
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
                <p className="text-xs text-muted-foreground truncate">{subscriber.email}</p>
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
                    'bg-slate-500/10 text-slate-400 border-slate-500/30',
                )}
              >
                {subscriber.statusLabel}
              </Badge>

              <span className="text-[9px] text-muted-foreground/80 font-mono">
                {subscriber.statusCasamentoLabel}
              </span>
            </div>
          </div>

          {subscriber.isAnualAntigoTransitado && (
            <div className="mt-2.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">⭐ Vitalício (Anual pré-10/11/2026)</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3.5 p-2.5 rounded-xl bg-background/50 border border-border/40 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Valor Contratado:</span>
              <span className="font-bold text-foreground text-sm">{brl(subscriber.valor)}</span>
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

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">
                Assinado em: <strong className="text-foreground">{subscriber.dataAssinaturaFormatada}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">{subscriber.proximaCobrancaOuExpiracao}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[170px]">
            {subscriber.asaasSubscriptionId ||
              subscriber.asaasCustomerId ||
              subscriber.asaasPaymentId ||
              subscriber.id}
          </span>

          <div className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-1 transition-transform">
            <span>Ver Dossiê</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </button>
  );
}
