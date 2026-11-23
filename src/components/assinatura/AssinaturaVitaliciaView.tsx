import { useState, useEffect, useMemo, startTransition } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Infinity as InfinityIcon, 
  Crown, 
  ArrowRight, 
  Headphones, 
  Flame 
} from 'lucide-react';

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { useGoBack } from '@/hooks/useGoBack';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { track } from '@/lib/analyticsEvents';

import PaywallImageStack from '@/components/planos/PaywallImageStack';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import laurel from '@/assets/landing-tribunal/laurel-leaf.webp';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import { PRECO_VITALICIO, PRECO_VITALICIO_PROMOCIONAL, brl, type PlanoCheckout } from '@/lib/precos';
import { getCycle5DaysCountdown } from '@/lib/subscriptionLayoutStore';

interface AssinaturaVitaliciaViewProps {
  onSuccess?: () => void;
  onVoltar?: () => void;
}

export function AssinaturaVitaliciaView({ onSuccess, onVoltar }: AssinaturaVitaliciaViewProps) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();

  const welcomeFlag = searchParams.get('welcome') === '1';
  const previewPlans = searchParams.get('preview') === 'plans' || searchParams.get('planos') === '1';
  const { refresh: refreshSubscription, isPremium, isTrial, loading: subLoading } = useSubscription({ pollOnMount: welcomeFlag });
  const { data: profileSummary } = useProfileSummary();

  const [checkoutPlan, setCheckoutPlan] = useState<PlanoCheckout | null>(null);
  const [countdown, setCountdown] = useState(getCycle5DaysCountdown());
  const falling = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCycle5DaysCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    haptic.selection();
    if (onVoltar) {
      onVoltar();
    } else {
      goBack();
    }
  };

  const handleAssinarVitalicioClick = () => {
    haptic.impact('heavy');

    if (isPremium && !isTrial) {
      toast.info('Você já é assinante — sua assinatura está ativa.');
      navigate('/planos/ativos', { replace: true });
      return;
    }

    if (!session) {
      try {
        sessionStorage.setItem('pending_checkout', 'vitalicio_promocional_pix');
      } catch {}
      toast.info('Faça login ou cadastre-se para assinar');
      navigate('/login', { state: { returnTo: '/assinatura?layout=vitalicio' } });
      return;
    }

    track('subscription_started', { plano: 'vitalicio_promocional_pix', metodo: 'pix', source: 'vitalicio_promocional_minimal' });
    
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano: 'vitalicio_promocional_pix' as any });
        appEvents.assinaturaIniciada({ plano: 'vitalicio_promocional_pix' as any, metodo: 'pix' });
      })
      .catch(() => {});

    startTransition(() => {
      setCheckoutPlan('vitalicio_promocional_pix');
    });
  };

  useEffect(() => {
    if (session && !isPremium) {
      try {
        const pending = sessionStorage.getItem('pending_checkout');
        if (pending) {
          sessionStorage.removeItem('pending_checkout');
          startTransition(() => {
            setCheckoutPlan(pending as any);
          });
        }
      } catch {}
    }
  }, [session, isPremium]);

  if (!subLoading && isPremium && !isTrial && !welcomeFlag && !previewPlans) {
    return <Navigate to="/planos/ativos" replace />;
  }

  return (
    <div className="min-h-dvh bg-[#0D0D0D] pb-[calc(4rem+var(--sai-bottom))] relative overflow-x-hidden text-white font-sans">
      {/* ── Fundo Imersivo Oficial com Imagem Nobre e Vinheta (Idêntico à Tela Padrão) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#120b08]">
        <img
          src={greciaFilosofosFundo}
          alt="Grécia Antiga e Filósofos"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[1.5px] brightness-[0.88] contrast-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85 pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-full overflow-x-hidden">
        {/* Checkout Modal Nativo */}
        <CheckoutModal
          open={!!checkoutPlan}
          onOpenChange={(v) => { if (!v) setCheckoutPlan(null); }}
          plan={checkoutPlan}
          userEmail={session?.user?.email || ''}
          userName={profileSummary?.nomeCompleto || profileSummary?.displayName || session?.user?.user_metadata?.full_name || ''}
          onSuccess={() => {
            refreshSubscription();
            if (onSuccess) onSuccess();
          }}
        />

        {/* Header Padrão */}
        <PageHeader
          onBack={handleBack}
          title=""
          rightAction={
            <Link
              to="/suporte-publico"
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-[0.96] shrink-0 touch-manipulation shadow-md"
              style={{
                background: 'hsl(0 0% 100% / 0.1)',
                border: '1px solid hsl(0 0% 100% / 0.2)',
                color: 'hsl(40 25% 97%)',
              }}
            >
              <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Suporte</span>
            </Link>
          }
        />

        <div className="w-full max-w-md mx-auto px-4 sm:px-6 pt-1 space-y-4 pb-[calc(5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative">
          {/* Folhas de louro caindo */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            {falling.map((i) => (
              <img
                key={i}
                src={laurel}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute top-0 lp-fall"
                style={{
                  left: `${(i * 8.5 + 3) % 100}%`,
                  width: `${16 + (i % 4) * 8}px`,
                  animationDuration: `${11 + (i % 5) * 3}s`,
                  animationDelay: `-${i * 1.2}s`,
                  opacity: 0.7,
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
                }}
              />
            ))}
          </div>

          {/* Pilha de Imagens de Doutrina e Obras */}
          <PaywallImageStack />

          {/* ── CHAMADA PARA A PROMOÇÃO (100% VERMELHO, SEM DIREITO PRIME) ── */}
          <div className="space-y-1.5 text-center flex flex-col items-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight uppercase tracking-tight">
              Acesso Vitalício ao <span className="text-rose-500">Aplicativo</span>
            </h1>

            <p className="text-xs sm:text-[13.5px] text-zinc-300/90 font-medium max-w-xs sm:max-w-md mx-auto leading-relaxed">
              No Pix à vista ou em até 4x no cartão. Tenha acesso completo e ilimitado para toda a vida, sem mensalidades.
            </p>

            {/* Aviso Sutil de Condição Promocional em Linha Única */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold mt-1">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>
                Promoção Relâmpago • Encerra em{' '}
                <strong className="text-white font-mono font-bold">
                  {countdown.days}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
                </strong>
              </span>
            </div>
          </div>

          {/* ── CARD PRINCIPAL DO PLANO VITALÍCIO (VERMELHO, 100% RESPONSIVO, SEM TÓPICOS VERDES) ── */}
          <div className="w-full">
            <div className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-5 sm:p-6 overflow-hidden border-rose-500/60 bg-[#141416]/95 backdrop-blur-xl shadow-[0_0_35px_rgba(225,29,72,0.25)] ring-1 ring-rose-500/30">
              {/* Badge Nobre Superior em Vermelho */}
              <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-[9px] sm:text-[10px] px-3.5 py-1 rounded-bl-xl tracking-wider z-10 flex items-center gap-1 uppercase shadow-md">
                <InfinityIcon className="w-3 h-3" />
                MELHOR VALOR · PAGAMENTO ÚNICO
              </div>

              {/* Título do Card */}
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <h3 className="font-display font-black text-rose-400 text-base uppercase tracking-wider">
                    Plano Vitalício
                  </h3>
                </div>
              </div>

              {/* Linha de Preço Responsiva (De R$ 149,90 por R$ 89,90 no Pix) */}
              <div className="flex flex-col gap-1 mb-2.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs sm:text-sm font-semibold line-through">
                    De {brl(PRECO_VITALICIO)}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                    -40% OFF
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-display text-3xl sm:text-4xl font-black text-rose-500 tracking-tight whitespace-nowrap">
                    {brl(PRECO_VITALICIO_PROMOCIONAL)}
                  </span>
                  <span className="font-display text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    no Pix ou até 4x no cartão
                  </span>
                </div>
              </div>

              {/* Subtítulo Minimalista */}
              <p className="text-[12px] font-medium text-zinc-300 relative z-10">
                Acesso para sempre • Sem mensalidades ou renovações • Liberação imediata
              </p>
            </div>
          </div>

          {/* Botão de Ação Primário CTA 100% Vermelho */}
          <div className="w-full flex flex-col gap-2 pt-1">
            <Button
              onClick={handleAssinarVitalicioClick}
              className="btn-shine-loop relative overflow-hidden w-full h-[58px] rounded-[20px] font-display text-[18px] sm:text-[19px] font-black uppercase tracking-wider transition-all active:scale-[0.98] group bg-rose-600 hover:bg-rose-500 text-white shadow-[0_12px_35px_rgba(225,29,72,0.5)] border border-rose-400/30"
            >
              <span className="flex items-center justify-center gap-2">
                <span>ASSINAR VITALÍCIO POR {brl(PRECO_VITALICIO_PROMOCIONAL)}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium pt-0.5">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Liberação imediata • Pix ou até 4x no cartão</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
