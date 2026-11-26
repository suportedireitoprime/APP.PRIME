import { Mail, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardId, Seen } from './visaoGeralTypes';

export const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;

export const getHojeBrasilia = (): Date => {
  const spStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [mes, dia, ano] = spStr.split('/');
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
};

export const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getBrasiliaDayRange = (datas: Date[]) => {
  const dataMin = datas[datas.length - 1];
  const dataMax = datas[0];
  const isoMin = isoDate(dataMin);
  const isoMax = isoDate(dataMax);
  const startIso = new Date(`${isoMin}T00:00:00-03:00`).toISOString();
  const nextDay = new Date(`${isoMax}T00:00:00-03:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return { startIso, endIso: nextDay.toISOString() };
};

export const dayRange = (d: Date) => {
  const iso = isoDate(d);
  const start = new Date(`${iso}T00:00:00-03:00`).toISOString();
  const nextDay = new Date(`${iso}T00:00:00-03:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return { start, end: nextDay.toISOString() };
};

export const sameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b);

export const hora = (v?: string | null) =>
  v
    ? new Date(v).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const seenStorageKey = (id: CardId, d: Date) => `admin_hoje_seen_${id}_${isoDate(d)}`;

export const readSeen = (id: CardId, d: Date): Seen => {
  try {
    const raw = localStorage.getItem(seenStorageKey(id, d));
    if (!raw) return { count: 0, keys: [] };
    const parsed = JSON.parse(raw);
    return { count: parsed.count || 0, keys: Array.isArray(parsed.keys) ? parsed.keys : [] };
  } catch {
    return { count: 0, keys: [] };
  }
};

export const writeSeen = (id: CardId, d: Date, seen: Seen) => {
  try {
    localStorage.setItem(seenStorageKey(id, d), JSON.stringify(seen));
  } catch {
    /* ignore */
  }
};

export function formatTempoCadastro(createdAt?: string | null, fallbackSubtitle?: string | null): string {
  if (createdAt) {
    const dataCad = new Date(createdAt);
    if (!isNaN(dataCad.getTime())) {
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const inicioCad = new Date(dataCad.getFullYear(), dataCad.getMonth(), dataCad.getDate());
      const diffDias = Math.floor((inicioHoje.getTime() - inicioCad.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias <= 0) return 'Cadastrado hoje';
      if (diffDias === 1) return 'Cadastrado há 1 dia';
      if (diffDias < 30) return `Cadastrado há ${diffDias} dias`;
      const meses = Math.floor(diffDias / 30);
      if (meses === 1) return 'Cadastrado há 1 mês';
      if (meses < 12) return `Cadastrado há ${meses} meses`;
      const anos = (diffDias / 365).toFixed(1).replace('.0', '');
      return `Cadastrado há ${anos} ${anos === '1' ? 'ano' : 'anos'}`;
    }
  }
  if (fallbackSubtitle && fallbackSubtitle !== 'Desconhecida' && fallbackSubtitle !== 'App aberto') {
    return fallbackSubtitle;
  }
  return 'Cadastrado recentemente';
}

export function renderTrialCountdown(createdAt?: string | null, isPremium?: boolean) {
  if (isPremium) {
    return (
      <span className="inline-flex items-center rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-[1px] text-[9.5px] font-bold text-emerald-400">
        ASSINANTE ATIVO
      </span>
    );
  }

  if (!createdAt) return <>{formatTempoCadastro(createdAt, null)}</>;

  const dataCad = new Date(createdAt);
  if (isNaN(dataCad.getTime())) return <>{formatTempoCadastro(createdAt, null)}</>;

  // 3 dias de acesso liberado
  const expiresAt = new Date(dataCad.getTime() + 3 * 24 * 60 * 60 * 1000);
  const diffMs = expiresAt.getTime() - Date.now();

  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-[1px] text-[9.5px] font-bold text-rose-400">
        ACESSO EXPIRADO
      </span>
    );
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-[1px] text-[9.5px]">
      <Timer className="w-2.5 h-2.5" />
      {hours}h {minutes}m restantes
    </span>
  );
}

export function formatStatusPt(status?: string | null): string {
  if (!status) return 'ATIVO';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'ativo') return 'ATIVO';
  if (s.includes('cancel')) return 'CANCELADO';
  if (s.includes('pend')) return 'PENDENTE';
  if (s.includes('overdue') || s.includes('atras')) return 'ATRASADO';
  if (s.includes('trial')) return 'TESTE';
  if (s.includes('expir')) return 'EXPIRADO';
  return status.replace(/^subscription_state_/i, '').toUpperCase();
}

export function formatPlanoTag(plano?: string | null): string {
  if (!plano) return '';
  const p = plano.toLowerCase();
  if (p.includes('anual') && (p.includes('promo') || p.includes('promocional'))) {
    return 'ANUAL PROMO';
  }
  if (p.includes('vital') || p === 'vitalicio') return 'VITALÍCIO';
  if (p.includes('anual')) return 'ANUAL';
  if (p.includes('mensal')) return 'MENSAL';
  return plano.toUpperCase();
}

export const ProviderTag = ({ provider }: { provider?: string | null }) => {
  if (!provider) return null;
  const p = provider.toLowerCase();
  const cfg = p.includes('google')
    ? {
        label: 'Google',
        node: (
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        ),
        bg: 'bg-[hsl(var(--provider-google))]',
        fg: 'text-[hsl(var(--provider-google-foreground))]',
        border: 'border-[hsl(var(--provider-google))]/30',
      }
    : p.includes('apple')
      ? {
          label: 'Apple',
          node: (
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.43.987 3.96.948 1.565-.027 2.613-1.508 3.611-2.973 1.157-1.69 1.636-3.327 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z" />
            </svg>
          ),
          bg: 'bg-[hsl(var(--provider-apple))]',
          fg: 'text-[hsl(var(--provider-apple-foreground))]',
          border: 'border-[hsl(var(--provider-apple))]/30',
        }
      : {
          label: 'E-mail',
          node: <Mail className="w-3 h-3" />,
          bg: 'bg-[hsl(var(--provider-email))]',
          fg: 'text-[hsl(var(--provider-email-foreground))]',
          border: 'border-[hsl(var(--provider-email))]/30',
        };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] font-body text-[10px] shrink-0',
        cfg.bg,
        cfg.fg,
        cfg.border,
      )}
    >
      {cfg.node}
      {cfg.label}
    </span>
  );
};
