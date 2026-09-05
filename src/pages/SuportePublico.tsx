import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from "@/hooks/useGoBack";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SuportePublico() {
  const goBack = useGoBack();
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = () => {
    if (!assunto || !mensagem.trim()) {
      toast.error("Preencha o assunto e a mensagem para continuar.");
      return;
    }

    const body = `Assunto: ${assunto}\n\nMensagem:\n${mensagem}\n\n`;
    const mailto = `mailto:wn7corporation@gmail.com?subject=Suporte Direito Prime - ${encodeURIComponent(assunto)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    
    setTimeout(() => {
      toast.success("Abrindo seu aplicativo de e-mail...");
    }, 500);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PageHeader title="Fale com o Suporte" onBack={() => goBack()} />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl lg:max-w-3xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl font-bold mb-2">Como podemos ajudar?</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Selecione o assunto e descreva sua necessidade. Vamos redirecionar você para o envio de um e-mail com os dados preenchidos.
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Qual é o assunto?
            </label>
            <Select value={assunto} onValueChange={setAssunto}>
              <SelectTrigger className="w-full h-12 bg-card border-border">
                <SelectValue placeholder="Selecione uma opção..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Minha assinatura">Minha assinatura</SelectItem>
                <SelectItem value="Reportar bug">Reportar um bug</SelectItem>
                <SelectItem value="Sobre funções">Dúvidas sobre funções</SelectItem>
                <SelectItem value="Outro assunto">Outro suporte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence>
            {assunto === "Minha assinatura" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl mt-2">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Fique tranquilo(a)!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se você é nosso assinante, sua solicitação terá máxima prioridade. Nossa equipe analisará sua conta, garantiremos que você tenha suporte completo e que você não perca nenhum direito. Responderemos o mais rápido possível!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Mensagem
            </label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva aqui o que você precisa..."
              className="resize-none bg-card border-border p-4"
              rows={8}
              maxLength={2000}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-14 rounded-full text-base font-bold shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Enviar para o nosso E-mail
          </Button>

          <p className="text-[11px] text-center text-muted-foreground px-4">
            Ao clicar, seu aplicativo de e-mail será aberto para concluir o envio da mensagem.
          </p>
        </div>
      </div>
    </div>
  );
}