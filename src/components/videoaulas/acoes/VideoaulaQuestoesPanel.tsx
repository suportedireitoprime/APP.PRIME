import { useState } from "react";
import { CheckCircle2, Sparkles, Scale, AlertTriangle, BookA } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";
import { ReportarErroQuestaoModal } from "../ReportarErroQuestaoModal";
import type { QuestaoIA } from "./videoaulaAcoesTypes";

export function QuestaoItem({ q, index, total }: { q: QuestaoIA; index: number; total: number }) {
  const [resposta, setResposta] = useState<string | null>(null);
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const [verComentario, setVerComentario] = useState(false);
  const [reportarModalOpen, setReportarModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const gab = (q.gabarito || "").trim().toUpperCase();
  const alternativas: Array<[string, string | undefined]> = [
    ["A", q.a], ["B", q.b], ["C", q.c], ["D", q.d],
  ];

  const acertou = mostrarGabarito && resposta === gab;

  return (
    <div id={`questao-${index}`} className="space-y-4 relative pb-16 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
          Questão {index} de {total}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{q.enunciado}</p>
      </div>

      <div className="space-y-2">
        {alternativas.map(([letra, texto]) => {
          if (!texto) return null;
          const selecionada = resposta === letra;
          const isCorreta = mostrarGabarito && letra === gab;
          const isErrada = mostrarGabarito && selecionada && letra !== gab;
          return (
            <button
              key={letra}
              onClick={() => !mostrarGabarito && setResposta(letra)}
              disabled={mostrarGabarito}
              className={cn(
                "w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-colors",
                isCorreta && "border-emerald-500/50 bg-emerald-500/10",
                isErrada && "border-red-500/50 bg-red-500/10",
                !mostrarGabarito && selecionada && "border-primary bg-primary/10",
                !mostrarGabarito && !selecionada && "border-border bg-background hover:border-primary/40",
                mostrarGabarito && !isCorreta && !isErrada && "border-border bg-background opacity-70",
              )}
            >
              <span className={cn(
                "h-7 w-7 shrink-0 rounded-full grid place-items-center text-xs font-bold",
                isCorreta ? "bg-emerald-500 text-white" :
                isErrada ? "bg-red-500 text-white" :
                selecionada ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {letra}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90 flex-1">{texto}</span>
            </button>
          );
        })}
      </div>

      {!mostrarGabarito && resposta && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-20 pb-[calc(1rem+var(--sai-bottom))] pointer-events-none">
          <div className="w-full sm:max-w-lg mx-auto pointer-events-auto">
            <button
              onClick={() => {
                setMostrarGabarito(true);
                setDrawerOpen(true);
              }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Responder
            </button>
          </div>
        </div>
      )}

      {mostrarGabarito && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerPortal>
            <DrawerOverlay className="bg-black/40 backdrop-blur-sm" />
            <DrawerContent className="bg-background max-h-[85vh] flex flex-col rounded-t-3xl pb-safe">
              <div className="px-5 pt-3 pb-6 flex-1 overflow-y-auto">
                <div className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center justify-center gap-2 shadow-sm mb-6",
                  acertou ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" : "border-red-500/40 bg-red-500/10 text-red-500",
                )}>
                  <CheckCircle2 className="h-8 w-8 shrink-0" />
                  <p className="text-lg font-bold text-center">
                    {acertou ? "Resposta correta!" : `Resposta incorreta`}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setVerComentario(!verComentario)}
                    className="w-full h-14 flex items-center justify-start px-5 gap-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 text-foreground font-semibold text-[15px] transition-colors"
                  >
                    <Sparkles className="h-5 w-5 text-primary" /> Comentários
                  </button>

                  {verComentario && q.comentario && (
                    <div className="rounded-2xl border border-border bg-background p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-primary font-bold mb-3 inline-flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Comentário do Professor
                      </p>
                      <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line font-medium">{q.comentario}</p>
                    </div>
                  )}

                  <button className="w-full h-14 flex items-center justify-start px-5 gap-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 text-foreground font-semibold text-[15px] transition-colors">
                    <Scale className="h-5 w-5 text-primary" /> Lei Seca
                  </button>
                  <button className="w-full h-14 flex items-center justify-start px-5 gap-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 text-foreground font-semibold text-[15px] transition-colors">
                    <AlertTriangle className="h-5 w-5 text-primary" /> Pegadinhas
                  </button>
                  <button className="w-full h-14 flex items-center justify-start px-5 gap-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 text-foreground font-semibold text-[15px] transition-colors">
                    <BookA className="h-5 w-5 text-primary" /> Termos
                  </button>
                  
                  <button
                    onClick={() => setReportarModalOpen(true)}
                    className="w-full h-14 flex items-center justify-start px-5 gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-semibold text-[15px] transition-colors mt-2"
                  >
                    <AlertTriangle className="h-5 w-5" /> Reportar erro na questão
                  </button>

                  {index < total && (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        setTimeout(() => {
                          document.getElementById(`questao-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 300);
                      }}
                      className="w-full h-14 mt-4 rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold shadow-xl transition-all active:scale-[0.98]"
                    >
                      Próxima Questão
                    </button>
                  )}
                </div>
              </div>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      )}

      {mostrarGabarito && index < total && !drawerOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pb-[calc(1rem+var(--sai-bottom))] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-full sm:max-w-lg mx-auto pointer-events-auto flex flex-col gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full h-12 rounded-xl border border-border bg-secondary/80 text-foreground hover:bg-secondary text-sm font-semibold shadow-lg transition-all active:scale-[0.98] backdrop-blur"
            >
              Ver opções / resultado
            </button>
            <button
              onClick={() => {
                document.getElementById(`questao-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition-all active:scale-[0.98]"
            >
              Próxima Questão
            </button>
          </div>
        </div>
      )}

      {/* Render the modal outside the drawer to avoid z-index/portal issues if they open simultaneously */}
      <ReportarErroQuestaoModal
        isOpen={reportarModalOpen}
        onClose={() => setReportarModalOpen(false)}
        questao={q}
      />
    </div>
  );
}

export function QuestoesPanel({ questoes }: { questoes: QuestaoIA[] }) {
  if (!questoes.length) return <p className="text-sm text-muted-foreground">Sem questões.</p>;
  
  return (
    <div className="space-y-12 pb-16">
      {questoes.map((q, i) => (
        <QuestaoItem key={i} q={q} index={i + 1} total={questoes.length} />
      ))}
    </div>
  );
}
