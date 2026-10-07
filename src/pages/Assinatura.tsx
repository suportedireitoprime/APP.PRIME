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

import laurel from '@/assets/landing-tribunal/laurel-leaf.webp';
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
  const falling = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  const isNewUser = !!(session?.user?.created_at && (Date.now() - new Date(session.user.created_at).getTime() < 24 * 60 * 60 * 1000));

  const [tab, setTab] = useState<'mensal' | 'anual' | 'vitalicio'>(isNewUser ? 'anual' : 'anual');
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
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_regular_pix' | null>(null);

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

  const startPurchase = async (plano: 'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_regular_pix') => {
    track('subscription_started', { plano, metodo: 'asaas', source: 'planos_page' });
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano: plano as any });
        appEvents.assinaturaIniciada({ plano: plano as any, metodo: 'asaas' });
      })
      .catch(() => {});
      
    if (!session) { 
      toast.info('FaÃƒÂ§a login ou cadastre-se para assinar'); 
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
          <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] w-full rounded-none px-0 pt-0 bg-[#0D0D0D] border-none flex flex-col overflow-hidden">
            <div className="flex-1 w-full max-w-md mx-auto flex flex-col overflow-y-auto px-6 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-16">
              <div className="absolute inset-0 pointer-events-none opacity-[0.15] -z-10">
                <ShapeGrid />
              </div>

              <SheetHeader className="mb-6 shrink-0 relative z-10 text-center flex flex-col items-center">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Checkout Seguro</span>
                </div>
                <SheetTitle className="text-3xl font-display font-black text-foreground leading-tight tracking-tight">
                  Finalize sua assinatura
                </SheetTitle>
                <SheetDescription className="text-sm font-medium mt-2 text-muted-foreground max-w-[280px]">
                  Escolha como prefere ativar seu plano {tab === 'vitalicio' ? 'Vitalício' : 'Anual'}. O acesso é liberado na hora.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-3 relative z-10 mb-6 w-full">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex items-center justify-start gap-4 px-5 border-2 border-[#27272a] bg-[#121212] hover:border-primary hover:bg-primary/5 transition-all rounded-[1.25rem] group relative overflow-hidden shadow-lg"
                  onClick={() => {
                    setPaymentMethodSheetOpen(false);
                    startPurchase(tab === 'vitalicio' ? 'vitalicio' : 'anual');
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-9 h-9 text-primary shrink-0 animate-card-flip"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <div className="flex flex-col items-start text-left flex-1">
                    <span className="font-black text-lg text-white">Cartão de Crédito</span>
                    {tab === 'vitalicio' ? (
                      <span className="text-xs font-bold text-zinc-400 mt-0.5">Até 10x de R$ 24,99</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-400 mt-0.5">Até 6x de R$ 24,98</span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex items-center justify-start gap-4 px-5 border-2 border-[#27272a] bg-[#121212] hover:border-emerald-500 hover:bg-emerald-500/5 transition-all rounded-[1.25rem] group relative overflow-hidden shadow-md"
                  onClick={() => {
                    setPaymentMethodSheetOpen(false);
                    startPurchase(tab === 'vitalicio' ? 'vitalicio_pix' : 'anual_regular_pix');
                  }}
                >
                  <div className="absolute top-0 right-0 p-1.5 bg-emerald-500/10 rounded-bl-xl">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider px-2">10% OFF</span>
                  </div>
                  <svg className="w-9 h-9 text-emerald-500 shrink-0" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M119.2 384l136.8-136.8L119.2 110.4 72 157.6v196.8l47.2 47.2-47.2 47.2V512h62.4l52-52v-24.8l-52-52H72v-114.4l112 112L184 384h-64.8zm273.6 0l-136.8-136.8 136.8-136.8L440 157.6V52.8L392.8 5.6V5.6l-52 52v24.8l52 52H440v114.4l-112-112L328 128h64.8zm-136.8-136.8L392.8 384l47.2-47.2v-196.8l-47.2-47.2-136.8 136.8zm0 0L119.2 128 72 175.2v196.8l47.2 47.2 136.8-136.8z"/>
                  </svg>
                  <div className="flex flex-col items-start text-left flex-1">
                    <span className="font-black text-lg text-white">PIX</span>
                    {tab === 'vitalicio' ? (
                      <span className="text-xs font-bold text-zinc-400 mt-0.5">R$ 249,90 à vista</span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-500 mt-0.5">R$ 149,90 à vista</span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500 transition-colors group-hover:translate-x-1" />
                </Button>
              </div>

              <div className="flex flex-col gap-4 mt-auto relative z-10 w-full">
                <div className="bg-[#121212] border border-[#27272a] rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-foreground">7 dias de garantia incondicional</span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Se não gostar, devolvemos 100% do valor.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-foreground">Pagamento 100% Seguro</span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Ambiente criptografado. Seus dados protegidos.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <RotateCw className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-foreground">Acesso Imediato</span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Comece a usar agora mesmo, liberaÃƒÂ§ÃƒÂ£o na hora.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <HorusPromoModal 
          open={showHorusPromo}
          timeLeft={timeLeft}
          onClose={() => { setShowHorusPromo(false); setHasClosedPromo(true); }}
          onRedeem={() => { setShowHorusPromo(false); setHasClosedPromo(true); setTab('anual'); startPurchase('anual'); }}
        />

        {!showHorusPromo && hasClosedPromo && isNewUser && tab !== 'anual' && (
          <button
            onClick={() => {
              setTab('anual');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-[calc(5.5rem+var(--sai-bottom,0px))] right-6 z-40 w-14 h-14 bg-emerald-500 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] flex items-center justify-center border-2 border-white/20 hover:bg-emerald-400 active:opacity-70 transition-transform hover:scale-105"
            aria-label="Abrir promoÃƒÂ§ÃƒÂ£o"
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

        <div className="max-w-2xl mx-auto pt-4 space-y-7 pb-[calc(9.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative">
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

            <PaywallImageStack />

            <div className="space-y-3 text-center px-4 flex flex-col items-center mt-2">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-1">
                Acesso Total Liberado
              </div>
              <h1 className="font-display text-[32px] sm:text-4xl font-black text-foreground leading-[1.15] uppercase tracking-tight">
                Acesso a todo conteúdo <span className="text-primary">do aplicativo</span>
              </h1>
              <p className="text-[14px] text-muted-foreground font-medium max-w-[280px] sm:max-w-sm mx-auto leading-relaxed">
                Acelere sua aprovação com o ecossistema de estudos mais completo do país. Tenha a Inteligência Artificial, Vade Mecum interativo e Simulados ilimitados sempre à mão.
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
                  if (tab === 'anual') {
                     setPaymentMethodSheetOpen(true);
                  } else if (tab === 'vitalicio') {
                     setPaymentMethodSheetOpen(true);
                  } else {
                     startPurchase('mensal');
                  }
                }}
                className="btn-shine-loop relative overflow-hidden w-full h-[60px] rounded-[20px] font-display text-[19px] font-black tracking-wider transition-all active:scale-[0.98] group bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_12px_35px_rgba(224,31,71,0.4)]"
              >
                <span className="flex items-center justify-center gap-2">
                  {tab === 'anual' ? 'ASSINAR ANUAL' : tab === 'vitalicio' ? 'ASSINAR VITALÍCIO' : 'ASSINAR MENSAL'}
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
                  PrÃƒÂ©via
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
                sÃƒÂ³ pra mim
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
                  <SheetTitle>PrÃƒÂ©via da assinatura</SheetTitle>
                  <SheetDescription>
                    Escolha como quer visualizar a tela de planos. SÃƒÂ³ vocÃƒÂª vÃƒÂª este controle.
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




