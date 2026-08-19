import { useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export function useAssistenteRuntime() {
  const adapter = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages, abortSignal }) {
      try {
        // Formatar mensagens para o formato da Edge Function do Supabase
        const formattedMessages = messages.map(m => ({
          role: m.role,
          content: m.content.map(c => c.type === 'text' ? c.text : '').join('\n')
        }));

        const { data, error } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            messages: formattedMessages,
            webSearch: false, // Pode ser passado dinamicamente via ferramentas depois
          },
        });

        if (error) throw error;

        // assistant-ui lida com o estado. Precisamos yield a resposta.
        // Como não temos streaming real, nós geramos um único chunk final.
        yield {
          content: [{ type: "text", text: data?.reply || "Não consegui gerar uma resposta." }],
          // Vamos adaptar 'sources' e outras customizacoes via dados auxiliares futuramente
        };
      } catch (err) {
        console.error(err);
        toast.error("Erro ao comunicar com a assistente.");
        yield {
          content: [{ type: "text", text: "Desculpe, ocorreu um erro ao processar sua dúvida. Tente novamente." }]
        };
      }
    }
  }), []);

  return useLocalRuntime(adapter);
}
