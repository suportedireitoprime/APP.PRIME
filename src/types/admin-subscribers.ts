export type SubscriberPlanType = 'mensal' | 'anual' | 'vitalicio';

export type PaymentMethodType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'OUTRO';

export interface AsaasPaymentCharge {
  id: string; // pay_xxx
  customer?: string;
  subscription?: string;
  dateCreated: string;
  dueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  value: number; // gross value R$
  netValue?: number; // net value R$ after fees
  billingType: PaymentMethodType | string;
  status: 'CONFIRMED' | 'RECEIVED' | 'PENDING' | 'OVERDUE' | 'REFUNDED' | 'REFUND_REQUESTED' | 'RECEIVED_IN_CASH' | string;
  description?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
  };
  pixTransaction?: {
    qrCode?: string;
  };
}

export interface SubscriberItem {
  id: string; // internal unique key
  userId?: string | null;
  name: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  cpfCnpj?: string | null;

  // Plan & Category (3 Options)
  modalidade: SubscriberPlanType; // 'mensal' | 'anual' | 'vitalicio'
  planoOriginal: string; // 'vitalicio', 'vitalicio_pix', 'anual', 'mensal', etc.
  isAnualAntigoTransitado?: boolean; // Transição oficial para Vitalício (anteriores a 10/11/2026)

  // Financial details
  valor: number; // R$ valor contratado / pago
  formaPagamento: PaymentMethodType;
  billingTypeRaw?: string;

  // Dates
  dataAssinatura: string; // ISO
  dataAssinaturaFormatada: string; // "10/11/2026 às 14:32"
  dataExpiracao?: string | null;
  proximaCobrancaOuExpiracao: string; // "Vitalício · Sem expiração" ou "DD/MM/AAAA"

  // Status
  status: string; // 'ACTIVE', 'ACTIVE_GRACE', 'CONFIRMED', 'OVERDUE', 'CANCELLED', etc.
  statusLabel: string; // "Ativa", "Renovando", "Paga", "Atrasada", "Cancelada"
  statusBadgeColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

  // Identifiers
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  origem: 'asaas' | 'legacy' | 'checkout' | 'play_store' | 'apple_store' | 'outro';

  // Live Asaas info if available
  asaasCycle?: string;
  asaasNextDueDate?: string;
  livePayments?: AsaasPaymentCharge[];
}

export interface AssinantesMetricas {
  totalAssinantes: number;
  mensaisCount: number;
  mensaisMRR: number; // R$
  anuaisCount: number;
  anuaisARR: number; // R$
  vitaliciosCount: number;
  vitaliciosReceita: number; // R$
  receitaTotalGeral: number; // R$
}
