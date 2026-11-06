import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, LifeBuoy, Calendar, CheckCircle2,
  Sparkles, Shield, CreditCard, QrCode, AlertTriangle,
  XCircle, Infinity as InfinityIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays } from "@/lib/dateUtils";
import { Capacitor } from '@capacitor/core';
import CancelarAssinaturaSheet from './CancelarAssinaturaSheet';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO, brl } from '@/lib/precos';

interface Props {
  plano: string | null;
  expiresAt: string | null;
  startedAt?: string | null;
  source: 'play' | 'apple' | 'asaas' | null;
  status?: string | null;
  isAdminOverride?: boolean;
}

function planoLabel(plano: string | null): string {
  if (!plano) return 'Plano Anual';
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

export default function MinhaAssinaturaView({
  plano,
  expiresAt,
  startedAt,
  source,
  status,
  isAdminOverride,
}: Props) {
  const { user } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(expiresAt);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isPix, setIsPix] = useState(false);
  const [hasCardRecurrence, setHasCardRecurrence] = useState(false);

  const label = planoLabel(plano);
  const isVitalicio = /vitalício|vitalicio/i.test(plano ?? '');
  const isAnual = !isVitalicio && /anual|year/i.test(plano ?? '');
  const isMensal = /mensal|month/i.test(plano ?? '');
  const isStore = source === 'apple' || source === 'play';

  // Preços oficiais centralizados em precos.ts
  let preco = `${brl(PRECO_ANUAL)}/ano`;
  let equivalente: string | null = `Equivalente a ${brl(PRECO_ANUAL / 12)}/mês`;

  if (isVitalicio) {
    preco = brl(PRECO_VITALICIO);
    equivalente = 'Pagamento único · Acesso permanente';
  } else if (isMensal) {
    preco = `${brl(PRECO_MENSAL)}/mês`;
    equivalente = null;
  } else {
    preco = `${brl(PRECO_ANUAL)}/ano`;
    equivalente = `Equivalente a ${brl(PRECO_ANUAL / 12)}/mês`;
  }

  const imgCapa = isVitalicio
    ? '/vitalicio_premium_v2.webp'
    : isAnual
      ? '/anual_premium.webp'
      : '/mensal_premium.webp';

  useEffect(() => {
    setCurrentExpiresAt(expiresAt);
  }, [expiresAt]);

  // Consulta status de recorrência do Asaas e histórico de cancelamento
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [subRes, cancelRes] = await Promise.all([
          supabase
            .from('asaas_subscriptions' as any)
            .select('id, plano, status, asaas_subscription_id, expires_at, started_at, origem')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('assinatura_cancelamentos' as any)
            .select('canceled_at')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const sub = subRes.data as any;
        if (sub) {
          if (sub.expires_at) {
            setCurrentExpiresAt(sub.expires_at);
          }
          const pLower = (sub.plano || '').toLowerCase();
          const subPix =
            pLower.includes('pix') ||
            sub.origem === 'pix' ||
            (!sub.asaas_subscription_id && !isVitalicio);
          setIsPix(subPix);

          const cardActive = Boolean(
            sub.asaas_subscription_id && !subPix && !isVitalicio && sub.status !== 'CANCELED'
          );
          setHasCardRecurrence(cardActive);

          if (sub.status === 'CANCELED' || cancelRes.data) {
            setIsCancelled(true);
          }
        } else if (cancelRes.data) {
          setIsCancelled(true);
        }
      } catch {
        /* fallback gracioso para dados locais */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isVitalicio]);

  const openSupport = () => {
    const subject = encodeURIComponent(`Suporte Direito Prime - ${label}`);
    const body = encodeURIComponent(
      `Olá, sou assinante do ${label} e gostaria de atendimento sobre minha assinatura.`
    );
    window.location.href = `mailto:suporte@direitoprime.com.br?subject=${subject}&body=${body}`;
  };

  const diasRestantes = useMemo(() => {
    if (!currentExpiresAt || isVitalicio) return null;
    try {
      return Math.max(0, differenceInDays(new Date(currentExpiresAt), new Date()));
    } catch {
      return null;
    }
  }, [currentExpiresAt, isVitalicio]);

  const totalDias = isAnual ? 365 : 30;
  const progresso =
    diasRestantes != null
      ? Math.min(100, Math.max(0, ((totalDias - diasRestantes) / totalDias) * 100))
      : 0;

  // Pode exibir botão de cancelar?
  // Não exibir no Vitalício e não exibir no Pix (pois Pix não renova no cartão)
  const podeCancelar =
    !isVitalicio &&
    !isPix &&
    !isCancelled &&
    (hasCardRecurrence || isStore || source === 'asaas');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 shadow-2xl backdrop-blur-xl"
      >
        {/* Imagem de Capa com blend elegante */}
        <div
          className="absolute inset-0 right-0 left-[20%] sm:left-[35%] overflow-hidden pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 65%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 65%)',
          }}
        >
          <img
            src={imgCapa}
            alt=""
            className="w-full h-full object-cover opacity-35 mix-blend-screen scale-110 translate-x-4"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-5 sm:p-7">
          {/* Badges de Status */}
          <div className="flex flex-wrap items-center gap-2">
            {isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <XCircle className="w-3.5 h-3.5" /> Renovação cancelada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assinatura Ativa
              </span>
            )}

            {isVitalicio ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <InfinityIcon className="w-3.5 h-3.5" /> Acesso Permanente
              </span>
            ) : isPix ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <QrCode className="w-3.5 h-3.5" /> Pagamento Pix
              </span>
            ) : hasCardRecurrence || isStore ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-foreground/90 border border-border/80 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Cartão de Crédito
              </span>
            ) : null}

            {isAdminOverride && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-body text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Modo Admin
              </span>
            )}
          </div>

          {/* Nome do Plano e Preço */}
          <div className="mt-5 sm:mt-6 flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
              <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl sm:text-3xl leading-none font-bold tracking-tight text-foreground uppercase">
                {label}
              </h2>
              <p className="font-body text-sm sm:text-base font-semibold text-foreground/90 mt-1.5">
                {preco}
                {equivalente && (
                  <span className="block sm:inline sm:ml-2 font-normal text-xs sm:text-sm text-muted-foreground">
                    {equivalente}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bloco de Renovação / Vigência */}
          <div className="mt-6 rounded-2xl bg-card/70 border border-border/60 p-4 sm:p-5">
            {isVitalicio ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <InfinityIcon className="w-4 h-4 text-amber-400" />
                    <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
                      Vigência do Plano
                    </span>
                  </div>
                  <span className="font-display text-sm sm:text-base font-bold text-amber-400">
                    Vitalício
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-2 leading-relaxed">
                  Seu plano vitalício nunca expira e não possui renovação ou cobranças futuras.
                </p>
              </div>
            ) : isPix ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
                      Acesso Liberado Até
                    </span>
                  </div>
                  <span className="font-display text-sm sm:text-base font-bold text-foreground">
                    {fmtDate(currentExpiresAt)}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-2 leading-relaxed">
                  Pagamento único via Pix. Não há renovação automática nem cobrança no seu cartão de crédito.
                </p>
              </div>
            ) : isCancelled ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-body text-[11px] uppercase tracking-wider font-bold">
                      Acesso Premium Ativo Até
                    </span>
                  </div>
                  <span className="font-display text-sm sm:text-base font-bold text-amber-300">
                    {fmtDate(currentExpiresAt)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-3">
                  <div className="h-full bg-amber-500" style={{ width: `${progresso}%` }} />
                </div>
                <p className="font-body text-xs text-amber-300/90 mt-2.5 leading-relaxed font-medium">
                  A renovação automática no seu cartão de crédito foi cancelada com sucesso. Nenhuma nova cobrança será realizada e seu acesso Premium continua ativo até a data acima.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
                      Próxima Renovação Automática
                    </span>
                  </div>
                  <span className="font-display text-sm sm:text-base font-bold text-foreground">
                    {fmtDate(currentExpiresAt)}
                  </span>
                </div>
                {diasRestantes != null && (
                  <>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-3">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      <strong className="text-foreground font-semibold">{diasRestantes}</strong>{' '}
                      {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} no ciclo atual. Cobrança de {preco} em {fmtDate(currentExpiresAt)}.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação no Card */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={openSupport}
              className="h-12 rounded-xl bg-secondary/70 border border-border/80 text-foreground hover:bg-secondary transition-all font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-primary" />
              Falar com Suporte
            </button>

            {podeCancelar && (
              <button
                onClick={() => setCancelOpen(true)}
                className="h-12 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal de Cancelamento de Assinatura */}
      <CancelarAssinaturaSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        expiresAt={currentExpiresAt}
        startedAt={startedAt ?? null}
        isAdminOverride={!!isAdminOverride}
        source={source}
        onCancelled={(newExpiresAt) => {
          setIsCancelled(true);
          setHasCardRecurrence(false);
          if (newExpiresAt) setCurrentExpiresAt(newExpiresAt);
        }}
      />
    </>
  );
}
