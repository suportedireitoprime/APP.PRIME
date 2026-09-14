import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, ExternalLink, LifeBuoy, Calendar, CheckCircle2,
  Sparkles, Brain, Monitor, ClipboardCheck, Mic, Newspaper, Library, Shield,
  CreditCard, Wallet, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {  format, differenceInDays  } from "@/lib/dateUtils";
import { Capacitor } from '@capacitor/core';
import CancelarAssinaturaSheet from './CancelarAssinaturaSheet';
import { abrirLink } from '@/lib/nativo';

interface Props {
  plano: string | null;
  expiresAt: string | null;
  startedAt?: string | null;
  source: 'play' | 'apple' | 'asaas' | null;
  status?: string | null;
  isAdminOverride?: boolean;
}

function planoLabel(plano: string | null): string {
  if (!plano) return 'Premium';
  const p = plano.toLowerCase();
  if (p.includes('anual') || p.includes('yearly') || p.includes('year')) return 'Premium Anual';
  if (p.includes('mensal') || p.includes('month')) return 'Premium Mensal';
  return `Premium (${plano})`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "dd 'de' MMMM 'de' yyyy");
  } catch {
    return iso;
  }
}

interface HistoryRow {
  id: string;
  product_id: string | null;
  status: string | null;
  expires_at: string | null;
  created_at?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  SUBSCRIPTION_STATE_ACTIVE: 'Ativa',
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: 'Em graça',
  SUBSCRIPTION_STATE_ON_HOLD: 'Em espera',
  SUBSCRIPTION_STATE_PAUSED: 'Pausada',
  SUBSCRIPTION_STATE_CANCELED: 'Cancelada',
  SUBSCRIPTION_STATE_EXPIRED: 'Expirada',
  SUBSCRIPTION_STATE_PENDING: 'Pendente',
};
const ACTIVE_STATUSES = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);

type Tab = 'beneficios' | 'historico' | 'pagamento';

const BENEFICIOS = [
  { icon: Brain, title: 'IA Jurídica Ilimitada', desc: 'Tire dúvidas 24/7 sem limite diário.' },
  { icon: Monitor, title: 'Desktop, Web e Mobile', desc: 'Tudo sincronizado + 20 recursos exclusivos.' },
  { icon: ClipboardCheck, title: 'Questões OAB', desc: 'Correção detalhada por IA em segundos.' },
  { icon: Mic, title: 'Narração de Leis', desc: 'Voz humana para ouvir leis inteiras.' },
  { icon: Newspaper, title: 'Radar Legislativo', desc: 'Alertas de PLs e decisões em tempo real.' },
  { icon: Library, title: 'Biblioteca Premium', desc: 'Ebooks e materiais completos liberados.' },
  { icon: Shield, title: 'Sem anúncios', desc: 'Zero interrupções durante o estudo.' },
  { icon: Sparkles, title: 'Suporte prioritário', desc: 'Atendimento rápido pela equipe Direito Prime.' },
];

export default function MinhaAssinaturaView({ plano, expiresAt, startedAt, source, status, isAdminOverride }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('beneficios');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tab !== 'historico' || !user) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      const [playRes, appleRes] = await Promise.all([
        supabase
          .from('play_subscriptions')
          .select('id, product_id, status, expires_at, created_at')
          .eq('user_id', user.id)
          .order('expires_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('apple_subscriptions')
          .select('id, product_id, status, expires_at, created_at')
          .eq('user_id', user.id)
          .order('expires_at', { ascending: false, nullsFirst: false }),
      ]);
      const rows = [...(playRes.data ?? []), ...(appleRes.data ?? [])].sort((a, b) => {
        const aDate = a.expires_at ? new Date(a.expires_at).getTime() : 0;
        const bDate = b.expires_at ? new Date(b.expires_at).getTime() : 0;
        return bDate - aDate;
      });
      if (!cancelled) {
        setHistory(rows as HistoryRow[]);
        setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, user]);

  const openStore = () => {
    if (source === 'apple') {
      void abrirLink('https://apps.apple.com/account/subscriptions');
    } else {
      void abrirLink('https://play.google.com/store/account/subscriptions');
    }
  };

  const openSupport = () => {
    const subject = encodeURIComponent('Suporte Direito Prime Premium');
    const body = encodeURIComponent(`Olá, sou assinante ${planoLabel(plano)} e preciso de ajuda.`);
    window.location.href = `mailto:wn7corporation@gmail.com?subject=${subject}&body=${body}`;
  };

  const label = planoLabel(plano);
  const isAnual = /anual|year/i.test(plano ?? '');
  const isApple = source === 'apple' || Capacitor.getPlatform() === 'ios';
  const preco = isAnual ? (isApple ? 'R$ 238,80/ano' : 'R$ 199,90/ano') : 'R$ 29,90/mês';
  const equivalente = isAnual ? (isApple ? 'Equivalente a R$ 19,90/mês' : 'Equivalente a R$ 16,66/mês') : null;

  const diasRestantes = useMemo(() => {
    if (!expiresAt) return null;
    try { return Math.max(0, differenceInDays(new Date(expiresAt), new Date())); }
    catch { return null; }
  }, [expiresAt]);

  const totalDias = isAnual ? 365 : 30;
  const progresso = diasRestantes != null
    ? Math.min(100, Math.max(0, ((totalDias - diasRestantes) / totalDias) * 100))
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* Glow sutil */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-6">
          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-body text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <CheckCircle2 className="w-3 h-3" /> Ativa
            </span>
            {isAdminOverride && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-body text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3" /> Concedido
              </span>
            )}
          </div>

          {/* Brand block */}
          <div className="mt-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[22px] sm:text-[24px] leading-none font-bold tracking-tight text-foreground">
                PLANO {label.replace('Premium ', '').toUpperCase().trim() || 'PREMIUM'}
              </h2>
              <p className="font-body text-[13px] text-muted-foreground mt-1.5">
                {preco}{equivalente ? ` · ${equivalente}` : ''}
              </p>
            </div>
          </div>

          {/* Validity strip */}
          <div className="mt-6 rounded-2xl bg-card/60 border border-border/50 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-body text-[11px] uppercase tracking-wider">
                  Próxima renovação
                </span>
              </div>
              <span className="font-display text-sm font-bold text-foreground">
                {fmtDate(expiresAt)}
              </span>
            </div>
            {diasRestantes != null && (
              <>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-3">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
                </div>
                <p className="font-body text-[11px] text-muted-foreground mt-2">
                  <strong className="text-foreground font-medium">{diasRestantes}</strong> {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} no ciclo atual
                </p>
              </>
            )}
          </div>

          {/* Grace period warning */}
          {status === 'in_grace' && (
            <div className="mt-4 rounded-2xl bg-red-600/90 border border-red-400/50 px-4 py-3 text-white shadow-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm font-bold">Falha na cobrança</p>
                  <p className="font-body text-xs text-white/90 mt-0.5 leading-snug">
                    A renovação da sua assinatura não foi concluída. Você continua com acesso Premium até <span className="font-semibold">{fmtDate(expiresAt)}</span>. Para não perder o acesso, atualize sua forma de pagamento na App Store.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {!isAdminOverride && (
              <button
                onClick={openStore}
                className="h-11 rounded-xl bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary transition-colors font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                {source === 'apple' ? 'App Store' : source === 'asaas' ? 'Asaas' : 'Google Play'}
              </button>
            )}
            <button
              onClick={openSupport}
              className={`h-11 rounded-xl bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary transition-colors font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] ${isAdminOverride ? 'col-span-2' : ''}`}
            >
              <LifeBuoy className="w-4 h-4" />
              Suporte
            </button>
          </div>
        </div>
      </motion.div>

      {/* Abas de detalhes */}
      <div className="w-full p-1 rounded-2xl bg-secondary/70 border border-border flex items-center">
        {([
          { id: 'beneficios' as const, label: 'Benefícios' },
          { id: 'historico' as const, label: 'Histórico' },
          { id: 'pagamento' as const, label: 'Pagamento' },
        ]).map((it) => (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`flex-1 px-2 py-2.5 rounded-xl font-body text-xs sm:text-sm font-semibold transition-all ${
              tab === it.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'beneficios' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFICIOS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-3 p-4 rounded-2xl bg-card/60 border border-border/60">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[14px] font-semibold text-foreground leading-tight">{b.title}</p>
                      <p className="font-body text-[12px] text-muted-foreground leading-snug mt-1">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'historico' && (
            <div className="space-y-3">
              {isAdminOverride ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-display text-sm font-bold text-foreground">Plano concedido pela equipe</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Iniciado em {fmtDate(startedAt ?? null)} · sem histórico de cobranças.
                  </p>
                </div>
              ) : loadingHistory ? (
                <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro anterior.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="rounded-2xl border border-border/60 p-4 bg-card/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-sm font-semibold text-foreground">
                        {planoLabel(h.product_id)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          h.status && ACTIVE_STATUSES.has(h.status)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(h.status && STATUS_LABEL[h.status]) ?? h.status ?? '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Expira em: {fmtDate(h.expires_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'pagamento' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-3">
                <InfoLine icon={CreditCard} label="Método" value={
                  isAdminOverride ? 'Concedido pela equipe' :
                  source === 'play' ? 'Google Play' :
                  source === 'apple' ? 'App Store' :
                  source === 'asaas' ? 'Asaas (assinatura anterior)' : '—'
                } />
                <InfoLine icon={Wallet} label={isAdminOverride ? 'Cobrança' : 'Próxima cobrança'} value={
                  isAdminOverride ? 'Não se aplica' : `${preco} em ${fmtDate(expiresAt)}`
                } />
                <InfoLine icon={Calendar} label="Início" value={fmtDate(startedAt ?? null)} />
                <InfoLine icon={Calendar} label="Renovação" value={fmtDate(expiresAt)} />
              </div>
              {!isAdminOverride && (
                <Button onClick={openStore} variant="secondary" className="w-full h-11">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Alterar forma de pagamento
                </Button>
              )}
              <Button
                onClick={() => setCancelOpen(true)}
                variant="outline"
                className="w-full h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Cancelar assinatura
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <CancelarAssinaturaSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        expiresAt={expiresAt}
        startedAt={startedAt ?? null}
        isAdminOverride={!!isAdminOverride}
      />
    </>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-body text-sm text-foreground font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
