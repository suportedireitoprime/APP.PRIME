import { useState, useEffect, useMemo, startTransition } from "react";
import { useNavigate, useSearchParams, Navigate, useLocation, Link } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { CreditCard, QrCode, Smartphone, RotateCw, Gift, ArrowRight, Headphones, ShieldCheck, Sparkles } from "lucide-react";

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import { isAdminEmail } from "@/lib/adminEmails";
import { maybeRequestAfterPurchase } from "@/lib/inAppReview";
import { useTrackArea } from "@/hooks/useTrackArea";
import { track } from "@/lib/analyticsEvents";
import { useGoBack } from '@/hooks/useGoBack';

import WelcomePremiumOverlay from "@/components/planos/WelcomePremiumOverlay";
import { CheckoutModal } from "@/components/assinatura/CheckoutModal";
import PaywallImageStack from '@/components/planos/PaywallImageStack';
import ShapeGrid from '@/components/ui/ShapeGrid';

import { TrialCountdownBanner } from '@/components/assinatura/TrialCountdownBanner';

import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));
import { HorusPromoModal } from '@/components/assinatura/HorusPromoModal';
import { PricingCards } from '@/components/assinatura/PricingCards';
import { FeaturesList } from '@/components/assinatura/FeaturesList';
import { FaqAccordion } from '@/components/assinatura/FaqAccordion';

export default function Assinatura() {
  useTrackArea("assinatura_aberta");
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useGoBack();
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const welcomeFlag = searchParams.get('welcome') === '1';
  const { refresh: refreshSubscription, isPremium, isTrial, loading: subLoading, plano: planoAtual, expiresAt } = useSubscription({ pollOnMount: welcomeFlag });
  const [showWelcome, setShowWelcome] = useState(welcomeFlag);

  const { data: profileSummary } = useProfileSummary();

  const isNewUser = !!(session?.user?.created_at && (Date.now() - new Date(session.user.created_at).getTime() < 24 * 60 * 60 * 1000));

  const [tab, setTab] = useState<'mensal' | 'anual' | 'promocao' | 'vitalicio'>(isNewUser ? 'promocao' : 'anual');
  const [showHorusPromo, setShowHorusPromo] = useState(false);
  const [hasClosedPromo, setHasClosedPromo] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!session?.user?.created_at) return 24 * 60 * 60 - 1;
    const diff = Math.floor((Date.now() - new Date(session.user.created_at).getTime()) / 1000);
    return Math.max(0, 24 * 60 * 60 - diff);
  });

  useEffect(() => {
    if (session?.user?.created_at) {
      const diff = Math.floor((Date.now() - new Date(session.user.created_at).getTime()) / 1000);
      setTimeLeft(Math.max(0, 24 * 60 * 60 - diff));
    }
  }, [session?.user?.created_at]);

  useEffect(() => {
    if (!isNewUser || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isNewUser, timeLeft <= 0]);

  useEffect(() => {
    if (welcomeFlag) {
      setShowWelcome(true);
      maybeRequestAfterPurchase(2500);
    }
  }, [welcomeFlag]);

  useEffect(() => {
    if (isNewUser && !hasClosedPromo && !isPremium && !welcomeFlag) {
      const t = setTimeout(() => setShowHorusPromo(true), 800);
      return () => clearTimeout(t);
    }
  }, [isNewUser, hasClosedPromo, isPremium, welcomeFlag]);

  const closeWelcome = () => {
    setShowWelcome(false);
    if (searchParams.has('welcome')) {
      searchParams.delete('welcome');
      setSearchParams(searchParams, { replace: true });
    }
  };

  useEffect(() => {
    import('@/lib/appEvents').then(({ appEvents }) => appEvents.verPlanos()).catch(() => {});
  }, []);

  const nativePlatform = useMemo(() => Capacitor.getPlatform(), []);
  const showDevToggle = isAdminEmail(session?.user?.email);
  const [platformOverride, setPlatformOverride] = useState<'ios' | 'android' | null>(() => {
    if (typeof window === 'undefined') return null;
    const v = window.localStorage.getItem('assinatura_platform_override');
    return v === 'ios' || v === 'android' ? v : null;
  });
  
  const [devSheetOpen, setDevSheetOpen] = useState(false);
  const [paymentMethodSheetOpen, setPaymentMethodSheetOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | 'anual_regular_pix' | null>(null);

  const handleBack = () => {
    if (showWelcome) return closeWelcome();
    if (devSheetOpen) return setDevSheetOpen(false);
    if (searchParams.get('preview') === 'plans') {
      if (isPremium && !isTrial) return navigate('/planos/ativos', { replace: true });
      return navigate('/', { replace: true });
    }
    
    const stateFrom = (location.state as { from?: string } | undefined)?.from;
    if (stateFrom && stateFrom !== '/assinatura' && stateFrom !== '/planos/ativos') {
      return navigate(stateFrom, { replace: true });
    }
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (devSheetOpen) return;
    const t = window.setTimeout(() => { document.body.style.pointerEvents = ''; }, 350);
    return () => window.clearTimeout(t);
  }, [devSheetOpen]);

  const applyPlatformOverride = (p: 'ios' | 'android' | null) => {
    setPlatformOverride(p);
    if (p) window.localStorage.setItem('assinatura_platform_override', p);
    else window.localStorage.removeItem('assinatura_platform_override');
    setDevSheetOpen(false);
  };

  const startPurchase = async (plano: 'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | 'anual_regular_pix') => {
    track('subscription_started', { plano, metodo: 'asaas', source: 'planos_page' });
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano: plano as any });
        appEvents.assinaturaIniciada({ plano: plano as any, metodo: 'asaas' });
      })
      .catch(() => {});
      
    if (!session) { 
      toast.info('Faça login ou cadastre-se para assinar'); 
      navigate('/login', { state: { returnTo: '/assinatura' } });
      return; 
    }
    startTransition(() => {
      setCheckoutPlan(plano);
    });
  };

  const previewPlans = searchParams.get('preview') === 'plans' || searchParams.get('planos') === '1' || (location.state as { previewPlans?: boolean } | null)?.previewPlans;

  if (!subLoading && (isPremium && !isTrial) && !showWelcome && !previewPlans) {
    return <Navigate to="/planos/ativos" replace />;
  }

  return (
    <div className="min-h-dvh bg-background pb-[calc(4rem+var(--sai-bottom))] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>
      
      <div className="relative z-10 flex flex-col">
        <WelcomePremiumOverlay
          open={showWelcome}
          planoLabel={planoAtual ?? 'Premium'}
          syncing={false}
          onClose={closeWelcome}
        />
        
        <CheckoutModal 
          open={!!checkoutPlan} 
          onOpenChange={(v) => { if (!v) setCheckoutPlan(null); }} 
          plan={checkoutPlan}
          userEmail={session?.user?.email || ''}
          userName={profileSummary?.nomeCompleto || profileSummary?.displayName || session?.user?.user_metadata?.full_name || ''}
          onSuccess={() => { refreshSubscription(); }}
        />

        <Sheet open={paymentMethodSheetOpen} onOpenChange={setPaymentMethodSheetOpen}>
          <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] w-full rounded-none px-6 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-14 bg-background border-none flex flex-col overflow-y-auto">
            <div className="absolute inset-0 pointer-events-none opacity-20 -z-10">
              <ShapeGrid />
            </div>
            <SheetHeader className="mb-6 text-left shrink-0 relative z-10">
              <SheetTitle className="text-3xl font-display font-black text-foreground leading-tight uppercase">Último passo.</SheetTitle>
              <SheetDescription className="text-sm font-medium mt-2 text-muted-foreground">
                Escolha como prefere ativar seu plano {tab === 'vitalicio' ? 'Vitalício' : 'Anual'}. O acesso é liberado na hora.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-3 mb-8 relative z-10 p-5 rounded-3xl bg-card border border-border/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 text-sm font-bold text-foreground">7 dias de garantia incondicional</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 text-sm font-bold text-foreground">Acesso imediato à inteligência artificial</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <RotateCw className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 text-sm font-bold text-foreground">Leis sempre atualizadas em tempo real</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 relative z-10 mt-auto">
              <Button
                variant="outline"
                className="h-auto py-5 flex items-center justify-start gap-4 px-5 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all rounded-3xl group"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase(tab === 'vitalicio' ? 'vitalicio' : 'anual');
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-lg text-foreground">Cartão de Crédito</span>
                  {tab === 'vitalicio' ? (
                    <span className="text-[11px] font-bold text-primary">Até 12x de R$ 29,90 · Plano Vitalício</span>
                  ) : (
                    <span className="text-[11px] font-bold text-primary">Até 12x de R$ 16,65 · Plano Anual</span>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                className="h-auto py-5 flex items-center justify-start gap-4 px-5 border-2 border-border/80 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all rounded-3xl group"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase(tab === 'vitalicio' ? 'vitalicio_pix' : 'anual_regular_pix');
                }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-lg text-foreground">PIX</span>
                  {tab === 'vitalicio' ? (
                    <span className="text-[11px] font-bold text-muted-foreground">R$ 280,00 Vitalício</span>
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground">R$ 199,90 à vista · Plano Anual</span>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors group-hover:translate-x-1" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <HorusPromoModal 
          open={showHorusPromo}
          timeLeft={timeLeft}
          onClose={() => { setShowHorusPromo(false); setHasClosedPromo(true); }}
          onRedeem={() => { setShowHorusPromo(false); setHasClosedPromo(true); setTab('promocao'); startPurchase('anual_pix'); }}
        />

        {!showHorusPromo && hasClosedPromo && isNewUser && tab !== 'promocao' && (
          <button
            onClick={() => {
              setTab('promocao');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-[calc(5.5rem+var(--sai-bottom,0px))] right-6 z-40 w-14 h-14 bg-emerald-500 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] flex items-center justify-center border-2 border-white/20 hover:bg-emerald-400 active:opacity-70 transition-transform hover:scale-105"
            aria-label="Abrir promoção"
          >
            <Gift className="w-6 h-6 text-white" />
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center text-[10px] font-black text-white shadow-sm">1</span>
            </span>
          </button>
        )}

        <PageHeader
          title={<span className="tracking-widest font-display uppercase font-black text-[15px]">Assinatura Premium</span>}
          onBack={handleBack}
          rightAction={
            <Link
              to="/suporte-publico"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-[0.96] shrink-0"
              style={{
                background: 'hsl(0 0% 100% / 0.1)',
                border: '1px solid hsl(0 0% 100% / 0.2)',
                color: 'hsl(40 25% 97%)',
              }}
            >
              <Headphones className="w-3.5 h-3.5" style={{ color: 'hsl(350 78% 62%)' }} />
              <span>Suporte</span>
            </Link>
          }
        />

        {isTrial && <TrialCountdownBanner expiresAt={expiresAt} />}

        <div className="max-w-2xl mx-auto pt-4 space-y-7 pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            <PaywallImageStack />

            <div className="space-y-3 text-center px-4 flex flex-col items-center">
              <img src={primeLogo} alt="Estudos Jurídicos" className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(224,31,71,0.2)]" />
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-1">
                Acesso Total Liberado
              </div>
              <h1 className="font-display text-[32px] sm:text-4xl font-black text-foreground leading-[1.15]">
                Desbloqueie o aplicativo <span className="text-primary">sem limites.</span>
              </h1>
              <p className="text-[14px] text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                Pare de esbarrar em bloqueios. Tenha a Inteligência Artificial, Vade Mecum e Simulados liberados para você.
              </p>
            </div>

            <PricingCards 
              selectedPlan={tab} 
              isNewUser={isNewUser} 
              onSelectPlan={setTab} 
            />

            <div className="px-4 space-y-4 -mt-1">
              <Button
                onClick={() => {
                  if (tab === 'promocao') {
                     startPurchase('anual_pix');
                  } else if (tab === 'anual') {
                     setPaymentMethodSheetOpen(true);
                  } else if (tab === 'vitalicio') {
                     setPaymentMethodSheetOpen(true);
                  } else {
                     startPurchase('mensal');
                  }
                }}
                className={`btn-shine-loop relative overflow-hidden w-full h-[60px] rounded-[20px] font-display text-[19px] font-black tracking-wider transition-all active:scale-[0.98] group ${
                  tab === 'promocao' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_12px_35px_rgba(16,185,129,0.35)]'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_12px_35px_rgba(224,31,71,0.4)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab === 'promocao' ? 'ASSINAR ANUAL NO PIX' : tab === 'vitalicio' ? 'ADQUIRIR VITALÍCIO' : tab === 'anual' ? 'ASSINAR ANUAL' : 'ASSINAR MENSAL'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </Button>
              
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-500/90 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> 7 dias de garantia
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">
                  Sem burocracia. Cancele quando quiser.
                </span>
              </div>
            </div>

            <FeaturesList tabKey={tab} />

            <FaqAccordion />
        </div>

        {/* Admin Dev Tools */}
        {showDevToggle && (
          <>
            <div className="px-4 mt-10 pt-6 border-t border-border/40 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2">
                <span className="font-body text-[10px] uppercase tracking-wide text-muted-foreground">
                  Prévia
                </span>
                <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
                  {(['android', 'ios'] as const).map((p) => {
                    const active = (platformOverride ?? nativePlatform) === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => applyPlatformOverride(p)}
                        className={`px-3 py-1 rounded-full font-body text-[11px] font-bold transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p === 'ios' ? 'iOS' : 'Android'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDevSheetOpen(true)}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-body text-[11px] font-bold border border-primary/50 flex items-center gap-1.5 hover:brightness-95"
              >
                <RotateCw className="w-3 h-3" />
                só pra mim
                {platformOverride && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-[9px] uppercase">
                    {platformOverride}
                  </span>
                )}
              </button>
            </div>

            <Sheet open={devSheetOpen} onOpenChange={setDevSheetOpen}>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Prévia da assinatura</SheetTitle>
                  <SheetDescription>
                    Escolha como quer visualizar a tela de planos. Só você vê este controle.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button
                    variant={(platformOverride ?? nativePlatform) === 'android' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-1"
                    onClick={() => applyPlatformOverride('android')}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="font-bold">Android</span>
                    <span className="text-[10px] opacity-70">Google Play</span>
                  </Button>
                  <Button
                    variant={(platformOverride ?? nativePlatform) === 'ios' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-1"
                    onClick={() => applyPlatformOverride('ios')}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="font-bold">Apple</span>
                    <span className="text-[10px] opacity-70">App Store</span>
                  </Button>
                </div>
                {isPremium && (
                  <Button
                    variant="secondary"
                    className="w-full mt-3 text-xs"
                    onClick={() => { setDevSheetOpen(false); navigate('/planos/ativos'); }}
                  >
                    Ver tela do plano ativo
                  </Button>
                )}
                {platformOverride && (
                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-xs"
                    onClick={() => applyPlatformOverride(null)}
                  >
                    Usar plataforma real ({nativePlatform})
                  </Button>
                )}
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </div>
  );
}
