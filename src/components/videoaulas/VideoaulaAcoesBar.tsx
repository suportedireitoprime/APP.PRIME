import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import {
  Layers, AlertTriangle, Scale, ListChecks,
  BookOpenText, BookA, Lock, RefreshCw, PenTool, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AulaAcaoTipo, AulaCtxInput } from "@/hooks/useVideoaulaAcao";
import { useSubscription } from "@/hooks/useSubscription";
import { useGatedFeature } from "@/hooks/useGatedFeature";
import { haptic } from "@/lib/nativeHaptics";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";

import {
  METODOS_RESUMO,
  TIPOS_FLASH,
  SeletorOverlay,
  PainelOverlay,
} from "./acoes";

interface Props {
  input: AulaCtxInput | null;
  gridLayout?: boolean;
  extras?: React.ReactNode;
  /** Esconde o botão "Questões" da barra. */
  hideQuestoes?: boolean;
  /** Número de colunas quando gridLayout (default 4). */
  gridCols?: 3 | 4 | 5 | 6;
  /** Callback para abrir o sheet de Anotações da aula */
  onOpenAnotacoes?: () => void;
}

type SeletorTipo = "resumos" | "flash" | null;

export default function VideoaulaAcoesBar({ input, gridLayout, extras, hideQuestoes, gridCols = 4, onOpenAnotacoes }: Props) {
  const [aba, setAba] = useState<AulaAcaoTipo | null>(null);
  const [seletor, setSeletor] = useState<SeletorTipo>(null);
  const [maisOpen, setMaisOpen] = useState(false);

  const { isPremium, loading: loadingPlano } = useSubscription();
  const gate = useGatedFeature('videoaula_funcoes', 'videoaula_funcoes');
  // Funções da aula são exclusivas de assinantes (limite editável no admin).
  const bloqueado = !loadingPlano && !isPremium && gate.blocked;

  const guard = <T extends any[]>(fn: (...args: T) => void) => (...args: T) => {
    if (bloqueado) {
      gate.openGate();
      return;
    }
    fn(...args);
  };

  const RailBtn = ({
    icon: Icon, label, onClick,
  }: { icon: LucideIcon; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={guard(onClick)}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/40 min-h-[48px]",
        gridLayout ? "w-full" : "shrink-0 min-w-[64px] snap-start",
      )}
    >
      {bloqueado && (
        <span className="absolute top-0.5 right-0.5 grid place-items-center h-3.5 w-3.5 rounded-full bg-brand-amber/20 text-brand-amber">
          <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )}
      <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", bloqueado && "opacity-60")} strokeWidth={2} />
      <span className={cn("text-[10px] sm:text-[11px] font-medium leading-tight text-center line-clamp-1 truncate w-full", bloqueado && "opacity-60")}>{label}</span>
    </button>
  );

  const gridColsClass = gridCols === 3 ? "grid-cols-3" : gridCols === 5 ? "grid-cols-5" : gridCols === 6 ? "grid-cols-6" : "grid-cols-4";

  return (
    <>
      {gate.gateNode}
      {gridLayout ? (
        <div className={cn("grid gap-1 w-full", gridColsClass)}>
          {onOpenAnotacoes && <RailBtn icon={PenTool} label="Anotações" onClick={onOpenAnotacoes} />}
          <RailBtn icon={Layers} label="Flashcards" onClick={guard(() => setSeletor("flash"))} />
          <RailBtn icon={AlertTriangle} label="Pegadinhas" onClick={guard(() => setAba("pegadinhas"))} />
          <RailBtn icon={BookOpenText} label="Resumos" onClick={() => setSeletor("resumos")} />
          <RailBtn icon={Scale} label="Lei seca" onClick={guard(() => setAba("lei"))} />
          <RailBtn icon={BookA} label="Termos" onClick={guard(() => setAba("termos"))} />
          {!hideQuestoes && <RailBtn icon={ListChecks} label="Questões" onClick={guard(() => setAba("questoes"))} />}
          {extras}
        </div>
      ) : (
        <div className="relative z-10 bg-card/95 backdrop-blur shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)] w-full pb-[calc(1.5rem+var(--sai-bottom))] rounded-t-2xl border-t border-border">
          <div className="max-w-2xl mx-auto px-2 py-2">
            <div className="grid grid-cols-5 items-stretch">
              <button
                onClick={() => { haptic.selection(); setSeletor("resumos"); }}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <BookOpenText className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Resumos</span>
              </button>

              <button
                onClick={() => { haptic.selection(); if (onOpenAnotacoes) onOpenAnotacoes(); }}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <PenTool className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Anotações</span>
              </button>
              
              <button
                onClick={guard(() => { haptic.light(); setAba("questoes"); })}
                className="relative flex flex-col items-center justify-end gap-1 py-2"
              >
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden bg-card shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition-transform active:scale-[0.95] border border-border">
                  <ListChecks className="relative w-9 h-9 text-primary drop-shadow-lg" strokeWidth={1.2} />
                </span>
                <span aria-hidden className="w-8 h-8" />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center text-foreground drop-shadow-sm">Questões</span>
              </button>

              <button
                onClick={guard(() => { haptic.light(); setAba("flashcards"); })}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Flashcards</span>
              </button>

              <button
                onClick={() => { haptic.selection(); setMaisOpen(true); }}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex gap-0.5 items-center justify-center drop-shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Mais</span>
              </button>
            </div>
          </div>

          <Drawer open={maisOpen} onOpenChange={setMaisOpen}>
            <DrawerPortal>
              <DrawerOverlay className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
              <DrawerContent className="bg-card border-t border-border flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-[70] pb-[calc(1.25rem+var(--sai-bottom))] outline-none">
                <div className="p-6 space-y-4">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-4" />
                  <h3 className="text-xl font-display font-bold mb-4 text-foreground">Mais Opções</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={guard(() => { setMaisOpen(false); setTimeout(() => setAba("pegadinhas"), 200); })} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Pegadinhas</span>
                    </button>
                    <button onClick={guard(() => { setMaisOpen(false); setTimeout(() => setAba("lei"), 200); })} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Lei Seca</span>
                    </button>
                    <button onClick={guard(() => { setMaisOpen(false); setTimeout(() => setAba("termos"), 200); })} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookA className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Termos</span>
                    </button>
                  </div>
                </div>
              </DrawerContent>
            </DrawerPortal>
          </Drawer>
        </div>
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {seletor === "resumos" && (
            <SeletorOverlay
              key="sel-resumos"
              titulo="Método de resumo"
              opcoes={METODOS_RESUMO}
              onClose={() => setSeletor(null)}
              onPick={guard((id) => { setSeletor(null); setAba(id); })}
            />
          )}
          {seletor === "flash" && (
            <SeletorOverlay
              key="sel-flash"
              titulo="Tipo de flashcard"
              opcoes={TIPOS_FLASH}
              onClose={() => setSeletor(null)}
              onPick={guard((id) => { setSeletor(null); setAba(id as AulaAcaoTipo); })}
            />
          )}
          {aba && (
            <PainelOverlay
              key="painel"
              input={input}
              tipo={aba}
              onClose={() => setAba(null)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
