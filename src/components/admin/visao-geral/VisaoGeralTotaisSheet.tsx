import { ChevronRight, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CARD_TITLES, type CardId, type Row, type TotaisData } from './visaoGeralTypes';
import { ProviderTag } from './visaoGeralUtils';

interface VisaoGeralTotaisSheetProps {
  openCard: CardId | null;
  totaisOpen: boolean;
  onTotaisOpenChange: (open: boolean) => void;
  totais: TotaisData | null;
  totaisLoading: boolean;
  onOpenProvider: (provider: string) => void;
  provOpen: string | null;
  onCloseProv: () => void;
  provRows: Row[];
  provLoading: boolean;
  onSelectDossie: (row: Row) => void;
}

export default function VisaoGeralTotaisSheet({
  openCard,
  totaisOpen,
  onTotaisOpenChange,
  totais,
  totaisLoading,
  onOpenProvider,
  provOpen,
  onCloseProv,
  provRows,
  provLoading,
  onSelectDossie,
}: VisaoGeralTotaisSheetProps) {
  return (
    <>
      <Sheet open={totaisOpen} onOpenChange={onTotaisOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl h-[92vh] max-h-[92vh] overflow-y-auto p-0 bg-background border-border"
        >
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <SheetTitle className="font-display text-base font-bold text-foreground">
              {openCard ? `Totais · ${CARD_TITLES[openCard]}` : 'Totais'}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">Métricas gerais acumuladas</p>
          </SheetHeader>

          <div className="p-3 space-y-3">
            {totaisLoading || !totais ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : totais.error ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">Acesso restrito a administradores.</p>
            ) : (
              <>
                <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-5 text-center">
                  <div className="font-display text-4xl font-bold text-primary leading-none">{totais.total ?? 0}</div>
                  <div className="font-body text-[12px] text-muted-foreground mt-1.5">Total acumulado</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Hoje', v: totais.hoje },
                    { l: '7 dias', v: totais.d7 },
                    { l: '30 dias', v: totais.d30 },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-foreground leading-none">{x.v ?? 0}</div>
                      <div className="font-body text-[11px] text-muted-foreground mt-1">{x.l}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="font-body text-[13px] font-semibold text-foreground mb-3">Origem da conta</div>
                  <div className="space-y-2.5">
                    {(['google', 'apple', 'email'] as const).map((p) => {
                      const v = Number(totais.providers?.[p] || 0);
                      const tot = Math.max(1, Number(totais.total || 1));
                      const pct = Math.round((v / tot) * 100);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onOpenProvider(p)}
                          className="w-full text-left rounded-xl px-1 py-1 hover:bg-secondary/60 active:bg-secondary transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <ProviderTag provider={p} />
                            <span className="font-body text-[12.5px] text-foreground inline-flex items-center gap-1">
                              {v} <span className="text-muted-foreground">({pct}%)</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Premium', v: totais.premium },
                    { l: 'Com número', v: totais.com_telefone },
                    { l: 'Onboarding', v: totais.onboarding },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-3 text-center">
                      <div className="font-display text-xl font-bold text-foreground leading-none">{x.v ?? 0}</div>
                      <div className="font-body text-[11px] text-muted-foreground mt-1">{x.l}</div>
                    </div>
                  ))}
                </div>

                {Array.isArray(totais.paises) && totais.paises.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                    <div className="px-4 py-3 font-body text-[13px] font-semibold text-foreground">Países</div>
                    {totais.paises.map((p) => (
                      <div key={p.pais} className="flex items-center justify-between px-4 py-2.5">
                        <span className="font-body text-[13px] text-foreground truncate">{p.pais}</span>
                        <span className="font-body text-[13px] text-muted-foreground">{p.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!provOpen} onOpenChange={(v) => !v && onCloseProv()}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border"
        >
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <SheetTitle className="font-display text-base font-bold text-foreground">
              Contas · {provOpen === 'google' ? 'Google' : provOpen === 'apple' ? 'Apple' : 'E-mail'}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
              {provLoading ? 'Carregando…' : `${provRows.length} usuário${provRows.length === 1 ? '' : 's'}`}
            </p>
          </SheetHeader>
          <div className="p-3">
            {provLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : provRows.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">Nenhum usuário.</p>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {provRows.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onSelectDossie(r)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 active:bg-secondary transition-colors"
                  >
                    {r.avatarUrl && r.avatarUrl !== 'null' ? (
                      <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
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
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="font-display font-bold text-primary text-sm uppercase">{r.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                      {r.subtitle && <div className="font-body text-[11px] text-muted-foreground truncate">{r.subtitle}</div>}
                    </div>
                    <ProviderTag provider={r.provider} />
                    <div className="font-body text-[11px] text-muted-foreground shrink-0">{r.meta}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
