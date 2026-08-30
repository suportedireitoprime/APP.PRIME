import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  questao: { enunciado: string; gabarito?: string };
};

const MOTIVOS = [
  "A resposta dada como certa está incorreta",
  "O enunciado está confuso ou incompleto",
  "Há erro de digitação/formatação",
  "A questão está desatualizada (Lei revogada, etc)",
  "Outro motivo (especifique abaixo)",
];

export function ReportarErroQuestaoModal({ isOpen, onClose, questao }: Props) {
  const { session } = useAuth();
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error("Você precisa estar logado para reportar.");
      return;
    }
    
    setEnviando(true);
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("erros_questoes").insert({
        user_id: session.user.id,
        questao_texto: questao.enunciado,
        motivo,
        detalhes: detalhes.trim() || null,
        status: "pendente",
      });

      if (error) throw error;
      
      toast.success("Erro reportado com sucesso! Agradecemos sua ajuda.");
      onClose();
    } catch (e: any) {
      console.error("Erro ao reportar:", e);
      toast.error("Não foi possível enviar o reporte.");
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Reportar erro na questão
          </h2>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">O que está errado?</label>
            <div className="space-y-2">
              {MOTIVOS.map((m) => (
                <label key={m} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  motivo === m ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-foreground/80 hover:bg-muted"
                )}>
                  <div className="pt-0.5">
                    <input 
                      type="radio" 
                      name="motivo_erro" 
                      checked={motivo === m} 
                      onChange={() => setMotivo(m)}
                      className="accent-primary"
                    />
                  </div>
                  <span className="text-sm leading-snug">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Mais detalhes (opcional)</label>
            <textarea
              className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              rows={3}
              placeholder="Explique o erro com mais detalhes para nos ajudar a corrigir..."
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={enviando}
            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar reporte"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
