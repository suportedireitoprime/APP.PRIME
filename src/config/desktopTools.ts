import {
  BookOpenText,
  MicVocal,
  ScanEye,
  Newspaper,
  Film,
  NotebookText,
  Clapperboard,
  MapPin,
  Radar,
  FileSignature,
  Mic,
  Mail,
  CloudDownload,
  Library,
  GraduationCap,
  Bell,
  CreditCard,
  LifeBuoy,
  User,
  Sparkles,
  Layers,
  Scale,
  Trophy,
  Bot,
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
 * Serve tanto para a página /ferramentas quanto para o menu rápido do cabeçalho,
 * garantindo que nenhuma função fique acessível só no mobile.
 */
export const DESKTOP_TOOL_GROUPS: DesktopToolGroup[] = [
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    hint: 'Acompanhe alterações legislativas e notícias',
    tools: [
      { id: 'radares', label: 'Radares de Leis', desc: 'Alterações de leis e projetos monitorados', icon: Radar, route: '/radares', color: '#0EA5E9' },
      { id: 'noticias', label: 'Notícias', desc: 'Notícias jurídicas e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
      { id: 'boletins', label: 'Boletins Jurídicos', desc: 'Vídeo diário com as normas quentes', icon: MicVocal, route: '/boletins', color: '#EF4444' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Receba o resumo por e-mail', icon: Mail, route: '/newsletter', color: '#F97316' },
    ],
  },
  {
    id: 'producao',
    label: 'Produção',
    hint: 'Escreva, grave e organize seu material',
    tools: [
      { id: 'peticao', label: 'Petição Inicial', desc: 'Monte peças com apoio de IA', icon: FileSignature, route: '/ferramentas/peticao-inicial', color: '#10B981' },
    ],
  },
  {
    id: 'utilitarios',
    label: 'Utilitários',
    hint: 'Recursos adicionais do aplicativo',
    tools: [
      { id: 'locais', label: 'Locais Jurídicos', desc: 'Fóruns, cartórios e delegacias', icon: MapPin, route: '/ferramentas/locais', color: '#EAB308' },
      { id: 'offline', label: 'Modo Offline', desc: 'Baixe leis e livros para usar sem internet', icon: CloudDownload, route: '/modo-offline', color: '#64748B' },
    ],
  },
  {
    id: 'gamificacao',
    label: 'Gamificação',
    hint: 'Aprenda jogando e compita no Ranking Elite',
    tools: [
      { id: 'tribunal', label: 'Tribunal Simulado', desc: 'Simulador prático de defesa criminal', icon: Scale, route: '/tribunal-simulado', color: '#8B5CF6' },
      { id: 'forca', label: 'Jogo da Forca', desc: 'Teste seu vocabulário jurídico', icon: Trophy, route: '/gamificacao/forca', color: '#FACC15' },
      { id: 'caca-palavras', label: 'Caça-palavras', desc: 'Em breve', icon: BookOpenText, route: '#', color: '#6B7280' },
      { id: 'palavras-cruzadas', label: 'Palavras cruzadas', desc: 'Em breve', icon: NotebookText, route: '#', color: '#6B7280' },
      { id: 'ranking', label: 'Ranking Elite', desc: 'Veja sua posição no pódio', icon: Trophy, route: '/gamificacao/ranking', color: '#F59E0B' },
    ],
  },
];

export const DESKTOP_TOOLS_FLAT: DesktopTool[] = DESKTOP_TOOL_GROUPS.flatMap((g) => g.tools);
