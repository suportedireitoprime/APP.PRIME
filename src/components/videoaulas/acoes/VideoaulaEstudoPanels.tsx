import { AlertTriangle, Workflow, Sparkles, Scale } from "lucide-react";
import FlashcardEleganteViewer from "@/components/flashcards/FlashcardEleganteViewer";
import type { LeiCitada } from "./videoaulaAcoesTypes";

export function FlashcardsPanel({
  cards,
}: {
  cards: Array<{ frente: string; verso: string }>;
}) {
  if (!cards.length) return <p className="text-sm text-muted-foreground">Sem flashcards.</p>;
  const mapped = cards.map((c) => ({
    pergunta: c.frente,
    resposta: c.verso,
    explicacao: null,
    exemplo: null,
    dica: null,
    tema: null,
  }));
  return <FlashcardEleganteViewer cards={mapped} />;
}

export function PegadinhasPanel({ itens }: { itens: Array<{ titulo: string; descricao: string; exemplo?: string }> }) {
  if (!itens.length) return <p className="text-sm text-muted-foreground">Sem pegadinhas.</p>;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Atenção da banca
        </p>
      </div>
      {itens.map((p, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-amber-500/15 text-amber-500 grid place-items-center font-semibold text-sm tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-snug mb-1">{p.titulo}</h4>
              <p className="text-sm text-foreground/85 leading-relaxed">{p.descricao}</p>
              {p.exemplo && (
                <div className="mt-2.5 rounded-lg bg-muted/50 border-l-2 border-amber-500 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-0.5">Exemplo</p>
                  <p className="text-sm italic text-foreground/80 leading-relaxed">{p.exemplo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapaMentalPanel({ raiz, ramos }: { raiz: string; ramos: Array<{ titulo: string; itens: string[]; exemplo?: string }> }) {
  if (!ramos.length) return <p className="text-sm text-muted-foreground">Sem mapa mental.</p>;
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-red-400/50 bg-red-400/10 px-4 py-2.5 shadow-lg shadow-red-400/15">
          <Workflow className="h-4 w-4 text-red-400" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-red-400 font-semibold leading-none mb-1">Tema</p>
            <p className="font-display text-sm md:text-base font-bold leading-tight">{raiz}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ramos.map((r, i) => (
          <div key={i} className="rounded-xl border border-red-400/30 bg-card overflow-hidden">
            <div className="bg-red-400/10 px-3 py-2 border-b border-red-400/20">
              <p className="font-semibold text-sm">{r.titulo}</p>
            </div>
            <ul className="p-3 space-y-1.5">
              {(r.itens ?? []).map((it, j) => (
                <li key={j} className="text-sm text-foreground/85 leading-snug flex gap-2">
                  <span className="text-red-400">•</span><span>{it}</span>
                </li>
              ))}
            </ul>
            {r.exemplo && (
              <div className="mx-3 mb-3 rounded-lg bg-amber-500/10 border-l-2 border-amber-500/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-0.5 inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Exemplo
                </p>
                <p className="text-xs italic text-foreground/85 leading-relaxed">{r.exemplo}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeiSecaPanel({ leis }: { leis: LeiCitada[] }) {
  if (!leis.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum dispositivo identificado.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold inline-flex items-center gap-1.5">
        <Scale className="h-3 w-3" /> Dispositivos da aula
      </p>
      {leis.map((item, i) => {
        const sigla = (item.codigo || "LEI").toUpperCase();
        return (
          <div key={i} className="rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-start gap-3 mb-2">
              <span className="shrink-0 h-9 px-2.5 min-w-[44px] grid place-items-center rounded-lg bg-primary/15 text-primary text-[11px] font-bold tracking-wider">
                {sigla}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">Art. {item.artigo}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.lei || ""}</p>
              </div>
            </div>
            {item.texto && (
              <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-line">
                {item.trecho_relevante && item.texto.includes(item.trecho_relevante) ? (
                  item.texto.split(item.trecho_relevante).flatMap((part, idx, arr) =>
                    idx < arr.length - 1
                      ? [<span key={`p${idx}`}>{part}</span>, <mark key={`m${idx}`} className="bg-amber-500/30 text-amber-100 rounded px-1 py-0.5 font-medium">{item.trecho_relevante}</mark>]
                      : [<span key={`p${idx}`}>{part}</span>]
                  )
                ) : (
                  item.texto
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TermosPanel({ termos }: { termos: Array<{ termo: string; definicao: string; exemplo?: string }> }) {
  if (!termos.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum termo identificado nesta aula.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold inline-flex items-center gap-1.5">
        <Sparkles className="h-3 w-3" /> Glossário da aula
      </p>
      {termos.map((t, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-3.5">
          <div className="flex items-start gap-3">
            <span className="shrink-0 h-8 w-8 grid place-items-center rounded-lg bg-primary/15 text-primary text-[12px] font-bold tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{t.termo}</p>
              <p className="text-sm text-foreground/85 leading-relaxed mt-1">{t.definicao}</p>
              {t.exemplo && (
                <div className="mt-2 rounded-lg bg-muted/40 border-l-2 border-primary/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">Exemplo</p>
                  <p className="text-xs italic text-foreground/80 leading-relaxed">{t.exemplo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
