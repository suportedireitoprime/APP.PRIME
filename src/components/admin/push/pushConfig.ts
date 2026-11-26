import type { ModuloNotificacaoLocal } from '@/lib/nativo/notificacaoLocalManager';

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  status: string;
  url?: string | null;
  image_url?: string | null;
  next_run_at?: string | null;
  created_at: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  failed_count: number;
  audience?: unknown;
  tipo?: string | null;
}

export type TabMode = 'grade2h' | 'dashboard' | 'manual' | 'laboratorio';
export type TargetAudience = 'users_only' | 'premium' | 'free' | 'test_admin';

export interface GradeSlot {
  hora: string;
  titulo: string;
  desc: string;
  emoji: string;
  tag: string;
  rota: string;
  modulo: ModuloNotificacaoLocal;
}

export const GRADE_2_HORAS: GradeSlot[] = [
  { hora: '06:00', titulo: 'Boletim Matinal', desc: 'Atualizações jurídicas e novidades para iniciar o dia.', emoji: '🌅', tag: 'Notícias', rota: '/radar-360', modulo: 'boletim' },
  { hora: '08:00', titulo: 'Novas Leis & CF88', desc: 'Atos publicados no Diário Oficial e artigos da Constituição.', emoji: '📜', tag: 'Legislação', rota: '/vade-mecum', modulo: 'livros' },
  { hora: '10:00', titulo: 'Dicionário Jurídico', desc: 'Conceito e vocabulário técnico com exemplo prático.', emoji: '📖', tag: 'Vocabulário', rota: '/ferramentas/dicionario', modulo: 'livros' },
  { hora: '12:00', titulo: 'Sugestão de Leitura', desc: 'Livro estratégico da biblioteca para a pausa do almoço.', emoji: '📚', tag: 'Biblioteca', rota: '/biblioteca', modulo: 'livros' },
  { hora: '14:00', titulo: 'Áudio-aula Explicativa', desc: 'Revisão jurídica em áudio citando o nome do estudante.', emoji: '🎧', tag: 'Áudio', rota: '/audioaulas', modulo: 'audioaulas' },
  { hora: '16:00', titulo: 'Pílula Jurídica', desc: 'Conceito clássico ou resumo doutrinário de 2 minutos.', emoji: '💊', tag: 'Pílula', rota: '/blog', modulo: 'boletim' },
  { hora: '18:00', titulo: 'Resumo do Expediente', desc: 'Fechamento do dia com as principais decisões dos tribunais.', emoji: '🌆', tag: 'Tribunais', rota: '/radar-360', modulo: 'boletim' },
  { hora: '20:00', titulo: 'Questão de Fixação', desc: 'Simulado prático de OAB e Concursos para a noite.', emoji: '🧠', tag: 'Questões', rota: '/questoes', modulo: 'streak' },
  { hora: '22:00', titulo: 'Áudio de Revisão', desc: 'Revisão passiva antes de dormir para consolidar a matéria.', emoji: '🌙', tag: 'Revisão', rota: '/audioaulas', modulo: 'audioaulas' },
  { hora: '00:00', titulo: 'Videoaula Coruja', desc: 'Aula rápida com tema coringa para quem estuda na madrugada.', emoji: '🦉', tag: 'Vídeo', rota: '/aprender', modulo: 'videoaulas' },
];

export function getTodayBrasiliaIso(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

export function getBrasiliaDateStr(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  } catch {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  }
}

export function getNextRunInfo(nextRunAtIso: string | null | undefined, nowMs: number) {
  if (!nextRunAtIso) return null;
  const diffMs = new Date(nextRunAtIso).getTime() - nowMs;
  if (diffMs <= 0) return { passed: true, diffMin: 0, label: 'Disparando agora' };
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;

  if (diffHours > 0) {
    return { passed: false, diffMin, label: `em ${diffHours}h ${remMin > 0 ? `${remMin}min` : ''}`.trim() };
  }
  return { passed: false, diffMin, label: `em ${diffMin} min` };
}

export function buildAudiencePayload(targetAudience: TargetAudience) {
  if (targetAudience === 'premium') return { premium: 'premium', target: 'all', include_admins: true };
  if (targetAudience === 'free') return { premium: 'free', target: 'all', include_admins: true };
  if (targetAudience === 'test_admin') return { target: 'admins_only', include_admins: true };
  return { all: true, target: 'all', include_admins: true };
}
