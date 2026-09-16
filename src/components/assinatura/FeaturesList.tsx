import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Scale, Brain, Library, Sparkles, Briefcase, CheckCircle2 } from "lucide-react";

const CATEGORIZED_FEATURES = [
  {
    category: "Vade Mecum Inteligente",
    icon: Scale,
    features: [
      "Todas as leis em vigor sempre atualizadas automaticamente",
      "Busca inteligente de artigos por termo ou número",
      "Súmulas Vinculantes do STF integradas",
      "Leis secas formatadas para leitura confortável",
      "Histórico de artigos mais lidos e recentes",
      "Organização por áreas do Direito e matérias"
    ]
  },
  {
    category: "IA Jurídica (Horus)",
    icon: Brain,
    features: [
      "Assistente Hórus 24h no WhatsApp",
      "Tira-dúvidas ilimitado sobre leis e casos práticos",
      "Criador de peças jurídicas (petições, recursos, contratos)",
      "Resumos automáticos de artigos complexos da lei",
      "Explicações simplificadas ('Em português claro')",
      "Exemplos práticos gerados na hora para qualquer artigo"
    ]
  },
  {
    category: "Biblioteca Profissional",
    icon: Library,
    features: [
      "+200 livros e ebooks jurídicos disponíveis",
      "Resumos focados nos temas mais cobrados",
      "Doutrinas essenciais e clássicos da literatura jurídica",
      "Biografias de juristas históricos e filósofos do Direito",
      "Leitura offline e progresso salvo automaticamente",
      "Conteúdo curado pela equipe editorial"
    ]
  },
  {
    category: "Kit Completo de Estudos",
    icon: Sparkles,
    features: [
      "Narração nativa: ouça as leis inteiras com voz humana",
      "Milhares de Flashcards de memorização integrados",
      "Mapas mentais visuais gerados a partir da legislação",
      "Simulador de questões comentadas por alternativas",
      "Marca-texto (grifos virtuais) sincronizados na nuvem",
      "Anotações pessoais salvas em cada artigo da lei"
    ]
  },
  {
    category: "Uso Profissional & Ferramentas",
    icon: Briefcase,
    features: [
      "Radar Legislativo: notificações de novas leis em tempo real",
      "Acesso simultâneo no App (iOS/Android), Web e Desktop",
      "Modo Offline Premium: acesse todo o conteúdo sem internet",
      "Sem anúncios e sem interrupções",
      "Suporte prioritário exclusivo para assinantes",
      "Acesso antecipado a novas ferramentas do ecossistema"
    ]
  }
];

export function FeaturesList({ tabKey }: { tabKey: string }) {
  return (
    <div className="mx-4 rounded-2xl p-5 bg-card/60 border border-border">
      <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider mb-5 text-center">
        Tudo que você desbloqueia
      </h3>
      
      <Accordion type="single" collapsible className="w-full space-y-3">
        {CATEGORIZED_FEATURES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <AccordionItem key={i} value={`cat-${i}`} className="border border-white/5 bg-black/20 rounded-xl overflow-hidden shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-display font-bold text-[13px] tracking-wide text-left">{cat.category}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-1">
                <ul className="space-y-3">
                  {cat.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 opacity-90" />
                      <span className="font-body text-[13px] text-muted-foreground leading-snug font-medium pr-1">{feat}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
