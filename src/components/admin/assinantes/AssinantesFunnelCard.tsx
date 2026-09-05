import React from 'react';
import { Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FunnelMetricsType {
  assinatura_aberta: any[];
  trial_click: any[];
  start_trial: any[];
  purchase: any[];
}

interface AssinantesFunnelCardProps {
  funnelMetrics: FunnelMetricsType;
  funnelDays: number;
  setFunnelDays: (days: number) => void;
  onDaysChange: (days: number) => void;
  funnelPlatform: 'asaas' | 'play' | 'apple';
  setFunnelPlatform: (p: 'asaas' | 'play' | 'apple') => void;
  setFunnelStage: (stage: 'assinatura_aberta' | 'trial_click' | 'start_trial' | 'purchase') => void;
}

export function AssinantesFunnelCard({
  funnelMetrics,
  funnelDays,
  setFunnelDays,
  onDaysChange,
  funnelPlatform,
  setFunnelPlatform,
  setFunnelStage,
}: AssinantesFunnelCardProps) {
  const navigate = useNavigate();

  return (
    <section className="bg-card rounded-2xl border border-border p-2.5 md:p-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Filter className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">Funil de Conversão</h2>
              <select
                value={funnelDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFunnelDays(val);
                  onDaysChange(val);
                }}
                className="text-[10px] font-medium text-muted-foreground bg-transparent border-none outline-none p-0 focus:ring-0 cursor-pointer hover:text-foreground mt-0.5"
              >
                <option value={1}>Últimas 24h</option>
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Último mês</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/funil')}
            className="sm:hidden text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors border border-blue-500/20 ml-2"
          >
            Ver completo
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <div className="flex items-center bg-muted/50 rounded-full p-0.5 border border-border/50 shrink-0">
            <button
              onClick={() => setFunnelPlatform('asaas')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                funnelPlatform === 'asaas'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Asaas
            </button>
            <button
              onClick={() => setFunnelPlatform('play')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                funnelPlatform === 'play'
                  ? 'bg-[#3DDC84] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Play
            </button>
            <button
              onClick={() => setFunnelPlatform('apple')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                funnelPlatform === 'apple'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Apple
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/funil')}
            className="hidden sm:block text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors border border-blue-500/20 shrink-0"
          >
            Ver completo
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          onClick={() => setFunnelStage('assinatura_aberta')}
          className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-full bg-blue-500/10 pointer-events-none" />
          <span className="text-sm font-medium relative z-10">1. Acessaram a tela de Planos</span>
          <span className="font-bold text-blue-500 relative z-10">
            {funnelMetrics.assinatura_aberta.length}
          </span>
        </div>

        <div
          onClick={() => setFunnelStage('trial_click')}
          className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-4"
        >
          <div
            className="absolute left-0 top-0 bottom-0 bg-blue-500/20 pointer-events-none transition-all"
            style={{
              width: funnelMetrics.assinatura_aberta.length
                ? `${(funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100}%`
                : '0%',
            }}
          />
          <span className="text-sm font-medium relative z-10">2. Clicaram em Assinar / Ver Modal</span>
          <div className="flex items-center gap-2.5 relative z-10">
            {funnelMetrics.assinatura_aberta.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.min(
                  100,
                  Math.round(
                    (funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100
                  )
                )}
                %
              </span>
            )}
            <span className="font-bold text-blue-500">{funnelMetrics.trial_click.length}</span>
          </div>
        </div>

        <div
          onClick={() => setFunnelStage('start_trial')}
          className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-8"
        >
          <div
            className="absolute left-0 top-0 bottom-0 bg-blue-500/30 pointer-events-none transition-all"
            style={{
              width: funnelMetrics.trial_click.length
                ? `${(funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100}%`
                : '0%',
            }}
          />
          <span className="text-sm font-medium relative z-10">3. Iniciaram Checkout / Teste Grátis</span>
          <div className="flex items-center gap-2.5 relative z-10">
            {funnelMetrics.trial_click.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.min(
                  100,
                  Math.round(
                    (funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100
                  )
                )}
                %
              </span>
            )}
            <span className="font-bold text-blue-500">{funnelMetrics.start_trial.length}</span>
          </div>
        </div>

        <div
          onClick={() => setFunnelStage('purchase')}
          className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-12"
        >
          <div
            className="absolute left-0 top-0 bottom-0 bg-blue-500/40 pointer-events-none transition-all"
            style={{
              width: funnelMetrics.start_trial.length
                ? `${(funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100}%`
                : '0%',
            }}
          />
          <span className="text-sm font-medium relative z-10">4. Pagamento Confirmado</span>
          <div className="flex items-center gap-2.5 relative z-10">
            {funnelMetrics.start_trial.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.min(
                  100,
                  Math.round(
                    (funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100
                  )
                )}
                %
              </span>
            )}
            <span className="font-bold text-blue-500">{funnelMetrics.purchase.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
