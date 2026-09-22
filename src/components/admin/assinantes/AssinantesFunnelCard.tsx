import React from 'react';
import { Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FunnelMetricsType {
  assinatura_aberta: any[];
  subscription_started: any[];
  purchase: any[];
}

interface AssinantesFunnelCardProps {
  funnelMetrics: FunnelMetricsType;
  funnelDate: Date;
  setFunnelDate: (d: Date) => void;
  funnelPlatform: 'asaas' | 'play' | 'apple';
  setFunnelPlatform: (p: 'asaas' | 'play' | 'apple') => void;
  setFunnelStage: (stage: 'assinatura_aberta' | 'subscription_started' | 'purchase') => void;
}

export function AssinantesFunnelCard({
  funnelMetrics,
  funnelDate,
  setFunnelDate,
  funnelPlatform,
  setFunnelPlatform,
  setFunnelStage,
}: AssinantesFunnelCardProps) {
  const navigate = useNavigate();

  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  });

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  return (
    <section className="bg-card rounded-2xl border border-border p-2.5 md:p-4 relative overflow-hidden">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-xl shrink-0">
              <Filter className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">Funil de Conversão (Planos)</h2>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/funil')}
            className="sm:hidden text-[10px] font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border shrink-0"
          >
            Ver completo
          </button>
        </div>

        {/* Date Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {dias.map((d, i) => {
            const selected = isSameDay(d, funnelDate);
            let label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (i === 0) label = 'Hoje';
            else if (i === 1) label = 'Ontem';

            return (
              <button
                key={d.toISOString()}
                onClick={() => setFunnelDate(d)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium text-[11px] transition-colors border ${
                  selected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>



      <div className="flex flex-col gap-3 bg-card rounded-xl p-3 border border-border/50">
        
        {/* Step 1: Tela de Planos */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-[10px] font-bold shrink-0 border border-blue-500/20">
                1
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Acessaram a Tela de Planos
              </div>
            </div>
            <button
              onClick={() => setFunnelStage('assinatura_aberta')}
              className="text-lg font-black text-foreground hover:text-blue-500 transition-colors"
            >
              {funnelMetrics.assinatura_aberta.length}
            </button>
          </div>
          {funnelMetrics.assinatura_aberta.length > 0 && (
             <div className="flex flex-col gap-1.5 ml-9">
               <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                 <span>Conversão p/ info:</span>
                 <span className="font-bold">{Math.min(100, Math.round((funnelMetrics.subscription_started.length / funnelMetrics.assinatura_aberta.length) * 100))}%</span>
               </div>
               <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${(funnelMetrics.subscription_started.length / funnelMetrics.assinatura_aberta.length) * 100}%` }} />
               </div>
             </div>
          )}
        </div>

        <div className="w-[1px] h-3 bg-border/50 ml-3" />

        {/* Step 2: Preencheram Info / Iniciaram Assinatura */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0 border border-emerald-500/20">
                2
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Preencheram Informações
              </div>
            </div>
            <button
              onClick={() => setFunnelStage('subscription_started')}
              className="text-lg font-black text-foreground hover:text-emerald-500 transition-colors"
            >
              {funnelMetrics.subscription_started.length}
            </button>
          </div>
          {funnelMetrics.subscription_started.length > 0 && (
             <div className="flex flex-col gap-1.5 ml-9">
               <div className="flex justify-between items-center text-[10px] text-emerald-500/70">
                 <span>Conversão p/ pagamento:</span>
                 <span className="font-bold">{Math.min(100, Math.round((funnelMetrics.purchase.length / funnelMetrics.subscription_started.length) * 100))}%</span>
               </div>
               <div className="w-full h-1 bg-emerald-500/10 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${(funnelMetrics.purchase.length / funnelMetrics.subscription_started.length) * 100}%` }} />
               </div>
             </div>
          )}
        </div>

        <div className="w-[1px] h-3 bg-border/50 ml-3" />

        {/* Step 3: Geraram Pagamento */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-[10px] font-bold shrink-0 border border-amber-500/20">
                3
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Geraram Pagamento
              </div>
            </div>
            <button
              onClick={() => setFunnelStage('purchase')}
              className="text-lg font-black text-foreground hover:text-amber-500 transition-colors"
            >
              {funnelMetrics.purchase.length}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
