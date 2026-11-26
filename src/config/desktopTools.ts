import {
  Newspaper,
  Film,
  Clapperboard,
  Radar,
  Headphones,
  Bird,
  Speech,
  type LucideIcon,
} from 'lucide-react';

export type DesktopTool = {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  route: string;
  color: string;
};

export type DesktopToolGroup = {
  id: string;
  label: string;
  hint: string;
  tools: DesktopTool[];
};

/**
 * Catálogo único das funções disponíveis no desktop.
 * Serve tanto para a página /ferramentas quanto para a aba Ferramentas da Home.
 */
export const DESKTOP_TOOL_GROUPS: DesktopToolGroup[] = [
  {
    id: 'ia',
    label: 'Inteligência Artificial',
    hint: 'Tutores jurídicos e ferramentas com inteligência artificial',
    tools: [
      { id: 'assistente', label: 'Hórus', desc: 'Assistente jurídico inteligente', icon: Bird, route: '/assistente-horus', color: '#A855F7' },
      { id: 'me-explique', label: 'Me Explique (IA)', desc: 'Explicações jurídicas com voz e tutor interativo', icon: Speech, route: '/me-explique', color: '#F97316' },
    ],
  },
  {
    id: 'midia',
    label: 'Estudo Visual & Áudio',
    hint: 'Casos animados, leis narradas e videoaulas',
    tools: [
      { id: 'animacoes', label: 'Animações Jurídicas', desc: 'Casos penais e OAB explicados em animação 2D', icon: Clapperboard, route: '/animacoes', color: '#F59E0B' },
      { id: 'audioleis', label: 'Ouça a Lei', desc: 'Artigos de lei narrados com acompanhamento', icon: Headphones, route: '/audioleis', color: '#10B981' },
      { id: 'videoaulas', label: 'Videoaulas', desc: 'Aulas em vídeo organizadas por matéria', icon: Film, route: '/videoaulas', color: '#E11D48' },
    ],
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    hint: 'Acompanhe alterações legislativas e notícias',
    tools: [
      { id: 'radares', label: 'Radares de Leis', desc: 'Alterações de leis e projetos monitorados', icon: Radar, route: '/radares', color: '#0EA5E9' },
      { id: 'noticias', label: 'Notícias', desc: 'Notícias jurídicas e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
    ],
  },
];

export const DESKTOP_TOOLS_FLAT: DesktopTool[] = DESKTOP_TOOL_GROUPS.flatMap((g) => g.tools);
