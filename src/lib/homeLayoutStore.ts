import { useState, useEffect } from 'react';

export type HomeLayoutId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export interface LayoutMeta {
  id: HomeLayoutId;
  nome: string;
  badge: string;
  proposta: string;
  destaque: string;
  icone: string; // nome do ícone
  gradiente: string;
  corTema: string;
}

export const LAYOUTS_METADATA: Record<HomeLayoutId, LayoutMeta> = {
  1: {
    id: 1,
    nome: 'Central de Comando 360',
    badge: 'EXECUTIVE DASHBOARD',
    proposta: 'Cockpit de alta produtividade com status ao vivo, radar de notícias do DOU e acesso em 1 toque.',
    destaque: 'Bento 2x2 · Ticker DOU · Status XP/Streak',
    icone: 'LayoutDashboard',
    gradiente: 'from-amber-500/20 via-orange-950/30 to-black',
    corTema: '#f59e0b',
  },
  2: {
    id: 2,
    nome: 'Cinema & Streaming Prime',
    badge: 'IMERSÃO AUDIOVISUAL',
    proposta: 'Experiência fluida inspirada em streaming com trailer do dia, áudios em carrossel e capas de cinema.',
    destaque: 'Hero Trailer · Trilhas Horizontais · Capas HD',
    icone: 'Film',
    gradiente: 'from-rose-500/20 via-red-950/30 to-black',
    corTema: '#f43f5e',
  },
  3: {
    id: 3,
    nome: 'Jornada RPG Jurídica',
    badge: 'GAMIFICAÇÃO GUIADA',
    proposta: 'Árvore de habilidades e nós de progressão estilo Duolingo, com streak vivo, vidas e quiz relâmpago.',
    destaque: 'Trilha em Nós · Baús de XP · Quiz 1 Minuto',
    icone: 'Gamepad2',
    gradiente: 'from-emerald-500/20 via-teal-950/30 to-black',
    corTema: '#10b981',
  },
  4: {
    id: 4,
    nome: 'Leitor Clássico & Editorial',
    badge: 'FOCO NA LEI SECA',
    proposta: 'Santuário de leitura jurídica minimalista, tipografia serifada de luxo e livro aberto diretamente na tela.',
    destaque: 'Zero Distrações · Citação do Dia · Marcador Ativo',
    icone: 'BookOpen',
    gradiente: 'from-stone-500/20 via-zinc-950/40 to-black',
    corTema: '#a8a29e',
  },
  5: {
    id: 5,
    nome: 'Bento Grid Apple Style',
    badge: 'MODULAR HIGH-END',
    proposta: 'Módulos dinâmicos assimétricos com cantos ultra-arredondados, mini player de áudio e widgets vivos.',
    destaque: 'Proporções 2x2/2x1 · Mini Player · Feedback Tátil',
    icone: 'LayoutGrid',
    gradiente: 'from-indigo-500/20 via-blue-950/30 to-black',
    corTema: '#6366f1',
  },
  6: {
    id: 6,
    nome: 'Daily Briefing Cronológico',
    badge: 'FEED POR HORÁRIOS',
    proposta: 'Rotina adaptada ao ritmo biológico: Manhã (Notícias/DOU), Tarde (Questões/Juris) e Noite (Áudio/Revisão).',
    destaque: 'Filtro Manhã/Tarde/Noite · Rotina Saudável',
    icone: 'Clock',
    gradiente: 'from-sky-500/20 via-blue-950/30 to-black',
    corTema: '#0ea5e9',
  },
  7: {
    id: 7,
    nome: 'Hub de Questões & OAB',
    badge: 'CONCURSEIRO HARDCORE',
    proposta: 'Centro de treinamento focado em métricas, matérias deficitárias, simulados rápidos e regressiva OAB.',
    destaque: 'Gráfico de Acertos · Alerta Vermelho · Resolver 5 Questões',
    icone: 'Target',
    gradiente: 'from-yellow-500/20 via-amber-950/30 to-black',
    corTema: '#eab308',
  },
  8: {
    id: 8,
    nome: 'IA Tutor em Destaque',
    badge: 'BUSCA COGNITIVA',
    proposta: 'Perplexity / ChatGPT jurídico no centro da experiência, com sugestões de teses e Me Explique instantâneo.',
    destaque: 'Barra de Pergunta Ampla · Teses Prontas · Me Explique',
    icone: 'Bot',
    gradiente: 'from-purple-500/20 via-violet-950/30 to-black',
    corTema: '#a855f7',
  },
  9: {
    id: 9,
    nome: 'Timeline de Estudos & Pomodoro',
    badge: 'ANTI-PROCRASTINAÇÃO',
    proposta: 'Linha do tempo linear estilo planner diário com blocos de 25 min, checklist interativo e comemorações.',
    destaque: 'Pomodoro Embutido · Checklist de Metas · Flow Diário',
    icone: 'CheckSquare',
    gradiente: 'from-cyan-500/20 via-slate-950/30 to-black',
    corTema: '#06b6d4',
  },
  10: {
    id: 10,
    nome: 'Workspace Adaptativo Multi-Pane',
    badge: 'TABLET & DESKTOP',
    proposta: 'Ambiente de trabalho em 3 colunas simultâneas: navegação, feed de artigos e bloco de notas/súmulas.',
    destaque: '3 Colunas Simultâneas · Anotações Rápidas · Multitarefa',
    icone: 'Columns',
    gradiente: 'from-fuchsia-500/20 via-purple-950/30 to-black',
    corTema: '#d946ef',
  },
};

const STORAGE_ACTIVE_KEY = 'direito_prime_home_layout_active';
const STORAGE_PREVIEW_KEY = 'direito_prime_home_layout_preview';

export function getActiveHomeLayout(): HomeLayoutId {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (parsed >= 1 && parsed <= 10) return parsed as HomeLayoutId;
    }
  } catch {}
  return 1;
}

export function setActiveHomeLayout(id: HomeLayoutId) {
  try {
    localStorage.setItem(STORAGE_ACTIVE_KEY, String(id));
  } catch {}
}

export function useHomeLayoutState() {
  const [activeLayout, setActiveLayoutState] = useState<HomeLayoutId>(getActiveHomeLayout);
  const [previewLayout, setPreviewLayout] = useState<HomeLayoutId>(activeLayout);
  const [viewport, setViewport] = useState<ViewportMode>('mobile');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const switchActive = (id: HomeLayoutId) => {
    setActiveLayoutState(id);
    setActiveHomeLayout(id);
  };

  return {
    activeLayout,
    previewLayout,
    setPreviewLayout,
    switchActive,
    viewport,
    setViewport,
    isFullscreen,
    setIsFullscreen,
  };
}
