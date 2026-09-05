import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';

export interface PresenceUser {
  user_id: string;
  email: string;
  display_name: string;
  current_route: string;
  online_at: string;
}

export interface ActivityRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  current_route: string | null;
  last_seen_at: string;
}

export interface NormalizedUser {
  id: string;
  email: string;
  name: string;
  route: string | null;
  time: string;
  isOnline: boolean;
  accesses?: number;
}

export type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d';

export interface RouteVisit {
  label: string;
  route: string;
  count: number;
  totalMs: number;
}

export interface UserDetail {
  userId: string;
  email: string;
  name: string;
  totalAccesses: number;
  distinctDays: number;
  firstSeen: string;
  lastSeen: string;
  isRecurrent: boolean;
  totalTimeMs: number;
  routes: RouteVisit[];
}

export const STATIC_ROUTES: Record<string, string> = {
  '/': 'Início',
  '/landing': 'Landing',
  '/auth': 'Autenticação',
  '/onboarding': 'Onboarding',
  '/ferramentas': 'Ferramentas',
  '/ferramentas/locais': 'Locais Jurídicos',
  '/estudos': 'Estudar',
  '/biblioteca': 'Biblioteca',
  '/bibliotecas': 'Biblioteca',
  '/radar-360': 'Radar 360',
  '/radares': 'Radares',
  '/noticias': 'Notícias',
  '/novidades': 'Novidades',
  '/anotacoes': 'Anotações',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil',
  '/narracao': 'Narração',
  '/explicacao-lei': 'Explicação de Lei',
  '/resumos-juridicos': 'Resumos Jurídicos',
  '/aprender': 'Aprender',
  '/sobre': 'Sobre',
  '/blog': 'Blog',
  '/newsletter': 'Newsletter',
  '/planos': 'Planos',
  '/assinatura': 'Assinatura',
  '/compartilhado': 'Compartilhado',
  '/grafo-artigos': 'Grafo de Artigos',
  '/tematica-juridica': 'Temática Jurídica',
  '/gerador-post': 'Gerador de Post',
  '/legislacao-estadual': 'Legislação Estadual',
  '/admin-funcoes': 'Admin · Funções',
  '/admin-monitor': 'Admin · Monitor',
  '/admin-monitor-usuarios': 'Admin · Usuários',
};

export function titleCase(s: string) {
  return s
    .replace(/[-_+]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function getRouteLabel(route: string | null): string {
  if (!route) return 'Desconhecida';
  const [pathRaw] = route.split('?');
  const path = pathRaw.replace(/\/+$/, '') || '/';
  if (STATIC_ROUTES[path]) return STATIC_ROUTES[path];

  const parts = path.split('/').filter(Boolean).map(safeDecode);
  const seg = (i: number) => (parts[i] ? titleCase(parts[i]) : '');

  if (parts[0] === 'bibliotecas' || parts[0] === 'biblioteca') {
    if (parts.length >= 3) return `Biblioteca · ${seg(1)} · ${seg(2)}`;
    if (parts.length === 2) return `Biblioteca · ${seg(1)}`;
    return 'Biblioteca';
  }
  if (parts[0] === 'leitor-nativo') return `Leitor Nativo${parts[1] ? ` · ${seg(1)}` : ''}`;
  if (parts[0] === 'legislacao') {
    if (parts.length >= 3) return `Legislação · ${seg(2)}`;
    if (parts.length === 2) return `Legislação · ${seg(1)}`;
    return 'Legislação';
  }
  if (parts[0] === 'legislacao-estadual') {
    if (parts.length >= 4) return `Lei Estadual · ${parts[1].toUpperCase()} · ${seg(3)}`;
    if (parts.length >= 2) return `Legislação · ${parts[1].toUpperCase()}`;
    return 'Legislação Estadual';
  }
  if (parts[0] === 'aprender') {
    if (parts[1] === 'categoria' && parts[2]) return `Aprender · ${seg(2)}`;
    if (parts[1]) return `Aprender · ${seg(1)}`;
    return 'Aprender';
  }
  if (parts[0] === 'radar') return `Radar · ${seg(1)}`;
  if (parts[0] === 'resumos-juridicos') {
    if (parts.length >= 3) return `Resumo · ${seg(1)} · ${seg(2)}`;
    if (parts.length === 2) return `Resumo · ${seg(1)}`;
    return 'Resumos';
  }
  if (parts[0] === 'ajustes') return `Ajustes · ${seg(1)}`;
  if (parts[0] === 'admin' || parts[0]?.startsWith('admin-')) {
    return `Admin · ${
      parts
        .slice(1)
        .map((_, i) => seg(i + 1))
        .filter(Boolean)
        .join(' · ') ||
      seg(0).replace('Admin', '').trim() ||
      'Painel'
    }`;
  }
  if (parts[0] === 'normas') return `Norma · ${seg(1)}`;

  return titleCase(parts.join(' · '));
}

export function formatPreciseTime(time: string) {
  const d = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'agora';
  if (diffSec < 60) return `${diffSec}s atrás`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min atrás`;
  if (diffSec < 86400) return format(d, 'HH:mm', { locale: ptBR });
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatDuration(ms: number) {
  if (!ms || ms < 1000) return '0s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}

export function buildRouteRank(rows: ActivityRow[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const label = getRouteLabel(r.current_route);
    map[label] = (map[label] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export const MEDAL = ['🥇', '🥈', '🥉'];
export const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

export interface MetricCard {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  count: number;
  clickable: boolean;
  users?: NormalizedUser[];
}

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const getDatasPeriodo = (p: PeriodoId) => {
  const hoje = new Date();
  if (p === 'hoje') return [hoje];
  if (p === 'ontem') {
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    return [ontem];
  }
  const dias = p === '7d' ? 7 : 30;
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date();
    d.setDate(hoje.getDate() - i);
    return d;
  });
};
