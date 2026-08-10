import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Layers, AlertTriangle, Workflow, NotebookPen, Scale, ListChecks,
  X, Loader2, Sparkles, ChevronLeft, ChevronRight, CheckCircle2,
  FileText, Lightbulb, ListTree, Bookmark, Table as TableIcon, BookOpenText,
  Brackets, KeyRound, BookA, Lock, RefreshCw, PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoaulaAcao, type AulaAcaoTipo, type AulaCtxInput } from "@/hooks/useVideoaulaAcao";
import { useSubscription } from "@/hooks/useSubscription";
import { useGatedFeature } from "@/hooks/useGatedFeature";
import { toast } from "sonner";
import FlashcardEleganteViewer from "@/components/flashcards/FlashcardEleganteViewer";
import { ReportarErroQuestaoModal } from "./ReportarErroQuestaoModal";
import { haptic } from "@/lib/nativeHaptics";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";


const TITULOS: Record<AulaAcaoTipo, string> = {
  flashcards: "Flashcards",
  lacunas: "Flashcards — Lacunas",
  conceito: "Flashcards — Conceitos",
  pegadinhas: "Pegadinhas",
  mapa: "Mapa mental",
  cornell: "Resumo Cornell",
  feynman: "Resumo Feynman",
  topicos: "Resumo por tópicos",
  tradicional: "Resumo tradicional",
  fichamento: "Fichamento",
  comparativa: "Tabela comparativa",
  lei: "Lei seca",
  questoes: "Questões",
  termos: "Termos da aula",
};

type MetodoResumo = {
  id: Extract<AulaAcaoTipo, "cornell" | "feynman" | "mapa" | "topicos" | "tradicional" | "fichamento" | "comparativa">;
  label: string;
  desc: string;
  icon: any;
};

const METODOS_RESUMO: MetodoResumo[] = [
  { id: "cornell", label: "Cornell", desc: "Notas + perguntas-chave + síntese", icon: NotebookPen },
  { id: "feynman", label: "Feynman", desc: "Explica como se fosse um leigo", icon: Lightbulb },
  { id: "mapa", label: "Mapa Mental", desc: "Hierarquia visual de conceitos", icon: Workflow },
  { id: "topicos", label: "Por tópicos", desc: "Estrutura em tópicos organizados", icon: ListTree },
  { id: "tradicional", label: "Resumo tradicional", desc: "Texto corrido e fluido", icon: FileText },
  { id: "fichamento", label: "Fichamento", desc: "Referências, citações e análise", icon: Bookmark },
  { id: "comparativa", label: "Tabela comparativa", desc: "Elementos lado a lado", icon: TableIcon },
];

type TipoFlash = Extract<AulaAcaoTipo, "flashcards" | "lacunas" | "conceito">;
const TIPOS_FLASH: Array<{ id: TipoFlash; label: string; desc: string; icon: any }> = [
  { id: "flashcards", label: "Tradicional", desc: "Pergunta → resposta", icon: Layers },
  { id: "lacunas", label: "Lacunas", desc: "Frase com palavra-chave oculta", icon: Brackets },
  { id: "conceito", label: "Conceito-chave", desc: "Termo → definição curta", icon: KeyRound },
];

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

  const navigate = useNavigate();
  const { isPremium, loading: loadingPlano } = useSubscription();
  const gate = useGatedFeature('videoaula_funcoes', 'videoaula_funcoes');
  // Funções da aula são exclusivas de assinantes (limite editável no admin).
  const bloqueado = !loadingPlano && !isPremium && gate.blocked;

  const guard = (fn: () => void) => () => {
    if (bloqueado) {
      gate.openGate();
      return;
    }
    fn();
  };


  const RailBtn = ({
    icon: Icon, label, onClick,
  }: { icon: any; label: string; onClick: () => void }) => (
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
          <RailBtn icon={Layers} label="Flashcards" onClick={() => setSeletor("flash")} />
          <RailBtn icon={AlertTriangle} label="Pegadinhas" onClick={() => setAba("pegadinhas")} />
          <RailBtn icon={BookOpenText} label="Resumos" onClick={() => setSeletor("resumos")} />
          <RailBtn icon={Scale} label="Lei seca" onClick={() => setAba("lei")} />
          <RailBtn icon={BookA} label="Termos" onClick={() => setAba("termos")} />
          {!hideQuestoes && <RailBtn icon={ListChecks} label="Questões" onClick={() => setAba("questoes")} />}
          {extras}
        </div>
      ) : (
        <div className="relative z-10 bg-card/95 backdrop-blur shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)] w-[calc(100%+16px)] -mx-2 -my-2 -mb-[calc(12px+var(--sai-bottom,0px))] pb-[calc(12px+var(--sai-bottom,0px))] rounded-t-2xl border-t border-border">
          <div className="max-w-2xl mx-auto px-2 py-2">
            <div className="grid grid-cols-5 items-stretch">
              <button
                onClick={guard(() => { haptic.selection(); setSeletor("resumos"); })}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <BookOpenText className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Resumos</span>
              </button>

              <button
                onClick={guard(() => { haptic.selection(); if (onOpenAnotacoes) onOpenAnotacoes(); })}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <PenTool className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Anotações</span>
              </button>
              
              <button
                onClick={guard(() => { haptic.light(); setAba("questoes"); })}
                className="relative flex flex-col items-center justify-end gap-1 py-2"
              >
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden bg-card shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition-transform active:scale-95 border border-border">
                  <ListChecks className="relative w-9 h-9 text-primary drop-shadow-lg" strokeWidth={1.2} />
                </span>
                <span aria-hidden className="w-8 h-8" />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center text-foreground drop-shadow-sm">Questões</span>
              </button>

              <button
                onClick={guard(() => { haptic.selection(); setSeletor("flash"); })}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:bg-muted/50"
              >
                <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" strokeWidth={1.2} />
                <span className="font-body text-[10px] sm:text-[12px] font-medium leading-tight text-center drop-shadow-sm">Flashcards</span>
              </button>

              <button
                onClick={guard(() => { haptic.selection(); setMaisOpen(true); })}
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
              <DrawerContent className="bg-card border-t border-border flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-[70] pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] outline-none">
                <div className="p-6 space-y-4">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-4" />
                  <h3 className="text-xl font-display font-bold mb-4 text-foreground">Mais Opções</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => { setMaisOpen(false); setTimeout(() => setAba("pegadinhas"), 200); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Pegadinhas</span>
                    </button>
                    <button onClick={() => { setMaisOpen(false); setTimeout(() => setAba("lei"), 200); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Lei Seca</span>
                    </button>
                    <button onClick={() => { setMaisOpen(false); setTimeout(() => setAba("termos"), 200); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
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
              onPick={(id) => { setSeletor(null); setAba(id); }}
            />
          )}
          {seletor === "flash" && (
            <SeletorOverlay
              key="sel-flash"
              titulo="Tipo de flashcard"
              opcoes={TIPOS_FLASH}
              onClose={() => setSeletor(null)}
              onPick={(id) => { setSeletor(null); setAba(id as AulaAcaoTipo); }}
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

function SeletorOverlay<T extends string>({
  titulo, opcoes, onClose, onPick,
}: {
  titulo: string;
  opcoes: Array<{ id: T; label: string; desc: string; icon: any }>;
  onClose: () => void;
  onPick: (id: T) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> {titulo}
          </p>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {opcoes.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onPick(opt.id)}
                className="text-left rounded-2xl border border-border bg-background hover:border-primary/50 hover:bg-muted/40 transition-colors p-3.5 flex items-center gap-3"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PainelOverlay({ input, tipo, onClose }: { input: AulaCtxInput | null; tipo: AulaAcaoTipo; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useVideoaulaAcao(input, tipo, true);
  const [showLoading, setShowLoading] = useState(false);

  // Atraso de 500ms para mostrar o loader (evita piscar se o cache for muito rápido)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timeout = setTimeout(() => setShowLoading(true), 500);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative overflow-y-auto border-border bg-card shadow-2xl",
          tipo === "questoes"
            ? "w-full h-full max-h-screen rounded-none pb-12 sm:pb-12"
            : "w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] sm:pb-0"
        )}
      >
        {tipo === "questoes" ? (
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-card/95 backdrop-blur border-b border-border">
            <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <p className="text-sm uppercase tracking-[0.1em] text-red-400 font-bold flex-1 text-center pr-10">
              {TITULOS[tipo]}
            </p>
          </div>
        ) : (
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-semibold inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> {TITULOS[tipo]}
            </p>
            <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4 md:p-5">
          {showLoading && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Gerando {TITULOS[tipo].toLowerCase()} com base na aula…
              </p>
            </div>
          )}
          {error && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-destructive">Não foi possível gerar o conteúdo.</p>
              <button onClick={() => refetch()} className="text-xs underline text-primary">
                Tentar de novo
              </button>
            </div>
          )}
          {data && !isLoading && !error && <PainelConteudo tipo={tipo} data={data} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PainelConteudo({ tipo, data }: { tipo: AulaAcaoTipo; data: any }) {
  if (tipo === "flashcards" || tipo === "lacunas" || tipo === "conceito")
    return <FlashcardsPanel cards={data.cards ?? []} />;
  if (tipo === "pegadinhas") return <PegadinhasPanel itens={data.pegadinhas ?? []} />;
  if (tipo === "mapa") return <MapaMentalPanel raiz={data.raiz ?? ""} ramos={data.ramos ?? []} />;
  if (tipo === "cornell") return <CornellPanel data={data} />;
  if (tipo === "feynman") return <FeynmanPanel data={data} />;
  if (tipo === "topicos") return <TopicosPanel data={data} />;
  if (tipo === "tradicional") return <TradicionalPanel data={data} />;
  if (tipo === "fichamento") return <FichamentoPanel data={data} />;
  if (tipo === "comparativa") return <ComparativaPanel data={data} />;
  if (tipo === "lei") return <LeiSecaPanel leis={data.leis ?? []} />;
  if (tipo === "questoes") return <QuestoesPanel questoes={data.questoes ?? []} />;
  if (tipo === "termos") return <TermosPanel termos={data.termos ?? []} />;
  return null;
}

function FeynmanPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.explicacao_simples && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2 inline-flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" /> Explicação simples
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{data.explicacao_simples}</p>
        </div>
      )}
      {data.analogia && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-1.5">Analogia</p>
          <p className="text-sm italic leading-relaxed text-foreground/90">{data.analogia}</p>
        </div>
      )}
      {Array.isArray(data.pontos_dificeis) && data.pontos_dificeis.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pontos difíceis</p>
          {data.pontos_dificeis.map((p: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-semibold mb-1">{p.conceito}</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{p.explicacao_facil}</p>
            </div>
          ))}
        </div>
      )}
      {data.resumo_uma_frase && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">Em uma frase</p>
          <p className="text-sm font-medium leading-relaxed">{data.resumo_uma_frase}</p>
        </div>
      )}
    </div>
  );
}

function TopicosPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {(data.topicos ?? []).map((t: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="bg-primary/10 px-3 py-2 border-b border-border">
            <p className="text-sm font-bold inline-flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] grid place-items-center font-bold">{i + 1}</span>
              {t.titulo}
            </p>
          </div>
          <div className="p-3 space-y-2">
            {(t.subtopicos ?? []).map((s: any, j: number) => (
              <div key={j} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm font-semibold">{s.titulo}</p>
                <p className="text-sm text-foreground/85 leading-relaxed mt-0.5">{s.conteudo}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TradicionalPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.introducao && (
        <p className="text-sm leading-relaxed text-foreground/90 italic whitespace-pre-line">{data.introducao}</p>
      )}
      {data.desenvolvimento && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.desenvolvimento}</p>
        </div>
      )}
      {data.conclusao && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">Conclusão</p>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{data.conclusao}</p>
        </div>
      )}
    </div>
  );
}

function FichamentoPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.referencia_principal && (
        <p className="text-xs text-muted-foreground italic">Referência: {data.referencia_principal}</p>
      )}
      {Array.isArray(data.citacoes) && data.citacoes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Citações</p>
          {data.citacoes.map((c: any, i: number) => (
            <div key={i} className="rounded-xl border-l-4 border-primary bg-muted/30 p-3">
              <p className="text-sm italic leading-relaxed text-foreground/90">"{c.trecho}"</p>
              {c.fonte && <p className="text-[11px] text-muted-foreground mt-1.5">— {c.fonte}</p>}
            </div>
          ))}
        </div>
      )}
      {data.analise && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Análise</p>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{data.analise}</p>
        </div>
      )}
      {Array.isArray(data.conceitos_chave) && data.conceitos_chave.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.conceitos_chave.map((k: string, i: number) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ComparativaPanel({ data }: { data: any }) {
  const criterios: string[] = data.criterios ?? [];
  const itens: Array<{ nome: string; valores: string[] }> = data.itens ?? [];
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2.5 font-semibold border-b border-border">Critério</th>
              {itens.map((it, i) => (
                <th key={i} className="text-left p-2.5 font-semibold border-b border-border min-w-[120px]">{it.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criterios.map((c, ci) => (
              <tr key={ci} className="border-b border-border last:border-0">
                <td className="p-2.5 font-medium text-foreground/90 bg-muted/20">{c}</td>
                {itens.map((it, ii) => (
                  <td key={ii} className="p-2.5 align-top text-foreground/85">{it.valores?.[ci] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function FlashcardsPanel({
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

function PegadinhasPanel({ itens }: { itens: Array<{ titulo: string; descricao: string; exemplo?: string }> }) {
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

function MapaMentalPanel({ raiz, ramos }: { raiz: string; ramos: Array<{ titulo: string; itens: string[]; exemplo?: string }> }) {
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

function CornellPanel({ data }: { data: { palavras_chave?: string[]; notas?: string; sintese?: string } }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Palavras-chave</p>
          <ul className="space-y-1.5">
            {(data.palavras_chave ?? []).map((p, i) => (
              <li key={i} className="text-xs font-medium text-foreground/90">{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Notas</p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{data.notas}</p>
        </div>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Síntese</p>
        <p className="text-sm leading-relaxed text-foreground">{data.sintese}</p>
      </div>
    </div>
  );
}

type LeiCitada = {
  lei?: string;
  codigo?: string;
  artigo?: string;
  texto?: string;
  trecho_relevante?: string;
};

function LeiSecaPanel({ leis }: { leis: LeiCitada[] }) {
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

type QuestaoIA = {
  enunciado: string;
  a?: string; b?: string; c?: string; d?: string;
  gabarito?: string;
  comentario?: string;
};

function QuestaoItem({ q, index, total }: { q: QuestaoIA; index: number; total: number }) {
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-20 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pointer-events-none">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
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

function QuestoesPanel({ questoes }: { questoes: QuestaoIA[] }) {
  if (!questoes.length) return <p className="text-sm text-muted-foreground">Sem questões.</p>;
  
  return (
    <div className="space-y-12 pb-16">
      {questoes.map((q, i) => (
        <QuestaoItem key={i} q={q} index={i + 1} total={questoes.length} />
      ))}
    </div>
  );
}

function TermosPanel({ termos }: { termos: Array<{ termo: string; definicao: string; exemplo?: string }> }) {
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