import { useEffect, useState } from "react";
import { CheckCircle2, Play, Layers, ListChecks, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  videoId: string;
  concluida: boolean;
  pctAtual: number;
  onMarcarConcluida: () => void;
}

export function TrilhaAula({ videoId, concluida, pctAtual, onMarcarConcluida }: Props) {
  const [flashcardsDone, setFlashcardsDone] = useState(false);
  const [questoesDone, setQuestoesDone] = useState(false);
  const [notaQuestoes, setNotaQuestoes] = useState<number | null>(null);

  // Carrega progresso salvo localmente para esta aula
  useEffect(() => {
    if (!videoId) return;
    try {
      const saved = localStorage.getItem(`trilha_aula_${videoId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.flashcardsDone) setFlashcardsDone(true);
        if (parsed.questoesDone) setQuestoesDone(true);
        if (typeof parsed.nota === "number") setNotaQuestoes(parsed.nota);
      }
    } catch (e) {
      console.error(e);
    }
  }, [videoId]);

  const saveProgress = (updates: any) => {
    try {
      const current = JSON.parse(localStorage.getItem(`trilha_aula_${videoId}`) || "{}");
      const next = { ...current, ...updates };
      localStorage.setItem(`trilha_aula_${videoId}`, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  // Simula marcação ao clicar nos itens
  const handleAssistirClick = () => {
    if (!concluida) {
      onMarcarConcluida();
    }
  };

  const handleFlashcardsClick = () => {
    if (!flashcardsDone) {
      setFlashcardsDone(true);
      saveProgress({ flashcardsDone: true });
    }
  };

  const handleQuestoesClick = () => {
    if (!questoesDone) {
      setQuestoesDone(true);
      // Gera nota aleatória entre 5 e 10 (passos de 0.5) para demonstração visual
      const mockNota = Math.floor(Math.random() * 11) * 0.5 + 5;
      const notaF = Math.min(10, mockNota);
      setNotaQuestoes(notaF);
      saveProgress({ questoesDone: true, nota: notaF });
    }
  };

  const isAssistindo = !concluida;
  const isRevisando = concluida && !flashcardsDone;
  const isPraticando = concluida && flashcardsDone && !questoesDone;

  return (
    <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 shadow-inner">
      <h3 className="text-[11px] uppercase font-black text-muted-foreground mb-4 tracking-widest flex items-center gap-2">
        Trilha de Conclusão da Aula
      </h3>
      <div className="space-y-2">
        
        {/* Passo 1: Assistir Aula */}
        <button 
          onClick={handleAssistirClick}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
            concluida ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/50",
            isAssistindo && "ring-2 ring-primary/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-card"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", concluida ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-muted text-muted-foreground")}>
              {concluida ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-4 h-4 ml-0.5" />}
            </div>
            <div>
              <p className={cn("text-sm font-bold", concluida ? "text-primary" : "text-foreground")}>1. Assistir Aula</p>
              <p className="text-[11px] font-medium text-muted-foreground">{concluida ? "Concluído" : pctAtual > 0 ? `${pctAtual}% assistido` : "Pendente"}</p>
            </div>
          </div>
          {isAssistindo && (
             <div className="flex h-3 w-3 relative shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
             </div>
          )}
        </button>

        {/* Passo 2: Revisar Flashcards */}
        <button 
          onClick={handleFlashcardsClick}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
            flashcardsDone ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/50",
            !concluida && "opacity-40 grayscale pointer-events-none",
            isRevisando && "ring-2 ring-primary/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-card"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", flashcardsDone ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-muted text-muted-foreground")}>
              {flashcardsDone ? <CheckCircle2 className="w-5 h-5" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <p className={cn("text-sm font-bold", flashcardsDone ? "text-primary" : "text-foreground")}>2. Revisar Flashcards</p>
              <p className="text-[11px] font-medium text-muted-foreground">{flashcardsDone ? "Concluído" : "Pendente"}</p>
            </div>
          </div>
          {isRevisando && (
             <div className="flex h-3 w-3 relative shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
             </div>
          )}
        </button>

        {/* Passo 3: Praticar Questões */}
        <button 
          onClick={handleQuestoesClick}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
            questoesDone ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/50",
            (!concluida || !flashcardsDone) && "opacity-40 grayscale pointer-events-none",
            isPraticando && "ring-2 ring-primary/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-card"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", questoesDone ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-muted text-muted-foreground")}>
              {questoesDone ? <CheckCircle2 className="w-5 h-5" /> : <ListChecks className="w-4 h-4" />}
            </div>
            <div>
              <p className={cn("text-sm font-bold", questoesDone ? "text-primary" : "text-foreground")}>3. Praticar Questões</p>
              <p className="text-[11px] font-medium text-muted-foreground">{questoesDone ? "Concluído" : "Pendente"}</p>
            </div>
          </div>
          
          {isPraticando && (
             <div className="flex h-3 w-3 relative shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
             </div>
          )}

          {questoesDone && notaQuestoes !== null && (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Sua Nota</span>
              <div className="flex items-center gap-1 text-amber-500 font-black text-lg leading-none">
                <Star className="w-4 h-4 fill-current mb-0.5" />
                {notaQuestoes.toFixed(1)}<span className="text-[10px] text-muted-foreground font-semibold">/10</span>
              </div>
            </div>
          )}
        </button>

      </div>
    </div>
  );
}
