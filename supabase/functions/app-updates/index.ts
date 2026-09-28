import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const updates = [
  {
    version: "2.4",
    title: "Versão 2.4 Liberada",
    date: "2026-09-28",
    description: "Novo painel de explicações ao vivo e melhorias no Vade Mecum.",
    features: [
      "Integração do Mentor de IA em tempo real",
      "Scroll inteligente ao alternar abas",
      "Novas animações fluidas nas listas de leis"
    ]
  },
  {
    version: "2.3",
    title: "Versão 2.3 Liberada",
    date: "2026-09-14",
    description: "Desempenho aprimorado e novos atalhos de estudo.",
    features: [
      "Pesquisa 40% mais rápida em legislações extensas",
      "Modo escuro otimizado para economia de bateria",
      "Novo sistema de flashcards para revisão"
    ]
  },
  {
    version: "2.2",
    title: "Versão 2.2 Liberada",
    date: "2026-08-25",
    description: "Expansão da biblioteca e suporte a tablets.",
    features: [
      "Layout totalmente adaptado para iPads e tablets",
      "Mais de 500 novas súmulas adicionadas",
      "Notificações personalizadas para editais"
    ]
  },
  {
    version: "2.1",
    title: "Versão 2.1 Liberada",
    date: "2026-08-10",
    description: "Nova seção de jurisprudências e melhorias de leitura.",
    features: [
      "Busca avançada com filtros por tribunal",
      "Opção de ajustar o tamanho e a fonte do texto",
      "Marcação de texto com múltiplas cores"
    ]
  },
  {
    version: "2.0",
    title: "Versão 2.0 Liberada",
    date: "2026-07-22",
    description: "A maior atualização do ano com design renovado.",
    features: [
      "Interface completamente redesenhada",
      "Navegação por gestos mais intuitiva",
      "Sincronização em nuvem instantânea"
    ]
  },
  {
    version: "1.9",
    title: "Versão 1.9 Liberada",
    date: "2026-07-05",
    description: "Modo offline aprimorado e novos resumos.",
    features: [
      "Acesso completo ao Vade Mecum sem internet",
      "Baixe resumos em áudio para ouvir no trânsito",
      "Correção de falhas ao carregar arquivos pesados"
    ]
  },
  {
    version: "1.8",
    title: "Versão 1.8 Liberada",
    date: "2026-06-18",
    description: "Foco nos concursos e editais recentes.",
    features: [
      "Alerta automático de novos concursos",
      "Simulados inéditos com foco na banca CESPE",
      "Ranking de desempenho entre usuários"
    ]
  },
  {
    version: "1.7",
    title: "Versão 1.7 Liberada",
    date: "2026-06-02",
    description: "Melhorias de acessibilidade e leitura por voz.",
    features: [
      "Leitura em voz alta de artigos de lei",
      "Suporte aprimorado para leitores de tela",
      "Novo modo de alto contraste"
    ]
  },
  {
    version: "1.6",
    title: "Versão 1.6 Liberada",
    date: "2026-05-15",
    description: "Mapas mentais integrados ao estudo.",
    features: [
      "Visualização de conexões entre artigos",
      "Criação de anotações vinculadas aos mapas",
      "Exportação rápida para PDF"
    ]
  },
  {
    version: "1.5",
    title: "Versão 1.5 Liberada",
    date: "2026-04-28",
    description: "Painel de revisões espaçadas.",
    features: [
      "Algoritmo inteligente para agendar revisões",
      "Estatísticas detalhadas de aprendizado",
      "Lembretes diários configuráveis"
    ]
  },
  {
    version: "1.4",
    title: "Versão 1.4 Liberada",
    date: "2026-04-10",
    description: "Comunidade e fórum de dúvidas.",
    features: [
      "Espaço para interagir com outros estudantes",
      "Resolução de questões comentadas por professores",
      "Compartilhamento de cadernos de erros"
    ]
  },
  {
    version: "1.3",
    title: "Versão 1.3 Liberada",
    date: "2026-03-22",
    description: "Otimização de armazenamento local.",
    features: [
      "O app agora ocupa 50% menos espaço no celular",
      "Gerenciador de downloads aprimorado",
      "Limpeza automática de cache antigo"
    ]
  },
  {
    version: "1.2",
    title: "Versão 1.2 Liberada",
    date: "2026-03-05",
    description: "Novos cadernos de legislação penal.",
    features: [
      "Inclusão do Pacote Anticrime atualizado",
      "Questões inéditas de Direito Penal",
      "Marcadores inteligentes de artigos revogados"
    ]
  },
  {
    version: "1.1",
    title: "Versão 1.1 Liberada",
    date: "2026-02-15",
    description: "Suporte a vídeos e videoaulas.",
    features: [
      "Player de vídeo nativo sem interrupções",
      "Controle de velocidade de reprodução",
      "Modo picture-in-picture (PiP)"
    ]
  },
  {
    version: "1.0",
    title: "Versão 1.0 Liberada",
    date: "2026-01-20",
    description: "Lançamento oficial do aplicativo.",
    features: [
      "Vade Mecum interativo e atualizado",
      "Filtros de busca rápida",
      "Sistema de favoritos e histórico"
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    return new Response(JSON.stringify(updates), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
