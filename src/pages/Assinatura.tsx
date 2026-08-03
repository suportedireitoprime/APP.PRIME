import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { Zap, Check, Shield, Brain, Loader2, Smartphone, RotateCw, Monitor, Sparkles, Star, MessageCircle, Headphones, FileText, Library, Scale, Briefcase } from "lucide-react";
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isBillingAvailable, initBilling, getProducts, purchase as playPurchase, restorePurchases, PRODUCT_IDS, type PlanId, type PlayProduct } from "@/lib/billing";
import { useSubscription } from "@/hooks/useSubscription";
import WelcomePremiumOverlay from "@/components/planos/WelcomePremiumOverlay";
import { TrialTimelineSheet } from "@/components/planos/TrialTimelineSheet";
import { scheduleTrialReminder, trialDaysFor, type TrialPlan } from "@/lib/trialReminders";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { isAdminEmail } from "@/lib/adminEmails";
import { maybeRequestAfterPurchase } from "@/lib/inAppReview";
import { track } from "@/lib/analyticsEvents";
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';

export default function Assinatura() {
  useTrackArea("assinatura_aberta");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const welcomeFlag = searchParams.get('welcome') === '1';
  const { refresh: refreshSubscription, isPremium, loading: subLoading, plano: planoAtual } = useSubscription({ pollOnMount: welcomeFlag });
  const [showWelcome, setShowWelcome] = useState(welcomeFlag);

  useEffect(() => {
    if (welcomeFlag) {
      setShowWelcome(true);
      // Pós-compra: pede avaliação nativa (Play/App Store) só se ainda não pedimos.
      maybeRequestAfterPurchase(2500);
    }
  }, [welcomeFlag]);

  const closeWelcome = () => {
    setShowWelcome(false);
    if (searchParams.has('welcome')) {
      searchParams.delete('welcome');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // ── View state ──
  const view = "plans" as const;

  // Funil de receita: visualização da lista de planos.
  useEffect(() => {
    import('@/lib/appEvents').then(({ appEvents }) => appEvents.verPlanos()).catch(() => {});
  }, []);

  // ── Google Play native billing ──
  const nativeBilling = isBillingAvailable();
  const [playProducts, setPlayProducts] = useState<PlayProduct[]>([]);
  const [playLoading, setPlayLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!nativeBilling) return;
    (async () => {
      await initBilling(() => {
        refreshSubscription();
        toast.success('Assinatura ativada! 🎉');
        navigate('/assinatura?welcome=1', { replace: true });
      });
      const list = await getProducts();
      setPlayProducts(list);
    })();
  }, [nativeBilling, navigate, refreshSubscription]);

  const handlePlayPurchase = async (planKey: PlanId) => {
    if (!session) { toast.error('Faça login para assinar'); return; }
    setPlayLoading(true);
    try {
      const r = await playPurchase(planKey);
      if (!r.ok) {
        track('subscription_payment_failed', { plano: planKey, erro: r.error ?? 'unknown', metodo: 'play' });
        toast.error(r.error ?? 'Falha na compra');
        return;
      }
      track('subscription_completed', { plano: planKey, metodo: 'play', valor: playProducts.find(p => p.productId === PRODUCT_IDS[planKey])?.price ?? '' });
      // Handshake pós-compra: força refresh + navega para overlay de boas-vindas
      // (não dependemos só do listener transactionUpdated).
      refreshSubscription();
      toast.success('Assinatura ativada! 🎉');
      navigate('/assinatura?welcome=1', { replace: true });
    } finally {
      setPlayLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const r = await restorePurchases();
    setRestoring(false);
    if (r.ok && r.restored > 0) { toast.success(`${r.restored} assinatura(s) restaurada(s)`); refreshSubscription(); navigate('/assinatura?welcome=1', { replace: true }); }
    else if (r.ok) toast.info('Nenhuma compra anterior encontrada.');
    else toast.error(r.error ?? 'Falha ao restaurar');
  };

  // ── PLANS VIEW (tabbed: Mensal / Anual) ──
  type PlanoTab = PlanId;
  const nativePlatform = useMemo(() => Capacitor.getPlatform(), []);
  const showDevToggle = isAdminEmail(session?.user?.email);
  const [platformOverride, setPlatformOverride] = useState<'ios' | 'android' | null>(() => {
    if (typeof window === 'undefined') return null;
    const v = window.localStorage.getItem('assinatura_platform_override');
    return v === 'ios' || v === 'android' ? v : null;
  });
  const [devSheetOpen, setDevSheetOpen] = useState(false);
  const [trialSheetPlan, setTrialSheetPlan] = useState<TrialPlan | null>(null);
  const isIOS = (platformOverride ?? nativePlatform) === 'ios';
  // Voltar: no modo prévia de admin, volta direto pro painel do plano ativo.
  // Fora disso usa o histórico interno e, se não houver, vai pro início.
  const handleBack = () => {
    setDevSheetOpen(false);
    setTrialSheetPlan(null);
    if (searchParams.get('preview') === 'plans') {
      navigate('/planos/ativos', { replace: true });
      return;
    }
    const hasHistory = typeof window !== 'undefined' && window.history.state?.idx > 0;
    if (hasHistory) goBack();
    else navigate('/', { replace: true });
  };
  // Radix às vezes deixa `pointer-events: none` no body depois de fechar o sheet,
  // o que travava todos os cliques da tela (inclusive o botão de voltar).
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
  const [tab, setTab] = useState<PlanoTab>('anual');

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

  const startPurchase = (plano: PlanoTab) => {
    track('subscription_started', { plano, metodo: nativeBilling ? 'play' : 'web', source: 'planos_page' });
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano });
        appEvents.assinaturaIniciada({ plano, metodo: nativeBilling ? 'play' : 'web' });
      })
      .catch(() => {});
    // Antes de abrir a loja, mostra a linha do tempo do teste grátis.
    setTrialSheetPlan(plano);
  };

  const confirmTrialAndBuy = async () => {
    if (!trialSheetPlan) return;
    import('@/lib/appEvents')
      .then(({ appEvents }) =>
        appEvents.trialIniciado({ plano: trialSheetPlan, dias: trialDaysFor(trialSheetPlan) })
      )
      .catch(() => {});
    // Agenda lembrete (WhatsApp via cron + push local) e abre a loja.
    await scheduleTrialReminder(trialSheetPlan);
    const plano = trialSheetPlan;
    setTrialSheetPlan(null);
    if (nativeBilling) {
      handlePlayPurchase(plano);
    } else {
      toast.info('Assinatura disponível no app', {
        description: 'Baixe o Direito Prime no Google Play ou na App Store para assinar.',
      });
    }
  };

  // Admin pode forçar a visualização dos cards de planos mesmo sendo assinante (?preview=plans)
  const previewPlans = showDevToggle && searchParams.get('preview') === 'plans';

  // Já assinante? Redireciona pro painel de plano ativo (mantém welcome overlay quando volta do checkout).
  if (view === "plans" && !subLoading && isPremium && !showWelcome && !previewPlans) {
    return <Navigate to="/planos/ativos" replace />;
  }

  if (view === "plans") {


    return (
      <div className="min-h-dvh bg-background pb-12">
        <WelcomePremiumOverlay
          open={showWelcome}
          planoLabel={planoAtual ?? 'Premium'}
          syncing={welcomeFlag && !isPremium}
          onClose={closeWelcome}
        />
        <TrialTimelineSheet
          open={!!trialSheetPlan}
          onOpenChange={(v) => { if (!v) setTrialSheetPlan(null); }}
          plan={trialSheetPlan ?? 'anual'}
          onConfirm={confirmTrialAndBuy}
          loading={playLoading}
        />
        <PageHeader
          title="Assinatura Premium"
          onBack={handleBack}
        />

        <div className="max-w-2xl mx-auto pt-6 space-y-7">
          {/* Clean hero */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-4 px-4 pt-1"
          >

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border">
              <Briefcase className="w-3 h-3 text-primary" />
              <span className="font-body text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Uso profissional
              </span>
            </div>


            <div className="flex justify-center">
              <div className="btn-attention-shine relative inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-primary shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-primary-foreground leading-none tracking-tight">
                  ESTUDE SEM LIMITES
                </h1>
              </div>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Escolha o plano ideal e aprove sem barreiras.
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="font-body text-xs text-muted-foreground">
                <span className="font-bold text-foreground">4.9</span> · Nota máxima na Play Store
              </span>
            </div>

          </motion.section>




          {/* Plan carousel — equal-size cards, snap scroll, anual peeks on the side */}
          <div
            className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
            style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
          >
            {([
              {
                id: 'mensal' as const,
                label: 'Mensal',
                price: 'R$ 29,90',
                priceSuffix: '/mês',
                subtitle: 'Cobrado mensalmente · renove ou cancele quando quiser',
                trial: '3 dias grátis',
                highlights: ['Acesso total ao Vade Mecum', 'Acesso ao desktop', 'Uso offline', 'Horus 24h no WhatsApp'],
                badge: null as string | null,
              },
              isIOS
                ? {
                    id: 'anual' as const,
                    label: 'Anual',
                    price: 'R$ 19,90',
                    priceSuffix: '/mês',
                    subtitle: '12x de R$ 19,90 · total R$ 238,80 por ano · economize 33%',
                    trial: '3 dias grátis',
                    highlights: ['Acesso total ao Vade Mecum', 'Acesso ao desktop', 'Uso offline', 'Horus 24h no WhatsApp'],
                    badge: '-33%' as string | null,
                  }
                : {
                    id: 'anual_parcelado' as const,
                    label: 'Anual',
                    price: 'R$ 16,66',
                    priceSuffix: '/mês',
                    subtitle: '12x de R$ 16,66 · total R$ 199,90 por ano · economize 44%',
                    trial: '3 dias grátis',
                    highlights: ['Acesso total ao Vade Mecum', 'Acesso ao desktop', 'Uso offline', 'Horus 24h no WhatsApp'],
                    badge: '-44%' as string | null,
                  },
            ]).map((plan) => {
              const isActive = tab === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setTab(plan.id)}
                  role="button"
                  tabIndex={0}
                  data-track="plan_card_viewed"
                  data-plano={plan.id}
                  className={`snap-start shrink-0 w-[85%] sm:w-auto sm:shrink relative rounded-2xl p-5 flex flex-col text-left transition-all cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-card border-2 border-primary'
                      : 'bg-card/70 border border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-primary">
                        {plan.label}
                      </span>
                    </div>
                    {plan.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-body text-[10px] font-extrabold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="font-body text-sm text-muted-foreground">{plan.priceSuffix}</span>
                  </div>
                  <span className="font-body text-[11px] text-muted-foreground mb-3">
                    {plan.subtitle}
                  </span>

                  <ul className="space-y-1.5 mb-4">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={3} />
                        <span className="font-body text-[12px] text-foreground/90 leading-tight">{h}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={(e) => { e.stopPropagation(); setTab(plan.id); startPurchase(plan.id); }}
                    disabled={playLoading}
                    data-track="plan_cta_click"
                    data-plano={plan.id}
                    className="btn-attention-shine mt-auto w-full h-14 rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-base sm:text-lg tracking-wide hover:brightness-95 transition-all"
                  >
                    {playLoading && isActive ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processando…</span>
                    ) : (
                      <span>Começar {plan.trial}</span>
                    )}
                  </Button>
                  <p className="text-center font-body text-[10px] text-muted-foreground mt-2">
                    Cancele quando quiser
                  </p>
                </div>

              );
            })}

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
              <Sparkles className="w-4 h-4 text-primary" />
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
                  Sim. O cancelamento é feito direto pela sua conta da Google Play, com um toque, sem burocracia. Você mantém o acesso Premium até o fim do período pago.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="teste" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  Como funciona o período grátis?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  Você testa 3 dias grátis em qualquer um dos planos. Durante o teste, todas as funções Premium ficam liberadas. Cancele antes do fim para não ser cobrado.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pagamento" className="border-border">
                <AccordionTrigger className="font-body text-sm font-semibold text-foreground text-left hover:no-underline">
                  O pagamento é seguro?
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  O pagamento é processado pela Google Play, com a mesma segurança usada em milhões de aplicativos. O Direito Prime nunca tem acesso aos dados do seu cartão.
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


          {nativeBilling && (
            <div className="px-4">
              <Button variant="ghost" onClick={handleRestore} disabled={restoring} className="w-full">
                {restoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCw className="w-4 h-4 mr-2" />}
                Restaurar compras
              </Button>
            </div>
          )}
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

    );
  }

  return null;
}
