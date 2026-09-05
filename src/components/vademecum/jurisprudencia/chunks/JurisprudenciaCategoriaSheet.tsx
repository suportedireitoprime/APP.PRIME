import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Heart, Scale, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { copiarTexto } from '@/lib/nativo/copiar';
import { JurisCategoria, JurisItem, tribunalClasses } from './jurisprudenciaConstants';

interface JurisprudenciaCategoriaSheetProps {
  catAberta: JurisCategoria | null;
  onClose: () => void;
  favoritos: Set<string>;
  onToggleFav: (cat: JurisCategoria, item: JurisItem) => void;
  onOpenDetalhe: (item: JurisItem, cat: JurisCategoria, mode: 'tese' | 'ementa') => void;
}

export const JurisprudenciaCategoriaSheet: React.FC<JurisprudenciaCategoriaSheetProps> = ({
  catAberta,
  onClose,
  favoritos,
  onToggleFav,
  onOpenDetalhe,
}) => {
  return (
    <Sheet open={!!catAberta} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 rounded-t-3xl flex flex-col overflow-hidden [&>button.absolute]:hidden"
      >
        {catAberta && (
          <>
            <SheetHeader className="px-5 sm:px-6 pt-4 pb-4 border-b border-border/60 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center h-6 px-2 rounded-md border text-xs font-semibold ${tribunalClasses(
                        catAberta.tribunal
                      )}`}
                    >
                      {catAberta.tribunal}
                    </span>
                    <Badge variant="secondary" className="text-xs font-medium h-6 px-2">
                      {catAberta.itens.length} {catAberta.itens.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  <SheetTitle className="text-xl sm:text-2xl font-heading mt-3 leading-tight tracking-tight">
                    {catAberta.label}
                  </SheetTitle>
                </div>
                <SheetClose
                  aria-label="Fechar"
                  className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-muted hover:bg-muted/70 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <X className="w-5 h-5" />
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-3 lg:max-w-[1200px] lg:px-10">
                {catAberta.itens.map((item) => {
                  const key = String(item.id);
                  const isFav = favoritos.has(key);
                  const tese = item.tese || (item.teses && item.teses[0]) || '';
                  const ementa = item.ementa || item.conteudo || '';
                  const descricao =
                    item.descricao ||
                    (item.teses && item.teses.length > 1 ? item.teses[1] : '') ||
                    '';
                  return (
                    <div
                      key={key}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 160px' }}
                      className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {item.titulo && (
                              <div className="font-heading text-base sm:text-lg font-semibold text-foreground leading-snug">
                                {item.titulo}
                              </div>
                            )}
                            {item.situacao && (
                              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                {item.situacao}
                              </span>
                            )}
                          </div>
                          {item.numero_processo && (
                            <div className="text-xs sm:text-sm text-muted-foreground font-mono">
                              {item.numero_processo}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleFav(catAberta, item)}
                          className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full ${
                            isFav
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-muted-foreground hover:text-red-500 hover:bg-muted'
                          }`}
                          aria-label={isFav ? 'Remover favorito' : 'Favoritar'}
                        >
                          <Heart className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      {descricao && (
                        <p className="text-sm sm:text-[15px] text-foreground/85 leading-relaxed mb-3">
                          {descricao}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {tese && (
                          <Button
                            size="sm"
                            className="h-11 gap-1.5 px-2 w-full rounded-full text-xs sm:text-sm font-medium bg-hero-yellow hover:opacity-90"
                            onClick={() => onOpenDetalhe(item, catAberta, 'tese')}
                          >
                            <Scale className="w-4 h-4 shrink-0" />{' '}
                            <span className="truncate">Ver tese</span>
                          </Button>
                        )}
                        {ementa && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-11 gap-1.5 px-2 w-full rounded-full text-xs sm:text-sm font-medium"
                            onClick={() => onOpenDetalhe(item, catAberta, 'ementa')}
                          >
                            <FileText className="w-4 h-4 shrink-0" />{' '}
                            <span className="truncate">Ver ementa</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-11 gap-1.5 px-2 w-full rounded-full text-xs sm:text-sm font-medium border border-border/60"
                          onClick={() => {
                            const txt = [
                              item.titulo,
                              item.situacao,
                              item.numero_processo,
                              descricao,
                              tese && `TESE:\n${tese}`,
                              ementa && `EMENTA:\n${ementa}`,
                            ]
                              .filter(Boolean)
                              .join('\n\n');
                            copiarTexto(txt);
                            toast.success('Copiado');
                          }}
                        >
                          <Copy className="w-4 h-4 shrink-0" />{' '}
                          <span className="truncate">Copiar</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
