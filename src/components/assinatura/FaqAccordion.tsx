import { MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqAccordion() {
  return (
    <div className="mx-4 rounded-2xl p-5 bg-card/60 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
          Perguntas frequentes
        </h3>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="para-quem" className="border-border">
          <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
            Para quem é o Direito Prime?
          </AccordionTrigger>
          <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
            O Direito Prime é feito para <span className="text-foreground font-medium">estudantes de Direito, concurseiros e advogados</span> que precisam de agilidade no dia a dia jurídico. Consulte qualquer lei atualizada em segundos, tire dúvidas com IA jurídica 24h, gere resumos automáticos, ouça leis inteiras narradas, estude com flashcards e mapas mentais, acompanhe novidades legislativas em tempo real e leve toda a biblioteca no bolso — na faculdade, no trabalho, no fórum ou revisando para a próxima prova.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cancelar" className="border-border">
          <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
            Posso cancelar quando quiser?
          </AccordionTrigger>
          <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
            O cancelamento é feito direto pelo sistema de assinaturas da App Store ou do Google Play. A renovação dos planos pode ser interrompida a qualquer momento nas configurações do seu celular.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="teste" className="border-border">
          <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
            Quais são as formas de pagamento?
          </AccordionTrigger>
          <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
            Aceitamos pagamentos via PIX e Cartão de Crédito de forma 100% segura. O acesso é liberado no mesmo instante.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="pagamento" className="border-border">
          <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
            O pagamento é seguro?
          </AccordionTrigger>
          <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
            O pagamento é processado pelo Asaas (Instituição de Pagamento autorizada pelo Banco Central), com a mesma segurança usada em milhares de empresas. O Direito Prime nunca tem acesso aos dados do seu cartão.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dispositivos" className="border-border-0 border-b-0">
          <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
            Funciona em vários dispositivos?
          </AccordionTrigger>
          <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
            Sim. Sua assinatura sincroniza no App, no Desktop e na Web — estude onde e quando quiser, do mesmo jeito.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
