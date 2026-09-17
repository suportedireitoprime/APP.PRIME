import { Scale, Brain, Library, Sparkles, Briefcase, CheckCircle2, ShieldCheck, Headphones, Gavel, Globe, BookOpen, Zap, FileText, Bell, BarChart3, Bookmark, MessageSquare, Tv, Map, Gamepad2, GraduationCap, Newspaper, Landmark, Search, Mic, PenTool, Trophy, Layers, FolderOpen, Podcast } from "lucide-react";

const CATEGORIZED_FEATURES = [
  {
    category: "Vade Mecum Inteligente",
    icon: Scale,
    badge: "Legislação Completa",
    features: [
      "Todas as leis federais atualizadas",
      "Busca por termo, número ou assunto",
      "Súmulas Vinculantes e STJ integradas",
      "Leitura formatada e confortável",
      "Histórico de artigos lidos",
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
      "Gerador de peças e contratos",
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
      "Leitura offline com progresso",
      "Curadoria da equipe editorial",
      "Audiobooks por capítulo",
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
      "Grifos virtuais sincronizados",
      "Anotações salvas por artigo",
      "Planos de estudo personalizados",
      "Questões com gabarito comentado"
    ]
  },
  {
    category: "Ferramentas Pro",
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
  },
  {
    category: "Questões & Simulados",
    icon: GraduationCap,
    badge: "Banco Completo",
    features: [
      "Milhares de questões comentadas",
      "Simulados por cargo e banca",
      "Trilhas de estudo progressivas",
      "Desafios diários gamificados",
      "Cadernos de erros inteligente",
      "Estatísticas de desempenho",
      "Revisão espaçada automática",
      "Questões por área e matéria"
    ]
  },
  {
    category: "Videoaulas",
    icon: Tv,
    badge: "Catálogo Premium",
    features: [
      "Videoaulas por lei e matéria",
      "Professores especializados",
      "Trilhas completas por cargo",
      "Anotações integradas ao vídeo",
      "Conquistas e progresso visual",
      "Velocidade de reprodução",
      "Mini-player flutuante",
      "Catálogo por concurso"
    ]
  },
  {
    category: "Flashcards Avançado",
    icon: Layers,
    badge: "Memorização Ativa",
    features: [
      "Flashcards por lei e matéria",
      "Decks de jurisprudência",
      "Prazos e exceções processuais",
      "Termos e classificações",
      "Filósofos e juristas históricos",
      "Cartões Cornell de revisão",
      "Desafios cronometrados",
      "Progresso por categoria"
    ]
  },
  {
    category: "Jurisprudência",
    icon: Gavel,
    badge: "STF & STJ",
    features: [
      "Jurisprudência comentada por IA",
      "Pesquisas prontas organizadas",
      "Informativos STF e STJ",
      "Teses e entendimentos atuais",
      "Súmulas com explicação",
      "Busca por tema e número",
      "Favoritar decisões relevantes",
      "Conexão com artigos da lei"
    ]
  },
  {
    category: "Podcasts Jurídicos",
    icon: Podcast,
    badge: "Ouça em Qualquer Lugar",
    features: [
      "Episódios sobre legislação",
      "Comentários de atualidades",
      "Player com velocidade ajustável",
      "Reprodução em segundo plano",
      "Curadoria por área do Direito",
      "Notificação de novos episódios",
      "Acesso offline salvo no app",
      "Temas de concurso e OAB"
    ]
  },
  {
    category: "Leis Cantadas",
    icon: Mic,
    badge: "Fixação Musical",
    features: [
      "Artigos musicados e cantados",
      "Player com letra sincronizada",
      "Fixação auditiva da lei seca",
      "Áudios por matéria do Direito",
      "Mini-player global flutuante",
      "Reprodução contínua e offline",
      "Velocidade de reprodução",
      "Conteúdo exclusivo original"
    ]
  },
  {
    category: "Audioaulas",
    icon: Headphones,
    badge: "Estude Ouvindo",
    features: [
      "Aulas narradas profissionais",
      "Ouça em trânsito e exercícios",
      "Player com velocidade variável",
      "Progresso salvo por capítulo",
      "Conteúdo por lei e matéria",
      "Mini-player em background",
      "Download para modo offline",
      "Notificação de novos áudios"
    ]
  },
  {
    category: "Três Poderes Ao Vivo",
    icon: Landmark,
    badge: "Acompanhe em Tempo Real",
    features: [
      "Agenda da Câmara dos Deputados",
      "Pauta do Senado Federal",
      "Sessões ao vivo do STF",
      "Radar de votações do Congresso",
      "Rankings de parlamentares",
      "Proposições legislativas do dia",
      "Portais oficiais integrados",
      "Perfil detalhado por deputado"
    ]
  },
  {
    category: "Radar Legislativo",
    icon: Bell,
    badge: "Alertas Inteligentes",
    features: [
      "Alertas de novas leis publicadas",
      "Monitoramento por área jurídica",
      "Proposições em alta no Congresso",
      "Impacto de leis na sua área",
      "Categorias personalizáveis",
      "Notificações push em tempo real",
      "Histórico de alterações legais",
      "Radar por estado e competência"
    ]
  },
  {
    category: "Peças e Petições",
    icon: FileText,
    badge: "IA Generativa",
    features: [
      "Gerador de petições iniciais",
      "Editor jurídico completo",
      "Modelos por área e ação",
      "Revisão inteligente por IA",
      "Formatação ABNT automática",
      "Fundamentação legal sugerida",
      "Exportação em PDF",
      "Histórico de peças salvas"
    ]
  },
  {
    category: "Resumos Jurídicos",
    icon: BookOpen,
    badge: "Estudo Dirigido",
    features: [
      "Resumos por matéria e lei",
      "Resumos de jurisprudência",
      "Texto otimizado para fixação",
      "Organização por temas",
      "Áudio dos resumos narrados",
      "Favoritar e compartilhar",
      "Atualização automática",
      "Ideal para revisão final"
    ]
  },
  {
    category: "Aprender (Trilhas)",
    icon: Zap,
    badge: "Gamificação",
    features: [
      "Trilhas de aprendizado guiadas",
      "Teoria + questões integradas",
      "Progresso visual por módulo",
      "Desempenho e estatísticas",
      "Flashcards dentro da trilha",
      "Aulas interativas com IA",
      "Módulos por área e assunto",
      "Sistema de conquistas e XP"
    ]
  },
  {
    category: "Modo Aula",
    icon: PenTool,
    badge: "Estudo Focado",
    features: [
      "Sessões de estudo cronometradas",
      "Aulas estruturadas por tema",
      "Chat com IA dentro da aula",
      "Avaliação inteligente ao final",
      "Progresso e sessões salvas",
      "Gráficos de desempenho",
      "Revisão de erros e acertos",
      "Metodologia de estudo ativa"
    ]
  },
  {
    category: "Dicionário Jurídico",
    icon: Search,
    badge: "Consulta Rápida",
    features: [
      "Termos jurídicos explicados",
      "Busca por palavra ou conceito",
      "Exemplos de uso no Direito",
      "Conexão com artigos da lei",
      "Linguagem acessível e direta",
      "Referências doutrinárias",
      "Histórico de consultas",
      "Favoritos e coleções"
    ]
  },
  {
    category: "Gamificação & Metas",
    icon: Trophy,
    badge: "Motivação Constante",
    features: [
      "Sistema de XP e níveis",
      "Conquistas por categoria",
      "Streak de dias consecutivos",
      "Desafios semanais exclusivos",
      "Rankings e posições",
      "Metas personalizadas",
      "Lembretes de estudo",
      "Histórico completo de progresso"
    ]
  },
  {
    category: "Laboratório Visual",
    icon: Gamepad2,
    badge: "Experiência Imersiva",
    features: [
      "Artigos do Código em 3D",
      "Cenas interativas por tema",
      "Visual jurídico animado",
      "Grafo de conexões entre artigos",
      "Explicações visuais da lei",
      "Navegação imersiva",
      "Conteúdo exclusivo curado",
      "Ideal para estudo visual"
    ]
  },
  {
    category: "Legislação Estadual",
    icon: Map,
    badge: "Todos os Estados",
    features: [
      "Constituições estaduais",
      "Leis orgânicas e estatutos",
      "Busca por estado e matéria",
      "Texto integral formatado",
      "Comparação entre estados",
      "Atualização automática",
      "Favoritar leis estaduais",
      "Portal oficial integrado"
    ]
  },
  {
    category: "Notícias Jurídicas",
    icon: Newspaper,
    badge: "Atualidade",
    features: [
      "Feed de notícias em tempo real",
      "STF, STJ, Congresso e OAB",
      "Análise de impacto na lei",
      "Curadoria por área de atuação",
      "Notificações de breaking news",
      "Boletim matinal por WhatsApp",
      "Novidades e atualizações do app",
      "Edição diária do blog jurídico"
    ]
  },
  {
    category: "Meu Espaço Pessoal",
    icon: FolderOpen,
    badge: "Tudo Organizado",
    features: [
      "Grifos e destaques unificados",
      "Anotações em um só lugar",
      "Leis e artigos favoritos",
      "Livros e filmes salvos",
      "Downloads para offline",
      "Minhas leituras em progresso",
      "Meus resumos e videoaulas",
      "Documentos pessoais na nuvem"
    ]
  },
  {
    category: "Temáticas & Filmes",
    icon: Globe,
    badge: "Cultura Jurídica",
    features: [
      "Filmes e séries sobre Direito",
      "Ficha técnica e análise jurídica",
      "Conexão com leis e artigos",
      "Trilha de aprendizado por tema",
      "Sugestões personalizadas",
      "Avaliação e recomendação",
      "Porque assistir cada título",
      "Curadoria da equipe editorial"
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
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
          +200 funcionalidades em 25 módulos completos
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {CATEGORIZED_FEATURES.map((cat, i) => {
          const Icon = cat.icon;
          const isLastOdd = i === CATEGORIZED_FEATURES.length - 1 && CATEGORIZED_FEATURES.length % 2 !== 0;
          return (
            <div 
              key={i} 
              className={`rounded-2xl border border-white/5 bg-black/30 p-3 sm:p-3.5 flex flex-col transition-all hover:border-white/10 hover:bg-black/40 ${
                isLastOdd ? 'md:col-span-2' : ''
              }`}
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h4 className="font-display font-black text-[12px] sm:text-[13px] text-foreground tracking-wide leading-tight">
                    {cat.category}
                  </h4>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5 whitespace-nowrap">
                  {cat.badge}
                </span>
              </div>

              {/* Lista compacta em grid 2 colunas */}
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 flex-1">
                {cat.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1 min-w-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-body text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight font-medium truncate">
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
