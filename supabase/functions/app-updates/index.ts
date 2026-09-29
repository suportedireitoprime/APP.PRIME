import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const updates = [
  {
    "version": "3.9",
    "title": "Versão 3.9 Liberada",
    "date": "2026-09-29",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Implementa pesquisa web para o OmniRoute",
      "Atualização: Atualiza mascote de Audioaulas",
      "Atualização: Atualiza mascote de Biblioteca",
      "Correção: Melhorias de conexão assistente-juridica, remove btn Enviar e formata Copiar para WhatsApp",
      "Correção: Substitui bg-hero-panel por bg-hero-panel-violet para evitar piscada vermelha no carregamento da capa"
    ]
  },
  {
    "version": "3.8",
    "title": "Versão 3.8 Liberada",
    "date": "2026-09-27",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Restaura cards de pastas vermelhas na aba Pastas Salvas e padroniza cor roxa na pesquisa",
      "Atualização: Clone Home visual design for functions and searchbar",
      "Atualização: Novo painel hero roxo padrao vade mecum com socrates, 3 cerebros orbitais, 5 abas e nova tipografia nos cards",
      "Correção: Cards da Camara com min-h para exibir titulo e ementa sem corte",
      "Correção: Restaura Atualizacoes.tsx e aplica abas multi-filtro corretamente"
    ]
  },
  {
    "version": "3.7",
    "title": "Versão 3.7 Liberada",
    "date": "2026-09-26",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Substituir lembretes e perguntar por novo menu interativo me explique",
      "Atualização: Tornar exclusao de anotacao instantanea (optimistic UI) com confirmacao previa",
      "Atualização: Prompt super animado mais expressivo e contagiante para Gemini TTS",
      "Correção: Ajusta layout dos cards em Atualizacoes, altura e text fallback da Camara",
      "Correção: Aplica startTransition, corrige delay do ShapeGrid via PageTransition instant e conecta Giro Juridico aos dados reais (0ms)"
    ]
  },
  {
    "version": "3.6",
    "title": "Versão 3.6 Liberada",
    "date": "2026-09-25",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Implementar fallback para gemini-3.1-flash-light e tornar cards minimalistas",
      "Atualização: Layout em lista com bottom sheets 95% para testar gateway e funcoes do app",
      "Atualização: Filtra modelos exclusivos Antigravity (Gemini 3.8/3.7/3.6/3.1, Claude Sonnet/Opus, GPT) no badge e seletores",
      "Correção: Refina deteccao de banner ativo no scroll center e amplia responsividade do botao",
      "Correção: Alinha header do carrossel horus com a tab estudos e ajusta matematica do scroll snap"
    ]
  },
  {
    "version": "3.5",
    "title": "Versão 3.5 Liberada",
    "date": "2026-09-21",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Bypass onboarding and grant premium access to test account juridicosapp@gmail.com for Google Play review",
      "Atualização: Substituir estilo cartoon por imagem conceitual com background removido no onboarding",
      "Atualização: Transformar texto de rejeicao em botao vermelho com degrad├¬ no modal de promocao",
      "Correção: Oculta gate de permissoes de notificacao no desktop",
      "Correção: Expandir layout desktop para toda a largura"
    ]
  },
  {
    "version": "3.4",
    "title": "Versão 3.4 Liberada",
    "date": "2026-09-19",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Avatar e UI ajustados baseados no feedback do ├íudio",
      "Atualização: Adjust FaceYellow gavel hand position and increase wig size, remove badge and center mic in MeExpliqueLiveChatView",
      "Atualização: MeExpliqueLiveChatView layout updates and FaceYellow Judge avatar",
      "Correção: Limita max-width em 1600px e corrige margens do hero banner",
      "Correção: Carrossel, prefetch do Vade Mecum e corre├º├úo de crash no AprenderAula"
    ]
  },
  {
    "version": "3.3",
    "title": "Versão 3.3 Liberada",
    "date": "2026-09-18",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Improve quick access menu with separators, larger hitboxes and chat option",
      "Atualização: Redesign desktop hero banner and sidebar",
      "Atualização: Capa alinhada a direita e icones notifica├º├úo movidos para header fixo",
      "Correção: Adjust logo style and reduce red polygon on desktop hero banner",
      "Correção: Match tab menu active color with hero panel"
    ]
  },
  {
    "version": "3.2",
    "title": "Versão 3.2 Liberada",
    "date": "2026-09-16",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Fallback offline para biografias e refat workflow github action com client payload",
      "Atualização: Implementa UI de Radar STF (Pautas e Ministros)",
      "Atualização: Migracao para o supabase e sync_deputados",
      "Correção: Oculta barra de rolagem branca nativa no iOS/Mobile travando o viewport e transferindo o scroll para a div #root",
      "Correção: Remove translate-x para corrigir margem vazada do hero"
    ]
  },
  {
    "version": "3.1",
    "title": "Versão 3.1 Liberada",
    "date": "2026-09-15",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Deck 3d de metodologias, carregamento instantaneo e capas dinamicas por materia",
      "Atualização: Mover titulo para lado oposto com linha fina conectora e botao player no card",
      "Atualização: Loading da IA com checklist animado, barra de progresso e porcentagem",
      "Correção: Fecha tag div em QuestoesArea e corrige import de FILTRO_VAZIO em QuestoesPraticar",
      "Correção: Corrigir palette before initialization + substituir tag por barra de progresso geral"
    ]
  },
  {
    "version": "3.0",
    "title": "Versão 3.0 Liberada",
    "date": "2026-09-10",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Remove video de capa e substitui por imagem heroEstudanteImg",
      "Atualização: Atualiza decks para cards 4x3 com capas ilustradas e play glassmorphic",
      "Atualização: Integra botao entrar na paleta do fundo e simplifica tag superior sem prefixo Direito",
      "Correção: Remove animacao automatica de cards e implementa navegacao exclusivamente por clique",
      "Correção: Aplica corre├º├Áes dos itens 11 ao 20 com touch targets, acessibilidade e memoiza├º├úo"
    ]
  },
  {
    "version": "2.9",
    "title": "Versão 2.9 Liberada",
    "date": "2026-09-08",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Implementa proximo artigo, trilha com linha/pegadas e progresso com estrelas",
      "Atualização: Reintegra o bonequinho (SVG animado) ao layout do Jogo da Forca",
      "Atualização: Implementa ├¡ndice alfab├®tico (A-Z) para Termos Jur├¡dicos",
      "Correção: Corrige erro de parse do jsx no loop de artigos da trilha",
      "Correção: Exibe bot├úo Apple em todos os dispositivos + remove import morto"
    ]
  },
  {
    "version": "2.8",
    "title": "Versão 2.8 Liberada",
    "date": "2026-09-07",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Resolve race conditions, sync transactions and layout shifts on background resume",
      "Atualização: Usar capas por area do Aprender nos cards de areas",
      "Atualização: Aplica otimizacoes finais de IA memoizada, TTL de cargos e responsividade no grid desktop (itens 11-20 da auditoria)",
      "Correção: Add remotion core package that was missing",
      "Correção: Prevent MiniSearch duplicate ID crash on numeric IDs"
    ]
  },
  {
    "version": "2.7",
    "title": "Versão 2.7 Liberada",
    "date": "2026-09-06",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Converte Acervos de Livros para lista com capa a esquerda e fixa ShapeGrid cobrindo 100% da tela",
      "Atualização: Expande leque para 7 cards e sincroniza cor da borda e glow com a cor predominante da capa",
      "Atualização: Transforma carrossel em deck de cards em leque com borda neon vermelha, titulo na capa e descricao embaixo",
      "Correção: Aumenta tempo para 5.5s e elimina reversao da luzinha com animacao continua e pause estavel",
      "Correção: Remove fundo colorido atras das capas e implementa swipe com o dedo e drag para passar as capas"
    ]
  },
  {
    "version": "2.6",
    "title": "Versão 2.6 Liberada",
    "date": "2026-09-05",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Brighten materia icon colors and ensure ShapeGrid across area views",
      "Atualização: Add ShapeGrid background and remove flashcards/questoes/progresso alternation menu in AprenderArea",
      "Atualização: Remover fundo quadriculado de pilulas e persistir favoritos no indexeddb",
      "Correção: Corrigir bloco em CategoriaLegislacao e refatorar Ferramentas em chunks modulares",
      "Correção: Remover rota duplicada/antiga e voltar direto para o Vade Mecum"
    ]
  },
  {
    "version": "2.5",
    "title": "Versão 2.5 Liberada",
    "date": "2026-09-03",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Criar skill nativas-compose-e-swiftui e aplicar leitor nativo no iOS e Android",
      "Atualização: Leitor de artigos 100% nativo em kotlin jetpack compose no android",
      "Atualização: UI otimizada de cria├º├úo de decks (Wizard Step-by-Step) e corre├º├Áes de optimistic update",
      "Correção: Remover fechamento duplicado de IIFE em ArtigoBottomSheet",
      "Correção: Card flutuante centralizado para apagar grifos, anotacao automatica ao soltar o dedo, prevencao de piscar preto e checagem de narracoes no banco"
    ]
  },
  {
    "version": "2.4",
    "title": "Versão 2.4 Liberada",
    "date": "2026-09-02",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Add horizontal tab menu and ministros gallery to PilulasHome",
      "Atualização: Add POSSE and NOMEACAO to timeline dates and explain STF WAF blocking",
      "Atualização: Atualiza tipografia da linha do tempo e insere fallback visual de datas",
      "Correção: Contar corretamente todos os homens no filtro (genero !== F)",
      "Correção: Corrige importacoes quebradas em useLeiArtigos que derrubavam a compilacao e as rotas lazy"
    ]
  },
  {
    "version": "2.3",
    "title": "Versão 2.3 Liberada",
    "date": "2026-08-31",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Display text inside card and glassmorphic play button overlay",
      "Atualização: Add ShapeGrid background to PilulasHome",
      "Atualização: Restructure PilulasHome with P├¡lulas R├ípidas layout",
      "Correção: Replace incorrect CC images with correct ones",
      "Correção: Move generic covers and CP to Supabase CDN bucket"
    ]
  },
  {
    "version": "2.2",
    "title": "Versão 2.2 Liberada",
    "date": "2026-08-30",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Refatora PilulasHome para exibir apenas card de Classicos do Direito",
      "Atualização: Implementacao do recurso de Pilulas para classicos do direito",
      "Atualização: Animate flashcards pages with framer-motion stagger and springs",
      "Correção: Tenta execCommand antes das chamadas async em ambiente Web p/ preservar contexto no iframe",
      "Correção: Corrige bug no utilitario copiar.ts - navigator.clipboard agora faz fallback p/ execCommand quando falha"
    ]
  },
  {
    "version": "2.1",
    "title": "Versão 2.1 Liberada",
    "date": "2026-08-28",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Replace Lembretes shortcut with Desktop in HomeHeaderHero",
      "Atualização: Simplifica telas de download offline focando em pacotes inteiros",
      "Atualização: Add PremiumGate and responsiveness to LeiSeca",
      "Correção: Move font size control to header and remove floating FAB colliding with bottom bar on mobile",
      "Correção: Revert gemini model to gemini-3.1-flash-lite for text generation"
    ]
  },
  {
    "version": "2.0",
    "title": "Versão 2.0 Liberada",
    "date": "2026-08-21",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Reestruturacao do cronograma de push notifications (6 disparos diarios)",
      "Atualização: Integra ia tutor juridico, supabase architect, pwa sync e qa e2e tester",
      "Atualização: Aplica regras da skill acessibilidade-extrema em componentes e side menu",
      "Correção: Aplica cores fixas inline para forcar o estado verde (ativo e enviado) na UI do painel",
      "Correção: Restore app icon in Assets.xcassets"
    ]
  },
  {
    "version": "1.9",
    "title": "Versão 1.9 Liberada",
    "date": "2026-08-19",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Implement instant load and fluid native transitions",
      "Atualização: Add TopProgressBar for seamless lazy loading indication",
      "Atualização: Implement lazyWithRetry and replace all React.lazy calls to improve robustness against network/chunk errors",
      "Correção: Translate Assistant UI and prevent focus loss by memoizing runtime adapter",
      "Correção: BottomNav disappearing inside PageTransition (removed transform CSS stacking context)"
    ]
  },
  {
    "version": "1.8",
    "title": "Versão 1.8 Liberada",
    "date": "2026-08-17",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Atualiza modelo base para gemini-3.1-flash-lite para gera├º├úo de roteiros de apresenta├º├úo, seguindo padr├úo arquitetural do projeto",
      "Atualização: Implementar Bloco 2 - Offline Progressivo, PWA e Correcoes",
      "Atualização: Implementar avaliacao forcada pelo Horus e resolver erro de build (OOM)",
      "Correção: Atualiza modelo do Gemini para 3.6-flash para corrigir erro 404 de modelo descontinuado",
      "Correção: Corrigir crash no app ÔÇö Heart nao importado no BibliotecaAtividadeRail e FilePicker com import estatico causando falha no modulo eagerly loaded"
    ]
  },
  {
    "version": "1.7",
    "title": "Versão 1.7 Liberada",
    "date": "2026-08-16",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Aprimorar selecao de titulos, status e animacao de quantidade total",
      "Atualização: Ordenar capitulos cronologicamente por artigos, badges com contagem e spinner de carregamento",
      "Atualização: Materias 2-por-linha e filtro em etapas para Leis",
      "Correção: Stabilize artigosList dependency to prevent infinite re-render loop",
      "Correção: Remove auto-selection for Status and Quantity in session setup"
    ]
  },
  {
    "version": "1.6",
    "title": "Versão 1.6 Liberada",
    "date": "2026-08-15",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Expandir kant e hans kelsen para padrao editorial elite e validar build",
      "Atualização: Fila de bg-sync via idb-keyval para offline; feat(gate): botao DEV para pular gate sem compras nativas",
      "Atualização: Expans├úo em massa de biografias e adi├º├úo de anima├º├Áes Framer Motion",
      "Correção: Revert \"fix: unescaped backticks in maquiavel.ts and santoAgostinho.ts\"",
      "Correção: Unescaped backticks in maquiavel.ts and santoAgostinho.ts"
    ]
  },
  {
    "version": "1.5",
    "title": "Versão 1.5 Liberada",
    "date": "2026-08-13",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Implementa Playback Autom├ítico com Web Speech API e legendas sincronizadas, al├®m de melhoria de ilumina├º├úo e enquadramento da c├ómera",
      "Atualização: Atualiza Laboratorio de Agentes com lista de artigos do CP e status Gerado/Nao Gerado",
      "Atualização: Refatora Art 2 com detalhes e cria Art 3 com clima dinamico",
      "Correção: ParseInt('Art. 121') retornava NaN ÔÇö extrai d├¡gitos antes de parsear o numero do artigo para a Engine 3D",
      "Correção: Corrige filtro de artigos que matava a lista inteira ÔÇö inverte l├│gica para blocklist de r├│tulos estruturais (PARTE, T├ìTULO, LIVRO...)"
    ]
  },
  {
    "version": "1.4",
    "title": "Versão 1.4 Liberada",
    "date": "2026-08-11",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Migrate heavy PDF processing to GitHub Actions with PyMuPDF",
      "Atualização: Migra armazenamento de conteudo markdown para Storage",
      "Atualização: Paleta amarela/dourada, aba Sobre o Cargo, filtro obrigatorio de materias/assuntos, modo sem press├úo padrao e botao flutuante no rodape",
      "Correção: Pass anon key as fallback if service_role_key is undefined in edge functions",
      "Correção: Inject supabase credentials into client_payload to skip github secrets setup"
    ]
  },
  {
    "version": "1.3",
    "title": "Versão 1.3 Liberada",
    "date": "2026-08-10",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Invalida cache e atualiza capas offline dos concursos",
      "Atualização: Unifica titulos para medium, insere barra de progresso no catalogo e mic icon em vermelho vibrante",
      "Atualização: Prompt to resume video playback or start from scratch",
      "Correção: Make video actions responsive, change share icon to send and adjust horizontal scroll",
      "Correção: Force video action buttons to stay on a single line horizontally scrollable"
    ]
  },
  {
    "version": "1.2",
    "title": "Versão 1.2 Liberada",
    "date": "2026-08-09",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Create dedicated section for OAB exams in categories screen",
      "Atualização: Create structured study plans per edital with horizontal carousels",
      "Atualização: Add stars and gamified phase path",
      "Correção: Force cache invalidation to v3 after fixing RLS permissions",
      "Correção: Bust IndexedDB cache for concursos to fetch newly inserted rows"
    ]
  },
  {
    "version": "1.1",
    "title": "Versão 1.1 Liberada",
    "date": "2026-08-06",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: Refazer capas dos artigos antigos (Lei do Inquilinato, LGPD, Aristoteles e Terras Indigenas) no estilo vetor com contorno branco e atualizar cache v5",
      "Atualização: Ajustar geracao de capas com IA orientada ao sujeito, autor Redacao Estudos Juridicos, e artigos pedagogicos com leis do banco",
      "Atualização: Definir gemini-3.1-flash-lite como modelo padrao de geracao de texto",
      "Correção: Remover saudacoes cliches e introduzir tabelas, diagramas e artigos destrinchados no processo legislativo",
      "Correção: Popular texto integral da Lei 15.485 e corrigir parser de artigos sem Art. 1"
    ]
  },
  {
    "version": "1.0",
    "title": "Versão 1.0 Liberada",
    "date": "2026-08-04",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Correção: Otimizacoes de busca, logo hero e deploy github pages",
      "Correção: Force compileSdk 36 em todos os modulos (send-intent AAR metadata)"
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
