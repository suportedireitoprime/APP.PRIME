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
      "Atualização: feat: Implementa pesquisa web para o OmniRoute",
      "Atualização: feat(Assistente): Adicionar suporte a anexos PDF e imagens via OmniRoute no Chat",
      "Atualização: feat: atualiza headline e nova arte ajustada para plano vitalicio"
    ]
  },
  {
    "version": "3.8",
    "title": "Versão 3.8 Liberada",
    "date": "2026-09-27",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(giro-juridico): divide boletins em juridicos e noticias, troca icone para fone de ouvido e tag para 'ouvir'",
      "Atualização: feat(giro-juridico): reestrutura abas e altera cards de noticias para formato retangular",
      "Atualização: feat(mapas-mentais): restaura cards de pastas vermelhas na aba Pastas Salvas e padroniza cor roxa na pesquisa"
    ]
  },
  {
    "version": "3.7",
    "title": "Versão 3.7 Liberada",
    "date": "2026-09-26",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(admin): exibe partes dinamicas (ex: 1 de 5, 2 de 3) durante a narracao de artigos",
      "Atualização: feat(narracao): unificar pipeline de geracao automatica fatiada entre Vade Mecum e Admin com tom Super Animado e Realtime",
      "Atualização: feat(vademecum): substituir lembretes e perguntar por novo menu interativo me explique"
    ]
  },
  {
    "version": "3.6",
    "title": "Versão 3.6 Liberada",
    "date": "2026-09-25",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: adicionar Horus WhatsApp e Liga├º├úo Live no gateway OmniRoute",
      "Atualização: feat: implementar fallback para gemini-3.1-flash-light e tornar cards minimalistas",
      "Atualização: feat(omniroute): layout em lista com bottom sheets 95% para testar gateway e funcoes do app"
    ]
  },
  {
    "version": "3.5",
    "title": "Versão 3.5 Liberada",
    "date": "2026-09-21",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(Auth): bypass onboarding and grant premium access to test account juridicosapp@gmail.com for Google Play review",
      "Atualização: feat(questoes): adiciona animacoes staggered para os componentes da tela Questoes",
      "Atualização: feat: substituir estilo cartoon por imagem conceitual com background removido no onboarding"
    ]
  },
  {
    "version": "3.4",
    "title": "Versão 3.4 Liberada",
    "date": "2026-09-19",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(MeExplique): avatar e UI ajustados baseados no feedback do ├íudio",
      "Atualização: feat: Aumenta largura max do desktop e adiciona Me Explique na barra lateral",
      "Atualização: feat: adjust FaceYellow gavel hand position and increase wig size, remove badge and center mic in MeExpliqueLiveChatView"
    ]
  },
  {
    "version": "3.3",
    "title": "Versão 3.3 Liberada",
    "date": "2026-09-18",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: improve quick access menu with separators, larger hitboxes and chat option",
      "Atualização: feat: redesign desktop hero banner and sidebar",
      "Atualização: feat(desktop): capa alinhada a direita e icones notifica├º├úo movidos para header fixo"
    ]
  },
  {
    "version": "3.2",
    "title": "Versão 3.2 Liberada",
    "date": "2026-09-16",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(stf): fallback offline para biografias e refat workflow github action com client payload",
      "Atualização: feat(ui): adiciona descricao em portais, safe-area margin e corrige cores do modal",
      "Atualização: feat(tres-poderes): adiciona portais da camara e senado e padroniza modulo"
    ]
  },
  {
    "version": "3.1",
    "title": "Versão 3.1 Liberada",
    "date": "2026-09-15",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(home): adiciona barra praticar lei seca e linha do tempo de apresentacoes narradas",
      "Atualização: feat(resumos): deck 3d de metodologias, carregamento instantaneo e capas dinamicas por materia",
      "Atualização: feat: carrossel exclusivo de noticias na home e novo carrossel de livros em ferramentas"
    ]
  },
  {
    "version": "3.0",
    "title": "Versão 3.0 Liberada",
    "date": "2026-09-10",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: Remove video de capa e substitui por imagem heroEstudanteImg",
      "Atualização: feat(hero): adiciona video-capa.webm em loop no painel do inicio e unifica media providers",
      "Atualização: feat(aulas): atualiza decks para cards 4x3 com capas ilustradas e play glassmorphic"
    ]
  },
  {
    "version": "2.9",
    "title": "Versão 2.9 Liberada",
    "date": "2026-09-08",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: recria layout da trilha em zigue-zague nativo com svg e pegadas rotacionadas",
      "Atualização: feat: implementa proximo artigo, trilha com linha/pegadas e progresso com estrelas",
      "Atualização: feat: padroniza botao voltar, fundo ShapeGrid e adiciona sons de acerto/erro no Forca"
    ]
  },
  {
    "version": "2.8",
    "title": "Versão 2.8 Liberada",
    "date": "2026-09-07",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(lifecycle): resolve race conditions, sync transactions and layout shifts on background resume",
      "Atualização: feat(resumos): usar capas por area do Aprender nos cards de areas",
      "Atualização: feat(questoes): aplica otimizacoes finais de IA memoizada, TTL de cargos e responsividade no grid desktop (itens 11-20 da auditoria)"
    ]
  },
  {
    "version": "2.7",
    "title": "Versão 2.7 Liberada",
    "date": "2026-09-06",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(biblioteca): converte Acervos de Livros para lista com capa a esquerda e fixa ShapeGrid cobrindo 100% da tela",
      "Atualização: feat(biblioteca): unifica Selecionados para voce com deck 3D em leque, timer de luzinha, reflexo e titulo fora da capa",
      "Atualização: feat(aprender): reduz espessura da linha do contorno e adiciona luzinha animada sincronizada com tempo do proximo card"
    ]
  },
  {
    "version": "2.6",
    "title": "Versão 2.6 Liberada",
    "date": "2026-09-05",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(vademecum): modularizar em chunks e implementar cache aquecido para biblioteca, resumos e videoaulas",
      "Atualização: feat(aprender): brighten materia icon colors and ensure ShapeGrid across area views",
      "Atualização: feat(aprender): add ShapeGrid background and remove flashcards/questoes/progresso alternation menu in AprenderArea"
    ]
  },
  {
    "version": "2.5",
    "title": "Versão 2.5 Liberada",
    "date": "2026-09-03",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(native): diretiva 100% nativo mobile no AGENTS.md e abas nativas de jurisprudencia e gravador de voz em Compose e SwiftUI",
      "Atualização: feat(skill): criar skill nativas-compose-e-swiftui e aplicar leitor nativo no iOS e Android",
      "Atualização: feat(vademecum): leitor de artigos 100% nativo em kotlin jetpack compose no android"
    ]
  },
  {
    "version": "2.4",
    "title": "Versão 2.4 Liberada",
    "date": "2026-09-02",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(pilulas): add horizontal tab menu and ministros gallery to PilulasHome",
      "Atualização: feat: Add POSSE and NOMEACAO to timeline dates and explain STF WAF blocking",
      "Atualização: feat(stf): atualiza tipografia da linha do tempo e insere fallback visual de datas"
    ]
  },
  {
    "version": "2.3",
    "title": "Versão 2.3 Liberada",
    "date": "2026-08-31",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: display text inside card and glassmorphic play button overlay",
      "Atualização: feat: add CircularGallery to Pilulas R├ípidas with new categories",
      "Atualização: feat: add ShapeGrid background to PilulasHome"
    ]
  },
  {
    "version": "2.2",
    "title": "Versão 2.2 Liberada",
    "date": "2026-08-30",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: adiciona componente de audio customizado para a intro e para preview do audio final",
      "Atualização: feat: adiciona card de instrucoes e preview de audio da intro na tela de envio de pilulas",
      "Atualização: feat: adiciona fallback infalivel via window.prompt caso navegador bloqueie execCommand e navigator.clipboard"
    ]
  },
  {
    "version": "2.1",
    "title": "Versão 2.1 Liberada",
    "date": "2026-08-28",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: replace Lembretes shortcut with Desktop in HomeHeaderHero",
      "Atualização: feat: simplifica telas de download offline focando em pacotes inteiros",
      "Atualização: feat: add PremiumGate and responsiveness to LeiSeca"
    ]
  },
  {
    "version": "2.0",
    "title": "Versão 2.0 Liberada",
    "date": "2026-08-21",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: reestruturacao do cronograma de push notifications (6 disparos diarios)",
      "Atualização: feat(admin): reorder ocr lists and add pending badges on categories",
      "Atualização: feat(admin): track and display paywall views in admin dashboard"
    ]
  },
  {
    "version": "1.9",
    "title": "Versão 1.9 Liberada",
    "date": "2026-08-19",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(performance): implement instant load and fluid native transitions",
      "Atualização: feat: add TopProgressBar for seamless lazy loading indication",
      "Atualização: feat: implement lazyWithRetry and replace all React.lazy calls to improve robustness against network/chunk errors"
    ]
  },
  {
    "version": "1.8",
    "title": "Versão 1.8 Liberada",
    "date": "2026-08-17",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(edge-function): Atualiza modelo base para gemini-3.1-flash-lite para gera├º├úo de roteiros de apresenta├º├úo, seguindo padr├úo arquitetural do projeto",
      "Atualização: feat(ux): adiciona efeitos haptic nas a├º├Áes do gravador de voz e corre├º├úo final de bugs",
      "Atualização: feat(ux): adiciona visualizador de ondas sonoras no microfone (AudioVisualizer) nas anota├º├Áes"
    ]
  },
  {
    "version": "1.7",
    "title": "Versão 1.7 Liberada",
    "date": "2026-08-16",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(flashcards): aprimorar selecao de titulos, status e animacao de quantidade total",
      "Atualização: feat(flashcards): ordenar capitulos cronologicamente por artigos, badges com contagem e spinner de carregamento",
      "Atualização: feat: refatorar AdminFlashcardsEditar para navegacao em 3 etapas (categoria > area > temas) com categoria enviada ao prompt da IA"
    ]
  },
  {
    "version": "1.6",
    "title": "Versão 1.6 Liberada",
    "date": "2026-08-15",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(biografias): expandir kant e hans kelsen para padrao editorial elite e validar build",
      "Atualização: feat(sync): fila de bg-sync via idb-keyval para offline; feat(gate): botao DEV para pular gate sem compras nativas",
      "Atualização: feat(biografias): expans├úo em massa de biografias e adi├º├úo de anima├º├Áes Framer Motion"
    ]
  },
  {
    "version": "1.5",
    "title": "Versão 1.5 Liberada",
    "date": "2026-08-13",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(ai): cria UI do AIGeneratorPanel com responsividade no AdminLaboratorio",
      "Atualização: feat(3d): refatora Art 2 com detalhes e cria Art 3 com clima dinamico",
      "Atualização: feat(3d): cria cena do art 2 (Abolitio Criminis) em Cel-Shading"
    ]
  },
  {
    "version": "1.4",
    "title": "Versão 1.4 Liberada",
    "date": "2026-08-11",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat: migrate heavy PDF processing to GitHub Actions with PyMuPDF",
      "Atualização: feat(biblioteca): migra armazenamento de conteudo markdown para Storage",
      "Atualização: feat(ui): adiciona efeito de folhas de louro caindo e balan├ºas flutuantes no header da home"
    ]
  },
  {
    "version": "1.3",
    "title": "Versão 1.3 Liberada",
    "date": "2026-08-10",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(videoaulas): invalida cache e atualiza capas offline dos concursos",
      "Atualização: feat(videoaulas): unifica titulos para medium, insere barra de progresso no catalogo e mic icon em vermelho vibrante",
      "Atualização: feat: prompt to resume video playback or start from scratch"
    ]
  },
  {
    "version": "1.2",
    "title": "Versão 1.2 Liberada",
    "date": "2026-08-09",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(videoaulas): create dedicated section for OAB exams in categories screen",
      "Atualização: feat(videoaulas): create structured study plans per edital with horizontal carousels",
      "Atualização: feat(forca): add stars and gamified phase path"
    ]
  },
  {
    "version": "1.1",
    "title": "Versão 1.1 Liberada",
    "date": "2026-08-06",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Atualização: feat(blog): refazer capas dos artigos antigos (Lei do Inquilinato, LGPD, Aristoteles e Terras Indigenas) no estilo vetor com contorno branco e atualizar cache v5",
      "Atualização: feat(blog): ajustar geracao de capas com IA orientada ao sujeito, autor Redacao Estudos Juridicos, e artigos pedagogicos com leis do banco",
      "Atualização: feat(ai): definir gemini-3.1-flash-lite como modelo padrao de geracao de texto"
    ]
  },
  {
    "version": "1.0",
    "title": "Versão 1.0 Liberada",
    "date": "2026-08-04",
    "description": "Atualizações baseadas no seu feedback com novas funcionalidades e correções importantes.",
    "features": [
      "Correção: fix: otimizacoes de busca, logo hero e deploy github pages",
      "Correção: fix(android): force compileSdk 36 em todos os modulos (send-intent AAR metadata)"
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
