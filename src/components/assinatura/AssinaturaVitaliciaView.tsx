import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  Infinity as InfinityIcon, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Flame, 
  Lock, 
  BookOpen, 
  Headphones, 
  Video, 
  Bot, 
  Compass, 
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import { PRECO_VITALICIO, PRECO_VITALICIO_PROMOCIONAL, brl } from '@/lib/precos';
import { getCycle5DaysCountdown } from '@/lib/subscriptionLayoutStore';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import appLogo from '@/assets/logo-direitoprime-v2.webp';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface AssinaturaVitaliciaViewProps {
  onSuccess?: () => void;
  onVoltar?: () => void;
}

export const AssinaturaVitaliciaView: React.FC<AssinaturaVitaliciaViewProps> = ({
  onSuccess,
  onVoltar,
}) => {
  const goBack = useGoBack();
  const { session } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [countdown, setCountdown] = useState(getCycle5DaysCountdown());
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Contador de 5 dias em loop perpétuo infinito (persuasão contínua)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCycle5DaysCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenCheckout = () => {
    haptic.impact('heavy');
    setCheckoutOpen(true);
  };

  const handleBack = () => {
    haptic.selection();
    if (onVoltar) {
      onVoltar();
    } else {
      goBack();
    }
  };

  const beneficios = [
    {
      icon: <InfinityIcon className="w-5 h-5 text-amber-400" />,
      title: 'Acesso Vitalício Garantido',
      desc: 'Pague apenas uma vez. Nunca mais se preocupe com renovações, mensalidades ou anuidades.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      title: 'Vade Mecum & Leis Sempre Atualizadas',
      desc: 'Todas as novas leis, súmulas e reformas publicadas no futuro inclusas automaticamente.',
    },
    {
      icon: <Video className="w-5 h-5 text-rose-400" />,
      title: 'Videoaulas em Trilhas e Aulas Interativas',
      desc: 'Catálogo completo por áreas do Direito, módulos para iniciantes e animações didáticas.',
    },
    {
      icon: <Headphones className="w-5 h-5 text-sky-400" />,
      title: 'Áudio de Todas as Leis e Códigos',
      desc: 'Ouça onde quiser, inclusive em segundo plano com a tela do celular apagada ou offline.',
    },
    {
      icon: <Bot className="w-5 h-5 text-purple-400" />,
      title: 'Inteligência Artificial Hórus & Mentor Jurídico',
      desc: 'Tire dúvidas de processos, artigos e doutrina em segundos direto no aplicativo e WhatsApp.',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-amber-300" />,
      title: 'Multiplataforma (Celular, Tablet e PC)',
      desc: 'Sincronização instantânea do seu histórico, grifos e progresso em todos os seus aparelhos.',
    },
  ];

  const faqs = [
    {
      q: 'É realmente vitalício ou tem cobrança depois?',
      a: 'É 100% vitalício com pagamento único. Você paga apenas R$ 89,90 uma única vez no Pix e nunca mais recebe nenhuma fatura ou cobrança.',
    },
    {
      q: 'Como funciona a liberação do meu acesso?',
      a: 'A liberação é automática e instantânea pelo Pix do Asaas. Assim que você paga, o sistema reconhece em 0 segundos e seu acesso é liberado na hora.',
    },
    {
      q: 'As novas leis e futuras atualizações estão inclusas?',
      a: 'Sim! Todas as atualizações legislativas, novas aulas, novos recursos e ferramentas futuras estão cobertas no seu plano vitalício sem custo adicional.',
    },
    {
      q: 'E se eu não gostar, tenho garantia?',
      a: 'Sim, você possui garantia incondicional de 7 dias protegida pelo Código de Defesa do Consumidor. Satisfação total ou seu dinheiro de volta.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white flex flex-col font-sans selection:bg-rose-500/30 overflow-x-hidden">
      {/* Fundo Oficial Padronizado ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      {/* Glow Superior */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-rose-950/25 via-amber-950/15 to-transparent pointer-events-none z-0" />

      {/* Header Fixo */}
      <header className="sticky top-0 z-40 w-full bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar"
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img src={appLogo} alt="Direito Prime" className="w-7 h-7 object-contain" />
          <span className="font-display font-black tracking-wider text-sm uppercase text-white">
            Direito Prime
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Compra Segura</span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-5 pb-36 space-y-6">
        {/* Topo: Nomenclatura Oficial Plano Vitalício */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Assinatura Vitalícia Exclusiva</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
            Plano Vitalício
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Pague apenas uma única vez no Pix. Tenha acesso completo e ilimitado para toda a vida, sem mensalidades.
          </p>
        </div>

        {/* ── CARD DA PROMOÇÃO COM PULSO & CONTADOR DE 5 DIAS EM LOOP ── */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-[#141013] border-2 border-rose-500/50 shadow-[0_0_40px_rgba(225,29,72,0.22)] overflow-hidden"
        >
          {/* Efeito Glow Pulsante */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Superior da Promoção */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                Promoção Relâmpago
              </span>
            </div>

            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Economize R$ 60,00
            </span>
          </div>

          {/* Contador Regressivo de 5 Dias Cíclico */}
          <div className="py-4 space-y-2 text-center">
            <p className="text-xs sm:text-[13px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Esta condição promocional acaba em:</span>
            </p>

            {/* Caixas do Timer */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto pt-1">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-rose-500/30 text-center shadow-inner">
                <span className="font-mono font-black text-xl sm:text-2xl text-white block">
                  {countdown.days}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Dias</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-rose-500/30 text-center shadow-inner">
                <span className="font-mono font-black text-xl sm:text-2xl text-white block">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Horas</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-rose-500/30 text-center shadow-inner">
                <span className="font-mono font-black text-xl sm:text-2xl text-white block">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">Min</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-rose-500/30 text-center shadow-inner">
                <span className="font-mono font-black text-xl sm:text-2xl text-amber-400 block animate-pulse">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-400">Seg</span>
              </div>
            </div>
          </div>

          {/* Preço de R$ 149,90 por R$ 89,90 */}
          <div className="py-4 text-center border-t border-b border-white/10 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-zinc-500 text-sm sm:text-base font-medium line-through">
                De {brl(PRECO_VITALICIO)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                -40% OFF
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-zinc-400 text-lg font-semibold">Por apenas</span>
              <span className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight">
                {brl(PRECO_VITALICIO_PROMOCIONAL)}
              </span>
            </div>

            <p className="text-xs text-amber-300 font-bold tracking-wide pt-1">
              Pagamento único · Acesso permanente para sempre
            </p>
          </div>

          {/* Forma Exclusiva: Somente PIX */}
          <div className="pt-4 flex items-center justify-center gap-2 text-emerald-400 text-xs sm:text-[13px] font-bold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.954 1.34l-5.617 5.617a2.53 2.53 0 0 0 0 3.578L10.3 14.5a2.53 2.53 0 0 0 3.578 0l3.963-3.965a2.53 2.53 0 0 0 0-3.578L12.224 1.34a.19.19 0 0 0-.27 0zm8.012 8.653l3.056 3.056c.394.394.614.928.614 1.485s-.22 1.092-.614 1.485l-9.155 9.155c-.195.195-.45.293-.705.293s-.51-.098-.705-.293l-3.32-3.32 1.38-1.38 2.645 2.645 8.16-8.16-2.062-2.062a.19.19 0 0 0-.27 0l-3.518 3.518a4.42 4.42 0 0 1-6.251 0L5.3 12.443a.19.19 0 0 0-.27 0L2.969 14.51c-.195.195-.293.45-.293.705s.098.51.293.705l3.52 3.52-1.38 1.38-4.516-4.516c-.394-.394-.614-.928-.614-1.485s.22-1.092.614-1.485l9.156-9.155c.39-.39 1.02-.39 1.41 0l3.057 3.057a.19.19 0 0 0 .27 0l2.062-2.062a4.42 4.42 0 0 1 6.25 0l3.208 3.208-1.38 1.38-2.215-2.216z" />
            </svg>
            <span>Pagamento Exclusivo via PIX (Aprovação Instantânea)</span>
          </div>

          {/* Botão de Ação Primário CTA */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleOpenCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-display font-black text-base sm:text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Garantir Vitalício por {brl(PRECO_VITALICIO_PROMOCIONAL)}</span>
              <InfinityIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              🔒 Pagamento seguro via Asaas · Sem mensalidades futuras
            </p>
          </div>
        </motion.div>

        {/* ── LISTA DE TUDO QUE ESTÁ INCLUSO NO VITALÍCIO ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-4.5 rounded-full bg-amber-500" />
            <h2 className="font-display font-bold text-base sm:text-lg text-white uppercase tracking-wide">
              Tudo Incluso no Seu Acesso Vitalício
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {beneficios.map((b, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all flex items-start gap-3.5 shadow-sm"
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  {b.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SELO DE GARANTIA INCONDICIONAL ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white">Garantia Incondicional de 7 Dias</h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Experimente todas as funções sem riscos. Se não gostar, basta solicitar o reembolso que devolvemos 100% do seu valor via Pix.
            </p>
          </div>
        </div>

        {/* ── PERGUNTAS FREQUENTES (FAQ) ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-4.5 rounded-full bg-rose-500" />
            <h2 className="font-display font-bold text-base sm:text-lg text-white uppercase tracking-wide">
              Dúvidas Frequentes
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setFaqOpen(isOpen ? null : idx);
                    }}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-bold text-white hover:text-zinc-200 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-rose-400' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-2"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── BARRA FIXA INFERIOR COM BOTÃO DE COMPRA ── */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 line-through">De {brl(PRECO_VITALICIO)}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">PIX</span>
            </div>
            <div className="font-display font-black text-xl sm:text-2xl text-white leading-none mt-0.5">
              {brl(PRECO_VITALICIO_PROMOCIONAL)}
            </div>
            <span className="text-[10px] text-zinc-400">Pagamento único</span>
          </div>

          <button
            type="button"
            onClick={handleOpenCheckout}
            className="flex-1 max-w-xs py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-display font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Assinar Vitalício no Pix</span>
          </button>
        </div>
      </footer>

      {/* Modal de Checkout Especializado em PIX para o Plano Vitalício */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plan="vitalicio_promocional_pix"
        userEmail={session?.user?.email || ''}
        userName={session?.user?.user_metadata?.nome || ''}
        onSuccess={() => {
          setCheckoutOpen(false);
          toast.success('Parabéns! Seu Acesso Vitalício foi ativado com sucesso!');
          if (onSuccess) onSuccess();
        }}
      />
    </div>
  );
};
