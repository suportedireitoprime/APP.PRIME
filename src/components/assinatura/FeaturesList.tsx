import { Scale, Brain, Library, Sparkles, Briefcase, CheckCircle2, ShieldCheck } from "lucide-react";

const CATEGORIZED_FEATURES = [
  {
    category: "Vade Mecum Inteligente",
    icon: Scale,
    badge: "Legislação Completa",
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
    badge: "Inteligência Artificial",
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
    badge: "+200 Títulos",
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
    badge: "Aceleração & Fixação",
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
    badge: "Ecossistema Completo",
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

export function FeaturesList({ tabKey: _tabKey }: { tabKey: string }) {
  return (
    <div className="mx-4 rounded-3xl p-5 sm:p-6 bg-card/60 border border-border/80 backdrop-blur-md shadow-xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Acesso Total Ilimitado
        </div>
        <h3 className="font-display text-lg sm:text-xl font-black text-foreground uppercase tracking-wider">
          Tudo o que você desbloqueia
        </h3>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          Confira abaixo todos os recursos e benefícios inclusos na sua assinatura
        </p>
      </div>
      
      {/* Grid de tópicos 100% abertos e completos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIZED_FEATURES.map((cat, i) => {
          const Icon = cat.icon;
          const isLastOdd = i === CATEGORIZED_FEATURES.length - 1 && CATEGORIZED_FEATURES.length % 2 !== 0;
          return (
            <div 
              key={i} 
              className={`rounded-2xl border border-white/5 bg-black/30 p-4 sm:p-5 flex flex-col transition-all hover:border-white/10 hover:bg-black/40 ${
                isLastOdd ? 'md:col-span-2' : ''
              }`}
            >
              {/* Cabeçalho da Categoria */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-display font-black text-sm text-foreground tracking-wide">
                    {cat.category}
                  </h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                  {cat.badge}
                </span>
              </div>

              {/* Lista Completa de Tópicos */}
              <ul className="space-y-2.5 flex-1">
                {cat.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-body text-[12.5px] sm:text-[13px] text-muted-foreground leading-snug font-medium">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
