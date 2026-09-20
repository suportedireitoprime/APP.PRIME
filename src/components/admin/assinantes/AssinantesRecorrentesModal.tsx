import React, { useState, useEffect } from 'react';
import { XCircle, RefreshCw, TrendingUp, CalendarDays, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssinantesRecorrentesModalProps {
  onClose: () => void;
  fmtBRL: (v: number) => string;
  fmtDateTime: (d: string) => string;
  combinedRows: any[];
}

export function AssinantesRecorrentesModal({
  onClose,
  fmtBRL,
  fmtDateTime,
  combinedRows,
}: AssinantesRecorrentesModalProps) {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [receivedPayments, setReceivedPayments] = useState<any[]>([]);
  const [recebidoMes, setRecebidoMes] = useState(0);
  const [aReceberMes, setAReceberMes] = useState(0);
  const [activeTab, setActiveTab] = useState<'VENCIMENTOS' | 'PAGOS'>('VENCIMENTOS');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1 to 12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  useEffect(() => {
    async function loadRecorrentes() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          toast.error('Erro de autenticação');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('legacy-sync', {
          body: { 
            action: 'recent_payments',
            month: selectedMonth,
            year: selectedYear
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (error) throw error;
        
        let fetchedSubs = data?.subscriptions || [];
        let fetchedPayments = data?.receivedPayments || [];
        
        // Cruzar com base local (Assinaturas)
        fetchedSubs = fetchedSubs.map((s: any) => {
          const match = combinedRows.find(
            (r) => r.raw?.asaas_customer_id === s.customer || r.id === s.customer || r.email?.includes(s.customer)
          );
          return {
            ...s,
            localName: match?.display_name || null,
            localEmail: match?.email || null,
            localAvatar: match?.avatar_url || null,
          };
        });

        // Cruzar com base local (Pagamentos Recebidos)
        fetchedPayments = fetchedPayments.map((p: any) => {
          const match = combinedRows.find(
            (r) => r.raw?.asaas_customer_id === p.customer || r.id === p.customer || r.email?.includes(p.customer)
          );
          return {
            ...p,
            localName: match?.display_name || null,
            localEmail: match?.email || null,
            localAvatar: match?.avatar_url || null,
          };
        });

        // Ordenar por data de próximo vencimento
        fetchedSubs.sort((a: any, b: any) => {
          if (!a.nextDueDate) return 1;
          if (!b.nextDueDate) return -1;
          return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        });

        // Ordenar pagamentos por data decrescente
        fetchedPayments.sort((a: any, b: any) => {
          if (!a.paymentDate) return 1;
          if (!b.paymentDate) return -1;
          return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        });

        setSubscriptions(fetchedSubs);
        setReceivedPayments(fetchedPayments);
        setRecebidoMes(data?.recebidoMes || 0);
        setAReceberMes(data?.aReceberMes || 0);
      } catch (err: any) {
        console.error(err);
        toast.error('Erro ao buscar pagamentos: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecorrentes();
  }, [combinedRows, selectedMonth, selectedYear]);

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return 'Sem previsão';
    const d = new Date(dateStr);
    const now = new Date();
    d.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diff < 0) return 'Atrasado';
    if (diff === 0) return 'Vence hoje';
    if (diff === 1) return 'Vence amanhã';
    return `Em ${diff} dias`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-[95vw] h-[95vh] sm:max-w-4xl sm:h-[85vh] rounded-2xl shadow-xl border border-border flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl">Receita Recorrente (Asaas)</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Monitoramento de fluxo de caixa em tempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/50 rounded-lg p-1 mr-2 hidden sm:flex">
              <select 
                className="bg-transparent text-sm font-medium outline-none px-2 py-1 cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                <option className="bg-[#0D0D0D] text-white" value={1}>Janeiro</option>
                <option className="bg-[#0D0D0D] text-white" value={2}>Fevereiro</option>
                <option className="bg-[#0D0D0D] text-white" value={3}>Março</option>
                <option className="bg-[#0D0D0D] text-white" value={4}>Abril</option>
                <option className="bg-[#0D0D0D] text-white" value={5}>Maio</option>
                <option className="bg-[#0D0D0D] text-white" value={6}>Junho</option>
                <option className="bg-[#0D0D0D] text-white" value={7}>Julho</option>
                <option className="bg-[#0D0D0D] text-white" value={8}>Agosto</option>
                <option className="bg-[#0D0D0D] text-white" value={9}>Setembro</option>
                <option className="bg-[#0D0D0D] text-white" value={10}>Outubro</option>
                <option className="bg-[#0D0D0D] text-white" value={11}>Novembro</option>
                <option className="bg-[#0D0D0D] text-white" value={12}>Dezembro</option>
              </select>
              <select 
                className="bg-transparent text-sm font-medium outline-none px-2 py-1 border-l border-border/50 ml-1 pl-2 cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <option className="bg-[#0D0D0D] text-white" key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile selectors */}
        <div className="sm:hidden flex bg-muted/50 border-b border-border p-2 px-4 justify-between">
          <select 
            className="bg-transparent text-sm font-medium outline-none w-full cursor-pointer"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option className="bg-[#0D0D0D] text-white" value={1}>Janeiro</option>
            <option className="bg-[#0D0D0D] text-white" value={2}>Fevereiro</option>
            <option className="bg-[#0D0D0D] text-white" value={3}>Março</option>
            <option className="bg-[#0D0D0D] text-white" value={4}>Abril</option>
            <option className="bg-[#0D0D0D] text-white" value={5}>Maio</option>
            <option className="bg-[#0D0D0D] text-white" value={6}>Junho</option>
            <option className="bg-[#0D0D0D] text-white" value={7}>Julho</option>
            <option className="bg-[#0D0D0D] text-white" value={8}>Agosto</option>
            <option className="bg-[#0D0D0D] text-white" value={9}>Setembro</option>
            <option className="bg-[#0D0D0D] text-white" value={10}>Outubro</option>
            <option className="bg-[#0D0D0D] text-white" value={11}>Novembro</option>
            <option className="bg-[#0D0D0D] text-white" value={12}>Dezembro</option>
          </select>
          <select 
            className="bg-transparent text-sm font-medium outline-none cursor-pointer border-l border-border/50 ml-2 pl-2"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option className="bg-[#0D0D0D] text-white" key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 relative bg-muted/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground h-full">
              <RefreshCw className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Sincronizando com Asaas...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/50 shadow-sm flex items-start gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Wallet className="w-20 h-20" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Recebido Mês Atual</p>
                    <h4 className="text-2xl font-extrabold text-foreground mt-1">{fmtBRL(recebidoMes)}</h4>
                  </div>
                </div>

                <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/50 shadow-sm flex items-start gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CalendarDays className="w-20 h-20" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">A Receber (Este Mês)</p>
                    <h4 className="text-2xl font-extrabold text-foreground mt-1">{fmtBRL(aReceberMes)}</h4>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-border">
                <button
                  onClick={() => setActiveTab('VENCIMENTOS')}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'VENCIMENTOS' 
                      ? 'border-blue-500 text-blue-500' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Próximos Vencimentos
                </button>
                <button
                  onClick={() => setActiveTab('PAGOS')}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'PAGOS' 
                      ? 'border-emerald-500 text-emerald-500' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Já Pagaram
                </button>
              </div>

              {/* List Content */}
              <div className="space-y-4">
                {activeTab === 'VENCIMENTOS' ? (
                  subscriptions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 bg-card rounded-2xl border border-border">
                      Nenhuma assinatura ativa encontrada.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {subscriptions.map((s, idx) => (
                        <div key={s.id || idx} className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {s.localAvatar ? (
                              <img src={s.localAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-muted-foreground">
                                  {(s.localName || 'C')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-sm sm:text-base truncate">
                                {s.localName || 'Cliente sem nome (Local)'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {s.localEmail || s.customer}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {s.billingType === 'CREDIT_CARD' ? 'CARTÃO' : s.billingType === 'PIX' ? 'PIX' : s.billingType}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                            <div className="text-xs font-medium text-muted-foreground sm:mb-1">
                              {getDaysUntil(s.nextDueDate)}
                            </div>
                            <div className="font-extrabold text-foreground text-lg sm:text-xl">
                              {fmtBRL(s.value)}
                            </div>
                            <div className="text-[10px] text-muted-foreground hidden sm:block">
                              {s.nextDueDate ? fmtDateTime(s.nextDueDate).split(' ')[0] : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  receivedPayments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 bg-card rounded-2xl border border-border">
                      Nenhum pagamento recebido neste mês até o momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {receivedPayments.map((p, idx) => (
                        <div key={p.id || idx} className="p-4 sm:p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {p.localAvatar ? (
                              <img src={p.localAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-emerald-500">
                                  {(p.localName || 'C')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-sm sm:text-base truncate">
                                {p.localName || 'Cliente sem nome (Local)'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {p.localEmail || p.customer}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  PAGO
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-emerald-500/20 pt-3 sm:pt-0">
                            <div className="text-xs font-medium text-emerald-500 sm:mb-1">
                              {p.paymentDate ? `Pago em ${fmtDateTime(p.paymentDate).split(' ')[0]}` : 'Recebido'}
                            </div>
                            <div className="font-extrabold text-foreground text-lg sm:text-xl">
                              {fmtBRL(p.value)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
