import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoaulaAcao, type AulaAcaoTipo, type AulaCtxInput } from "@/hooks/useVideoaulaAcao";
import { TITULOS } from "./videoaulaAcoesTypes";
import {
  FeynmanPanel,
  TopicosPanel,
  TradicionalPanel,
  FichamentoPanel,
  ComparativaPanel,
  CornellPanel,
} from "./VideoaulaResumosPanels";
import {
  FlashcardsPanel,
  PegadinhasPanel,
  MapaMentalPanel,
  LeiSecaPanel,
  TermosPanel,
} from "./VideoaulaEstudoPanels";
import { QuestoesPanel } from "./VideoaulaQuestoesPanel";

export function PainelConteudo({ tipo, data }: { tipo: AulaAcaoTipo; data: any }) {
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

interface PainelOverlayProps {
  input: AulaCtxInput | null;
  tipo: AulaAcaoTipo;
  onClose: () => void;
}

export function PainelOverlay({ input, tipo, onClose }: PainelOverlayProps) {
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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed inset-0 sm:left-auto sm:right-0 sm:w-[min(40rem,92vw)] z-[81] flex flex-col bg-card shadow-2xl pb-[calc(1.25rem+var(--sai-bottom))] pt-[calc(1rem+var(--sai-top))]",
          (tipo === "questoes" || tipo === "flashcards") && "sm:w-[min(50rem,92vw)]"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-card/95 backdrop-blur border-b border-border shrink-0">
          <button
            onClick={onClose}
            aria-label="Voltar"
            className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <p className="text-sm uppercase tracking-[0.1em] text-red-400 font-bold flex-1 text-center pr-10">
            {TITULOS[tipo]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5">
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
    </>
  );
}
