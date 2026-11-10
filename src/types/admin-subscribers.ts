export type SubscriberPlanType = 'mensal' | 'anual' | 'vitalicio';

export type PaymentMethodType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'OUTRO';

export type StatusCasamentoType =
  | 'casado_total' // Casado por ID de assinatura ou pagamento
  | 'casado_cliente' // Casado por ID do cliente Asaas
  | 'casado_email' // Casado por e-mail entre Asaas e Supabase
  | 'direto_asaas' // Presente no Asaas mas não vinculado ao app
  | 'local_somente'; // Presente apenas no Supabase / Lojas

export interface AsaasCustomerItem {
  id: string; // cus_xxx
  name: string;
  email: string;
  phone?: string | null;
  mobilePhone?: string | null;
  cpfCnpj?: string | null;
  dateCreated?: string;
}

export interface AsaasPaymentCharge {
  id: string; // pay_xxx
  customer?: string;
  subscription?: string;
  installment?: string;
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
  valor: number; // R$ valor contratado / pago bruto
  valorLiquido?: number | null; // R$ valor líquido após taxa Asaas
  taxaAsaas?: number | null; // R$ taxa Asaas (valor - valorLiquido)
  totalPagoAcumulado?: number; // Soma de todas as cobranças recebidas
  quantidadePagamentos?: number; // Total de cobranças geradas
  formaPagamento: PaymentMethodType;
  billingTypeRaw?: string;

  // Casamento / Conciliação Asaas
  statusCasamento: StatusCasamentoType;
  statusCasamentoLabel: string;
  asaasPaymentId?: string | null;

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
  totalAtivos: number; // quantidade de assinantes com pagamento ativo confirmado
  totalPendentes: number; // quantidade com cobrança pendente (aguardando pagamento)
  totalInadimplentes: number; // quantidade com cobrança vencida/atrasada
  totalCancelados: number; // quantidade cancelada ou inativa
  mensaisCount: number;
  mensaisMRR: number; // R$
  anuaisCount: number;
  anuaisARR: number; // R$
  vitaliciosCount: number;
  vitaliciosReceita: number; // R$
  receitaTotalGeral: number; // R$
  totalLiquidoRecebido: number; // R$ total líquido recebido após taxas
  totalTaxasAsaas: number; // R$ total de taxas retidas pelo Asaas
  totalFaturasPagas: number; // quantidade de faturas confirmadas/recebidas
  totalCasadosAsaas: number; // quantidade de registros com casamento no Asaas
}
