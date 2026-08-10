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
      const mockNota = Math.floor(Math.random() * 11) * 0.5 + 5;
      const notaF = Math.min(10, mockNota);
      setNotaQuestoes(notaF);
      saveProgress({ questoesDone: true, nota: notaF });
    }
  };

  const isAssistindo = !concluida;
  const isRevisando = concluida && !flashcardsDone;
  const isPraticando = concluida && flashcardsDone && !questoesDone;

  // Calcula preenchimento da linha baseado nos passos
  let progressPct = "0%";
  if (questoesDone) progressPct = "100%";
  else if (flashcardsDone) progressPct = "50%";
  else if (concluida) progressPct = "15%";

  return (
    <div className="relative w-full max-w-[400px] py-3">
      <div className="relative z-10 flex items-start justify-between px-2 sm:px-6">
        
        {/* Linha Conectora */}
        <div className="absolute left-[10%] right-[10%] top-[14px] sm:top-[15px] h-[2px] bg-border/50 z-0 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]" 
            style={{ width: progressPct }} 
          />
        </div>

        {/* Passo 1: Aula */}
        <button 
          onClick={handleAssistirClick} 
          className="relative z-10 flex flex-col items-center gap-2 group outline-none"
        >
          <div className="relative">
            <div className={cn(
              "w-7 h-7 sm:w-[30px] sm:h-[30px] rounded-full flex items-center justify-center transition-all duration-500", 
              concluida 
                ? "bg-primary text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-110" 
                : "bg-background border-2 border-border text-muted-foreground",
              isAssistindo && "border-primary text-primary bg-background scale-105"
            )}>
              {concluida ? <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5" />}
            </div>
            {isAssistindo && (
               <div className="absolute inset-0 -m-1">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30 duration-1000"></span>
               </div>
            )}
          </div>
          <span className={cn("text-[9px] sm:text-[10px] font-bold tracking-wider", concluida ? "text-primary" : isAssistindo ? "text-foreground" : "text-muted-foreground/70")}>AULA</span>
        </button>

        {/* Passo 2: Flashcards */}
        <button 
          onClick={handleFlashcardsClick} 
          className={cn(
            "relative z-10 flex flex-col items-center gap-2 group outline-none transition-opacity",
            !concluida && "opacity-40 grayscale pointer-events-none"
          )}
        >
          <div className="relative">
            <div className={cn(
              "w-7 h-7 sm:w-[30px] sm:h-[30px] rounded-full flex items-center justify-center transition-all duration-500", 
              flashcardsDone 
                ? "bg-primary text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-110" 
                : "bg-background border-2 border-border text-muted-foreground",
              isRevisando && "border-primary text-primary bg-background scale-105"
            )}>
              {flashcardsDone ? <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4" /> : <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </div>
            {isRevisando && (
               <div className="absolute inset-0 -m-1">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30 duration-1000"></span>
               </div>
            )}
          </div>
          <span className={cn("text-[9px] sm:text-[10px] font-bold tracking-wider", flashcardsDone ? "text-primary" : isRevisando ? "text-foreground" : "text-muted-foreground/70")}>FLASHCARDS</span>
        </button>

        {/* Passo 3: Questões */}
        <button 
          onClick={handleQuestoesClick} 
          className={cn(
            "relative z-10 flex flex-col items-center gap-2 group outline-none transition-opacity",
            (!concluida || !flashcardsDone) && "opacity-40 grayscale pointer-events-none"
          )}
        >
          <div className="relative">
            <div className={cn(
              "w-7 h-7 sm:w-[30px] sm:h-[30px] rounded-full flex items-center justify-center transition-all duration-500", 
              questoesDone 
                ? "bg-primary text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-110" 
                : "bg-background border-2 border-border text-muted-foreground",
              isPraticando && "border-primary text-primary bg-background scale-105"
            )}>
              {questoesDone ? <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4" /> : <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </div>
            {isPraticando && (
               <div className="absolute inset-0 -m-1">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30 duration-1000"></span>
               </div>
            )}
            
            {/* Badge de Nota Absoluto em cima */}
            {questoesDone && notaQuestoes !== null && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in duration-500">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span className="text-[10px] font-black leading-none">{notaQuestoes.toFixed(1)}</span>
              </div>
            )}
          </div>
          <span className={cn("text-[9px] sm:text-[10px] font-bold tracking-wider", questoesDone ? "text-primary" : isPraticando ? "text-foreground" : "text-muted-foreground/70")}>QUESTÕES</span>
        </button>

      </div>
    </div>
  );
}
