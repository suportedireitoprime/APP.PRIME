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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <HelpCircle className="w-5 h-5" />
        <h3 className="font-semibold">Dúvidas Frequentes</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-sm font-medium text-left">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
