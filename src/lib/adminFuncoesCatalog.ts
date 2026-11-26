import {
  BellRing,
  Bird,
  CloudDownload,
  Crown,
  FileSignature,
  FlaskConical,
  Globe,
  Lightbulb,
  Newspaper,
  Presentation,
  Route as RouteIcon,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export type AdminFuncoesItem = {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
};

export type AdminFuncoesCategory = {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: AdminFuncoesItem[];
  route?: string;
};

const PREFETCH: Record<string, () => Promise<unknown>> = {
  '/admin-assinantes': () => import('@/pages/admin/AdminAssinantes'),
  '/admin-aulas-interativas': () => import('@/pages/admin/AdminAulasInterativas'),
  '/admin-laboratorio-aulas': () => import('@/pages/admin/AdminLaboratorioAulas'),
  '/admin-lousa-magica': () => import('@/pages/admin/AdminLousaMagica'),
  '/admin-push': () => import('@/pages/admin/AdminPush'),
  '/admin-notificacoes-locais': () => import('@/pages/admin/AdminNotificacoesLocais'),
  '/admin-horus': () => import('@/pages/admin/AdminHorus'),
  '/admin-omniroute': () => import('@/pages/admin/AdminOmniRouteTeste'),
  '/admin-rotas': () => import('@/pages/admin/AdminRotas'),
  '/explicacao-lei': () => import('@/pages/vademecum/ExplicacaoLei'),
};

const prefetched = new Set<string>();
const prefetching = new Map<string, Promise<unknown>>();

export function prefetchAdminRoute(route?: string): Promise<unknown> {
  const factory = route ? PREFETCH[route] : undefined;
  if (!route || !factory) return Promise.resolve();
  if (prefetched.has(route)) return Promise.resolve();
  const existing = prefetching.get(route);
  if (existing) return existing;
  const promise = factory()
    .then((result) => {
      prefetched.add(route);
      prefetching.delete(route);
      return result;
    })
    .catch((error) => {
      prefetching.delete(route);
      throw error;
    });
  prefetching.set(route, promise);
  return promise;
}

const ICON_HUES = [
  '0 72% 58%',
  '18 88% 58%',
  '36 92% 55%',
  '48 90% 55%',
  '84 60% 50%',
  '150 60% 45%',
  '168 66% 45%',
  '193 80% 50%',
  '208 80% 58%',
  '224 76% 62%',
  '258 70% 66%',
  '280 66% 64%',
  '310 66% 60%',
  '336 70% 58%',
];

export function adminIconColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${ICON_HUES[h % ICON_HUES.length]})`;
}

export const ADMIN_CATEGORIES: AdminFuncoesCategory[] = [
  {
    id: 'assinantes',
    title: 'Gestão de Assinantes',
    desc: 'Assinantes Mensais, Anuais e Vitalícios com histórico de pagamentos Asaas',
    icon: Crown,
    route: '/admin-assinantes',
    items: [
      {
        id: 'admin-assinantes',
        label: 'Gestão de Assinantes',
        icon: Crown,
        desc: 'Mensais, Anuais, Vitalícios, histórico Asaas e pagamentos detalhados',
        route: '/admin-assinantes',
      },
    ],
  },
  {
    id: 'lousa-magica-cat',
    title: 'Lousa Mágica',
    desc: 'Aulas narradas com lousa animada, traços em giz e ilustrações',
    icon: Presentation,
    route: '/admin-lousa-magica',
    items: [
      {
        id: 'lousa-magica',
        label: 'Lousa Mágica',
        icon: Presentation,
        desc: 'Lousa interativa sobre Teoria Pura do Direito e Escolas Penais',
        route: '/admin-lousa-magica',
      },
    ],
  },
  {
    id: 'laboratorio-cat',
    title: 'Laboratório',
    desc: 'Aulas teste e experimentos de layout visual, 3D e novas dinâmicas',
    icon: FlaskConical,
    route: '/admin-laboratorio-aulas',
    items: [
      {
        id: 'atlas-juridico',
        label: 'Atlas Jurídico 3D',
        icon: Globe,
        desc: 'Globo 3D interativo com as 7 funções do Art. 5º do CP (Territorialidade)',
        route: '/admin-atlas-juridico',
      },
      {
        id: 'laboratorio-aulas',
        label: 'Laboratório de Layout',
        icon: FlaskConical,
        desc: 'Ambiente de testes para protótipos de layout sem alterar a aula principal',
        route: '/admin-laboratorio-aulas',
      },
    ],
  },
  {
    id: 'push',
    title: 'Notificações Push',
    desc: 'Campanhas, agendamento e métricas',
    icon: Send,
    items: [
      {
        id: 'admin-push',
        label: 'Painel de Push',
        icon: BellRing,
        desc: 'Compor, agendar, campanhas e métricas',
        route: '/admin-push',
      },
      {
        id: 'admin-notificacoes-locais',
        label: 'Notificações Locais (Retenção)',
        icon: Smartphone,
        desc: 'Continuar assistindo/lendo, barra de progresso e regras no aparelho',
        route: '/admin-notificacoes-locais',
      },
    ],
  },
  {
    id: 'rotas',
    title: 'Rotas do Aplicativo',
    desc: 'Catálogo completo de rotas e sub-rotas em ordem alfabética',
    icon: RouteIcon,
    route: '/admin-rotas',
  },
  {
    id: 'horus-exclusivo',
    title: 'Horus',
    desc: 'Assistente Horus no WhatsApp — instância, usuários e conversas',
    icon: Bird,
    route: '/admin-horus',
  },
  {
    id: 'geracao-conteudo',
    title: 'Geração de Conteúdo',
    desc: 'IA, biblioteca e estudos',
    icon: Newspaper,
    items: [
      {
        id: 'omniroute-admin',
        label: 'OmniRoute (Gateway de IA)',
        icon: Sparkles,
        desc: 'Central unificada de modelos e chaves de IA do aplicativo',
        route: '/admin-omniroute',
      },
      {
        id: 'explicacao-lei',
        label: 'Explicações Editar (IA)',
        icon: Lightbulb,
        desc: 'Batch de explicações',
        route: '/explicacao-lei',
      },
    ],
  },
  {
    id: 'utilitarios',
    title: 'Utilitários',
    desc: 'Funções restritas para admin',
    icon: FileSignature,
    items: [
      {
        id: 'offline',
        label: 'Modo Offline',
        icon: CloudDownload,
        desc: 'Baixe leis e livros para usar sem internet',
        route: '/modo-offline',
      },
    ],
  },
];

export function prefetchAllAdminRoutes(): void {
  const routes = Array.from(
    new Set(
      ADMIN_CATEGORIES.flatMap((cat) => [
        ...(cat.route ? [cat.route] : []),
        ...(cat.items || []).map((item) => item.route).filter(Boolean),
      ]),
    ),
  ) as string[];
  routes.forEach((r) => void prefetchAdminRoute(r));
}
