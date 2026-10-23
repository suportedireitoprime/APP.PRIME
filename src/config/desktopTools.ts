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
  Bird,
  Speech,
  FolderOpen,
  CalendarDays,
  Gamepad2,
  Camera,
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
    id: 'ia',
    label: 'Inteligência Artificial',
    hint: 'Tutores jurídicos e ferramentas com inteligência artificial',
    tools: [
      { id: 'assistente', label: 'Hórus', desc: 'Assistente WhatsApp', icon: Bird, route: '/assistente-horus', color: '#A855F7' },
      { id: 'me-explique', label: 'Me Explique (IA)', desc: 'Explicações jurídicas com voz, câmera e avatar interativo', icon: Speech, route: '/me-explique', color: '#F97316' },
    ],
  },
  {
    id: 'pratica',
    label: 'Prática Forense',
    hint: 'Modelos e documentos para o dia a dia',
    tools: [
      { id: 'documentos', label: 'Documentos Prontos', desc: 'Petições, Contratos e modelos jurídicos', icon: FolderOpen, route: '/documentos', color: '#F59E0B' },
    ],
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    hint: 'Acompanhe alterações legislativas e notícias',
    tools: [
      { id: 'radar-concursos', label: 'Radar de Concursos', desc: 'Alertas por cargo, estado e Hórus IA', icon: Bell, route: '/ferramentas/radar-concursos', color: '#10B981' },
      { id: 'radares', label: 'Radares de Leis', desc: 'Alterações de leis e projetos monitorados', icon: Radar, route: '/radares', color: '#0EA5E9' },
      { id: 'noticias', label: 'Notícias', desc: 'Notícias jurídicas e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
      { id: 'boletins', label: 'Boletins Jurídicos', desc: 'Vídeo diário com as normas quentes', icon: MicVocal, route: '/boletins', color: '#EF4444' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Receba o resumo por e-mail', icon: Mail, route: '/newsletter', color: '#F97316' },
    ],
  },
];

export const DESKTOP_TOOLS_FLAT: DesktopTool[] = DESKTOP_TOOL_GROUPS.flatMap((g) => g.tools);
