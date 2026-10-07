import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import horusAsset from '@/assets/horus/03_coruja_balanca_justica.webp';
import horusWhatsapp from '@/assets/horus/coruja_whatsapp.webp';
import horusBiblioteca from '@/assets/horus/coruja_biblioteca.webp';
import horusOwl2 from '@/assets/horus/02_coruja_estudando.webp';
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { isAdminEmail } from "@/lib/adminEmails";
import { CheckoutModal } from "@/components/assinatura/CheckoutModal";
import { BeneficiosTimelineModal } from "@/components/assinatura/BeneficiosTimelineModal";
import { useBodyScrollLock, resetBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';

import penalCover from '@/assets/biblioteca/areas/direito-penal.webp';
import civilCover from '@/assets/biblioteca/areas/direito-civil.webp';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';
import adminCover from '@/assets/biblioteca/areas/direito-administrativo.webp';
import trabCover from '@/assets/biblioteca/areas/direito-do-trabalho.webp';
import tribCover from '@/assets/biblioteca/areas/direito-tributario.webp';
import procPenalCover from '@/assets/biblioteca/areas/direito-processual-penal.webp';
import procCivilCover from '@/assets/biblioteca/areas/direito-processual-civil.webp';

interface MateriaCover {
  id: string;
  nome: string;
  tag: string;
  cover: string;
}

const MATERIAS: MateriaCover[] = [
  { id: 'penal', nome: 'Direito Penal', tag: 'DIREITO PENAL', cover: penalCover },
  { id: 'civil', nome: 'Direito Civil', tag: 'DIREITO CIVIL', cover: civilCover },
  { id: 'const', nome: 'Direito Constitucional', tag: 'CONSTITUCIONAL', cover: constCover },
  { id: 'admin', nome: 'Direito Administrativo', tag: 'ADMINISTRATIVO', cover: adminCover },
  { id: 'trab', nome: 'Direito do Trabalho', tag: 'TRABALHO', cover: trabCover },
  { id: 'proc_penal', nome: 'Processo Penal', tag: 'PROCESSO PENAL', cover: procPenalCover },
  { id: 'trib', nome: 'Direito Tributário', tag: 'TRIBUTÁRIO', cover: tribCover },
  { id: 'proc_civil', nome: 'Processo Civil', tag: 'PROCESSO CIVIL', cover: procCivilCover },
];

const OWLS = [
  horusAsset,
  horusBiblioteca,
  horusOwl2,
  horusWhatsapp,
  horusAsset,
  horusBiblioteca,
  horusOwl2,
  horusWhatsapp
];

const OWL_TEXTS = [
  "a jornada continua? 🚀",
  "a biblioteca te espera! 📚",
  "bora revisar com os resumos? ✍️",
  "seu assistente no WhatsApp! 📱",
  "o tempo está passando! ⏳",
  "mergulhe na doutrina! 📖",
  "mais questões comentadas? 🎯",
  "estude em qualquer lugar! 🌍"
];

const SLOTS = [
  { x: 0, y: -45, rotate: 0, scale: 1.15, opacity: 1, z: 50 },
  { x: 62, y: -25, rotate: 8, scale: 0.9, opacity: 0.85, z: 40 },
  { x: 104, y: -10, rotate: 15, scale: 0.72, opacity: 0.4, z: 30 },
  { x: 0, y: -5, rotate: 0, scale: 0.6, opacity: 0, z: 10 },
  { x: 0, y: -5, rotate: 0, scale: 0.6, opacity: 0, z: 10 },
  { x: 0, y: -5, rotate: 0, scale: 0.6, opacity: 0, z: 10 },
  { x: -104, y: -10, rotate: -15, scale: 0.72, opacity: 0.4, z: 30 },
  { x: -62, y: -25, rotate: -8, scale: 0.9, opacity: 0.85, z: 40 },
];

interface TrialExpiredModalProps {
  open?: boolean;
  onClose?: () => void;
}

const COPIES = [
  {
    title: "SEU TESTE DE 3 DIAS ACABOU",
    message: "{name}, a sua degustação gratuita chegou ao fim. Não volte para métodos lentos e desatualizados: garanta acesso ilimitado à IA Horus, Vade Mecum inteligente e mais de 200 ferramentas agora.",
  },
  {
    title: "FIM DOS 3 DIAS GRATUITOS",
    message: "{name}, o seu período de teste expirou. Mantenha seu ritmo acelerado e garanta acesso irrestrito a todas as leis comentadas, resumos esquematizados e simulados exclusivos.",
  },
  {
    title: "OS SEUS 3 DIAS TERMINARAM",
    message: "{name}, o seu passe livre acabou. Desbloqueie todo o acervo do Direito Prime hoje mesmo e conquiste o diferencial competitivo que você precisa.",
  }
];

export function TrialExpiredModal({ open = true, onClose }: TrialExpiredModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refresh: refreshSubscription } = useSubscription();
  const [ativo, setAtivo] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'anual' | 'anual_pix' | null>(null);
  const [showBeneficios, setShowBeneficios] = useState(false);
  const [copyIndex] = useState(() => Math.floor(Math.random() * COPIES.length));

  const isAdmin = isAdminEmail(user?.email);

  useBodyScrollLock(Boolean(open && !isAdmin && user));

  useEffect(() => {
    // Pré-carregamento agressivo em background da página de assinatura e checkout
    if (typeof window !== "undefined") {
      setTimeout(() => {
        import("@/pages/Assinatura");
      }, 500);
    }
    
    return () => {
      // Item 36: Libera trava de scroll do body no unmount do modal
      resetBodyScrollLock(true);
    };
  }, []);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    'Doutor(a)';
    
  const currentCopy = COPIES[copyIndex];

  useEffect(() => {
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduz) return;
    const interval = setInterval(() => {
      setAtivo((prev) => (prev + 1) % MATERIAS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (isAdmin || !open || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto bg-black/85 p-4 py-8">
      {/* Checkout direto mantendo o fundo fosco */}
      {/* Tela Fullscreen de Benefícios em Linha do Tempo */}
      <BeneficiosTimelineModal
        open={showBeneficios}
        onClose={() => setShowBeneficios(false)}
        onGoToPlans={() => {
          setShowBeneficios(false);
          haptic.medium();
          resetBodyScrollLock(true);
          window.scrollTo(0, 0);
          navigate('/assinatura?preview=plans', { replace: true });
        }}
      />

      <CheckoutModal
        open={!!checkoutPlan}
        onOpenChange={(v) => { if (!v) setCheckoutPlan(null); }}
        plan={checkoutPlan}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name || ''}
        onSuccess={() => {
          // Item 30: Atualização reativa sem reload completo da janela
          setCheckoutPlan(null);
          refreshSubscription();
          queryClient.invalidateQueries();
          if (onClose) onClose();
        }}
      />

      <div className="relative mx-auto w-full max-w-md pt-24 sm:pt-28">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={`owl-${ativo}`}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-[52px] sm:-top-[62px] left-4 sm:left-7 z-30 flex items-end pointer-events-none"
          >
            <div
              className="w-28 h-28 sm:w-34 sm:h-34 drop-shadow-[0_18px_24px_rgba(0,0,0,0.65)] shrink-0"
            >
              <img
                src={OWLS[ativo]}
                alt="Horus"
                draggable={false}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Balão de fala ao lado do Horus */}
            <div
              className="relative -top-5 -left-1 max-w-[205px] sm:max-w-[235px] bg-white text-neutral-950 rounded-2xl px-3.5 py-2 shadow-2xl border-2 border-neutral-900 pointer-events-auto"
            >
              <p className="text-[12px] sm:text-[13px] font-black leading-snug text-neutral-900">
                {firstName}, {OWL_TEXTS[ativo]}
              </p>
              <span
                className="absolute -bottom-2 left-4 w-0 h-0 pointer-events-none"
                style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #171717' }}
              />
              <span
                className="absolute -bottom-[5px] left-[17px] w-0 h-0 pointer-events-none"
                style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #ffffff' }}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Card Principal */}
        <div
          className="relative z-10 space-y-4 rounded-3xl border border-white/10 bg-[#121417]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl shadow-black/60 text-center"
        >
          {/* Decks com as capas do Aprender passando no automático */}
          <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
            <div className="relative flex items-center justify-center w-full max-w-[320px] h-[165px] sm:h-[175px]">
              {MATERIAS.map((m, i) => {
                const pos = (i - ativo + MATERIAS.length) % MATERIAS.length;
                const slot = SLOTS[pos];

                return (
                  <motion.div
                    key={m.id}
                    animate={{
                      x: slot.x,
                      y: slot.y,
                      rotate: slot.rotate,
                      scale: slot.scale,
                      opacity: slot.opacity,
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ zIndex: slot.z }}
                    className={`absolute w-[114px] sm:w-[124px] h-[148px] sm:h-[160px] rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/20`}
                  >
                    <img
                      src={m.cover}
                      alt={m.nome}
                      className="w-full h-full object-cover"
                      loading={i < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-2.5 text-center pb-4">
                      <span className="text-[10px] sm:text-[11px] font-display font-black tracking-widest uppercase text-white drop-shadow leading-tight">
                        {m.tag}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Identificador da matéria ativa removido (apenas dots agora) */}
            <div className="flex flex-col items-center gap-1.5 mt-1">
              {/* Dots de navegação suave */}
              <div className="flex items-center gap-1 mt-0.5">
                {MATERIAS.map((m, idx) => (
                  <span
                    key={m.id}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === ativo ? 'w-4 bg-primary' : 'w-1 bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Título com espaço maior entre as letras */}
          <h2 className="text-lg sm:text-xl font-display font-black tracking-[0.15em] sm:tracking-[0.2em] text-foreground uppercase text-center mt-2">
            {currentCopy.title}
          </h2>

          {/* Mensagem persuasiva elegante citando o nome */}
          <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed text-center max-w-sm mx-auto" dangerouslySetInnerHTML={{__html: currentCopy.message.replace('{name}', `<strong class="text-foreground font-bold">${firstName}</strong>`)}} />

          {/* Botões de Ação */}
          <div className="w-full pt-2 space-y-2.5">
            <button
              onClick={() => {
                haptic.medium();
                setShowBeneficios(true);
              }}
              className="btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl font-display font-black text-base tracking-wider bg-primary text-primary-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/30 group cursor-pointer uppercase"
            >
              <span>VER BENEFÍCIOS</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
