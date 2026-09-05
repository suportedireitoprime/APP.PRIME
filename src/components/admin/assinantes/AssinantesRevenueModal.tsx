import React from 'react';
import { RevenueData } from './assinantesTypes';

interface AssinantesRevenueModalProps {
  modalDetails: 'mrr' | 'gross' | null;
  onClose: () => void;
  revenue: RevenueData;
  fmtBRL: (val: number) => string;
}

export const AssinantesRevenueModal: React.FC<AssinantesRevenueModalProps> = ({
  modalDetails,
  onClose,
  revenue,
  fmtBRL,
}) => {
  if (!modalDetails) return null;

  const users = modalDetails === 'mrr' ? revenue.mrrUsers : revenue.grossUsers;
  const total = users.reduce((acc, u) => acc + u.value, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full sm:max-w-2xl sm:rounded-2xl border-t sm:border border-border/50 shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
          <div>
            <h3 className="font-bold text-lg">
              {modalDetails === 'mrr' ? 'Composição do MRR' : 'Composição do Bruto Acumulado'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {modalDetails === 'mrr' ? 'Apenas assinaturas ativas com valor mensal' : 'Todas as vendas (inclui cancelados e vitalício)'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="sr-only">Fechar</span>
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{u.display_name || u.email || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-foreground">
                    {u.plan}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                    u.source === 'asaas' ? 'bg-blue-500 text-white' :
                    u.source === 'old' ? 'bg-amber-500 text-white' :
                    u.source === 'play' ? 'bg-[#3DDC84] text-black' :
                    'bg-zinc-700 text-white'
                  }`}>
                    {u.source}
                  </span>
                  {u.status !== 'active' && u.status !== 'SUBSCRIPTION_STATE_ACTIVE' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-bold uppercase tracking-wider">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="font-bold text-foreground">{fmtBRL(u.value)}</div>
                <div className="text-[10px] text-muted-foreground">{modalDetails === 'mrr' ? '/mês' : 'total'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border/50 shrink-0 bg-muted/10 flex justify-between items-center rounded-b-2xl">
          <span className="text-sm font-medium text-muted-foreground">Total Listado:</span>
          <span className="text-lg font-bold">
            {fmtBRL(total)}
          </span>
        </div>
      </div>
    </div>
  );
};
