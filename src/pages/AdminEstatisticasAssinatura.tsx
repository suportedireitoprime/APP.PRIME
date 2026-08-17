import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingDown, RotateCcw, ShieldAlert, ArrowDownRight, 
  Search, Filter, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Ban, CheckCircle,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminEstatisticasAssinatura() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('churn');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['play_subscriptions_metrics'],
    queryFn: async () => {
      // Usando array spread para join. 
      const { data, error } = await supabase
        .from('play_subscriptions')
        .select(`
          *,
          profiles!play_subscriptions_user_id_fkey(display_name, email)
        `)
        .order('updated_at', { ascending: false })
        .catch(async () => {
             // Fallback sem relação nomeada caso falhe
             return await supabase.from('play_subscriptions').select('*, profiles(display_name, email)').order('updated_at', { ascending: false });
        });

      if (error) {
        console.error("Erro ao carregar assinaturas:", error);
        // Tentar fallback cego (só assinaturas sem profiles)
        const fallback = await supabase.from('play_subscriptions').select('*').order('updated_at', { ascending: false });
        return fallback.data || [];
      }
      return data || [];
    }
  });

  // Realtime subscription para o admin
  useEffect(() => {
    const channel = supabase.channel('realtime_play_subs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_subscriptions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['play_subscriptions_metrics'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtros em memória
  const allData = subscriptions || [];

  const churnList = allData.filter(s => 
    s.status === 'SUBSCRIPTION_STATE_CANCELED' || 
    s.status === 'SUBSCRIPTION_STATE_EXPIRED' ||
    s.auto_renewing === false
  );

  const refundsList = allData.filter(s => 
    s.latest_notification_type === 'VOIDED_PURCHASE' || 
    (s.cancel_reason && String(s.cancel_reason).includes('REFUND'))
  );

  // Aqui para antifraude pegaremos os refunds que têm Refund de fraude (em play console é raríssimo chegar como tag de chargeback direto no webhook, mas vamos destacar os sem usuário vinculado)
  const fraudList = refundsList.filter(s => !s.user_id);

  // Totais (exibição de 30 dias para churn não tem filtro exato aqui sem saber qnd foi, mas pegaremos o total)
  const churnRate = allData.length > 0 ? ((churnList.length / allData.length) * 100).toFixed(1) : '0.0';

  const formatData = (iso: string | null) => {
    if (!iso) return 'Desconhecida';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (sub: any) => {
     if (sub.profiles) {
         if (Array.isArray(sub.profiles)) return sub.profiles[0]?.display_name || 'Desconhecido';
         return sub.profiles.display_name || 'Desconhecido';
     }
     return 'Usuário Externo (Não logado)';
  };
  
  const getUserEmail = (sub: any) => {
     if (sub.profiles) {
         if (Array.isArray(sub.profiles)) return sub.profiles[0]?.email || '';
         return sub.profiles.email || '';
     }
     return 'N/A';
  };

  const filterBySearch = (list: any[]) => {
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(item => 
      getUserName(item).toLowerCase().includes(lower) || 
      getUserEmail(item).toLowerCase().includes(lower) ||
      (item.order_id && item.order_id.toLowerCase().includes(lower))
    );
  };

  return (
    <div className="min-h-dvh bg-background pb-8 flex flex-col">
      <PageHeader title="Estatísticas da Assinatura" onBack={() => navigate('/admin')} />

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Taxa de Churn (Histórico)</div>
              <div className="text-2xl font-display font-bold">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${churnRate}%`} 
                <span className="text-xs text-muted-foreground font-normal ml-1">({churnList.length} usuários)</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Reembolsos Processados</div>
              <div className="text-2xl font-display font-bold">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : refundsList.length}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Alertas de Fraude / Sem Vínculo</div>
              <div className="text-2xl font-display font-bold">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : fraudList.length}
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/40 p-1 rounded-xl h-auto">
            <TabsTrigger value="churn" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <TrendingDown className="w-4 h-4 mr-2" />
              Churn ({churnList.length})
            </TabsTrigger>
            <TabsTrigger value="refunds" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reembolsos ({refundsList.length})
            </TabsTrigger>
            <TabsTrigger value="fraud" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Antifraude ({fraudList.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
             <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar nome, email, GPA.xxx..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/60" 
                  />
                </div>
              </div>
          </div>

          {/* Tab: CHURN */}
          <TabsContent value="churn" className="space-y-4 mt-4">
            <div className="space-y-3">
              {isLoading && <div className="text-center p-4 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Carregando...</div>}
              {!isLoading && churnList.length === 0 && <div className="text-center p-4 text-muted-foreground">Nenhum cancelamento encontrado.</div>}
              
              {filterBySearch(churnList).map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{getUserName(item)} <span className="text-muted-foreground font-normal ml-2">{getUserEmail(item)}</span></div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase border-border/50">{item.product_id}</Badge>
                        <span>{formatData(item.updated_at)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">ID: {item.order_id || 'Não informado'}</div>
                    </div>
                  </div>
                  <div className="sm:text-right flex flex-col justify-center bg-secondary/40 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                     <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status / Motivo</div>
                     <div className="text-sm font-medium text-foreground">{item.status}</div>
                     {item.cancel_reason && <div className="text-xs text-muted-foreground mt-1">{item.cancel_reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab: REFUNDS */}
          <TabsContent value="refunds" className="space-y-4 mt-4">
            <div className="space-y-3">
              {isLoading && <div className="text-center p-4 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Carregando...</div>}
              {!isLoading && refundsList.length === 0 && <div className="text-center p-4 text-muted-foreground">Nenhum reembolso registrado.</div>}

              {filterBySearch(refundsList).map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm truncate">{getUserName(item)} <span className="text-muted-foreground font-normal ml-2">{getUserEmail(item)}</span></div>
                      <Badge variant="default" className="bg-orange-500/20 text-orange-500">
                        Processado
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-background/50 p-2 rounded-md">
                        <span className="text-muted-foreground block mb-0.5">Data Notificação</span>
                        <span className="font-medium">{formatData(item.latest_notification_at || item.updated_at)}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-md">
                        <span className="text-muted-foreground block mb-0.5">Transação Play Store</span>
                        <span className="font-mono text-[10px] truncate block">{item.order_id || item.purchase_token?.slice(0, 20)+'...'}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Raw Reason: <span className="text-foreground">{item.cancel_reason || 'Reembolso do Sistema'}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab: FRAUD */}
          <TabsContent value="fraud" className="space-y-4 mt-4">
            <div className="space-y-3">
              {isLoading && <div className="text-center p-4 text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Carregando...</div>}
              {!isLoading && fraudList.length === 0 && <div className="text-center p-4 text-muted-foreground">Nenhuma assinatura sem vínculo detectada.</div>}

              {filterBySearch(fraudList).map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                      <Ban className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Usuário não registrado no App <span className="text-muted-foreground font-normal ml-2">Sincronização pendente ou pirataria</span></div>
                      <div className="text-xs mt-1 text-destructive font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        GPA: {item.order_id} ({formatData(item.created_at)})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium w-full sm:w-auto justify-center sm:justify-start">
                     <CheckCircle className="w-4 h-4 text-emerald-500" /> Webhook Revogou Acesso
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
