import { useState, useEffect, useCallback, memo } from 'react';
import { Crown, Clock, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import { haptic } from '@/lib/nativeHaptics';
import { useNavigate } from 'react-router-dom';

interface PromoHeaderBannerProps {
  className?: string;
  isDesktop?: boolean;
}

export const PromoHeaderBanner = memo(function PromoHeaderBanner({
  className = '',
  isDesktop = false,
}: PromoHeaderBannerProps) {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, isTrial, expiresAt, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const [checkoutPlan, setCheckoutPlan] = useState<'anual_pix' | 'anual' | null>(null);
  const [promoSecondsLeft, setPromoSecondsLeft] = useState<number>(0);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState<number>(0);
  const [is24hActive, setIs24hActive] = useState<boolean>(true);

  // Chave local para controlar a contagem regressiva da oferta de 24h
  const getPromoKey = useCallback(() => {
    return user?.id ? `promo_24h_expires_${user.id}` : 'promo_24h_expires_guest';
  }, [user]);

  // Recupera ou inicializa a expiração da promoção de 24 horas
  const getPromoExpiresAt = useCallback(() => {
    const key = getPromoKey();
    let exp = 0;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        exp = parseInt(stored, 10);
      } else {
        const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
        const age = Date.now() - createdAt;
        // Se a conta tem menos de 24h, termina 24h a partir do cadastro; senão 24h a partir do acesso
        if (age < 24 * 60 * 60 * 1000) {
          exp = createdAt + 24 * 60 * 60 * 1000;
        } else {
          exp = Date.now() + 24 * 60 * 60 * 1000;
        }
        localStorage.setItem(key, String(exp));
      }
    } catch {
      exp = Date.now() + 24 * 60 * 60 * 1000;
    }
    return exp;
  }, [getPromoKey, user]);

  // Sincronização contínua a cada segundo
  useEffect(() => {
    if (authLoading || subLoading) return;
    // Se o usuário já é assinante pagante ativo, não precisa calcular
    if (isPremium && !isTrial) return;

    const updateTimers = () => {
      const now = Date.now();
      const promoExp = getPromoExpiresAt();
      const diffPromo = Math.floor((promoExp - now) / 1000);

      if (diffPromo > 0) {
        setIs24hActive(true);
        setPromoSecondsLeft(diffPromo);
      } else {
        setIs24hActive(false);
        setPromoSecondsLeft(0);

        // Se expirou a promo de 24h, calcula o tempo restante do teste grátis (Trial de 3 dias)
        let trialExp = 0;
        if (expiresAt) {
          trialExp = new Date(expiresAt).getTime();
        } else if (user?.created_at) {
          trialExp = new Date(user.created_at).getTime() + 3 * 24 * 60 * 60 * 1000;
        } else {
          trialExp = now + 2 * 24 * 60 * 60 * 1000;
        }
        const diffTrial = Math.floor((trialExp - now) / 1000);
        setTrialSecondsLeft(diffTrial > 0 ? diffTrial : 0);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [authLoading, subLoading, isPremium, isTrial, getPromoExpiresAt, expiresAt, user]);

  // Regra Suprema: Se o usuário é assinante ativo pago, o banner some de cima
  if (!subLoading && isPremium && !isTrial) {
    return null;
  }

  // Formata o cronômetro para exibição limpa
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const d = Math.floor(seconds / (24 * 3600));
    const h = Math.floor((seconds % (24 * 3600)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (d > 0) {
      return `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleBannerClick = () => {
    haptic.selection();
    if (is24hActive) {
      setCheckoutPlan('anual_pix');
    } else {
      setCheckoutPlan('anual');
    }
  };

  const userEmail = user?.email || '';
  const initialName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '';

  return (
    <>
      <div 
        className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 ${
          isDesktop ? 'pt-0 pb-3' : 'pt-[calc(0.6rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1.5'
        } ${className}`}
      >
        {is24hActive ? (
          /* ──────────────────────────────────────────────────────────
             ESTADO 1: PROMOÇÃO 24H (DOURADO / GOLD LUXO)
             Altura exata da barra de pesquisa: h-16 (64px) com rounded-2xl
             ────────────────────────────────────────────────────────── */
          <div
            onClick={handleBannerClick}
            role="button"
            tabIndex={0}
            aria-label="Sua promoção termina em breve. Aproveite o plano anual por R$ 149,90"
            className="group relative w-full flex items-center h-16 pl-3 sm:pl-4 pr-[114px] sm:pr-[134px] rounded-2xl border border-amber-400/50 bg-gradient-to-r from-[#221704]/95 via-[#382606]/95 to-[#221704]/95 backdrop-blur-md shadow-lg shadow-amber-950/30 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden select-none"
          >
            {/* Shimmer dourado suave acelerado por hardware */}
            <div 
              aria-hidden="true" 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" 
            />

            {/* Ícone / Badge Dourado à esquerda */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Crown className="w-5 h-5 sm:w-5 sm:h-5 text-amber-300 animate-pulse" strokeWidth={2.4} />
            </div>

            {/* Texto Central Dinâmico */}
            <div className="flex flex-col justify-center min-w-0 ml-2.5 sm:ml-3">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-white/95 truncate">
                <span>Sua promoção termina em</span>
                <span className="font-mono font-extrabold text-amber-300 tracking-wider text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">
                  {formatTime(promoSecondsLeft)}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-amber-200/90 truncate flex items-center gap-1.5 mt-0.5">
                <span>Plano Anual por apenas</span>
                <span className="font-extrabold text-white">R$ 149,90</span>
                <span className="hidden xs:inline-flex text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  PIX
                </span>
              </div>
            </div>

            {/* Botão de Ação à Direita (Idêntico ao botão PESQUISAR da barra de busca) */}
            <div 
              aria-hidden="true"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-12 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-display text-[12px] sm:text-[13px] font-extrabold tracking-wider flex items-center justify-center uppercase shadow-md shadow-amber-950/40 group-hover:brightness-110 active:scale-95 transition-all"
            >
              APROVEITAR
            </div>
          </div>
        ) : (
          /* ──────────────────────────────────────────────────────────
             ESTADO 2: TESTE GRATUITO 3 DIAS (VERMELHO URGÊNCIA)
             Altura exata da barra de pesquisa: h-16 (64px) com rounded-2xl
             ────────────────────────────────────────────────────────── */
          <div
            onClick={handleBannerClick}
            role="button"
            tabIndex={0}
            aria-label="Seu teste gratuito termina em breve. Assine agora."
            className="group relative w-full flex items-center h-16 pl-3 sm:pl-4 pr-[114px] sm:pr-[134px] rounded-2xl border border-rose-500/50 bg-gradient-to-r from-[#280509]/95 via-[#440911]/95 to-[#280509]/95 backdrop-blur-md shadow-lg shadow-red-950/30 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden select-none"
          >
            {/* Shimmer carmim acelerado por hardware */}
            <div 
              aria-hidden="true" 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" 
            />

            {/* Ícone / Badge Vermelho à esquerda */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500/25 to-red-500/10 border border-rose-400/40 flex items-center justify-center shrink-0 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
              <Clock className="w-5 h-5 sm:w-5 sm:h-5 text-rose-300 animate-pulse" strokeWidth={2.4} />
            </div>

            {/* Texto Central Dinâmico */}
            <div className="flex flex-col justify-center min-w-0 ml-2.5 sm:ml-3">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-white/95 truncate">
                <span>Seu teste grátis termina em</span>
                <span className="font-mono font-extrabold text-rose-300 tracking-wider text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(244,63,94,0.35)]">
                  {formatTime(trialSecondsLeft)}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-rose-200/90 truncate flex items-center gap-1 mt-0.5">
                <span>Garanta seu acesso completo sem interrupções</span>
              </div>
            </div>

            {/* Botão de Ação à Direita (Idêntico ao botão PESQUISAR da barra de busca) */}
            <div 
              aria-hidden="true"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-12 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 text-white font-display text-[12px] sm:text-[13px] font-extrabold tracking-wider flex items-center justify-center uppercase shadow-md shadow-red-950/40 group-hover:brightness-110 active:scale-95 transition-all"
            >
              ASSINAR
            </div>
          </div>
        )}
      </div>

      {/* Modal de Checkout Integrado com latência zero */}
      <CheckoutModal
        open={!!checkoutPlan}
        onOpenChange={(v) => {
          if (!v) setCheckoutPlan(null);
        }}
        plan={checkoutPlan}
        userEmail={userEmail}
        userName={initialName}
        onSuccess={() => {
          setCheckoutPlan(null);
          haptic.success();
          navigate('/');
        }}
      />
    </>
  );
});

export default PromoHeaderBanner;
