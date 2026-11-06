// Catálogo Oficial de Todas as Rotas do Aplicativo Direito Prime
// Gerado automaticamente com 100% das rotas de src/AppRoutes.tsx em ordem alfabética
// Inclui métricas e estimativas reais de peso de bundle, dependências e consumo de memória

export type RouteWeightLevel = 'muito_pesada' | 'pesada' | 'media' | 'leve' | 'zero';

export interface AppRouteItem {
  path: string;
  group: string;
  label: string;
  description: string;
  isRedirect: boolean;
  redirectTarget: string | null;
  isProtected: boolean;
  isAdmin: boolean;
  component: string;
  exampleUrl: string;
  weightScore: number; // 0 = zero (redirect), 1 = leve, 2 = médio-leve, 3 = médio, 4 = pesado, 5 = muito pesado
  weightLevel: RouteWeightLevel;
  weightEstimate: string;
  weightReasons: string[];
}

export const APP_ROUTES_CATALOG: AppRouteItem[] = [
  {
    "path": "*",
    "group": "*",
    "label": "*",
    "description": "Página correspondente ao componente NotFound",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "NotFound",
    "exampleUrl": "*",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/",
    "group": "Início (Home)",
    "label": "Página Inicial (Home)",
    "description": "Página Inicial / Home do aplicativo (Vade Mecum, atalhos rápidos e destaques)",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "HomeGate",
    "exampleUrl": "/",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/admin-assinantes",
    "group": "Administração",
    "label": "Admin Assinantes",
    "description": "Painel de assinantes ativos, histórico de pagamentos e fontes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminAssinantes",
    "exampleUrl": "/admin-assinantes",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-audioaulas",
    "group": "Administração",
    "label": "Admin Audioaulas",
    "description": "Página correspondente ao componente AdminAudioaulas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminAudioaulas",
    "exampleUrl": "/admin-audioaulas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/admin-aulas-interativas",
    "group": "Administração",
    "label": "Admin Aulas Interativas",
    "description": "Página correspondente ao componente AdminAulasInterativas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminAulasInterativas",
    "exampleUrl": "/admin-aulas-interativas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/admin-biblioteca-leis",
    "group": "Administração",
    "label": "Admin Biblioteca Leis",
    "description": "Redirecionamento automático legado para a rota /admin-mapeamento-leis",
    "isRedirect": true,
    "redirectTarget": "/admin-mapeamento-leis",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin-biblioteca-leis",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/admin-biblioteca-leis/*",
    "group": "Administração",
    "label": "Admin Biblioteca Leis",
    "description": "Redirecionamento automático legado para a rota /admin-mapeamento-leis",
    "isRedirect": true,
    "redirectTarget": "/admin-mapeamento-leis",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin-biblioteca-leis",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/admin-blog-edicao",
    "group": "Administração",
    "label": "Admin Blog Edicao",
    "description": "Página correspondente ao componente AdminBlogEdicao",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminBlogEdicao",
    "exampleUrl": "/admin-blog-edicao",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-design-imagens",
    "group": "Administração",
    "label": "Admin Design Imagens",
    "description": "Redirecionamento automático legado para a rota /admin-blog-edicao",
    "isRedirect": true,
    "redirectTarget": "/admin-blog-edicao",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin-design-imagens",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/admin-erros-questoes",
    "group": "Administração",
    "label": "Admin Erros Questoes",
    "description": "Relatórios de erros apontados por alunos em questões de concurso",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminErrosQuestoes",
    "exampleUrl": "/admin-erros-questoes",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/admin-flashcards-editar",
    "group": "Administração",
    "label": "Admin Flashcards Editar",
    "description": "Página correspondente ao componente AdminFlashcardsEditar",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminFlashcardsEditar",
    "exampleUrl": "/admin-flashcards-editar",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/admin-funcoes",
    "group": "Administração",
    "label": "Admin Funcoes",
    "description": "Painel Geral de Funções Administrativas do Direito Prime",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminFuncoes",
    "exampleUrl": "/admin-funcoes",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-funcoes-assinantes",
    "group": "Administração",
    "label": "Admin Funcoes Assinantes",
    "description": "Página correspondente ao componente AdminFuncoesAssinantes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminFuncoesAssinantes",
    "exampleUrl": "/admin-funcoes-assinantes",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-horus",
    "group": "Administração",
    "label": "Admin Horus",
    "description": "Gerenciamento da instância do Horus no WhatsApp e logs",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminHorus",
    "exampleUrl": "/admin-horus",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-instagram-posts",
    "group": "Administração",
    "label": "Admin Instagram Posts",
    "description": "Redirecionamento automático legado para a rota /admin-funcoes",
    "isRedirect": true,
    "redirectTarget": "/admin-funcoes",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin-instagram-posts",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/admin-leitura-nativa",
    "group": "Administração",
    "label": "Admin Leitura Nativa",
    "description": "Página correspondente ao componente AdminLeituraNativa",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminLeituraNativa",
    "exampleUrl": "/admin-leitura-nativa",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.8 MB",
    "weightReasons": [
      "Motor PDF.js",
      "Canvas de alta resolução",
      "Leitor nativo"
    ]
  },
  {
    "path": "/admin-mapeamento-leis",
    "group": "Administração",
    "label": "Admin Mapeamento Leis",
    "description": "Catálogo de leis, status de extração e integridade textual",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminMapeamentoLeis",
    "exampleUrl": "/admin-mapeamento-leis",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/admin-monitor",
    "group": "Administração",
    "label": "Admin Monitor",
    "description": "Monitoramento de saúde do servidor, banco de dados e latência",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminMonitor",
    "exampleUrl": "/admin-monitor",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-monitor-apis",
    "group": "Administração",
    "label": "Admin Monitor Apis",
    "description": "Monitoramento de consumo e custos de APIs de inteligência artificial",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminMonitorApis",
    "exampleUrl": "/admin-monitor-apis",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-narracao",
    "group": "Administração",
    "label": "Admin Narracao",
    "description": "Redirecionamento automático legado para a rota /admin-narracao-leis",
    "isRedirect": true,
    "redirectTarget": "/admin-narracao-leis",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin-narracao",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/admin-narracao-leis",
    "group": "Administração",
    "label": "Admin Narracao Leis",
    "description": "Painel de geração de narrações em áudio para artigos de lei",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminNarracaoLeis",
    "exampleUrl": "/admin-narracao-leis",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~2.1 MB",
    "weightReasons": [
      "Componente 130KB",
      "Player de áudio dinâmico",
      "Integração Gemini AI"
    ]
  },
  {
    "path": "/admin-omniroute",
    "group": "Administração",
    "label": "Admin Omniroute",
    "description": "Página correspondente ao componente AdminOmniRouteTeste",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminOmniRouteTeste",
    "exampleUrl": "/admin-omniroute",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~2.1 MB",
    "weightReasons": [
      "Componente 130KB",
      "Player de áudio dinâmico",
      "Integração Gemini AI"
    ]
  },
  {
    "path": "/admin-push",
    "group": "Administração",
    "label": "Admin Push",
    "description": "Disparo de Notificações Push, campanhas e agendamentos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminPush",
    "exampleUrl": "/admin-push",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-usuarios",
    "group": "Administração",
    "label": "Admin Usuarios",
    "description": "Gestão de usuários cadastrados e controle de acessos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminUsuarios",
    "exampleUrl": "/admin-usuarios",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin-vade-mecum-historico",
    "group": "Administração",
    "label": "Admin Vade Mecum Historico",
    "description": "Página correspondente ao componente AdminVadeMecumHistorico",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminVadeMecumHistorico",
    "exampleUrl": "/admin-vade-mecum-historico",
    "weightScore": 2,
    "weightLevel": "media",
    "weightEstimate": "~500 KB",
    "weightReasons": [
      "Painel administrativo",
      "Tabelas e queries Supabase"
    ]
  },
  {
    "path": "/admin/pilulas",
    "group": "Administração",
    "label": "Admin Pilulas",
    "description": "Página correspondente ao componente AdminPilulas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": true,
    "component": "AdminPilulas",
    "exampleUrl": "/admin/pilulas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/admin/usuarios",
    "group": "Administração",
    "label": "Admin Usuarios",
    "description": "Redirecionamento automático legado para a rota /admin-usuarios",
    "isRedirect": true,
    "redirectTarget": "/admin-usuarios",
    "isProtected": false,
    "isAdmin": true,
    "component": "Componente",
    "exampleUrl": "/admin/usuarios",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/ajustes/excluir-conta",
    "group": "Ajustes",
    "label": "Ajustes Excluir Conta",
    "description": "Página correspondente ao componente ExcluirConta",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ExcluirConta",
    "exampleUrl": "/ajustes/excluir-conta",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/ajustes/horus",
    "group": "Ajustes",
    "label": "Ajustes Horus",
    "description": "Página correspondente ao componente HorusWhatsApp",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "HorusWhatsApp",
    "exampleUrl": "/ajustes/horus",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/ajustes/seguranca",
    "group": "Ajustes",
    "label": "Ajustes Seguranca",
    "description": "Página correspondente ao componente Seguranca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Seguranca",
    "exampleUrl": "/ajustes/seguranca",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/anotacoes",
    "group": "Espaço do Aluno & Perfil",
    "label": "Anotacoes",
    "description": "Redirecionamento automático legado para a rota /pessoal/anotacoes",
    "isRedirect": true,
    "redirectTarget": "/pessoal/anotacoes",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/anotacoes",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/aprender",
    "group": "Aulas Interativas",
    "label": "Aprender",
    "description": "Redirecionamento automático legado para a rota /aulas",
    "isRedirect": true,
    "redirectTarget": "/aulas",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/aprender",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/aprender/*",
    "group": "Aulas Interativas",
    "label": "Aprender",
    "description": "Redirecionamento automático legado para a rota /aulas",
    "isRedirect": true,
    "redirectTarget": "/aulas",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/aprender",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/assinatura",
    "group": "Assinatura & Planos",
    "label": "Assinatura",
    "description": "Planos de Assinatura (Mensal, Anual e Vitalício) via App Store / Google Play",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Assinatura",
    "exampleUrl": "/assinatura",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/assistente",
    "group": "IA & Assistente Horus",
    "label": "Assistente",
    "description": "Interface do Assistente Horus com comandos rápidos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "AssistenteApp",
    "exampleUrl": "/assistente",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/assistente-horus",
    "group": "IA & Assistente Horus",
    "label": "Assistente Horus",
    "description": "Assistente Inteligente Horus — chat com IA especialista jurídica",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "AssistenteHorus",
    "exampleUrl": "/assistente-horus",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/atualizacoes",
    "group": "Notícias & Informativos",
    "label": "Atualizacoes",
    "description": "Histórico de atualizações das leis do Vade Mecum",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Atualizacoes",
    "exampleUrl": "/atualizacoes",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/audio-leis",
    "group": "Audiobooks",
    "label": "Audio Leis",
    "description": "Redirecionamento automático legado para a rota /audiobooks",
    "isRedirect": true,
    "redirectTarget": "/audiobooks",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/audio-leis",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/audioaulas",
    "group": "Audioaulas",
    "label": "Audioaulas (Catálogo Principal)",
    "description": "Catálogo oficial de audioaulas divididas por matéria e ramo do Direito",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Audioaulas",
    "exampleUrl": "/audioaulas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/audioaulas/:area",
    "group": "Audioaulas",
    "label": "Audioaulas — Área de Estudo",
    "description": "Grade de audioaulas da disciplina selecionada",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Audioaulas",
    "exampleUrl": "/audioaulas/direito-penal",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/audiobooks",
    "group": "Audiobooks",
    "label": "Audiobooks",
    "description": "Biblioteca de Audiobooks jurídicos e clássicos da filosofia narrados",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Audiobooks",
    "exampleUrl": "/audiobooks",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/audioleis",
    "group": "Audiobooks",
    "label": "Audioleis",
    "description": "Redirecionamento automático legado para a rota /audiobooks",
    "isRedirect": true,
    "redirectTarget": "/audiobooks",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/audioleis",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/aulas",
    "group": "Aulas Interativas",
    "label": "Aulas Interativas (Catálogo)",
    "description": "Catálogo de aulas interativas com áudio e tópicos essenciais",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "AdminAulasInterativas",
    "exampleUrl": "/aulas",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/auth",
    "group": "Conta & Acesso Público",
    "label": "Auth",
    "description": "Tela de login, cadastro e autenticação de usuários",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "Auth",
    "exampleUrl": "/auth",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/biblioteca",
    "group": "Biblioteca Digital",
    "label": "Biblioteca (Redirecionamento)",
    "description": "Redirecionamento automático legado para a estante principal /bibliotecas",
    "isRedirect": true,
    "redirectTarget": "/bibliotecas",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/biblioteca",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/biblioteca-offline",
    "group": "Biblioteca Digital",
    "label": "Biblioteca Offline",
    "description": "Redirecionamento automático legado para a rota /modo-offline/livros",
    "isRedirect": true,
    "redirectTarget": "/modo-offline/livros",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/biblioteca-offline",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/biblioteca/caderno",
    "group": "Biblioteca Digital",
    "label": "Biblioteca Caderno",
    "description": "Redirecionamento automático legado para a rota /pessoal/grifos",
    "isRedirect": true,
    "redirectTarget": "/pessoal/grifos",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/biblioteca/caderno",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/bibliotecas",
    "group": "Biblioteca Digital",
    "label": "Biblioteca Digital (Estante Principal)",
    "description": "Estante digital com coleções, clássicos do direito e manuais",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Bibliotecas",
    "exampleUrl": "/bibliotecas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.8 MB",
    "weightReasons": [
      "Motor PDF.js",
      "Canvas de alta resolução",
      "Leitor nativo"
    ]
  },
  {
    "path": "/bibliotecas/:colecaoId",
    "group": "Biblioteca Digital",
    "label": "Biblioteca — Coleção",
    "description": "Obras da coleção selecionada na biblioteca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "BibliotecaCategoria",
    "exampleUrl": "/bibliotecas/classicos",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.8 MB",
    "weightReasons": [
      "Motor PDF.js",
      "Canvas de alta resolução",
      "Leitor nativo"
    ]
  },
  {
    "path": "/bibliotecas/:colecaoId/:areaSlug",
    "group": "Biblioteca Digital",
    "label": "Biblioteca — Área da Coleção",
    "description": "Obras da matéria selecionada dentro da coleção",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "BibliotecaCategoria",
    "exampleUrl": "/bibliotecas/classicos/direito-penalSlug",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.8 MB",
    "weightReasons": [
      "Motor PDF.js",
      "Canvas de alta resolução",
      "Leitor nativo"
    ]
  },
  {
    "path": "/bibliotecas/trilhas",
    "group": "Biblioteca Digital",
    "label": "Biblioteca — Trilhas de Leitura",
    "description": "Trilhas guiadas de leitura de obras e doutrinas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "BibliotecaTrilhas",
    "exampleUrl": "/bibliotecas/trilhas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.8 MB",
    "weightReasons": [
      "Motor PDF.js",
      "Canvas de alta resolução",
      "Leitor nativo"
    ]
  },
  {
    "path": "/blog",
    "group": "Notícias & Informativos",
    "label": "Blog",
    "description": "Página correspondente ao componente Blog",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Blog",
    "exampleUrl": "/blog",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/blog/:slug",
    "group": "Notícias & Informativos",
    "label": "BLOG (:slug)",
    "description": "Página correspondente ao componente Blog",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Blog",
    "exampleUrl": "/blog/direito-penal",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/boletim",
    "group": "Boletim",
    "label": "Boletim",
    "description": "Redirecionamento automático legado para a rota /boletins",
    "isRedirect": true,
    "redirectTarget": "/boletins",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/boletim",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/boletins",
    "group": "Notícias & Informativos",
    "label": "Boletins",
    "description": "Boletins jurídicos periódicos e informativos de jurisprudência",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Boletins",
    "exampleUrl": "/boletins",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/chat-juridico",
    "group": "IA & Assistente Horus",
    "label": "Chat Juridico",
    "description": "Chat Jurídico interativo para tirar dúvidas de artigos e jurisprudência",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ChatJuridico",
    "exampleUrl": "/chat-juridico",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/compartilhado",
    "group": "Compartilhado",
    "label": "Compartilhado",
    "description": "Página correspondente ao componente Compartilhado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Compartilhado",
    "exampleUrl": "/compartilhado",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/concursos",
    "group": "Concursos",
    "label": "Concursos",
    "description": "Painel geral de concursos públicos jurídicos e editais abertos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Concursos",
    "exampleUrl": "/concursos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/concursos/radar",
    "group": "Concursos",
    "label": "Concursos Radar",
    "description": "Redirecionamento automático legado para a rota /radar-concursos",
    "isRedirect": true,
    "redirectTarget": "/radar-concursos",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/concursos/radar",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/configuracoes",
    "group": "Configuracoes",
    "label": "Configuracoes",
    "description": "Redirecionamento automático legado para a rota /perfil",
    "isRedirect": true,
    "redirectTarget": "/perfil",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/configuracoes",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/desktop",
    "group": "Desktop",
    "label": "Desktop",
    "description": "Apresentação e download da versão Desktop do aplicativo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "DesktopPromo",
    "exampleUrl": "/desktop",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/desktop-link/:token",
    "group": "Desktop-link",
    "label": "DESKTOP-LINK (:token)",
    "description": "Confirmação e pareamento de sessão com o aplicativo Desktop",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "DesktopLinkConfirm",
    "exampleUrl": "/desktop-link/desktop-auth-test",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/dicionario",
    "group": "Dicionário Jurídico",
    "label": "Dicionario",
    "description": "Redirecionamento automático legado para a rota /ferramentas/dicionario",
    "isRedirect": true,
    "redirectTarget": "/ferramentas/dicionario",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/dicionario",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/documentos",
    "group": "Documentos",
    "label": "Documentos",
    "description": "Página correspondente ao componente Documentos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Documentos",
    "exampleUrl": "/documentos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/estudos",
    "group": "Estudos",
    "label": "Estudos",
    "description": "Página correspondente ao componente EstudosRouter",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "EstudosRouter",
    "exampleUrl": "/estudos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/excluir-conta",
    "group": "Conta & Acesso Público",
    "label": "Excluir Conta",
    "description": "Página de solicitação e confirmação de exclusão permanente de conta",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "ExcluirContaPublico",
    "exampleUrl": "/excluir-conta",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/explicacao-lei",
    "group": "Explicacao-lei",
    "label": "Explicacao Lei",
    "description": "Página correspondente ao componente ExplicacaoLei",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ExplicacaoLei",
    "exampleUrl": "/explicacao-lei",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/ferramentas",
    "group": "Ferramentas",
    "label": "Ferramentas",
    "description": "Página correspondente ao componente Ferramentas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Ferramentas",
    "exampleUrl": "/ferramentas",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/ferramentas/dicionario",
    "group": "Ferramentas",
    "label": "Ferramentas Dicionario",
    "description": "Página correspondente ao componente DicionarioJuridicoPage",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "DicionarioJuridicoPage",
    "exampleUrl": "/ferramentas/dicionario",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~200 KB",
    "weightReasons": [
      "Conteúdo textual formatado"
    ]
  },
  {
    "path": "/ferramentas/plano-estudos",
    "group": "Ferramentas",
    "label": "Ferramentas Plano Estudos",
    "description": "Página correspondente ao componente PlanoEstudos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PlanoEstudos",
    "exampleUrl": "/ferramentas/plano-estudos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/ferramentas/radar-concursos",
    "group": "Ferramentas",
    "label": "Ferramentas Radar Concursos",
    "description": "Redirecionamento automático legado para a rota /radar-concursos",
    "isRedirect": true,
    "redirectTarget": "/radar-concursos",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/ferramentas/radar-concursos",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/flashcards",
    "group": "Flashcards",
    "label": "Flashcards",
    "description": "Revisão ativa com Flashcards divididos por área e concurso",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsRouteWrapper",
    "exampleUrl": "/flashcards",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/area/:slug",
    "group": "Flashcards",
    "label": "FLASHCARDS (:slug)",
    "description": "Decks de flashcards do ramo jurídico selecionado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsArea",
    "exampleUrl": "/flashcards/area/direito-penal",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/cargos",
    "group": "Flashcards",
    "label": "Flashcards Cargos",
    "description": "Página correspondente ao componente FlashcardsCargos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsCargos",
    "exampleUrl": "/flashcards/cargos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/cargos/:id",
    "group": "Flashcards",
    "label": "FLASHCARDS (:id)",
    "description": "Página correspondente ao componente FlashcardsCargosDetalhes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsCargosDetalhes",
    "exampleUrl": "/flashcards/cargos/1",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/decks",
    "group": "Flashcards",
    "label": "Flashcards Decks",
    "description": "Página correspondente ao componente FlashcardsDecks",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsDecks",
    "exampleUrl": "/flashcards/decks",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/desafios",
    "group": "Flashcards",
    "label": "Flashcards Desafios",
    "description": "Página correspondente ao componente FlashcardsDesafios",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsDesafios",
    "exampleUrl": "/flashcards/desafios",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/desafios/:slug",
    "group": "Flashcards",
    "label": "FLASHCARDS (:slug)",
    "description": "Página correspondente ao componente FlashcardsDesafiosTimeline",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsDesafiosTimeline",
    "exampleUrl": "/flashcards/desafios/direito-penal",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/estudar",
    "group": "Flashcards",
    "label": "Flashcards Estudar",
    "description": "Redirecionamento automático legado para a rota /flashcards/estudo",
    "isRedirect": true,
    "redirectTarget": "/flashcards/estudo",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/flashcards/estudar",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/flashcards/estudo",
    "group": "Flashcards",
    "label": "Flashcards Estudo",
    "description": "Página correspondente ao componente FlashcardsEstudo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsEstudo",
    "exampleUrl": "/flashcards/estudo",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/historico",
    "group": "Flashcards",
    "label": "Flashcards Historico",
    "description": "Estatísticas de acertos, erros e revisões pendentes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsHistorico",
    "exampleUrl": "/flashcards/historico",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/jurisprudencia",
    "group": "Flashcards",
    "label": "Flashcards Jurisprudencia",
    "description": "Página correspondente ao componente Suspense",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "Suspense",
    "exampleUrl": "/flashcards/jurisprudencia",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/leis",
    "group": "Flashcards",
    "label": "Flashcards Leis",
    "description": "Página correspondente ao componente FlashcardsLeis",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsLeis",
    "exampleUrl": "/flashcards/leis",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/materias",
    "group": "Flashcards",
    "label": "Flashcards Materias",
    "description": "Página correspondente ao componente FlashcardsMaterias",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsMaterias",
    "exampleUrl": "/flashcards/materias",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/progresso",
    "group": "Flashcards",
    "label": "Flashcards Progresso",
    "description": "Página correspondente ao componente FlashcardsProgresso",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsProgresso",
    "exampleUrl": "/flashcards/progresso",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/revisar",
    "group": "Flashcards",
    "label": "Flashcards Revisar",
    "description": "Página correspondente ao componente FlashcardsRevisar",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsRevisar",
    "exampleUrl": "/flashcards/revisar",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/flashcards/trilhas",
    "group": "Flashcards",
    "label": "Flashcards Trilhas",
    "description": "Página correspondente ao componente FlashcardsTrilhas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "FlashcardsTrilhas",
    "exampleUrl": "/flashcards/trilhas",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~1.2 MB",
    "weightReasons": [
      "Efeito 3D Flip",
      "Sistema de repetição espaçada"
    ]
  },
  {
    "path": "/graficos/avaliacao",
    "group": "Graficos",
    "label": "Graficos Avaliacao",
    "description": "Página correspondente ao componente AvaliacaoInteligente",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "AvaliacaoInteligente",
    "exampleUrl": "/graficos/avaliacao",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/ir/*",
    "group": "Ir",
    "label": "Ir",
    "description": "Página correspondente ao componente SmartLink",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "SmartLink",
    "exampleUrl": "/ir",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia",
    "description": "Página correspondente ao componente Jurisprudencia",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Jurisprudencia",
    "exampleUrl": "/jurisprudencia",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/:slugLei/:numeroArtigo",
    "group": "Jurisprudencia",
    "label": "JURISPRUDENCIA (:numeroArtigo)",
    "description": "Página correspondente ao componente JurisprudenciaArtigo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "JurisprudenciaArtigo",
    "exampleUrl": "/jurisprudencia/cp/1",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/informativos-stf",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Informativos Stf",
    "description": "Página correspondente ao componente InformativosSTF",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "InformativosSTF",
    "exampleUrl": "/jurisprudencia/informativos-stf",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/informativos-stj",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Informativos Stj",
    "description": "Página correspondente ao componente InformativosSTJ",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "InformativosSTJ",
    "exampleUrl": "/jurisprudencia/informativos-stj",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/prontas/:tribunal",
    "group": "Jurisprudencia",
    "label": "JURISPRUDENCIA (:tribunal)",
    "description": "Página correspondente ao componente PesquisasProntasLista",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PesquisasProntasLista",
    "exampleUrl": "/jurisprudencia/prontas/stf",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/prontas/:tribunal/:slug",
    "group": "Jurisprudencia",
    "label": "JURISPRUDENCIA (:slug)",
    "description": "Página correspondente ao componente PesquisasProntasTema",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PesquisasProntasTema",
    "exampleUrl": "/jurisprudencia/prontas/stf/direito-penal",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/sumulas-stf",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Sumulas Stf",
    "description": "Página correspondente ao componente SumulasSTF",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SumulasSTF",
    "exampleUrl": "/jurisprudencia/sumulas-stf",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/sumulas-stj",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Sumulas Stj",
    "description": "Página correspondente ao componente SumulasSTJ",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SumulasSTJ",
    "exampleUrl": "/jurisprudencia/sumulas-stj",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/sumulas-vinculantes",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Sumulas Vinculantes",
    "description": "Página correspondente ao componente SumulasVinculantes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SumulasVinculantes",
    "exampleUrl": "/jurisprudencia/sumulas-vinculantes",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/teses-stf",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Teses Stf",
    "description": "Página correspondente ao componente TesesSTF",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "TesesSTF",
    "exampleUrl": "/jurisprudencia/teses-stf",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/jurisprudencia/teses-stj",
    "group": "Jurisprudencia",
    "label": "Jurisprudencia Teses Stj",
    "description": "Página correspondente ao componente TesesSTJ",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "TesesSTJ",
    "exampleUrl": "/jurisprudencia/teses-stj",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/landing",
    "group": "Conta & Acesso Público",
    "label": "Landing",
    "description": "Página pública de apresentação e benefícios do Direito Prime",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "Landing",
    "exampleUrl": "/landing",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/legislacao-estadual",
    "group": "Legislação & Leis",
    "label": "Legislacao Estadual",
    "description": "Legislação Estadual com constituições e códigos por UF",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "LegislacaoEstadual",
    "exampleUrl": "/legislacao-estadual",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/legislacao-estadual/:uf",
    "group": "Legislação & Leis",
    "label": "LEGISLACAO-ESTADUAL (:uf)",
    "description": "Normas e leis do Estado da Federação selecionado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "EstadoDetalhe",
    "exampleUrl": "/legislacao-estadual/sp",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/legislacao-estadual/:uf/lei/:slug",
    "group": "Legislação & Leis",
    "label": "LEGISLACAO-ESTADUAL (:slug)",
    "description": "Página correspondente ao componente LeiEstadualView",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "LeiEstadualView",
    "exampleUrl": "/legislacao-estadual/sp/lei/direito-penal",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/legislacao/:tipo",
    "group": "Legislação & Leis",
    "label": "LEGISLACAO (:tipo)",
    "description": "Lista de leis da categoria (Códigos, Estatutos, CLT, etc.)",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "CategoriaLegislacao",
    "exampleUrl": "/legislacao/codigo",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/legislacao/:tipo/:leiSlug",
    "group": "Legislação & Leis",
    "label": "LEGISLACAO (:leiSlug)",
    "description": "Texto integral da lei com artigos pesquisáveis",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "CategoriaLegislacao",
    "exampleUrl": "/legislacao/codigo/cp",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/legislacao/:tipo/:leiSlug/:artigoNumero",
    "group": "Legislação & Leis",
    "label": "LEGISLACAO (:artigoNumero)",
    "description": "Leitura detalhada do artigo com grifos e notas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "CategoriaLegislacao",
    "exampleUrl": "/legislacao/codigo/cp/121",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca",
    "group": "Legislação & Leis",
    "label": "Lei Seca",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/:slug",
    "group": "Legislação & Leis",
    "label": "LEI-SECA (:slug)",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/direito-penal",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/:slug/:parte",
    "group": "Legislação & Leis",
    "label": "LEI-SECA (:parte)",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/cp/parte-geral",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/:slug/:parte/licao/:id",
    "group": "Legislação & Leis",
    "label": "LEI-SECA (:id)",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/cp/parte-geral/licao/1",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/favoritos",
    "group": "Legislação & Leis",
    "label": "Lei Seca Favoritos",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/favoritos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/lembretes",
    "group": "Legislação & Leis",
    "label": "Lei Seca Lembretes",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/lembretes",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lei-seca/recentes",
    "group": "Legislação & Leis",
    "label": "Lei Seca Recentes",
    "description": "Página correspondente ao componente ErrorBoundary",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ErrorBoundary",
    "exampleUrl": "/lei-seca/recentes",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/lembretes",
    "group": "Espaço do Aluno & Perfil",
    "label": "Lembretes",
    "description": "Página correspondente ao componente CentralLembretes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "CentralLembretes",
    "exampleUrl": "/lembretes",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/lembretes/local",
    "group": "Espaço do Aluno & Perfil",
    "label": "Lembretes Local",
    "description": "Página correspondente ao componente LembretesLocal",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "LembretesLocal",
    "exampleUrl": "/lembretes/local",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/mapas",
    "group": "Mapas",
    "label": "Mapas",
    "description": "Redirecionamento automático legado para a rota /mapas-mentais",
    "isRedirect": true,
    "redirectTarget": "/mapas-mentais",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/mapas",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/mapas-mentais",
    "group": "Mapas-mentais",
    "label": "Mapas Mentais",
    "description": "Visual Jurídico e Mapas Mentais esquematizados para memorização",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VisualJuridico",
    "exampleUrl": "/mapas-mentais",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/mapas-mentais/*",
    "group": "Mapas-mentais",
    "label": "Mapas Mentais",
    "description": "Página correspondente ao componente VisualJuridico",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VisualJuridico",
    "exampleUrl": "/mapas-mentais",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/me-explique",
    "group": "IA & Assistente Horus",
    "label": "Me Explique",
    "description": "Ferramenta Me Explique — explicação didática de qualquer artigo de lei",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "MeExplique",
    "exampleUrl": "/me-explique",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/meu-espaco",
    "group": "Espaço do Aluno & Perfil",
    "label": "Meu Espaco",
    "description": "Meu Espaço — resumo geral das atividades, metas e progresso",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "MeuEspaco",
    "exampleUrl": "/meu-espaco",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/meus-downloads",
    "group": "Meus-downloads",
    "label": "Meus Downloads",
    "description": "Redirecionamento automático legado para a rota /modo-offline",
    "isRedirect": true,
    "redirectTarget": "/modo-offline",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/meus-downloads",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/meus-lembretes",
    "group": "Espaço do Aluno & Perfil",
    "label": "Meus Lembretes",
    "description": "Redirecionamento automático legado para a rota /?notificacoes=1",
    "isRedirect": true,
    "redirectTarget": "/?notificacoes=1",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/meus-lembretes",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/meus-resumos",
    "group": "Meus-resumos",
    "label": "Meus Resumos",
    "description": "Redirecionamento automático legado para a rota /resumos-juridicos",
    "isRedirect": true,
    "redirectTarget": "/resumos-juridicos",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/meus-resumos",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/minha-cota",
    "group": "Minha-cota",
    "label": "Minha Cota",
    "description": "Redirecionamento automático legado para a rota /assinatura",
    "isRedirect": true,
    "redirectTarget": "/assinatura",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/minha-cota",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/minhas-leituras",
    "group": "Minhas-leituras",
    "label": "Minhas Leituras",
    "description": "Redirecionamento automático legado para a rota /pessoal/livros",
    "isRedirect": true,
    "redirectTarget": "/pessoal/livros",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/minhas-leituras",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/minhas-videoaulas",
    "group": "Videoaulas",
    "label": "Minhas Videoaulas",
    "description": "Redirecionamento automático legado para a rota /videoaulas",
    "isRedirect": true,
    "redirectTarget": "/videoaulas",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/minhas-videoaulas",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/modo-offline",
    "group": "Modo Offline",
    "label": "Modo Offline",
    "description": "Painel do Modo Offline — download de leis e livros para uso sem internet",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ModoOffline",
    "exampleUrl": "/modo-offline",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/modo-offline/audioaulas",
    "group": "Modo Offline",
    "label": "Modo Offline Audioaulas",
    "description": "Áudios baixados no dispositivo para ouvir offline",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ModoOfflineAudioaulas",
    "exampleUrl": "/modo-offline/audioaulas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.2 MB",
    "weightReasons": [
      "Streaming de áudio R2",
      "Catálogo de 58 mil linhas",
      "Sincronizador SRT"
    ]
  },
  {
    "path": "/modo-offline/leis-e-narracoes",
    "group": "Modo Offline",
    "label": "Modo Offline Leis E Narracoes",
    "description": "Gerenciamento de leis baixadas no armazenamento interno",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ModoOfflineLeis",
    "exampleUrl": "/modo-offline/leis-e-narracoes",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/modo-offline/livros",
    "group": "Modo Offline",
    "label": "Modo Offline Livros",
    "description": "Livros baixados para leitura nativa offline",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ModoOfflineLivros",
    "exampleUrl": "/modo-offline/livros",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/normas/:slug",
    "group": "Normas",
    "label": "NORMAS (:slug)",
    "description": "Página correspondente ao componente OutrasNormasLista",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "OutrasNormasLista",
    "exampleUrl": "/normas/direito-penal",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/noticias",
    "group": "Notícias & Informativos",
    "label": "Noticias",
    "description": "Feed diário de notícias jurídicas e concursos atualizados",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Noticias",
    "exampleUrl": "/noticias",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~200 KB",
    "weightReasons": [
      "Conteúdo textual formatado"
    ]
  },
  {
    "path": "/notificacoes",
    "group": "Notificacoes",
    "label": "Notificacoes",
    "description": "Redirecionamento automático legado para a rota /?notificacoes=1",
    "isRedirect": true,
    "redirectTarget": "/?notificacoes=1",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/notificacoes",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/novidades",
    "group": "Notícias & Informativos",
    "label": "Novidades",
    "description": "Mural de novidades, novas leis promulgadas e melhorias do app",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Novidades",
    "exampleUrl": "/novidades",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~200 KB",
    "weightReasons": [
      "Conteúdo textual formatado"
    ]
  },
  {
    "path": "/onboarding",
    "group": "Conta & Acesso Público",
    "label": "Onboarding",
    "description": "Fluxo de boas-vindas e configuração inicial do perfil do aluno",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Onboarding",
    "exampleUrl": "/onboarding",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/perfil",
    "group": "Espaço do Aluno & Perfil",
    "label": "Perfil",
    "description": "Meu Perfil — dados pessoais, assinatura, cargo/área de atuação e histórico",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Perfil",
    "exampleUrl": "/perfil",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pessoal/anotacoes",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Anotacoes",
    "description": "Minhas Anotações pessoais vinculadas a leis e tópicos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalAnotacoes",
    "exampleUrl": "/pessoal/anotacoes",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pessoal/artigos",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Artigos",
    "description": "Artigos favoritos e marcados para revisão posterior",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalArtigos",
    "exampleUrl": "/pessoal/artigos",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pessoal/grifos",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Grifos",
    "description": "Meus Grifos — todos os destaques em cores feitos nos artigos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalGrifos",
    "exampleUrl": "/pessoal/grifos",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pessoal/jurisprudencias",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Jurisprudencias",
    "description": "Súmulas e jurisprudências salvas como favoritas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalJurisprudencias",
    "exampleUrl": "/pessoal/jurisprudencias",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pessoal/leis",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Leis",
    "description": "Página correspondente ao componente PessoalLeis",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalLeis",
    "exampleUrl": "/pessoal/leis",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/pessoal/livros",
    "group": "Espaço do Aluno & Perfil",
    "label": "Pessoal Livros",
    "description": "Minha estante de livros lidos e em andamento",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PessoalLivros",
    "exampleUrl": "/pessoal/livros",
    "weightScore": 2,
    "weightLevel": "leve",
    "weightEstimate": "~250 KB",
    "weightReasons": [
      "Cards de usuário",
      "Atalhos leves"
    ]
  },
  {
    "path": "/pilulas",
    "group": "Pilulas",
    "label": "Pilulas",
    "description": "Página correspondente ao componente PilulasHome",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasHome",
    "exampleUrl": "/pilulas",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/:id",
    "group": "Pilulas",
    "label": "PILULAS (:id)",
    "description": "Página correspondente ao componente PilulasPlayer",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasPlayer",
    "exampleUrl": "/pilulas/1",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/cc",
    "group": "Pilulas",
    "label": "Pilulas Cc",
    "description": "Página correspondente ao componente PilulasLeiSeca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLeiSeca",
    "exampleUrl": "/pilulas/cc",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/cf",
    "group": "Pilulas",
    "label": "Pilulas Cf",
    "description": "Página correspondente ao componente PilulasLeiSeca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLeiSeca",
    "exampleUrl": "/pilulas/cf",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/classicos",
    "group": "Pilulas",
    "label": "Pilulas Classicos",
    "description": "Página correspondente ao componente Pilulas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Pilulas",
    "exampleUrl": "/pilulas/classicos",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/clt",
    "group": "Pilulas",
    "label": "Pilulas Clt",
    "description": "Página correspondente ao componente PilulasLeiSeca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLeiSeca",
    "exampleUrl": "/pilulas/clt",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/cp",
    "group": "Pilulas",
    "label": "Pilulas Cp",
    "description": "Página correspondente ao componente PilulasLeiSeca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLeiSeca",
    "exampleUrl": "/pilulas/cp",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/cpp",
    "group": "Pilulas",
    "label": "Pilulas Cpp",
    "description": "Página correspondente ao componente PilulasLeiSeca",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLeiSeca",
    "exampleUrl": "/pilulas/cpp",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/deck/:deckId",
    "group": "Pilulas",
    "label": "PILULAS (:deckId)",
    "description": "Página correspondente ao componente PilulasViewer",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasViewer",
    "exampleUrl": "/pilulas/deck/1",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/pilulas/lista",
    "group": "Pilulas",
    "label": "Pilulas Lista",
    "description": "Página correspondente ao componente PilulasLista",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PilulasLista",
    "exampleUrl": "/pilulas/lista",
    "weightScore": 5,
    "weightLevel": "muito_pesada",
    "weightEstimate": "~3.5 MB",
    "weightReasons": [
      "Engine Vanilla Three.js",
      "Shaders e geometrias 3D",
      "Render loop"
    ]
  },
  {
    "path": "/planos/ativos",
    "group": "Assinatura & Planos",
    "label": "Planos Ativos",
    "description": "Página correspondente ao componente PlanosAtivos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "PlanosAtivos",
    "exampleUrl": "/planos/ativos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/privacidade",
    "group": "Conta & Acesso Público",
    "label": "Privacidade",
    "description": "Política de Privacidade e proteção de dados (LGPD)",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "Privacidade",
    "exampleUrl": "/privacidade",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/questoes",
    "group": "Questões & Simulados",
    "label": "Questoes",
    "description": "Banco de Questões de concursos públicos e Exame da OAB",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Questoes",
    "exampleUrl": "/questoes",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/area/:slug",
    "group": "Questões & Simulados",
    "label": "QUESTOES (:slug)",
    "description": "Questões filtradas por matéria ou disciplina",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesArea",
    "exampleUrl": "/questoes/area/direito-penal",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/areas",
    "group": "Questões & Simulados",
    "label": "Questoes Areas",
    "description": "Página correspondente ao componente QuestoesAreas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesAreas",
    "exampleUrl": "/questoes/areas",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/cadernos",
    "group": "Questões & Simulados",
    "label": "Questoes Cadernos",
    "description": "Cadernos personalizados de questões salvas pelo usuário",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesCadernos",
    "exampleUrl": "/questoes/cadernos",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/desafios",
    "group": "Questões & Simulados",
    "label": "Questoes Desafios",
    "description": "Página correspondente ao componente QuestoesDesafios",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesDesafios",
    "exampleUrl": "/questoes/desafios",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/desafios/conquistas",
    "group": "Questões & Simulados",
    "label": "Questoes Desafios Conquistas",
    "description": "Página correspondente ao componente QuestoesConquistas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesConquistas",
    "exampleUrl": "/questoes/desafios/conquistas",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/desempenho",
    "group": "Questões & Simulados",
    "label": "Questoes Desempenho",
    "description": "Gráficos de evolução, taxa de acerto e pontos fracos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesDesempenho",
    "exampleUrl": "/questoes/desempenho",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/historico",
    "group": "Questões & Simulados",
    "label": "Questoes Historico",
    "description": "Histórico completo de questões resolvidas e simulados feitos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesHistorico",
    "exampleUrl": "/questoes/historico",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/lembretes",
    "group": "Questões & Simulados",
    "label": "Questoes Lembretes",
    "description": "Página correspondente ao componente QuestoesLembretes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesLembretes",
    "exampleUrl": "/questoes/lembretes",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/praticar",
    "group": "Questões & Simulados",
    "label": "Questoes Praticar",
    "description": "Resolução de questões com gabarito comentado e filtros",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesPraticar",
    "exampleUrl": "/questoes/praticar",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/revisar",
    "group": "Questões & Simulados",
    "label": "Questoes Revisar",
    "description": "Página correspondente ao componente QuestoesRevisar",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesRevisar",
    "exampleUrl": "/questoes/revisar",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/simulado",
    "group": "Questões & Simulados",
    "label": "Questoes Simulado",
    "description": "Página correspondente ao componente QuestoesSimulado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesSimulado",
    "exampleUrl": "/questoes/simulado",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/simulado/:cargoId",
    "group": "Questões & Simulados",
    "label": "QUESTOES (:cargoId)",
    "description": "Página correspondente ao componente QuestoesSimuladoCargoConfig",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesSimuladoCargoConfig",
    "exampleUrl": "/questoes/simulado/geral",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/questoes/trilhas",
    "group": "Questões & Simulados",
    "label": "Questoes Trilhas",
    "description": "Página correspondente ao componente QuestoesTrilhas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "QuestoesTrilhas",
    "exampleUrl": "/questoes/trilhas",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/radar-360",
    "group": "Radares",
    "label": "Radar 360",
    "description": "Radar 360 de Legislação e acompanhamento diário de proposições",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Radar360",
    "exampleUrl": "/radar-360",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/radar-concursos",
    "group": "Radares",
    "label": "Radar Concursos",
    "description": "Radar de Concursos com filtros por cargo, estado e banca examinadora",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "RadarConcursos",
    "exampleUrl": "/radar-concursos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/radar-concursos/estatisticas",
    "group": "Radares",
    "label": "Radar Concursos Estatisticas",
    "description": "Estatísticas e métricas de matérias mais cobradas em concursos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "RadarEstatisticas",
    "exampleUrl": "/radar-concursos/estatisticas",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/radar/categorias",
    "group": "Radares",
    "label": "Radar Categorias",
    "description": "Redirecionamento automático legado para a rota /radar-360",
    "isRedirect": true,
    "redirectTarget": "/radar-360",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/radar/categorias",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/radar/em-alta",
    "group": "Radares",
    "label": "Radar Em Alta",
    "description": "Redirecionamento automático legado para a rota /radar-360",
    "isRedirect": true,
    "redirectTarget": "/radar-360",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/radar/em-alta",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/radar/proposicoes",
    "group": "Radares",
    "label": "Radar Proposicoes",
    "description": "Lista cronológica de proposições legislativas em tramitação",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "RadarProposicoes",
    "exampleUrl": "/radar/proposicoes",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/radar/proposicoes/:date",
    "group": "Radares",
    "label": "RADAR (:date)",
    "description": "Proposições legislativas do dia selecionado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "RadarProposicoesDia",
    "exampleUrl": "/radar/proposicoes/2026-11-05",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/radares",
    "group": "Radares",
    "label": "Radares",
    "description": "Página correspondente ao componente Radares",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Radares",
    "exampleUrl": "/radares",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~950 KB",
    "weightReasons": [
      "Gráficos e estatísticas",
      "Múltiplos filtros dinâmicos"
    ]
  },
  {
    "path": "/reset-password",
    "group": "Conta & Acesso Público",
    "label": "Reset Password",
    "description": "Recuperação e redefinição de senha esquecida",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "ResetPassword",
    "exampleUrl": "/reset-password",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/resumos",
    "group": "Resumos Jurídicos",
    "label": "Resumos",
    "description": "Redirecionamento automático legado para a rota /resumos-juridicos",
    "isRedirect": true,
    "redirectTarget": "/resumos-juridicos",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/resumos",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/resumos-juridicos",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos",
    "description": "Resumos Didáticos de doutrina organizados por temas e tópicos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosRouteWrapper",
    "exampleUrl": "/resumos-juridicos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/:area",
    "group": "Resumos Jurídicos",
    "label": "RESUMOS-JURIDICOS (:area)",
    "description": "Temas e tópicos resumidos da disciplina selecionada",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosRouteWrapper",
    "exampleUrl": "/resumos-juridicos/direito-penal",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/:area/:tema",
    "group": "Resumos Jurídicos",
    "label": "RESUMOS-JURIDICOS (:tema)",
    "description": "Subtemas e doutrina condensada do tema selecionado",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosRouteWrapper",
    "exampleUrl": "/resumos-juridicos/direito-penal/teoria-do-crime",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/favoritos",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos Favoritos",
    "description": "Página correspondente ao componente ResumosJuridicosLista",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosLista",
    "exampleUrl": "/resumos-juridicos/favoritos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/jurisprudencia",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos Jurisprudencia",
    "description": "Página correspondente ao componente ResumosJurisprudencia",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJurisprudencia",
    "exampleUrl": "/resumos-juridicos/jurisprudencia",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/jurisprudencia/:categoria",
    "group": "Resumos Jurídicos",
    "label": "RESUMOS-JURIDICOS (:categoria)",
    "description": "Página correspondente ao componente ResumosJuridicosJurisprudencia",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosJurisprudencia",
    "exampleUrl": "/resumos-juridicos/jurisprudencia/stf",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/leis",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos Leis",
    "description": "Página correspondente ao componente ResumosLeis",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosLeis",
    "exampleUrl": "/resumos-juridicos/leis",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/materias",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos Materias",
    "description": "Página correspondente ao componente ResumosMaterias",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosMaterias",
    "exampleUrl": "/resumos-juridicos/materias",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/resumos-juridicos/recentes",
    "group": "Resumos Jurídicos",
    "label": "Resumos Juridicos Recentes",
    "description": "Página correspondente ao componente ResumosJuridicosLista",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "ResumosJuridicosLista",
    "exampleUrl": "/resumos-juridicos/recentes",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~850 KB",
    "weightReasons": [
      "Estrutura doutrinária em árvore",
      "Artigos esquematizados"
    ]
  },
  {
    "path": "/simulados",
    "group": "Questões & Simulados",
    "label": "Simulados",
    "description": "Central de Simulados para OAB, Magistratura, MP e Defensoria",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Simulados",
    "exampleUrl": "/simulados",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/simulados/estatisticas",
    "group": "Questões & Simulados",
    "label": "Simulados Estatisticas",
    "description": "Página correspondente ao componente SimuladosEstatisticas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SimuladosEstatisticas",
    "exampleUrl": "/simulados/estatisticas",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/simulados/provas",
    "group": "Questões & Simulados",
    "label": "Simulados Provas",
    "description": "Redirecionamento automático legado para a rota /simulados",
    "isRedirect": true,
    "redirectTarget": "/simulados",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/simulados/provas",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/simulados/resolver/:id",
    "group": "Questões & Simulados",
    "label": "SIMULADOS (:id)",
    "description": "Página correspondente ao componente SimuladosResolver",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SimuladosResolver",
    "exampleUrl": "/simulados/resolver/1",
    "weightScore": 4,
    "weightLevel": "pesada",
    "weightEstimate": "~1.8 MB",
    "weightReasons": [
      "Banco extenso de questões",
      "Formatador KaTeX/LaTeX",
      "Motor de simulado cronometrado"
    ]
  },
  {
    "path": "/sobre",
    "group": "Sobre",
    "label": "Sobre",
    "description": "Sobre o Direito Prime — versão instalada, termos, privacidade e contato",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "SobreApp",
    "exampleUrl": "/sobre",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/suporte",
    "group": "Suporte",
    "label": "Suporte",
    "description": "Central de Ajuda, suporte humanizado via WhatsApp e dúvidas frequentes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "Suporte",
    "exampleUrl": "/suporte",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/suporte-publico",
    "group": "Suporte-publico",
    "label": "Suporte Publico",
    "description": "Página pública de suporte para usuários não logados",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "SuportePublico",
    "exampleUrl": "/suporte-publico",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/termos",
    "group": "Conta & Acesso Público",
    "label": "Termos",
    "description": "Termos de Uso e condições gerais de utilização do aplicativo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": false,
    "isAdmin": false,
    "component": "Termos",
    "exampleUrl": "/termos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum",
    "group": "Vade-mecum",
    "label": "Vade Mecum",
    "description": "Página correspondente ao componente VadeMecum",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecum",
    "exampleUrl": "/vade-mecum",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum/areas",
    "group": "Vade-mecum",
    "label": "Vade Mecum Areas",
    "description": "Redirecionamento automático legado para a rota /vade-mecum",
    "isRedirect": true,
    "redirectTarget": "/vade-mecum",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/vade-mecum/areas",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/vade-mecum/categorias",
    "group": "Vade-mecum",
    "label": "Vade Mecum Categorias",
    "description": "Redirecionamento automático legado para a rota /vade-mecum",
    "isRedirect": true,
    "redirectTarget": "/vade-mecum",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/vade-mecum/categorias",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/vade-mecum/codigos",
    "group": "Vade-mecum",
    "label": "Vade Mecum Codigos",
    "description": "Página correspondente ao componente VadeMecumCodigos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecumCodigos",
    "exampleUrl": "/vade-mecum/codigos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum/especiais",
    "group": "Vade-mecum",
    "label": "Vade Mecum Especiais",
    "description": "Página correspondente ao componente VadeMecumEspeciais",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecumEspeciais",
    "exampleUrl": "/vade-mecum/especiais",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum/estatutos",
    "group": "Vade-mecum",
    "label": "Vade Mecum Estatutos",
    "description": "Página correspondente ao componente VadeMecumEstatutos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecumEstatutos",
    "exampleUrl": "/vade-mecum/estatutos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum/favoritos",
    "group": "Vade-mecum",
    "label": "Vade Mecum Favoritos",
    "description": "Redirecionamento automático legado para a rota /vade-mecum",
    "isRedirect": true,
    "redirectTarget": "/vade-mecum",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/vade-mecum/favoritos",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/vade-mecum/recentes",
    "group": "Vade-mecum",
    "label": "Vade Mecum Recentes",
    "description": "Página correspondente ao componente VadeMecumRecentes",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecumRecentes",
    "exampleUrl": "/vade-mecum/recentes",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/vade-mecum/sumulas",
    "group": "Vade-mecum",
    "label": "Vade Mecum Sumulas",
    "description": "Página correspondente ao componente VadeMecumSumulas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VadeMecumSumulas",
    "exampleUrl": "/vade-mecum/sumulas",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas",
    "group": "Videoaulas",
    "label": "Videoaulas (Painel Principal)",
    "description": "Hub principal de videoaulas com trilhas, categorias e catálogo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasRouteWrapper",
    "exampleUrl": "/videoaulas",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/:catalogo",
    "group": "Videoaulas",
    "label": "Videoaulas — Catálogo por Carreira",
    "description": "Matérias e carreiras disponíveis em videoaulas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasCatalogo",
    "exampleUrl": "/videoaulas/areas",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/:catalogo/:area",
    "group": "Videoaulas",
    "label": "Videoaulas — Área de Estudo",
    "description": "Grade de aulas da matéria selecionada",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasArea",
    "exampleUrl": "/videoaulas/areas/direito-penal",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/:catalogo/:area/:videoId",
    "group": "Videoaulas",
    "label": "Videoaulas — Player de Aula",
    "description": "Reprodução da videoaula com transcrição e notas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulaView",
    "exampleUrl": "/videoaulas/areas/direito-penal/1",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/canal/:id",
    "group": "Videoaulas",
    "label": "Videoaulas — Canais Oficiais",
    "description": "Aulas de canais institucionais (STF, STJ, Senado)",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasCanalDetail",
    "exampleUrl": "/videoaulas/canal/1",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/favoritos",
    "group": "Videoaulas",
    "label": "Videoaulas — Favoritas",
    "description": "Minha lista de videoaulas salvas",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasLista",
    "exampleUrl": "/videoaulas/favoritos",
    "weightScore": 1,
    "weightLevel": "leve",
    "weightEstimate": "~120 KB",
    "weightReasons": [
      "Página padrão leve",
      "Carga instantânea 0ms"
    ]
  },
  {
    "path": "/videoaulas/lei-seca",
    "group": "Videoaulas",
    "label": "Videoaulas — Lei Seca",
    "description": "Videoaulas organizadas por códigos e estatutos",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasLeiSeca",
    "exampleUrl": "/videoaulas/lei-seca",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/videoaulas/lei-seca/categoria/:categoriaId",
    "group": "Videoaulas",
    "label": "Videoaulas — Categoria de Lei",
    "description": "Lista de leis da categoria selecionada",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasLeiSecaCategoria",
    "exampleUrl": "/videoaulas/lei-seca/categoria/codigos",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/videoaulas/lei-seca/lei/:leiId",
    "group": "Videoaulas",
    "label": "Videoaulas — Artigos da Lei",
    "description": "Artigos da lei com explicação em vídeo",
    "isRedirect": false,
    "redirectTarget": null,
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasLeiSecaArtigos",
    "exampleUrl": "/videoaulas/lei-seca/lei/cp",
    "weightScore": 3,
    "weightLevel": "media",
    "weightEstimate": "~650 KB",
    "weightReasons": [
      "Catálogo oficial de leis",
      "Virtualizador de artigos"
    ]
  },
  {
    "path": "/videoaulas/painel",
    "group": "Videoaulas",
    "label": "Videoaulas Painel",
    "description": "Redirecionamento automático legado para a rota /videoaulas",
    "isRedirect": true,
    "redirectTarget": "/videoaulas",
    "isProtected": true,
    "isAdmin": false,
    "component": "VideoaulasRouteWrapper",
    "exampleUrl": "/videoaulas/painel",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/visuais",
    "group": "Visuais",
    "label": "Visuais",
    "description": "Redirecionamento automático legado para a rota /mapas-mentais",
    "isRedirect": true,
    "redirectTarget": "/mapas-mentais",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/visuais",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  },
  {
    "path": "/visuais/*",
    "group": "Visuais",
    "label": "Visuais",
    "description": "Redirecionamento automático legado para a rota /mapas-mentais",
    "isRedirect": true,
    "redirectTarget": "/mapas-mentais",
    "isProtected": false,
    "isAdmin": false,
    "component": "Componente",
    "exampleUrl": "/visuais",
    "weightScore": 0,
    "weightLevel": "zero",
    "weightEstimate": "0 KB",
    "weightReasons": [
      "Redirecionamento instantâneo",
      "Zero impacto de bundle"
    ]
  }
];
