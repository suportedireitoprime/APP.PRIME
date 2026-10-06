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
  const [isTrialEnded, setIsTrialEnded] = useState<boolean>(false);

  // A promoção de 24h foi desativada, mantemos a função retornando 0 para compatibilidade
  const getPromoExpiresAt = useCallback(() => {
    return 0;
  }, []);

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
        if (diffTrial > 0) {
          setTrialSecondsLeft(diffTrial);
          setIsTrialEnded(false);
        } else {
          setTrialSecondsLeft(0);
          setIsTrialEnded(true);
        }
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
          isDesktop ? 'pt-0 pb-3' : 'pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1.5'
        } ${className}`}
      >
        {isTrialEnded ? (
          /* ──────────────────────────────────────────────────────────
             ESTADO 3: TESTE EXPIRADO (VERMELHO SÓLIDO)
             ────────────────────────────────────────────────────────── */
          <div
            onClick={handleBannerClick}
            role="button"
            tabIndex={0}
            aria-label="Seu teste gratuito expirou. Assine agora."
            className="group relative w-full flex items-center h-16 pl-3 sm:pl-4 pr-[114px] sm:pr-[134px] rounded-2xl border border-rose-500/50 bg-gradient-to-r from-[#280509]/95 via-[#440911]/95 to-[#280509]/95 backdrop-blur-md shadow-lg shadow-red-950/30 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden select-none"
          >
            {/* Shimmer carmim acelerado por hardware */}
            <div 
              aria-hidden="true" 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" 
            />

            {/* Ícone / Badge Vermelho à esquerda */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500/25 to-red-500/10 border border-rose-400/40 flex items-center justify-center shrink-0 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
              <Clock className="w-5 h-5 sm:w-5 sm:h-5 text-rose-300" strokeWidth={2.4} />
            </div>

            {/* Texto Central Dinâmico */}
            <div className="flex flex-col justify-center min-w-0 ml-2.5 sm:ml-3">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-white/95 truncate">
                <span>Seu teste grátis terminou</span>
              </div>
              <div className="text-[11px] sm:text-xs text-rose-200/90 truncate flex items-center gap-1 mt-0.5">
                <span>Toque para reativar seu acesso</span>
              </div>
            </div>

            {/* Botão de Ação à Direita */}
            <div 
              aria-hidden="true"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-12 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 text-white font-display text-[12px] sm:text-[13px] font-extrabold tracking-wider flex items-center justify-center uppercase shadow-md shadow-red-950/40 group-hover:brightness-110 active:scale-95 transition-all"
            >
              ASSINAR
            </div>
          </div>
        ) : !is24hActive && !isTrialEnded ? (
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
        ) : null}
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

