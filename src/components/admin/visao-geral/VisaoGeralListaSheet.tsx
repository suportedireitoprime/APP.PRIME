import { AlertTriangle, BarChart3, Check, Crown, Loader2, Target, Timer, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatarDuracao } from '@/lib/rotaFuncoes';
import { CARD_TITLES, type CardId, type Row } from './visaoGeralTypes';
import {
  ProviderTag,
  formatPlanoTag,
  formatStatusPt,
  formatTempoCadastro,
  hora,
  renderTrialCountdown,
} from './visaoGeralUtils';

interface VisaoGeralListaSheetProps {
  open: CardId | null;
  onClose: () => void;
  rotuloPeriodo: string;
  loading: boolean;
  rows: Row[];
  filteredRows: Row[];
  novosKeys: Set<string>;
  filtroCheckout: 'todos' | 'pagos' | 'recusados' | 'abandonos';
  setFiltroCheckout: (f: 'todos' | 'pagos' | 'recusados' | 'abandonos') => void;
  filtroUser: 'gratuitos' | 'assinantes' | 'todos';
  setFiltroUser: (u: 'gratuitos' | 'assinantes' | 'todos') => void;
  onOpenTotais: () => void;
  onSelectDossie: (row: Row) => void;
}

export default function VisaoGeralListaSheet({
  open,
  onClose,
  rotuloPeriodo,
  loading,
  rows,
  filteredRows,
  novosKeys,
  filtroCheckout,
  setFiltroCheckout,
  filtroUser,
  setFiltroUser,
  onOpenTotais,
  onSelectDossie,
}: VisaoGeralListaSheetProps) {
  return (
    <Sheet open={!!open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
          <div className="flex items-start justify-between gap-3 pr-9">
            <div className="min-w-0">
              <SheetTitle className="font-display text-base font-bold text-foreground">
                {open ? `${CARD_TITLES[open]} · ${rotuloPeriodo}` : ''}
              </SheetTitle>
              <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
                {loading ? 'Carregando…' : `${filteredRows.length} registro${filteredRows.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenTotais}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 font-body text-[12px] font-semibold text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Totais
            </button>
          </div>

          {open === 'viu_planos' && (
            <div className="flex bg-secondary/50 p-1 rounded-xl mt-4 w-full gap-1 overflow-x-auto scrollbar-none">
              {(['todos', 'pagos', 'recusados', 'abandonos'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroCheckout(f)}
                  className={cn(
                    'flex-1 text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all whitespace-nowrap',
                    filtroCheckout === f
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f === 'todos' && `Todos (${rows.length})`}
                  {f === 'pagos' && `Pagos (${rows.filter((r) => r.checkoutStatus === 'pago').length})`}
                  {f === 'recusados' && `Recusados (${rows.filter((r) => r.checkoutStatus === 'recusado').length})`}
                  {f === 'abandonos' &&
                    `Abandonos (${rows.filter((r) => r.checkoutStatus === 'etapa2_parou' || r.checkoutStatus === 'desistiu_inicio').length})`}
                </button>
              ))}
            </div>
          )}

          {(open === 'online' || open === 'online5m') && (
            <div className="flex bg-secondary/50 p-1 rounded-xl mt-4 w-full">
              {(['gratuitos', 'assinantes', 'todos'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroUser(t)}
                  className={cn(
                    'flex-1 text-[11.5px] font-semibold py-1.5 rounded-lg capitalize transition-all',
                    filtroUser === t
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'gratuitos' && `Gratuitos (${rows.filter((r) => !r.isPremium && !r.isAdmin).length})`}
                  {t === 'assinantes' && `Assinantes (${rows.filter((r) => r.isPremium).length})`}
                  {t === 'todos' && `Todos (${rows.length})`}
                </button>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="p-3">
          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-10">Nenhum registro encontrado.</p>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
              {filteredRows.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => r.userId && onSelectDossie(r)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-4 py-2.5 min-h-[76px] hover:bg-secondary/60 active:bg-secondary transition-colors',
                    novosKeys.has(r.key) && 'bg-emerald-500/10',
                  )}
                >
                  {r.avatarUrl && r.avatarUrl !== 'null' ? (
                    <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center">
                      <span className="font-display font-bold text-primary text-sm uppercase">
                        {r.title.charAt(0)}
                      </span>
                      <img
                        src={r.avatarUrl}
                        alt={r.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="font-display font-bold text-primary text-sm uppercase">
                        {r.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                      {r.isPremium && <Crown className="w-4 h-4 text-[#FFD700] fill-[#FFD700] drop-shadow-md shrink-0" />}
                      {r.isAdmin && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ADMIN
                        </span>
                      )}
                      {typeof r.acessos === 'number' && r.acessos > 1 && (
                        <span title={`${r.acessos} acessos no dia`} className="shrink-0 font-body text-[10.5px] font-bold text-rose-400">
                          {r.acessos}x
                        </span>
                      )}
                      {typeof r.tempo_tela === 'number' && r.tempo_tela > 0 && (
                        <span title="Tempo de tela" className="shrink-0 font-body text-[10.5px] font-bold text-emerald-500">
                          · {formatarDuracao(r.tempo_tela)}
                        </span>
                      )}
                      {novosKeys.has(r.key) && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-[1px] font-body text-[9.5px] font-bold text-emerald-400">
                          NOVO
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {r.email ? (
                        <div className="font-body text-xs text-muted-foreground/90 truncate">{r.email}</div>
                      ) : (
                        <div className="font-body text-xs text-muted-foreground/40 italic truncate">
                          {r.subtitle || 'Usuário'}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 min-h-[20px]">
                        {r.planTag ? (
                          <>
                            <span
                              className="shrink-0 inline-flex items-center rounded-md bg-secondary border border-border/50 px-1.5 py-0.5 text-[9px] font-bold text-foreground"
                              title={r.planTag.plano}
                            >
                              {formatPlanoTag(r.planTag.plano)}
                            </span>
                            <span className="shrink-0 inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.planValue || 0)}
                            </span>
                            <span
                              className={cn(
                                'shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold',
                                r.planTag.status?.toLowerCase() === 'ativo' || r.planTag.status?.toLowerCase() === 'active'
                                  ? 'bg-secondary/60 border-border/50 text-emerald-400'
                                  : r.planTag.status?.toLowerCase() === 'cancelado' || r.planTag.status?.toLowerCase().includes('expir')
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : 'bg-secondary/50 border-border/50 text-muted-foreground',
                              )}
                            >
                              {formatStatusPt(r.planTag.status)}
                            </span>
                            {r.planTag.expires_at && (
                              <span
                                className="shrink-0 inline-flex items-center text-[9.5px] font-medium text-muted-foreground opacity-80 truncate"
                                title={`Expira em: ${r.planTag.expires_at}`}
                              >
                                Até {r.planTag.expires_at}
                              </span>
                            )}
                          </>
                        ) : open === 'online' || open === 'online5m' ? (
                          renderTrialCountdown(r.created_at, r.isPremium ?? r.is_premium)
                        ) : (
                          formatTempoCadastro(r.created_at, null)
                        )}
                        {r.faixaEtaria && <span className="text-[10px] text-muted-foreground/60 truncate">· {r.faixaEtaria}</span>}
                      </div>

                      {(open === 'online' || open === 'online5m') &&
                        r.subtitle &&
                        r.subtitle !== 'Desconhecida' &&
                        r.subtitle !== 'App aberto' && (
                          <div className="font-body text-[10.5px] text-emerald-400 font-medium truncate mt-0.5">
                            Em {r.subtitle}
                          </div>
                        )}

                      {(open === 'online' || open === 'online5m') && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[9.5px] font-semibold text-purple-300 hover:bg-purple-500/25 transition-colors"
                            title="Clique para ver o dossiê e o status detalhado de uso"
                          >
                            <Target className="w-2.5 h-2.5 text-purple-400" />
                            Uso de Recursos
                          </span>
                        </div>
                      )}

                      {open === 'viu_planos' && (
                        <div className="flex flex-col gap-1 mt-1.5">
                          {r.checkoutStatus === 'pago' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                PAGAMENTO CONFIRMADO
                              </span>
                              {r.checkoutDetalhes && <span className="text-[10px] font-bold text-emerald-400">· {r.checkoutDetalhes}</span>}
                            </div>
                          )}

                          {r.checkoutStatus === 'recusado' && (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-black text-rose-300 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  PAGAMENTO RECUSADO PELO BANCO
                                </span>
                              </div>
                              {r.checkoutDetalhes && (
                                <p className="text-[10px] font-medium text-rose-400/90 leading-tight">Motivo: {r.checkoutDetalhes}</p>
                              )}
                            </div>
                          )}

                          {r.checkoutStatus === 'enviando' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                <Timer className="w-3 h-3 text-amber-400" />
                                PIX GERADO / AGUARDANDO PAGAMENTO
                              </span>
                            </div>
                          )}

                          {r.checkoutStatus === 'etapa2_parou' && (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                  <Timer className="w-3 h-3 text-amber-400" />
                                  PAROU NA ETAPA 2 (DADOS PREENCHIDOS)
                                </span>
                                {r.checkoutDetalhes && <span className="text-[9.5px] font-semibold text-amber-300">· {r.checkoutDetalhes}</span>}
                              </div>
                              <p className="text-[9.5px] text-zinc-400 leading-tight">
                                Preencheu os dados de cadastro, mas não enviou pagamento (cartão ou PIX).
                              </p>
                            </div>
                          )}

                          {r.checkoutStatus === 'desistiu_inicio' && (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 border border-zinc-700/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                                  <X className="w-3 h-3 text-zinc-500" />
                                  DESISTÊNCIA INICIAL (NÃO PREENCHEU)
                                </span>
                              </div>
                              <p className="text-[9.5px] text-zinc-500 leading-tight">
                                Abriu a tela de checkout e voltou sem preencher o formulário.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {r.logsCheckout && r.logsCheckout.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {r.logsCheckout.map((log, idx) => {
                            const isPixGerado = log.event_name === 'checkout_pix_gerado';
                            const isPixPago = log.event_name === 'checkout_pix_pago' || (isPixGerado && log.pixStatus === 'pago');
                            const isPixNaoPago = isPixGerado && log.pixStatus === 'nao_pago';
                            const isPixPendente = isPixGerado && (log.pixStatus === 'pendente' || !log.pixStatus);

                            return (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-muted-foreground/60">{hora(log.created_at)}</span>

                                {log.event_name === 'begin_checkout' && (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded uppercase font-bold text-[9px]">
                                    CHECKOUT INICIADO
                                  </span>
                                )}

                                {log.event_name === 'checkout_etapa1_concluida' && (
                                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1 rounded uppercase font-bold text-[9px]">
                                    ETAPA 1 CONCLUÍDA {log.cidade ? `(${log.cidade}/${log.uf})` : ''}
                                  </span>
                                )}

                                {isPixPago && (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black uppercase text-[9px] shadow-[0_0_8px_rgba(16,185,129,0.25)] flex items-center gap-1">
                                    <span>PIX PAGO</span>
                                    <span>✓</span>
                                  </span>
                                )}

                                {isPixNaoPago && (
                                  <span className="bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded uppercase font-semibold text-[9px] opacity-75">
                                    PIX NÃO PAGO
                                  </span>
                                )}

                                {isPixPendente && !isPixPago && (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                                    PIX PENDENTE
                                  </span>
                                )}

                                {log.event_name === 'checkout_cc_enviado' && (
                                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-bold text-[9px]">
                                    CC ENVIADO
                                  </span>
                                )}

                                {log.event_name === 'checkout_cc_recusado' && (
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded uppercase font-bold text-[9px]">
                                    CC RECUSADO
                                  </span>
                                )}

                                {log.event_name === 'checkout_cc_aprovado' && (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded uppercase font-black text-[9px] shadow-[0_0_8px_rgba(16,185,129,0.25)] flex items-center gap-1">
                                    <span>CC APROVADO</span>
                                    <span>✓</span>
                                  </span>
                                )}

                                {log.plano && <span className="text-muted-foreground ml-1">({log.plano.replace('_', ' ')})</span>}
                                {log.erro && (
                                  <span className="text-rose-400 ml-1 truncate max-w-[120px]" title={log.erro}>
                                    - {log.erro}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end justify-center gap-1 text-right min-w-[65px]">
                    <ProviderTag provider={r.provider} />
                    {r.meta && <span className="font-body text-[10.5px] font-medium text-muted-foreground/80">{r.meta}</span>}
                    {r.googleId && (
                      <div className="text-[9px] opacity-70 uppercase" title="Google Subscription ID / Token">
                        {r.googleId.slice(0, 15)}...
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
