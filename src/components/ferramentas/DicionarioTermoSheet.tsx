import { useMemo, useEffect } from "react";
import { motion } from 'framer-motion';
import { motion } from "framer-motion";
import { Copy, Share2, BookOpenText, Scale, Sparkles, Flame, Heart } from "lucide-react";
import { toast } from "sonner";
import type { DicionarioTermo } from "@/hooks/useDicionarioJuridico";
import {
  categoriasDoTermo,
  labelCategoria,
  aplicacaoNoDireito,
  termosRelacionados,
} from "@/lib/dicionarioCategorias";
import { supabase } from "@/integrations/supabase/client";
import { limparMarkdown, RichTexto } from "@/lib/dicionarioTexto";
import { copiarTexto } from '@/lib/nativo/copiar';

interface Props {
  termo: DicionarioTermo | null;
  todos: DicionarioTermo[];
  onClose: () => void;
  onSelectRelated: (t: DicionarioTermo) => void;
  emAltaClicks?: number;
  favorito?: boolean;
  onToggleFavorito?: () => void;
}

export default function DicionarioTermoSheet({ termo, todos, onClose, onSelectRelated, emAltaClicks, favorito, onToggleFavorito }: Props) {
  const open = !!termo;

  useEffect(() => {
    if (!termo) return;
    supabase.rpc("increment_dicionario_click", { p_palavra: termo.palavra }).then(() => {});
  }, [termo?.palavra]);

  const cats = useMemo(() => (termo ? categoriasDoTermo(termo) : []), [termo]);
  const relacionados = useMemo(
    () => (termo ? termosRelacionados(termo, todos) : []),
    [termo, todos]
  );
  const aplicacao = useMemo(() => (termo ? aplicacaoNoDireito(termo) : ""), [termo]);

  const copy = async () => {
    if (!termo) return;
    try {
      await copiarTexto(`${termo.palavra}\n\n${limparMarkdown(termo.significado)}`);
      toast.success("Copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const share = async () => {
    if (!termo) return;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({
          title: termo.palavra,
          text: `${termo.palavra} — ${limparMarkdown(termo.significado)}`,
        });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="theme-vademecum-accent h-[92dvh] rounded-t-3xl p-0 border-border/60 bg-background flex flex-col"
      >
        {termo && (
          <>
            {/* Grabber */}
            <div className="pt-2.5 pb-1 flex flex-col items-center relative shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2 pb-4 border-b border-border/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                    <span className="font-display text-xl font-bold text-primary">
                      {termo.letra || termo.palavra.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-2xl font-bold text-foreground leading-tight break-words">
                      {termo.palavra}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cats.length === 0 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/70 text-muted-foreground">
                          Vocabulário geral
                        </span>
                      )}
                      {cats.map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {labelCategoria(c)}
                        </span>
                      ))}
                      {typeof emAltaClicks === "number" && emAltaClicks > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          <Flame className="w-3 h-3" /> {emAltaClicks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={onToggleFavorito}
                    aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    aria-pressed={favorito}
                    className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-medium transition-colors ${favorito ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary/60 hover:bg-secondary"}`}
                  >
                    <Heart className={`w-4 h-4 ${favorito ? "fill-primary" : ""}`} /> Favoritar
                  </button>
                  <button
                    onClick={copy}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary/60 hover:bg-secondary text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                  <button
                    onClick={share}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary/60 hover:bg-secondary text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
              </motion.div>

              {/* Definição */}
              <Section icon={<BookOpenText className="w-4 h-4" />} title="Definição">
                <p className="text-base text-foreground/90 leading-[1.7] whitespace-pre-line">
                  <RichTexto texto={termo.significado} />
                </p>
              </Section>

              {termo.exemplo_pratico && (
                <Section icon={<Sparkles className="w-4 h-4" />} title="Exemplo prático">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                    <p className="text-base text-foreground/85 italic leading-[1.7] whitespace-pre-line">
                      <RichTexto texto={termo.exemplo_pratico} />
                    </p>
                  </div>
                </Section>
              )}

              <Section icon={<Scale className="w-4 h-4" />} title="Aplicação no Direito">
                <p className="text-base text-foreground/80 leading-[1.7]">{limparMarkdown(aplicacao)}</p>
              </Section>

              {relacionados.length > 0 && (
                <Section title="Termos relacionados">
                  <div className="grid grid-cols-2 gap-2">
                    {relacionados.map((r) => (
                      <button
                        key={`${r.letra}-${r.palavra}`}
                        onClick={() => onSelectRelated(r)}
                        className="text-left p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors"
                      >
                        <p className="text-[15px] font-semibold text-primary truncate">{r.palavra}</p>
                        <p className="text-[13px] leading-snug text-muted-foreground line-clamp-2 mt-1">
                          {limparMarkdown(r.significado)}
                        </p>
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

