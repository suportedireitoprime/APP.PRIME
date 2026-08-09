import {
  BookOpenText,
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
    id: 'pesquisa',
    label: 'Pesquisa',
    hint: 'Consulta rápida de conceitos, resumos e referências',
    tools: [
      { id: 'dicionario', label: 'Dicionário Jurídico', desc: 'Termos e conceitos do Direito', icon: BookOpenText, route: '/ferramentas/dicionario', color: '#3B82F6' },
      { id: 'resumos', label: 'Resumos Jurídicos', desc: 'Biblioteca por área, tema e subtema', icon: NotebookText, route: '/resumos-juridicos', color: '#A855F7' },
      { id: 'locais', label: 'Locais Jurídicos', desc: 'Tribunais, cartórios e delegacias', icon: MapPin, route: '/ferramentas/locais', color: '#14B8A6' },
      { id: 'assistente', label: 'Assistente Horus', desc: 'IA jurídica para tirar dúvidas', icon: Sparkles, route: '/assistente-horus', color: '#DC2626' },
    ],
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    hint: 'Acompanhe alterações legislativas e notícias',
    tools: [
      { id: 'radares', label: 'Radares', desc: 'Alterações de leis e projetos monitorados', icon: Radar, route: '/radares', color: '#0EA5E9' },
      { id: 'radar360', label: 'Radar 360', desc: 'Alterações recentes e projetos de lei', icon: ScanEye, route: '/radar-360', color: '#6366F1' },
      { id: 'noticias', label: 'Notícias', desc: 'Notícias jurídicas e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
      { id: 'boletins', label: 'Boletins Jurídicos', desc: 'Vídeo diário com as normas quentes', icon: Clapperboard, route: '/boletins', color: '#EF4444' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Receba o resumo por e-mail', icon: Mail, route: '/newsletter', color: '#F97316' },
    ],
  },
  {
    id: 'producao',
    label: 'Produção',
    hint: 'Escreva, grave e organize seu material',
    tools: [
      { id: 'peticao', label: 'Petição Inicial', desc: 'Monte peças com apoio de IA', icon: FileSignature, route: '/ferramentas/peticao-inicial', color: '#10B981' },
      { id: 'gravar', label: 'Gravar aula', desc: 'Grave e transcreva áudios de estudo', icon: Mic, route: '/anotacoes/audio', color: '#F43F5E' },
      { id: 'anotacoes', label: 'Anotações', desc: 'Suas anotações e grifos', icon: NotebookText, route: '/anotacoes', color: '#8B5CF6' },
      { id: 'tematica', label: 'Temática Jurídica', desc: 'Filmes, séries e documentários', icon: Film, route: '/tematica-juridica', color: '#0891B2' },
    ],
  },
  {
    id: 'estudo',
    label: 'Estudo e conta',
    hint: 'Sua trilha, seus materiais e sua assinatura',
    tools: [
      { id: 'aprender', label: 'Aprender', desc: 'Trilhas, aulas e flashcards', icon: GraduationCap, route: '/aprender', color: '#EF4444' },
      { id: 'flashcards', label: 'Flashcards', desc: 'Decks, revisão e progresso por área', icon: Layers, route: '/flashcards', color: '#F59E0B' },
      { id: 'biblioteca', label: 'Biblioteca', desc: 'Livros e coleções de estudo', icon: Library, route: '/bibliotecas', color: '#3B82F6' },
      { id: 'offline', label: 'Modo Offline', desc: 'Baixe leis e livros para usar sem internet', icon: CloudDownload, route: '/modo-offline', color: '#64748B' },
      { id: 'meu-espaco', label: 'Meu Espaço', desc: 'Tudo que você salvou em um lugar', icon: User, route: '/meu-espaco', color: '#A855F7' },
      { id: 'lembretes', label: 'Meus Lembretes', desc: 'Avisos e rotinas de estudo', icon: Bell, route: '/meus-lembretes', color: '#DC2626' },
      { id: 'assinatura', label: 'Assinatura', desc: 'Planos, créditos e benefícios', icon: CreditCard, route: '/assinatura', color: '#10B981' },
      { id: 'suporte', label: 'Suporte', desc: 'Fale com a equipe Direito Prime', icon: LifeBuoy, route: '/suporte', color: '#EC4899' },
      { id: 'forca', label: 'Jogo da Forca', desc: 'Teste seu vocabulário jurídico', icon: Scale, route: '/gamificacao/forca', color: '#FACC15' },
    ],
  },
];

export const DESKTOP_TOOLS_FLAT: DesktopTool[] = DESKTOP_TOOL_GROUPS.flatMap((g) => g.tools);
