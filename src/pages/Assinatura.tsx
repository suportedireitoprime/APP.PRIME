import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { Zap, Check, Shield, Brain, Loader2, Smartphone, RotateCw, Monitor, Sparkles, Star, MessageCircle, Headphones, FileText, Library, Scale, Briefcase } from "lucide-react";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
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
import { useTrackArea } from "@/hooks/useTrackArea";
import { track } from "@/lib/analyticsEvents";
import { useGoBack } from '@/hooks/useGoBack';
import PaywallImageStack from '@/components/planos/PaywallImageStack';

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
  const isIOS = (platformOverride ?? nativePlatform) === 'ios' || (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent));
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
  const [tab, setTab] = useState<'mensal' | 'anual'>('mensal');

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

  const startPurchase = async (plano: 'mensal' | 'anual') => {
    track('subscription_started', { plano, metodo: 'native', source: 'planos_page' });
    import('@/lib/appEvents')
      .then(({ appEvents }) => {
        appEvents.verPlano({ plano: plano as any });
        appEvents.assinaturaIniciada({ plano: plano as any, metodo: 'native' });
      })
      .catch(() => {});
      
    if (!session) { toast.error('Faça login para assinar'); return; }
    
    if (plano === 'anual' && !hasUsedTrial) {
      setTrialSheetPlan(plano);
      return;
    }

    if (nativeBilling) {
      handlePlayPurchase(plano);
    } else {
      toast.info('Assinatura disponível no aplicativo móvel', {
        description: 'Por favor, baixe o app Direito Prime no Google Play ou na App Store no seu celular para realizar a assinatura.'
      });
    }
  };

  const hasUsedTrial = useMemo(() => {
    if (!session?.user?.id) return false;
    const local = typeof localStorage !== 'undefined' ? localStorage.getItem(`prime_trial_used_${session.user.id}`) : null;
    return local === 'true' || isPremium || !!planoAtual;
  }, [session?.user?.id, isPremium, planoAtual]);

  const confirmTrialAndBuy = async () => {
    if (!trialSheetPlan) return;
    if (session?.user?.id) {
      try { localStorage.setItem(`prime_trial_used_${session.user.id}`, 'true'); } catch { /* ignore */ }
    }
    import('@/lib/appEvents')
      .then(({ appEvents }) =>
        appEvents.trialIniciado({ plano: trialSheetPlan, dias: trialDaysFor(trialSheetPlan) })
      )
      .catch(() => {});
    // Agenda lembrete (WhatsApp via cron + push local) em background para não travar a UI
    scheduleTrialReminder(trialSheetPlan).catch(() => {});
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
      <div className="min-h-dvh bg-background pb-[calc(4rem+var(--sai-bottom))]">
        <WelcomePremiumOverlay
          open={showWelcome}
          planoLabel={planoAtual ?? 'Premium'}
          syncing={false}
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
            {/* ── Carrossel 3D: 6 fotos jurídicas girando automaticamente ── */}
            <PaywallImageStack />

            {/* Headline & Subtitle */}
            <div className="space-y-2 text-center">
              <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
                PROJETO DIREITO PRIME PRO
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground leading-tight px-2">
                Chegue na sua melhor versão jurídica.
              </h1>
            </div>

            {/* Checklist de Benefícios */}
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

            {/* 🎛️ Seletor Alternante de Abas [ Mensal | Anual ] */}
            <div className="pt-3 px-4">
              <div className="flex rounded-xl bg-muted/80 p-1 border border-border/80 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setTab('mensal')}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition-all ${
                    tab === 'mensal'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setTab('anual')}
                  className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'anual'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Anual</span>
                  {!hasUsedTrial && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase">
                      3 DIAS GRÁTIS
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Card Principal de Preço com os Valores Oficiais */}
            <div className="pt-2 px-2">
              {tab === 'mensal' ? (
                <div className="relative rounded-2xl border-2 border-primary bg-card/90 p-5 shadow-2xl text-center space-y-3">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground font-display text-xs font-black tracking-wider uppercase shadow-md">
                    PLANO MENSAL
                  </div>

                  <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                    DIREITO PRIME PRO MENSAL
                  </p>

                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display text-3xl sm:text-4xl font-black text-foreground">R$ 29,90</span>
                    <span className="text-xs font-semibold text-muted-foreground">/mês</span>
                  </div>

                  <p className="text-xs font-bold text-primary">
                    Cobrado mensalmente
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl border-2 border-primary bg-card/90 p-5 shadow-2xl text-center space-y-3">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground font-display text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                    O MAIS VENDIDO
                  </div>

                  <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                    DIREITO PRIME PRO ANUAL
                  </p>

                  <div className="flex flex-col items-center justify-center gap-0">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-black text-foreground">R$ 199,90</span>
                      <span className="text-xs font-semibold text-muted-foreground">/ano</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground pt-0.5">equivalente a R$ 16,65 /mês</span>
                  </div>

                  <div className="text-xs font-bold text-primary flex items-center justify-center gap-1 pt-1">
                    {!hasUsedTrial ? (
                      <>Comece com <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary uppercase font-black text-[10px]">3 DIAS GRÁTIS</span></>
                    ) : (
                      'Cobrado anualmente'
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botão CTA Principal */}
            <div className="pt-2 px-2 space-y-3">
              <Button
                onClick={() => startPurchase(tab)}
                disabled={playLoading}
                className="btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl bg-gradient-to-r from-[hsl(348_78%_38%)] via-primary to-[hsl(348_78%_38%)] text-primary-foreground font-display text-lg font-black tracking-wider shadow-[0_10px_30px_rgba(224,31,71,0.4)] hover:brightness-110 active:scale-[0.99] transition-all"
              >
                {playLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processando…</span>
                ) : (
                  <span>Testar 3 dias grátis</span>
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
