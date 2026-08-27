import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, User } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminFunil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [combinedRows, setCombinedRows] = useState<any[]>([]);
  const [days, setDays] = useState<number | null>(7);
  const [funnelPlatform, setFunnelPlatform] = useState<'native' | 'asaas'>('native');
  const [funnelStage, setFunnelStage] = useState<'assinatura_aberta' | 'trial_click' | 'start_trial' | 'purchase' | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Carrega os dados reais de assinaturas (usando 'reporting' normal) para fazer o cruzamento
      const { data: reportData, error: reportError } = await supabase.functions.invoke('play-billing', {
        body: { fn: 'reporting' }
      });
      if (reportError) throw reportError;
      
      const { sync, local, legacy } = reportData;
      setCombinedRows([...(sync ?? []), ...(local ?? []), ...(legacy ?? [])]);

      // Carrega os eventos do funil com o filtro de dias
      const { data: funnelRes, error: funnelError } = await supabase.functions.invoke('play-billing', {
        body: { fn: 'funnel', days }
      });
      if (funnelError) throw funnelError;
      
      setData(funnelRes.funnel || []);
    } catch (err: any) {
      toast.error('Erro ao carregar funil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [days]);

  const funnelMetrics = useMemo(() => {
    if (!data.length) return null;
    
    const filteredEvents = data.filter((e: any) => {
      if (e.event_name === 'assinatura_aberta') return true;
      const isWeb = e.metadata?.metodo === 'web' || e.metadata?.source === 'planos_page';
      return funnelPlatform === 'native' ? !isWeb : isWeb;
    });

    return {
      assinatura_aberta: filteredEvents.filter((e: any) => e.event_name === 'assinatura_aberta'),
      trial_click: filteredEvents.filter((e: any) => e.event_name === 'trial_click'),
      start_trial: filteredEvents.filter((e: any) => e.event_name === 'start_trial'),
      purchase: filteredEvents.filter((e: any) => e.event_name === 'purchase')
    };
  }, [data, funnelPlatform]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <PageHeader 
        title="Funil Completo" 
        onBack={() => navigate('/admin/assinantes')}
        rightContent={<Filter className="w-5 h-5 text-muted-foreground" />}
      />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-muted/50 rounded-full p-1 border border-border/50">
            <button
              onClick={() => setFunnelPlatform('native')}
              className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                funnelPlatform === 'native' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Google / Apple
            </button>
            <button
              onClick={() => setFunnelPlatform('asaas')}
              className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                funnelPlatform === 'asaas' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Asaas (Novo)
            </button>
          </div>

          <div className="flex gap-2">
            {[null, 1, 7, 30].map(d => (
              <button
                key={d || 'all'}
                onClick={() => setDays(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border ${
                  days === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground'
                }`}
              >
                {d === null ? 'Tudo' : d === 1 ? 'Hoje' : d === 7 ? '7 dias' : '30 dias'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Visualização do Funil */}
            {funnelMetrics && (
              <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="space-y-4">
                  <div 
                    onClick={() => setFunnelStage('assinatura_aberta')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-4 flex justify-between items-center overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 bg-blue-500/10 pointer-events-none transition-all w-full" />
                    <span className="text-sm font-bold relative z-10">1. Acessaram a tela de Planos</span>
                    <span className="font-black text-lg text-blue-500 relative z-10">{funnelMetrics.assinatura_aberta.length}</span>
                  </div>

                  <div 
                    onClick={() => setFunnelStage('trial_click')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-4 flex justify-between items-center overflow-hidden ml-4"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/20 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.assinatura_aberta.length ? `${(funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-bold relative z-10">2. Clicaram em Assinar</span>
                    <div className="flex items-center gap-3 relative z-10">
                      {funnelMetrics.assinatura_aberta.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {Math.min(100, Math.round((funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100))}%
                        </span>
                      )}
                      <span className="font-black text-lg text-blue-500">{funnelMetrics.trial_click.length}</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFunnelStage('start_trial')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-4 flex justify-between items-center overflow-hidden ml-8"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/30 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.trial_click.length ? `${(funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-bold relative z-10">3. Iniciaram Checkout / Teste Grátis</span>
                    <div className="flex items-center gap-3 relative z-10">
                      {funnelMetrics.trial_click.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {Math.min(100, Math.round((funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100))}%
                        </span>
                      )}
                      <span className="font-black text-lg text-blue-500">{funnelMetrics.start_trial.length}</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFunnelStage('purchase')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-4 flex justify-between items-center overflow-hidden ml-12"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/40 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.start_trial.length ? `${(funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-bold relative z-10">4. Pagamento Confirmado</span>
                    <div className="flex items-center gap-3 relative z-10">
                      {funnelMetrics.start_trial.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {Math.min(100, Math.round((funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100))}%
                        </span>
                      )}
                      <span className="font-black text-lg text-blue-500">{funnelMetrics.purchase.length}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Detalhes do Estágio */}
            {funnelStage && funnelMetrics && (
              <section className="bg-card rounded-2xl border border-border flex flex-col h-[600px] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-muted/20">
                  <h3 className="font-black text-lg">
                    {funnelStage === 'assinatura_aberta' ? 'Acessaram a tela de Planos' : 
                     funnelStage === 'trial_click' ? 'Clicaram em Assinar / Ver Modal' : 
                     funnelStage === 'start_trial' ? 'Iniciaram Checkout / Teste Grátis' :
                     'Pagamento Confirmado'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {
                      Object.keys(
                        funnelMetrics[funnelStage].reduce((acc: any, ev: any) => {
                          const key = ev.email || ev.user_id || 'anonymous';
                          acc[key] = true;
                          return acc;
                        }, {})
                      ).length
                    } usuário(s) único(s) em {funnelMetrics[funnelStage].length} evento(s)
                  </p>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                  {funnelMetrics[funnelStage].length === 0 ? (
                    <div className="text-center text-muted-foreground p-8 flex flex-col items-center">
                      <Filter className="w-8 h-8 opacity-20 mb-2" />
                      <p>Nenhum evento registrado neste período.</p>
                    </div>
                  ) : (
                    Object.values(
                      funnelMetrics[funnelStage].reduce((acc: any, ev: any) => {
                        const key = ev.email || ev.user_id || 'anonymous';
                        if (!acc[key]) acc[key] = { ...ev, count: 1 };
                        else acc[key].count += 1;
                        return acc;
                      }, {})
                    ).map((ev: any, idx: number) => {
                      const match = combinedRows.find(r => r.email === ev.email || (ev.user_id && r.id?.includes(ev.user_id)));
                      const isConcluded = match && (match.status === 'active' || match.status === 'ACTIVE' || match.status === 'SUBSCRIPTION_STATE_ACTIVE') && match.source !== 'old';

                      return (
                        <div key={idx} className="p-3.5 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="mt-1">
                              {match?.avatar_url ? (
                                <img src={match.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border border-border object-cover shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border shadow-sm">
                                  <User className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-semibold text-sm break-all">{ev.email || 'Usuário Anônimo'}</div>
                                {ev.count > 1 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                                    {ev.count} vezes
                                  </span>
                                )}
                                {isConcluded ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3DDC84] text-black font-extrabold uppercase tracking-wider shadow-sm">
                                    Concluído ({match.source})
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider border border-border">
                                    Não Concluído
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">ID: {ev.user_id || 'Não logado'}</div>
                              
                              {match && match.order_id && (
                                <div className="text-[11px] font-medium text-amber-500 mt-1.5 truncate">
                                  Pedido: {match.order_id}
                                </div>
                              )}

                              {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {ev.metadata.plano && (
                                    <span className="text-[11px] bg-red-500/10 text-red-400 font-medium px-2 py-0.5 rounded-md border border-red-500/20">
                                      Plano: {ev.metadata.plano.replace('_', ' ')}
                                    </span>
                                  )}
                                  {ev.metadata.dias && (
                                    <span className="text-[11px] bg-purple-500/10 text-purple-400 font-medium px-2 py-0.5 rounded-md border border-purple-500/20">
                                      {ev.metadata.dias} dias de teste
                                    </span>
                                  )}
                                  {ev.metadata.value !== undefined && (
                                    <span className="text-[11px] bg-green-500/10 text-green-400 font-medium px-2 py-0.5 rounded-md border border-green-500/20">
                                      {ev.metadata.currency || 'BRL'} {ev.metadata.value}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md border border-border/50">
                              {new Date(ev.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
