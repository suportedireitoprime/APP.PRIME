import React from 'react';
import { XCircle, User, CalendarDays, Clock } from 'lucide-react';
import { CombinedRow } from './assinantesTypes';

interface AssinantesFunnelModalProps {
  funnelStage: 'assinatura_aberta' | 'subscription_started' | 'purchase' | null;
  onClose: () => void;
  funnelMetrics: {
    assinatura_aberta: any[];
    subscription_started: any[];
    purchase: any[];
  } | null;
  combinedRows: CombinedRow[];
}

/** Retorna texto relativo como "há 2 dias", "há 3 meses", "novo hoje" */
function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `há ${years} ano${years > 1 ? 's' : ''}`;
}

/** Retorna label de "idade" do cadastro: "Novo (hoje)", "Recente (3d)", "Antigo (2 meses)" */
function accountAge(profileCreatedAt: string | null): { label: string; cls: string } | null {
  if (!profileCreatedAt) return null;
  const ms = Date.now() - new Date(profileCreatedAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days === 0) return { label: 'Novo (hoje)', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (days <= 3) return { label: `Novo (${days}d)`, cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (days <= 7) return { label: `Recente (${days}d)`, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  if (days <= 30) return { label: `${days} dias`, cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
  const months = Math.floor(days / 30);
  if (months < 12) return { label: `${months} mês${months > 1 ? 'es' : ''}`, cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  const years = Math.floor(months / 12);
  return { label: `${years} ano${years > 1 ? 's' : ''}`, cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
}

function fmtShortDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso)
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' ·');
  } catch {
    return '—';
  }
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

  // Count new vs old users
  const newUsers = aggregatedList.filter((ev) => {
    const pDate = ev.profiles?.created_at || ev.profile_created_at;
    const days = pDate ? Math.floor((Date.now() - new Date(pDate).getTime()) / (24 * 60 * 60 * 1000)) : null;
    return days !== null && days <= 7;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {funnelStage === 'assinatura_aberta'
                ? 'Acessaram a tela de Planos'
                : funnelStage === 'subscription_started'
                ? 'Preencheram Informações'
                : 'Geraram Pagamento'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {uniqueCount} usuário(s) único(s) em {currentEvents.length} evento(s)
              {newUsers > 0 && (
                <span className="ml-2 text-emerald-400 font-semibold">
                  · {newUsers} novo{newUsers > 1 ? 's' : ''} (≤7d)
                </span>
              )}
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

              const pDate = ev.profiles?.created_at || ev.profile_created_at;
              const age = accountAge(pDate);
              const lastAccess = ev.last_sign_in_at;

              let trialStatus = null;
              if (pDate && ev.created_at) {
                const diffDays = (new Date(ev.created_at).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays <= 3) {
                  trialStatus = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Dentro dos 3 dias
                    </span>
                  );
                } else {
                  trialStatus = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-400 border-rose-500/30">
                      Após 3 dias ({Math.floor(diffDays)}d)
                    </span>
                  );
                }
              }

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
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                            {ev.count} vezes
                          </span>
                        )}
                      </div>

                      {/* Cadastro + Último acesso */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {trialStatus}
                        {age && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${age.cls}`}>
                            <CalendarDays className="w-3 h-3" />
                            Cadastro: {age.label}
                          </span>
                        )}
                        {pDate && !age && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
                            <CalendarDays className="w-3 h-3" />
                            Cadastro: {fmtShortDateTime(pDate)}
                          </span>
                        )}
                        {lastAccess && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
                            <Clock className="w-3 h-3" />
                            Acesso: {timeAgo(lastAccess)}
                          </span>
                        )}
                      </div>

                      {/* Origem do acesso */}
                      <div className="mt-1.5">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded">
                          {ev.metadata?.feature ? `Banner / Modal: ${String(ev.metadata.feature).replace(/_/g, ' ')}` : 'Menu Lateral'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 mt-2">
                        {isConcluded ? (
                          <div className="text-[10px] font-bold text-emerald-500 tracking-wider">
                            ASSINATURA ATIVA
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-muted-foreground tracking-wider">
                            NÃO CONCLUÍDO
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground/60 break-all">ID: {ev.user_id || '—'}</div>
                      </div>

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
