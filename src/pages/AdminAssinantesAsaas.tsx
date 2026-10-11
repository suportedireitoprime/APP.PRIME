import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { RefreshCw, Filter, Mail, CreditCard, Copy, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { toast } from 'sonner';


type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
};

type AsaasSubscription = {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  description?: string;
  billingType: string;
  dateCreated?: string;
};

type AsaasPayment = {
  id: string;
  customer: string;
  value: number;
  dueDate: string;
  status: string;
  description?: string;
  billingType: string;
  installment?: string;
  dateCreated?: string;
};

type UnifiedRecord = {
  id: string;
  type: 'subscription' | 'payment';
  planClass: 'Mensal' | 'Anual' | 'Vitalício' | 'Desconhecido';
  customerName: string;
  customerEmail: string;
  value: number;
  billingType: string;
  status: string;
  date: string;
  isInstallment?: boolean;
};

export default function AdminAssinantesAsaas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<AsaasCustomer[]>([]);
  const [subscriptions, setSubscriptions] = useState<AsaasSubscription[]>([]);
  const [payments, setPayments] = useState<AsaasPayment[]>([]);

  // Filtros
  const [q, setQ] = useState('');
  const [viewFilter, setViewFilter] = useState<'Todos' | 'Somente Vitalícios' | 'Somente Anuais' | 'Somente Mensais' | 'Mensais Cancelados'>('Todos');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) throw new Error('Sessão expirada');

      const fetchAll = async (endpoint: string, maxPages = 10) => {
        let allData: any[] = [];
        for (let i = 0; i < maxPages; i++) {
          const res = await supabase.functions.invoke('admin-asaas-proxy', {
            body: { endpoint, params: { limit: 100, offset: i * 100 } },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.error) throw new Error(res.error.message || `Erro fetch ${endpoint}`);
          const data = res.data?.data || [];
          allData = [...allData, ...data];
          if (data.length < 100) break;
        }
        return allData;
      };

      const [customersData, subscriptionsData, paymentsData] = await Promise.all([
        fetchAll('customers'),
        fetchAll('subscriptions'),
        fetchAll('payments')
      ]);

      setCustomers(customersData);
      setSubscriptions(subscriptionsData);
      setPayments(paymentsData);

    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao carregar dados do Asaas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const unifiedList = useMemo(() => {
    const list: UnifiedRecord[] = [];
    const custMap = new Map<string, AsaasCustomer>();
    customers.forEach(c => custMap.set(c.id, c));

    // Mapear pagamentos para saber o que foi REALMENTE pago
    const subPayments = new Map<string, AsaasPayment[]>();
    const installmentGroups = new Map<string, AsaasPayment[]>();
    const singlePayments: AsaasPayment[] = [];

    payments.forEach(pay => {
      const subId = (pay as any).subscription;
      if (subId) {
        if (!subPayments.has(subId)) subPayments.set(subId, []);
        subPayments.get(subId)!.push(pay);
      } else if (pay.installment) {
        if (!installmentGroups.has(pay.installment)) installmentGroups.set(pay.installment, []);
        installmentGroups.get(pay.installment)!.push(pay);
      } else {
        singlePayments.push(pay);
      }
    });

    const isPaid = (p: AsaasPayment) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status);

    // Processar assinaturas
    subscriptions.forEach(sub => {
      // Verificar se a assinatura tem pelo menos um pagamento concluído (ignorar PIX abandonado)
      const p = subPayments.get(sub.id) || [];
      const hasPaid = p.some(isPaid);
      if (!hasPaid) return; 

      const c = custMap.get(sub.customer);
      const desc = (sub.description || '').toLowerCase();
      let pClass: 'Mensal' | 'Anual' | 'Vitalício' | 'Desconhecido' = 'Desconhecido';
      
      if (sub.cycle === 'MONTHLY' || desc.includes('mensal')) pClass = 'Mensal';
      else if (sub.cycle === 'YEARLY' || desc.includes('anual')) pClass = 'Anual';
      
      list.push({
        id: sub.id,
        type: 'subscription',
        planClass: pClass,
        customerName: c?.name || 'Sem nome',
        customerEmail: c?.email || 'Sem email',
        value: sub.value,
        billingType: sub.billingType,
        status: sub.status,
        date: sub.dateCreated || sub.nextDueDate || '',
        isInstallment: false
      });
    });

    // Processar pagamentos isolados (single)
    singlePayments.forEach(pay => {
      if (!isPaid(pay)) return; // Apenas pagamentos concluídos

      const c = custMap.get(pay.customer);
      const desc = (pay.description || '').toLowerCase();
      let pClass: 'Mensal' | 'Anual' | 'Vitalício' | 'Desconhecido' = 'Desconhecido';
      
      if (desc.includes('vitalicio') || desc.includes('vitalício')) pClass = 'Vitalício';
      else if (desc.includes('anual')) pClass = 'Anual';
      else if (desc.includes('mensal')) pClass = 'Mensal';
      
      list.push({
        id: pay.id,
        type: 'payment',
        planClass: pClass,
        customerName: c?.name || 'Sem nome',
        customerEmail: c?.email || 'Sem email',
        value: pay.value,
        billingType: pay.billingType,
        status: pay.status,
        date: pay.dateCreated || pay.dueDate || '',
        isInstallment: false
      });
    });

    // Processar parcelamentos (Installments)
    installmentGroups.forEach((groupPayments, installmentId) => {
      // Se não tem nenhum pagamento pago no parcelamento, ignora
      const hasPaid = groupPayments.some(isPaid);
      if (!hasPaid) return;

      // Somar o valor total de todas as parcelas geradas
      const totalValue = groupPayments.reduce((acc, curr) => acc + curr.value, 0);

      // Usar a data do primeiro pagamento
      const sortedByDate = [...groupPayments].sort((a, b) => new Date(a.dateCreated || a.dueDate).getTime() - new Date(b.dateCreated || b.dueDate).getTime());
      const basePay = sortedByDate[0];
      
      const c = custMap.get(basePay.customer);
      const desc = (basePay.description || '').toLowerCase();
      let pClass: 'Mensal' | 'Anual' | 'Vitalício' | 'Desconhecido' = 'Desconhecido';
      
      if (desc.includes('vitalicio') || desc.includes('vitalício')) pClass = 'Vitalício';
      else if (desc.includes('anual')) pClass = 'Anual';
      else if (desc.includes('mensal')) pClass = 'Mensal';

      list.push({
        id: installmentId,
        type: 'payment',
        planClass: pClass,
        customerName: c?.name || 'Sem nome',
        customerEmail: c?.email || 'Sem email',
        value: totalValue, // VALOR CHEIO
        billingType: basePay.billingType,
        status: basePay.status,
        date: basePay.dateCreated || basePay.dueDate || '',
        isInstallment: true
      });
    });

    // Ordenação
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customers, subscriptions, payments]);

  const filteredList = useMemo(() => {
    return unifiedList.filter(item => {
      const qLower = q.toLowerCase();
      const matchText = 
        item.customerName.toLowerCase().includes(qLower) || 
        item.customerEmail.toLowerCase().includes(qLower);
        
      let match = false;
      const isActive = ['ACTIVE', 'RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(item.status);
      const isCanceled = ['CANCELED', 'DELETED', 'REFUNDED'].includes(item.status);

      switch (viewFilter) {
        case 'Todos':
          match = isActive; 
          break;
        case 'Somente Vitalícios':
          match = item.planClass === 'Vitalício' && isActive;
          break;
        case 'Somente Anuais':
          match = item.planClass === 'Anual' && isActive;
          break;
        case 'Somente Mensais':
          match = item.planClass === 'Mensal' && isActive;
          break;
        case 'Mensais Cancelados':
          match = item.planClass === 'Mensal' && isCanceled;
          break;
      }

      return matchText && match;
    });
  }, [unifiedList, q, viewFilter]);

  const fmtBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Acesso restrito.</div>;
  }

  const mobileHeader = (
    <PageHeader 
      title="Assinantes Asaas" 
      subtitle="Dados direto da API"
      onBack={() => navigate('/admin-funcoes')} 
      rightAction={
        <button onClick={loadData} disabled={loading} className="p-2 bg-muted rounded-full">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    />
  );

  return (
    <div className="min-h-dvh bg-background pb-20">{mobileHeader}
      <div className="space-y-6 max-w-7xl mx-auto md:py-6">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm">
            {error}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" /> Filtros
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar nome ou e-mail..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="bg-muted px-4 py-2 rounded-xl text-sm w-full sm:w-64 border-none focus:ring-1 focus:ring-primary"
              />
              <select 
                value={viewFilter}
                onChange={e => setViewFilter(e.target.value as any)}
                className="bg-muted px-4 py-2 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary outline-none w-full sm:w-auto"
              >
                <option value="Todos">Todos os Ativos</option>
                <option value="Somente Vitalícios">Somente Vitalícios</option>
                <option value="Somente Anuais">Somente Anuais</option>
                <option value="Somente Mensais">Somente Mensais</option>
                <option value="Mensais Cancelados">Mensais Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Cliente</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Data</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Plano</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Valor</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Método</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Status Asaas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      Carregando dados da API do Asaas...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      Nenhum assinante encontrado para esses filtros.
                    </td>
                  </tr>
                ) : (
                  filteredList.map(item => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{item.customerName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" /> {item.customerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          item.planClass === 'Vitalício' ? 'bg-amber-500/10 text-amber-500' :
                          item.planClass === 'Anual' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.planClass}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1.5 opacity-60">
                          {item.type === 'subscription' ? 'Assinatura' : item.isInstallment ? 'Parcelado no Cartão' : 'Pagto Único'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        {fmtBRL(item.value)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.billingType === 'PIX' ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> PIX
                            </span>
                          ) : item.billingType === 'CREDIT_CARD' ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                              <CreditCard className="w-3.5 h-3.5" /> Cartão
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                              {item.billingType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          ['ACTIVE', 'RECEIVED', 'CONFIRMED'].includes(item.status)
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : item.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-500'
                            : ['CANCELED', 'DELETED', 'REFUNDED'].includes(item.status)
                            ? 'bg-zinc-500/20 text-zinc-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
