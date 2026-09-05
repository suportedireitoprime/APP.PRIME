import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Brain, ExternalLink, Download, Loader2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { copiarTexto } from '@/lib/nativo/copiar';
import { gerarJurisprudenciaPDF } from '@/lib/jurisPdf';
import {
  JurisCategoria,
  JurisItem,
  prettyLeiName,
  tribunalClasses,
} from './jurisprudenciaConstants';

interface DetalheState {
  item: JurisItem;
  cat: JurisCategoria;
  mode?: 'tese' | 'ementa' | 'ambos';
}

interface JurisprudenciaDetalheSheetProps {
  detalhe: DetalheState | null;
  onClose: () => void;
  leiInfo: { corpus_lei_id: number; nome_exibicao: string } | null;
  numeroLabel: string;
  explicacao: string | null;
  setExplicacao: (exp: string | null) => void;
  explicandoLoading: boolean;
  setExplicandoLoading: (loading: boolean) => void;
}

export const JurisprudenciaDetalheSheet: React.FC<JurisprudenciaDetalheSheetProps> = ({
  detalhe,
  onClose,
  leiInfo,
  numeroLabel,
  explicacao,
  setExplicacao,
  explicandoLoading,
  setExplicandoLoading,
}) => {
  if (!detalhe) return null;

  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const mode = detalhe.mode || 'ambos';
  const teseStr =
    detalhe.item.tese ||
    (detalhe.item.teses && detalhe.item.teses[0]) ||
    '';
  const ementaStr = detalhe.item.ementa || detalhe.item.conteudo || '';
  const descricao =
    detalhe.item.descricao ||
    (detalhe.item.teses && detalhe.item.teses.length > 1 ? detalhe.item.teses[1] : '') ||
    '';
  const showTese = (mode === 'tese' || mode === 'ambos') && !!teseStr;
  const showEmenta =
    (mode === 'ementa' || mode === 'ambos') &&
    !!ementaStr &&
    norm(ementaStr).toLowerCase() !== norm(teseStr).toLowerCase();
  const sheetLabel =
    mode === 'tese' ? 'Tese' : mode === 'ementa' ? 'Ementa' : 'Inteiro teor';

  return (
    <Sheet
      open={!!detalhe}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setExplicacao(null);
          setExplicandoLoading(false);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 rounded-t-3xl flex flex-col overflow-hidden [&>button.absolute]:hidden"
      >
        <SheetHeader className="px-5 sm:px-6 pt-4 pb-4 border-b border-border/60 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center h-6 px-2 rounded-md border text-xs font-semibold ${tribunalClasses(
                    detalhe.cat.tribunal
                  )}`}
                >
                  {detalhe.cat.tribunal}
                </span>
                <Badge variant="secondary" className="text-xs font-medium h-6 px-2">
                  {detalhe.cat.label}
                </Badge>
                {detalhe.item.situacao && (
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {detalhe.item.situacao}
                  </span>
                )}
              </div>
              <SheetTitle className="text-xl sm:text-2xl font-heading mt-3 leading-tight tracking-tight">
                {detalhe.item.titulo ? `${detalhe.item.titulo} — ${sheetLabel}` : sheetLabel}
              </SheetTitle>
              {descricao && (
                <p className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed mt-2">
                  {descricao}
                </p>
              )}
              {detalhe.item.numero_processo && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-mono">
                  {detalhe.item.numero_processo}
                </div>
              )}
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
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-6 lg:max-w-3xl lg:px-10">
            {showTese && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Tese
                  </h3>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <p className="text-[15px] leading-[1.65] text-foreground/90 whitespace-pre-line">
                    {teseStr}
                  </p>
                </div>
              </section>
            )}

            {showEmenta && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Ementa
                  </h3>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <p className="text-[15px] leading-[1.65] text-foreground/90 whitespace-pre-line">
                  {ementaStr}
                </p>
              </section>
            )}

            {!showTese && !showEmenta && (
              <div className="text-sm text-muted-foreground text-center py-12">
                Sem conteúdo detalhado disponível.
              </div>
            )}

            {(explicandoLoading || explicacao) && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-500" />
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600 dark:text-amber-400">
                    Explicação da IA
                  </h3>
                  <div className="h-px flex-1 bg-amber-500/30" />
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  {explicandoLoading && !explicacao ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> A IA está preparando a explicação…
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90">
                      <ReactMarkdown>{explicacao || ''}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 p-3 flex flex-wrap gap-2 bg-background/95 backdrop-blur">
          {detalhe.item.url_origem && (
            <a
              href={detalhe.item.url_origem}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[120px]"
            >
              <Button variant="outline" className="w-full h-11 gap-1.5">
                <ExternalLink className="w-4 h-4" /> Abrir no site
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="flex-1 min-w-[120px] h-11 gap-1.5"
            onClick={async () => {
              try {
                toast.loading('Gerando PDF...', { id: 'juris-pdf' });
                await gerarJurisprudenciaPDF({
                  tribunal: detalhe.cat.tribunal,
                  categoria: detalhe.cat.label,
                  situacao: detalhe.item.situacao,
                  titulo: detalhe.item.titulo || sheetLabel,
                  descricao,
                  numeroProcesso: detalhe.item.numero_processo,
                  tese: showTese ? teseStr : undefined,
                  ementa: showEmenta ? ementaStr : undefined,
                  urlOrigem: detalhe.item.url_origem,
                  leiLabel: leiInfo
                    ? `${prettyLeiName(leiInfo.nome_exibicao)} — ${numeroLabel}`
                    : undefined,
                  modo: mode,
                });
                toast.success('PDF baixado', { id: 'juris-pdf' });
              } catch (e) {
                console.error(e);
                toast.error('Falha ao gerar PDF', { id: 'juris-pdf' });
              }
            }}
          >
            <Download className="w-4 h-4" /> Baixar PDF
          </Button>
          <Button
            className="flex-1 min-w-[120px] h-11 gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500"
            disabled={explicandoLoading}
            onClick={async () => {
              try {
                setExplicandoLoading(true);
                setExplicacao(null);
                const { data, error } = await supabase.functions.invoke(
                  'jurisprudencia-explicar',
                  {
                    body: {
                      titulo: detalhe.item.titulo,
                      categoria: detalhe.cat.label,
                      tribunal: detalhe.cat.tribunal,
                      numero_processo: detalhe.item.numero_processo,
                      situacao: detalhe.item.situacao,
                      tese: showTese ? teseStr : undefined,
                      ementa: showEmenta ? ementaStr : undefined,
                      descricao,
                      lei: leiInfo ? prettyLeiName(leiInfo.nome_exibicao) : undefined,
                      artigo: numeroLabel,
                    },
                  }
                );
                if (error) throw error;
                if ((data as any)?.error) throw new Error((data as any).error);
                setExplicacao((data as any)?.explicacao || 'Sem explicação disponível.');
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || 'Falha ao gerar explicação');
                setExplicacao(null);
              } finally {
                setExplicandoLoading(false);
              }
            }}
          >
            {explicandoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            Explicar
          </Button>
          <Button
            variant="secondary"
            className="flex-1 min-w-[120px] h-11 gap-1.5"
            onClick={() => {
              const txt = [
                detalhe.item.titulo,
                detalhe.item.situacao,
                detalhe.item.numero_processo,
                descricao,
                showTese && teseStr ? `TESE:\n${teseStr}` : '',
                showEmenta && ementaStr ? `EMENTA:\n${ementaStr}` : '',
              ]
                .filter(Boolean)
                .join('\n\n');
              copiarTexto(txt);
              toast.success('Copiado');
            }}
          >
            <Copy className="w-4 h-4" /> Copiar tudo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
