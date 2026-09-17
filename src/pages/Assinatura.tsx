import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Navigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { CreditCard, QrCode, Smartphone, RotateCw, Gift, ArrowRight, Headphones } from "lucide-react";

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

  const [tab, setTab] = useState<'mensal' | 'anual' | 'promocao'>(isNewUser ? 'promocao' : 'anual');
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
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'anual' | 'anual_pix' | null>(null);

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

  const startPurchase = async (plano: 'mensal' | 'anual' | 'anual_pix') => {
    track('subscription_started', { plano, metodo: 'asaas', source: 'planos_page' });
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano: plano as any });
        appEvents.assinaturaIniciada({ plano: plano as any, metodo: 'asaas' });
      })
      .catch(() => {});
      
    if (!session) { toast.error('Faça login para assinar'); return; }
    setCheckoutPlan(plano);
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
          <SheetContent side="bottom" className="rounded-none sm:rounded-t-3xl px-6 pb-12 pt-12 bg-background border-border relative">
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <ShapeGrid />
            </div>
            <SheetHeader className="mb-8 text-left shrink-0 relative z-10">
              <SheetTitle className="text-3xl font-display font-black text-foreground leading-tight uppercase">Escolha como<br/>prefere pagar.</SheetTitle>
              <SheetDescription className="text-[13px] font-medium mt-2 text-muted-foreground">
                Acesso imediato ao plano Anual. Selecione a forma de pagamento abaixo.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 relative z-10">
              <Button
                variant="outline"
                className="h-auto py-5 flex items-center justify-start gap-4 px-5 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all rounded-3xl group"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase('anual');
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-lg text-foreground">Cartão de Crédito</span>
                  <span className="text-[11px] font-bold text-primary">Até 12x de R$ 16,65</span>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                className="h-auto py-5 flex items-center justify-start gap-4 px-5 border-2 border-border/80 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all rounded-3xl group"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase('anual_pix');
                }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-lg text-foreground">PIX</span>
                  <span className="text-[11px] font-bold text-muted-foreground">R$ 199,90 à vista</span>
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

        <AnimatePresence>
          {!showHorusPromo && hasClosedPromo && isNewUser && tab !== 'promocao' && (
             <motion.button
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => {
                 setTab('promocao');
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] flex items-center justify-center border-2 border-white/20 hover:bg-emerald-400 transition-colors"
             >
               <Gift className="w-6 h-6 text-white" />
               <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center text-[10px] font-black text-white shadow-sm">1</span>
               </span>
             </motion.button>
          )}
        </AnimatePresence>

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

        <div className="max-w-2xl mx-auto pt-4 space-y-7 pb-20">
            <PaywallImageStack />

            <div className="space-y-2 text-center px-4">
              <p className="font-display text-[11px] font-black uppercase tracking-[0.25em] text-primary/80">
                PROJETO DIREITO PRIME PRO
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-[1.1]">
                Sua carreira jurídica em <span className="text-primary">outro nível.</span>
              </h1>
              <p className="text-[13px] text-muted-foreground font-medium max-w-sm mx-auto">
                Libere seu potencial máximo agora na OAB, Concursos e na Advocacia.
              </p>
            </div>

            <PricingCards 
              selectedPlan={tab} 
              isNewUser={isNewUser} 
              onSelectPlan={setTab} 
            />

            <div className="px-4 space-y-3 -mt-3">
              <Button
                onClick={() => {
                  if (tab === 'promocao') {
                     startPurchase('anual_pix');
                  } else if (tab === 'anual') {
                     setPaymentMethodSheetOpen(true);
                  } else {
                     startPurchase(tab);
                  }
                }}
                className={`btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl font-display text-lg font-black tracking-wider transition-all active:scale-[0.98] group ${
                  tab === 'promocao' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_10px_30px_rgba(224,31,71,0.4)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab === 'promocao' ? 'Assinar no PIX' : 'Assinar'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>

              <p className="text-[11px] text-muted-foreground text-center leading-tight px-4">
                Renovação automática. Você tem controle total e pode cancelar quando quiser através da loja.
              </p>
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
