import React from 'react';
import { XCircle, User } from 'lucide-react';
import { CombinedRow } from './assinantesTypes';

interface AssinantesFunnelModalProps {
  funnelStage: 'assinatura_aberta' | 'trial_click' | 'start_trial' | 'purchase' | null;
  onClose: () => void;
  funnelMetrics: {
    assinatura_aberta: any[];
    trial_click: any[];
    start_trial: any[];
    purchase: any[];
  } | null;
  combinedRows: CombinedRow[];
}

export function AssinantesFunnelModal({
  funnelStage,
  onClose,
  funnelMetrics,
  combinedRows,
}: AssinantesFunnelModalProps) {
  if (!funnelStage || !funnelMetrics) return null;

  const currentEvents = funnelMetrics[funnelStage];
  const uniqueCount = Object.keys(
    currentEvents.reduce((acc: any, ev: any) => {
      const key = ev.email || ev.user_id || 'anonymous';
      acc[key] = true;
      return acc;
    }, {})
  ).length;

  const aggregatedList: any[] = Object.values(
    currentEvents.reduce((acc: any, ev: any) => {
      const key = ev.email || ev.user_id || 'anonymous';
      if (!acc[key]) acc[key] = { ...ev, count: 1 };
      else acc[key].count += 1;
      return acc;
    }, {})
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {funnelStage === 'assinatura_aberta'
                ? 'Acessaram a tela de Planos'
                : funnelStage === 'trial_click'
                ? 'Clicaram em Assinar / Ver Modal'
                : funnelStage === 'start_trial'
                ? 'Iniciaram Checkout / Teste Grátis'
                : 'Pagamento Confirmado'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {uniqueCount} usuário(s) único(s) em {currentEvents.length} evento(s)
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {currentEvents.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">Nenhum evento registrado.</div>
          ) : (
            aggregatedList.map((ev: any, idx: number) => {
              const match = combinedRows.find(
                (r) => r.email === ev.email || (ev.user_id && r.id?.includes(ev.user_id))
              );
              const isConcluded =
                match &&
                (match.status === 'active' ||
                  match.status === 'ACTIVE' ||
                  match.status === 'SUBSCRIPTION_STATE_ACTIVE') &&
                match.source !== 'old';

              return (
                <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="mt-1">
                      {match?.avatar_url ? (
                        <img
                          src={match.avatar_url}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-border/50 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                          <User className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-sm break-all">{ev.email || 'Usuário Anônimo'}</div>
                        {ev.count > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                            {ev.count} vezes
                          </span>
                        )}
                        {isConcluded ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3DDC84] text-black font-extrabold uppercase tracking-wider">
                            Concluído ({match.source})
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider">
                            Não Concluído
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">ID: {ev.user_id || 'Não logado'}</div>

                      {match && match.order_id && (
                        <div className="text-[10px] text-amber-500 mt-1 truncate">
                          Pedido: {match.order_id}
                        </div>
                      )}

                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ev.metadata.plano && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 font-medium px-2 py-0.5 rounded-full border border-red-500/30">
                              Plano: {String(ev.metadata.plano).replace('_', ' ')}
                            </span>
                          )}
                          {ev.metadata.dias && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-medium px-2 py-0.5 rounded-full border border-purple-500/30">
                              {ev.metadata.dias} dias de teste
                            </span>
                          )}
                          {ev.metadata.value !== undefined && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 font-medium px-2 py-0.5 rounded-full border border-green-500/30">
                              {ev.metadata.currency || 'BRL'} {ev.metadata.value}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap bg-background px-2 py-1 rounded-full border border-border">
                      {new Date(ev.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
