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
  if (p.includes('vitalício') || p.includes('vitalicio')) return 'Plano Vitalício';
  if (p.includes('anual') || p.includes('yearly') || p.includes('year')) return 'Plano Anual';
  if (p.includes('mensal') || p.includes('month')) return 'Plano Mensal';
  return `Plano ${plano}`;
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
  const [cancelOpen, setCancelOpen] = useState(false);
  // Histórico e abas removidos conforme solicitação


  const openStore = () => {
    if (source === 'apple') {
      void abrirLink('https://apps.apple.com/account/subscriptions');
    } else if (source === 'asaas') {
      openSupport();
    } else {
      void abrirLink('https://play.google.com/store/account/subscriptions');
    }
  };

  const openSupport = () => {
    const subject = encodeURIComponent('Suporte Direito Prime Premium');
    const body = encodeURIComponent(`Olá, sou assinante ${planoLabel(plano)} e preciso de ajuda.`);
    window.location.href = `mailto:suporte@direitoprime.com.br?subject=${subject}&body=${body}`;
  };

  const label = planoLabel(plano);
  const isVitalicio = /vitalício|vitalicio/i.test(plano ?? '');
  const isAnual = !isVitalicio && /anual|year/i.test(plano ?? '');
  const isMensal = /mensal|month/i.test(plano ?? '');
  const isApple = source === 'apple' || Capacitor.getPlatform() === 'ios';
  
  const imgCapa = isVitalicio ? '/vitalicio_premium_v2.webp' : (isAnual ? '/anual_premium.webp' : '/mensal_premium.webp');

  const preco = isAnual ? (isApple ? 'R$ 238,80/ano' : 'R$ 149,90/ano') : 'R$ 29,90/mês';
  const equivalente = isAnual ? (isApple ? 'Equivalente a R$ 19,90/mês' : 'Equivalente a R$ 12,49/mês') : null;

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
        {/* Imagem de Capa */}
        <div className="absolute inset-0 right-0 left-[15%] sm:left-[35%] overflow-hidden pointer-events-none" style={{ maskImage: 'linear-gradient(to right, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)' }}>
          <img src={imgCapa} alt="" className="w-full h-full object-cover opacity-40 mix-blend-screen scale-110 translate-x-4" loading="lazy" />
        </div>
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
              <h2 className="font-display text-[22px] sm:text-[24px] leading-none font-bold tracking-tight text-foreground uppercase">
                {label}
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
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              onClick={openSupport}
              className={`h-11 rounded-xl bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary transition-colors font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]`}
            >
              <LifeBuoy className="w-4 h-4" />
              Suporte
            </button>
          </div>
        </div>
      </motion.div>

      {/* Benefícios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
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


