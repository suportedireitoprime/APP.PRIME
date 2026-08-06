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
import paywallLeft from '@/assets/paywall/paywall_left.png';
import paywallCenter from '@/assets/paywall/paywall_center.png';
import paywallRight from '@/assets/paywall/paywall_right.png';

            {/* ── 3D Image Stack: Leque de 3 Fotos Jurídicas no Topo ─────── */}
            <div className="relative flex items-center justify-center pt-2 pb-6 px-4 overflow-hidden">
              <div className="relative flex items-center justify-center w-full max-w-[340px] h-[190px]">
                {/* Foto Esquerda */}
                <motion.div
                  initial={{ opacity: 0, x: -30, rotate: -15 }}
                  animate={{ opacity: 0.85, x: -65, rotate: -10, y: 8 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="absolute w-[130px] h-[160px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0"
                >
                  <img src={paywallLeft} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>

                {/* Foto Direita */}
                <motion.div
                  initial={{ opacity: 0, x: 30, rotate: 15 }}
                  animate={{ opacity: 0.85, x: 65, rotate: 10, y: 8 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="absolute w-[130px] h-[160px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0"
                >
                  <img src={paywallRight} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>

                {/* Foto Central Destaque */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute z-20 w-[150px] h-[180px] rounded-2xl overflow-hidden border-4 border-primary shadow-[0_15px_40px_rgba(224,31,71,0.45)] shrink-0"
                >
                  <img src={paywallCenter} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </motion.div>
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-2">
              <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f97316]">
                PROJETO DIREITO PRIME PRO
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground leading-tight px-2">
                Chegue no topo da sua carreira na sua melhor versão.
              </h1>
            </div>

            {/* Checklist de Benefícios */}
            <div className="space-y-2 pt-2 text-left max-w-sm mx-auto px-4">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f97316]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#f97316]" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Aulas em Trilhas, Slides e Questões por matéria</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f97316]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#f97316]" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Vade Mecum Inteligente com IA e Resumos</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f97316]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#f97316]" strokeWidth={3} />
                </div>
                <span className="font-body text-sm font-semibold text-foreground/90">Todas as funcionalidades do DIREITO PRIME PRO</span>
              </div>
            </div>

            {/* Card Principal de Preço com Badge 50% OFF */}
            <div className="pt-4 px-2">
              <div className="relative rounded-2xl border-2 border-primary bg-card/90 p-5 shadow-2xl text-center space-y-3">
                {/* Badge 50% OFF sobreposto na borda */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#f97316] text-white font-display text-xs font-black tracking-wider uppercase shadow-md">
                  50% OFF
                </div>

                <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                  DIREITO PRIME PRO ANUAL
                </p>

                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-sm text-muted-foreground line-through font-semibold">R$ 199,90</span>
                  <span className="font-display text-3xl sm:text-4xl font-black text-foreground">R$ 99,90</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ano</span>
                </div>

                <p className="text-xs font-bold text-[#f97316]">
                  Apenas R$ 8,33 por mês
                </p>
              </div>
            </div>

            {/* Botão CTA Principal de Alta Conversão */}
            <div className="pt-2 px-2 space-y-3">
              <Button
                onClick={() => startPurchase(tab === 'mensal' ? 'mensal' : 'anual')}
                disabled={playLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[hsl(0_72%_52%)] via-[#f97316] to-[hsl(348_78%_38%)] text-white font-display text-lg font-black tracking-wider shadow-[0_10px_30px_rgba(249,115,22,0.4)] hover:brightness-110 active:scale-[0.99] transition-all"
              >
                {playLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processando…</span>
                ) : (
                  <span>Aproveitar 50% OFF</span>
                )}
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
