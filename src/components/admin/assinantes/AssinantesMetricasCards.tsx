import React from 'react';
import { Users, Calendar, Sparkles, Crown, DollarSign, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { brl } from '@/lib/precos';
import type { AssinantesMetricas, SubscriberPlanType } from '@/types/admin-subscribers';
import { cn } from '@/lib/utils';

interface Props {
  metricas: AssinantesMetricas;
  activeTab: SubscriberPlanType;
  onSelectTab: (tab: SubscriberPlanType) => void;
  isLoading?: boolean;
}

export const AssinantesMetricasCards: React.FC<Props> = ({
  metricas,
  activeTab,
  onSelectTab,
  isLoading,
}) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Métricas Financeiras & Contagem
        </span>
        <span className="text-xs text-muted-foreground/80">
          Total de {metricas.totalAssinantes} assinantes
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card Mensais */}
        <button
          type="button"
          onClick={() => onSelectTab('mensal')}
          className="text-left group focus:outline-none"
        >
          <Card
            className={cn(
              'p-3.5 transition-all duration-200 border relative overflow-hidden',
              activeTab === 'mensal'
                ? 'border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                : 'border-border/60 bg-secondary/30 hover:bg-secondary/60 hover:border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Mensais
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                MRR
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {isLoading ? '...' : metricas.mensaisCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{isLoading ? '...' : brl(metricas.mensaisMRR)}/mês</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
            </div>
          </Card>
        </button>

        {/* Card Anuais */}
        <button
          type="button"
          onClick={() => onSelectTab('anual')}
          className="text-left group focus:outline-none"
        >
          <Card
            className={cn(
              'p-3.5 transition-all duration-200 border relative overflow-hidden',
              activeTab === 'anual'
                ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                : 'border-border/60 bg-secondary/30 hover:bg-secondary/60 hover:border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Anuais
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                ARR
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {isLoading ? '...' : metricas.anuaisCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{isLoading ? '...' : brl(metricas.anuaisARR)}/ano</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
          </Card>
        </button>

        {/* Card Vitalícios */}
        <button
          type="button"
          onClick={() => onSelectTab('vitalicio')}
          className="text-left group focus:outline-none"
        >
          <Card
            className={cn(
              'p-3.5 transition-all duration-200 border relative overflow-hidden',
              activeTab === 'vitalicio'
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                : 'border-border/60 bg-secondary/30 hover:bg-secondary/60 hover:border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Vitalícios
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Acesso Total
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {isLoading ? '...' : metricas.vitaliciosCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{isLoading ? '...' : brl(metricas.vitaliciosReceita)}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
            </div>
          </Card>
        </button>

        {/* Card Receita Geral Total */}
        <Card className="p-3.5 border border-border/60 bg-secondary/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Faturamento
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Geral
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {isLoading ? '...' : brl(metricas.receitaTotalGeral)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Valor bruto contratado
          </div>
        </Card>
      </div>
    </div>
  );
};
