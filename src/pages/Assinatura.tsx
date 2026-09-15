import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Navigate, useLocation } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { Zap, Check, Shield, Brain, Loader2, Smartphone, RotateCw, Monitor, Sparkles, MessageCircle, Headphones, FileText, Library, Scale, Briefcase, CreditCard, QrCode, X, Clock, Gift, Timer } from "lucide-react";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import WelcomePremiumOverlay from "@/components/planos/WelcomePremiumOverlay";
import { CheckoutModal } from "@/components/assinatura/CheckoutModal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { isAdminEmail } from "@/lib/adminEmails";
import { maybeRequestAfterPurchase } from "@/lib/inAppReview";
import { useTrackArea } from "@/hooks/useTrackArea";
import { track } from "@/lib/analyticsEvents";
import { useGoBack } from '@/hooks/useGoBack';
import PaywallImageStack from '@/components/planos/PaywallImageStack';
import ShapeGrid from '@/components/ui/ShapeGrid';
import horusOwl from '@/assets/horus/horus-owl.webp';

function TrialCountdownBanner({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Seu teste expirou');
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (totalHours > 24) {
        setTimeLeft(`${totalHours}h restantes`);
      } else {
        setTimeLeft(`${totalHours}h ${mins}m restantes`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft === 'Seu teste expirou') return null;

  return (
    <div className="mx-4 mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-lg shadow-red-500/5">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
      <Timer className="w-6 h-6 text-red-400 mb-2" />
      <h3 className="font-display font-black text-red-400 text-lg mb-1 tracking-wide uppercase">Seu Teste Gratuito</h3>
      <p className="font-body text-sm font-semibold text-red-500/90 text-center">
        Aproveite todos os recursos.
      </p>
      <div className="mt-3 px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 font-display font-black text-sm tracking-wider animate-pulse">
        TERMINA EM {timeLeft}
      </div>
    </div>
  );
}

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

  const isNewUser = session?.user?.created_at && (Date.now() - new Date(session.user.created_at).getTime() < 24 * 60 * 60 * 1000);

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  const view = "plans" as const;

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
    if (showWelcome) {
      closeWelcome();
      return;
    }
    if (devSheetOpen) {
      setDevSheetOpen(false);
      return;
    }
    if (searchParams.get('preview') === 'plans') {
      navigate('/planos/ativos', { replace: true });
      return;
    }
    const stateFrom = (location.state as { from?: string } | undefined)?.from;
    if (stateFrom) {
      navigate(stateFrom, { replace: true });
      return;
    }
    goBack();
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

  const PRO_FEATURES = [
    { icon: Scale, text: 'Vade Mecum completo — todas as leis em vigor, sempre atualizadas' },
    { icon: MessageCircle, text: 'Horus 24h no WhatsApp — assistente jurídico com todas as funções' },
    { icon: Brain, text: 'IA jurídica ilimitada — tire dúvidas, gere peças e estude sem parar' },
    { icon: Library, text: 'Biblioteca profissional com +200 livros e ebooks jurídicos' },
    { icon: Headphones, text: 'Narração nativa — ouça leis inteiras com voz humana' },
    { icon: FileText, text: 'Resumos automáticos por IA de leis, artigos e livros' },
    { icon: Sparkles, text: 'Funções do artigo — explicar, mapa mental, flashcards e mais' },
    { icon: Monitor, text: 'Acesso completo no Desktop, Web e App sincronizados' },
    { icon: Shield, text: 'Radar Legislativo em tempo real — nenhuma novidade escapa' },
    { icon: Briefcase, text: 'Uso profissional liberado — advogados, servidores e concurseiros' },
    { icon: Zap, text: 'Sem anúncios · Suporte prioritário · Atualizações antecipadas' },
  ];

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

  const previewPlans = showDevToggle && searchParams.get('preview') === 'plans';

  if (view === "plans" && !subLoading && (isPremium && !isTrial) && !showWelcome && !previewPlans) {
    return <Navigate to="/planos/ativos" replace />;
  }

  if (view === "plans") {
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
          <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-xl font-display font-black text-foreground">Como você prefere pagar?</SheetTitle>
              <SheetDescription className="text-sm font-medium">
                Escolha a forma de pagamento para o plano Anual.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 px-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase('anual');
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-base text-foreground">Cartão de Crédito</span>
                  <span className="text-xs text-muted-foreground">Acesso imediato</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 px-4 border-2 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
                onClick={() => {
                  setPaymentMethodSheetOpen(false);
                  startPurchase('anual_pix');
                }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="font-bold text-base text-foreground">PIX (Desconto)</span>
                  <span className="text-xs text-emerald-500 font-medium">Promoção: R$ 149,90/ano</span>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Modal Horus Promocional */}
        <AnimatePresence>
          {showHorusPromo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowHorusPromo(false); setHasClosedPromo(true); }}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center"
              >
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 text-white/50 hover:text-white rounded-full z-10"
                  onClick={() => { setShowHorusPromo(false); setHasClosedPromo(true); }}
                >
                  <X className="w-5 h-5" />
                </Button>
                
                <div className="w-full flex items-center justify-center mb-1 -mt-4">
                  <img src={horusOwl} alt="Horus" className="w-28 h-28 object-contain drop-shadow-2xl" />
                </div>
                
                <h3 className="font-display text-2xl font-black text-white text-center mb-1">OFERTA EXCLUSIVA ANUAL</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Você acabou de criar sua conta e ganhou um super desconto de boas-vindas no <span className="text-emerald-400 font-bold">PIX</span> válido por tempo limitado! Tenha acesso ao aplicativo todo e a todas as funções liberadas.
                </p>
                
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="font-display text-4xl font-black text-emerald-400 mb-5 tracking-wider drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                >
                  {formatTime(timeLeft)}
                </motion.div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 w-full rounded-2xl p-4 text-center mb-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-bl-lg tracking-wider">
                     PROMOÇÃO 24H
                   </div>
                   <div className="text-sm font-bold text-emerald-500/80 line-through">De R$ 199,90</div>
                   <div className="font-display text-3xl font-black text-emerald-400">R$ 149,90</div>
                   <div className="text-xs font-semibold text-emerald-500/80">equivale a R$ 12,49 / mês</div>
                </div>

                <Button 
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                  onClick={() => { setShowHorusPromo(false); setHasClosedPromo(true); setTab('promocao'); startPurchase('anual_pix'); }}
                >
                  Resgatar Desconto Agora
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bolinha Flutuante (FAB) */}
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
          title="Assinatura Premium"
          onBack={handleBack}
        />

        {isTrial && <TrialCountdownBanner expiresAt={expiresAt} />}

        <div className="max-w-2xl mx-auto pt-6 space-y-7">
            <PaywallImageStack />

            <div className="space-y-2 text-center">
              <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
                PROJETO DIREITO PRIME PRO
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground leading-tight px-2">
                Chegue na sua melhor versão jurídica.
              </h1>
            </div>

            <div className="space-y-2.5 pt-1 text-left max-w-sm mx-auto px-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Aplicativo Ilimitado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Acesso Offline</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Acesso Desktop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Vade Mecum Completo Narrado e Comentado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Mais de 50 Funcionalidades Liberadas</span>
              </div>
            </div>

            {/* 🎛️ Seletor Alternante de Abas [ Mensal | Anual | Promoção ] */}
            <div className="pt-3 px-4">
              <div className="flex rounded-xl bg-muted/80 p-1 border border-border/80 max-w-sm mx-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setTab('mensal')}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition-all ${
                    tab === 'mensal'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setTab('anual')}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition-all ${
                    tab === 'anual'
                      ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anual
                </button>
                {isNewUser && (
                  <button
                    type="button"
                    onClick={() => setTab('promocao')}
                    className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      tab === 'promocao'
                        ? 'bg-emerald-500 text-white shadow-md ring-1 ring-emerald-400/50'
                        : 'text-emerald-500/70 hover:text-emerald-400'
                    }`}
                  >
                    Promoção
                  </button>
                )}
              </div>
            </div>

            {/* Card Principal de Preço */}
            <div className="pt-2 px-2 relative min-h-[180px]">
              <AnimatePresence mode="wait">
                {tab === 'mensal' && (
                  <motion.div 
                    key="mensal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-2 rounded-2xl border-2 border-border bg-card/90 p-5 shadow-2xl text-center space-y-3"
                  >
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-border text-foreground font-display text-xs font-black tracking-wider uppercase shadow-sm">
                      PLANO MENSAL
                    </div>

                    <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                      DIREITO PRIME PRO MENSAL
                    </p>

                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-black text-foreground">R$ 29,90</span>
                      <span className="text-xs font-semibold text-muted-foreground">/mês</span>
                    </div>

                    <p className="text-xs font-bold text-muted-foreground">
                      Cobrado mensalmente
                    </p>
                  </motion.div>
                )}

                {tab === 'anual' && (
                  <motion.div 
                    key="anual"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-2 rounded-2xl border-2 border-primary bg-card/90 p-5 shadow-2xl text-center space-y-3"
                  >
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground font-display text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                      O MAIS VENDIDO
                    </div>

                    <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                      DIREITO PRIME PRO ANUAL
                    </p>

                    <div className="flex flex-col items-center justify-center gap-0">
                      <div className="flex items-baseline gap-1 text-primary">
                        <span className="font-display text-2xl font-bold">12x de</span>
                        <span className="font-display text-4xl sm:text-5xl font-black ml-1">R$ 16,65</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground pt-1">ou R$ 199,90 à vista</span>
                    </div>

                    <div className="text-xs font-bold text-primary flex items-center justify-center gap-1 pt-1">
                      Cobrado anualmente
                    </div>
                  </motion.div>
                )}

                {tab === 'promocao' && isNewUser && (
                  <motion.div 
                    key="promocao"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-2 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-5 shadow-2xl text-center space-y-3 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-bl-lg tracking-wider">
                      PROMOÇÃO 24H
                    </div>

                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white font-display text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                      EXCLUSIVO NO PIX
                    </div>

                    <p className="font-display text-xs font-bold uppercase tracking-widest text-emerald-500 pt-1">
                      BÔNUS DE BOAS-VINDAS
                    </p>

                    <div className="flex flex-col items-center justify-center gap-0">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-3xl sm:text-4xl font-black text-emerald-400">R$ 149,90</span>
                        <span className="text-xs font-semibold text-emerald-500/80">/ano</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500/80 pt-0.5 line-through">Preço normal: R$ 199,90</span>
                    </div>

                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Aproveite antes que o tempo acabe
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spacer for absolute cards above */}
            <div className="h-6"></div>

            {/* Botão CTA Principal */}
            <div className="pt-2 px-2 space-y-3">
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
                className={`btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl font-display text-lg font-black tracking-wider transition-all active:scale-[0.99] ${
                  tab === 'promocao' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                    : 'bg-gradient-to-r from-[hsl(348_78%_38%)] via-primary to-[hsl(348_78%_38%)] text-primary-foreground shadow-[0_10px_30px_rgba(224,31,71,0.4)] hover:brightness-110'
                }`}
              >
                <span>{tab === 'promocao' ? 'Assinar no PIX com Desconto' : 'Assinar Agora'}</span>
              </Button>

              <p className="text-[11px] text-muted-foreground text-center leading-tight">
                Renovação automática no plano escolhido. Cancele quando quiser nas configurações da loja.
              </p>

              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/80 font-medium pt-1">
                <button onClick={() => navigate('/suporte')} className="hover:underline">Termos de Uso</button>
                <span>•</span>
                <button onClick={() => navigate('/suporte')} className="hover:underline">Privacidade</button>
              </div>
            </div>

          {/* Feature checklist */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 rounded-2xl p-5 bg-card/60 border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
                Tudo que você desbloqueia
              </h3>
            </div>
            <ul className="space-y-3">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="font-body text-sm text-foreground leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* FAQ */}
          <div className="mx-4 rounded-2xl p-5 bg-card/60 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
                Perguntas frequentes
              </h3>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="para-quem" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  Para quem é o Direito Prime?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  O Direito Prime é feito para <span className="text-foreground font-medium">estudantes de Direito, concurseiros e advogados</span> que precisam de agilidade no dia a dia jurídico. Consulte qualquer lei atualizada em segundos, tire dúvidas com IA jurídica 24h, gere resumos automáticos, ouça leis inteiras narradas, estude com flashcards e mapas mentais, acompanhe novidades legislativas em tempo real e leve toda a biblioteca no bolso — na faculdade, no trabalho, no fórum ou revisando para a próxima prova.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancelar" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  Posso cancelar quando quiser?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  O cancelamento é feito direto pelo sistema de assinaturas da App Store ou do Google Play. A renovação dos planos pode ser interrompida a qualquer momento nas configurações do seu celular.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="teste" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  Quais são as formas de pagamento?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  Aceitamos pagamentos via PIX e Cartão de Crédito de forma 100% segura. O acesso é liberado no mesmo instante.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pagamento" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  O pagamento é seguro?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  O pagamento é processado pelo Asaas (Instituição de Pagamento autorizada pelo Banco Central), com a mesma segurança usada em milhares de empresas. O Direito Prime nunca tem acesso aos dados do seu cartão.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dispositivos" className="border-border-0 border-b-0">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  Funciona em vários dispositivos?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  Sim. Sua assinatura sincroniza no App, no Desktop e na Web — estude onde e quando quiser, do mesmo jeito.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>

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
                aria-label="Alternar plataforma (só pra mim)"
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

  return null;
}
