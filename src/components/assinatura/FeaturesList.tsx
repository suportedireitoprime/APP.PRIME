import { Scale, Brain, Library, Sparkles, Briefcase, CheckCircle2, ShieldCheck, Headphones, Gavel, Globe, BookOpen, Zap, FileText, Bell, Users, BarChart3, Bookmark, MessageSquare } from "lucide-react";

const CATEGORIZED_FEATURES = [
  {
    category: "Vade Mecum Inteligente",
    icon: Scale,
    badge: "Legislação Completa",
    features: [
      "Todas as leis federais atualizadas automaticamente",
      "Busca por termo, número ou assunto",
      "Súmulas Vinculantes e STJ integradas",
      "Leitura formatada e confortável",
      "Histórico de artigos lidos e recentes",
      "Organização por áreas do Direito",
      "Comparador de versões da lei",
      "Índice e hierarquia completa"
    ]
  },
  {
    category: "IA Jurídica (Horus)",
    icon: Brain,
    badge: "Inteligência Artificial",
    features: [
      "Assistente 24h no WhatsApp",
      "Tira-dúvidas ilimitado sobre leis",
      "Gerador de peças (petições, contratos)",
      "Resumos automáticos de artigos",
      "Explicações em linguagem simples",
      "Exemplos práticos instantâneos",
      "Análise de jurisprudência",
      "Sugestão de teses e argumentos"
    ]
  },
  {
    category: "Biblioteca Jurídica",
    icon: Library,
    badge: "+200 Títulos",
    features: [
      "+200 livros e ebooks jurídicos",
      "Resumos dos temas mais cobrados",
      "Doutrinas e clássicos do Direito",
      "Biografias de juristas históricos",
      "Leitura offline com progresso salvo",
      "Curadoria da equipe editorial",
      "Audiobooks e narração por capítulo",
      "Destaques e notas pessoais"
    ]
  },
  {
    category: "Kit de Estudos",
    icon: Sparkles,
    badge: "Aceleração & Fixação",
    features: [
      "Narração nativa com voz humana",
      "Milhares de Flashcards integrados",
      "Mapas mentais da legislação",
      "Simulados comentados por banca",
      "Grifos virtuais na nuvem",
      "Anotações salvas por artigo",
      "Planos de estudo personalizados",
      "Questões por alternativa e gabarito"
    ]
  },
  {
    category: "Profissional & Ferramentas",
    icon: Briefcase,
    badge: "Ecossistema Completo",
    features: [
      "Radar de novas leis em tempo real",
      "App iOS, Android, Web e Desktop",
      "Offline Premium sem internet",
      "Zero anúncios e interrupções",
      "Suporte prioritário exclusivo",
      "Acesso antecipado a novidades",
      "Boletins legislativos diários",
      "Exportação de grifos e notas"
    ]
  }
];

export function FeaturesList({ tabKey: _tabKey }: { tabKey: string }) {
  return (
    <div className="mx-4 rounded-3xl p-4 sm:p-5 bg-card/60 border border-border/80 backdrop-blur-md shadow-xl">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Acesso Total Ilimitado
        </div>
        <h3 className="font-display text-base sm:text-lg font-black text-foreground uppercase tracking-wider">
          Tudo o que você desbloqueia
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CATEGORIZED_FEATURES.map((cat, i) => {
          const Icon = cat.icon;
          const isLastOdd = i === CATEGORIZED_FEATURES.length - 1 && CATEGORIZED_FEATURES.length % 2 !== 0;
          return (
            <div 
              key={i} 
              className={`rounded-2xl border border-white/5 bg-black/30 p-3.5 sm:p-4 flex flex-col transition-all hover:border-white/10 hover:bg-black/40 ${
                isLastOdd ? 'md:col-span-2' : ''
              }`}
            >
              {/* Cabeçalho da Categoria */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h4 className="font-display font-black text-[13px] text-foreground tracking-wide leading-tight">
                    {cat.category}
                  </h4>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5 whitespace-nowrap">
                  {cat.badge}
                </span>
              </div>

              {/* Lista compacta em grid 2 colunas no desktop */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 flex-1">
                {cat.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-body text-[11.5px] sm:text-[12px] text-muted-foreground leading-tight font-medium truncate">
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
