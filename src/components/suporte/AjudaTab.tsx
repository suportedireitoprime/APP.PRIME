import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function AjudaTab() {
  const faqs = [
    {
      q: "Como cancelar minha assinatura?",
      a: "Você pode cancelar a qualquer momento indo em Configurações > Minha Assinatura > Cancelar Plano. O acesso continua até o fim do período já pago."
    },
    {
      q: "Como funciona o Laboratório de Casos?",
      a: "O laboratório usa inteligência artificial para simular casos reais do tribunal, permitindo que você atue como defesa ou acusação."
    },
    {
      q: "Encontrei um erro em uma questão, o que fazer?",
      a: "Na própria tela da questão, há um botão com ícone de bandeira ou 'Reportar Erro'. Clique nele para avisar nossa equipe e corrigiremos rapidamente."
    },
    {
      q: "O app funciona offline?",
      a: "No momento, algumas funcionalidades como leitura do Vade Mecum podem ser acessadas offline, mas Laboratório e Questões requerem internet."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-primary/10 p-4 rounded-3xl border border-primary/20">
        <div className="p-2 bg-primary rounded-full text-primary-foreground">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold font-display text-foreground">Dúvidas Frequentes</h3>
          <p className="text-xs text-muted-foreground font-body">Encontre respostas rápidas aqui</p>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-[#1A1D21] border border-border/40 rounded-3xl px-5 overflow-hidden data-[state=open]:border-primary/50 transition-colors">
            <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground/90 text-sm leading-relaxed pb-4 pt-1">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
