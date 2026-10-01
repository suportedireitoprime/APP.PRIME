import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Clock, User as UserIcon, CheckCircle2, ShieldCheck, Mail, Target } from 'lucide-react';

const EVENT_DESCRIPTIONS: Record<string, { title: string, desc: string, icon: any }> = {
  sign_up: {
    title: 'Cadastro (sign_up)',
    desc: 'Disparado quando um usuário cria uma conta nova no app. Ideal para campanhas de geração de leads.',
    icon: ShieldCheck
  },
  login: {
    title: 'Login (login)',
    desc: 'Disparado quando um usuário já existente entra na conta.',
    icon: CheckCircle2
  },
  begin_checkout: {
    title: 'Início de Checkout (begin_checkout)',
    desc: 'Disparado no momento em que o usuário escolhe um plano e clica em "Assinar".',
    icon: Target
  },
  start_trial: {
    title: 'Teste Grátis (start_trial)',
    desc: 'Disparado quando o usuário inicia o período de teste grátis (trial) da assinatura.',
    icon: Clock
  },
  purchase: {
    title: 'Compra/Assinatura (purchase)',
    desc: 'Disparado quando o pagamento da assinatura é confirmado pelas lojas (Google Play ou App Store). É a conversão final.',
    icon: BarChart3
  },
  add_payment_info: {
    title: 'Adicionar informações de pagamento (add_payment_info)',
    desc: 'Disparado quando o usuário insere os dados de pagamento (cartão/PIX) durante o checkout.',
    icon: ShieldCheck
  },
  view_item_list: {
    title: 'Ver Planos (view_item_list)',
    desc: 'Disparado quando o usuário visualiza a tela de listagem de planos/paywall.',
    icon: BarChart3
  },
  search: {
    title: 'Busca (search)',
    desc: 'Disparado quando o usuário realiza uma busca no aplicativo.',
    icon: BarChart3
  }
};

const IMPORTANT_EVENTS = ['sign_up', 'login', 'begin_checkout', 'start_trial', 'purchase', 'view_item_list', 'add_payment_info'];

export default function AdminMetricasAds() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to new events for real-time updates
    const channel = supabase.channel('realtime_app_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_events' }, payload => {
        const novoEvento = payload.new;
        if (IMPORTANT_EVENTS.includes(novoEvento.event_name)) {
          setCounts(prev => ({
            ...prev,
            [novoEvento.event_name]: (prev[novoEvento.event_name] || 0) + 1
          }));
          setRecentEvents(prev => [novoEvento, ...prev].slice(0, 50));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch total counts for these events
      const { data: statsData } = await supabase
        .from('app_events')
        .select('event_name')
        .in('event_name', IMPORTANT_EVENTS);
      
      const newCounts: Record<string, number> = {};
      IMPORTANT_EVENTS.forEach(ev => newCounts[ev] = 0);
      
      if (statsData) {
        statsData.forEach((row: any) => {
          newCounts[row.event_name] = (newCounts[row.event_name] || 0) + 1;
        });
      }
      setCounts(newCounts);

      // Fetch 50 most recent events
      const { data: recentData } = await supabase
        .from('app_events')
        .select('*')
        .in('event_name', IMPORTANT_EVENTS)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (recentData) setRecentEvents(recentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background pb-8 text-foreground">
      <PageHeader title="Métricas Google Ads" onBack={() => window.history.back()} />

      <div className="p-4 max-w-4xl mx-auto space-y-8">
        <div className="bg-secondary/30 border border-border/50 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-2 font-sans tracking-normal normal-case">Eventos de Conversão</h2>
          <p className="text-sm text-muted-foreground mb-6 font-sans">
            Estes são os eventos disparados nativamente pelo aplicativo para o Google Analytics e Google Ads. 
            Eles são atualizados em tempo real nesta tela.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IMPORTANT_EVENTS.map(ev => {
              const info = EVENT_DESCRIPTIONS[ev] || { title: ev, desc: '', icon: BarChart3 };
              const Icon = info.icon;
              return (
                <div key={ev} className="bg-background rounded-xl p-4 border border-border flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-sans font-semibold text-base tracking-normal normal-case">{info.title}</h3>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {loading ? '...' : (counts[ev] || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-secondary/30 border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-sans tracking-normal normal-case">Últimos Disparos (Tempo Real)</h2>
            <div className="flex items-center gap-2 text-xs text-green-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Ao vivo
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando eventos...</p>
            ) : recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            ) : (
              recentEvents.map(ev => (
                <div key={ev.id} className="bg-background border border-border rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] uppercase bg-secondary px-2 py-1 rounded-md text-foreground font-bold">
                        {ev.event_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1">
                    {ev.email ? (
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {ev.email}
                      </div>
                    ) : ev.user_id ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <UserIcon className="w-4 h-4" />
                        ID: {ev.user_id.slice(0,8)}...
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">Usuário anônimo</div>
                    )}
                  </div>

                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div className="mt-2 text-[11px] font-mono text-muted-foreground bg-secondary/50 p-2 rounded-md break-all">
                      {JSON.stringify(ev.metadata)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
