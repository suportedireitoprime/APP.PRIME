import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { isAdminEmail } from '@/lib/adminEmails';
import { haptic } from '@/lib/nativeHaptics';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppUpdateStore } from '@/lib/appUpdateStore';

export function GlobalPromoFloatingCard() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading, isTrial, expiresAt } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados
  const [promoType, setPromoType] = useState<'24h' | 'trial' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showCard, setShowCard] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'mensal' | 'anual_pix' | 'anual' | null>(null);

  const isAdmin = isAdminEmail(user?.email);

  // Ocultar em rotas públicas (Landing page, auth, login, etc) e área administrativa
  const cleanPath = (location.pathname || '').replace(/\/+$/, '') || '/';
  const isHiddenRoute =
    cleanPath === '/' ||
    cleanPath === '/landing' ||
    cleanPath === '/inicio' ||
    cleanPath === '/login' ||
    cleanPath === '/auth' ||
    cleanPath === '/cadastro' ||
    cleanPath === '/recuperar-senha' ||
    cleanPath === '/onboarding' ||
    cleanPath === '/assinatura' ||
    cleanPath.startsWith('/assinatura/') ||
    cleanPath.startsWith('/admin');

  const getPromoKey = useCallback(() => {
    return user?.id ? `promo_24h_expires_${user.id}` : '';
  }, [user]);

  const getTrialKey = useCallback(() => {
    return user?.id ? `last_trial_promo_shown_${user.id}` : '';
  }, [user]);

  const incrementAppOpenCount = useCallback(() => {
    if (typeof window === 'undefined' || !user?.id) return 1;
    const key = `app_open_count_${user.id}`;
    let count = 1;
    try {
      if (!sessionStorage.getItem('session_counted')) {
        const stored = localStorage.getItem(key);
        count = stored ? parseInt(stored, 10) + 1 : 1;
        localStorage.setItem(key, String(count));
        sessionStorage.setItem('session_counted', '1');
      } else {
        const stored = localStorage.getItem(key);
        count = stored ? parseInt(stored, 10) : 1;
      }
    } catch {}
    return count;
  }, [user]);

  useEffect(() => {
    // Só decide quando o usuário está autenticado e o plano identificado
    if (authLoading || subLoading) return;
    if (!user || isHiddenRoute || isAdmin || (isPremium && !isTrial)) {
      setShowCard(false);
      return;
    }

    const count = incrementAppOpenCount();

    // Regra 1: Não mostra na primeira vez
    if (count < 2) return;

    let isEligibleFor24h = true;
    if (user?.created_at) {
      const createdAt = new Date(user.created_at).getTime();
      const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
      if (ageHours > 24) {
        isEligibleFor24h = false;
      }
    } else {
      isEligibleFor24h = false;
    }

    if (isEligibleFor24h) {
      // A partir da segunda vez, verificamos se a promo 24h já iniciou
      const promoKey = getPromoKey();
      if (!promoKey) return;
      let expiresAt = 0;
      try {
        const stored = localStorage.getItem(promoKey);
        if (stored) {
          expiresAt = parseInt(stored, 10);
        } else {
          // Se não iniciou, inicia agora (segundo acesso)
          expiresAt = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem(promoKey, String(expiresAt));
        }
      } catch {}

      const diffSeconds = Math.floor((expiresAt - Date.now()) / 1000);

      if (diffSeconds > 0) {
        // Promo 24h ativa
        setPromoType('24h');
        setTimeLeft(diffSeconds);
        setShowCard(true);
        return; // Retorna para não mostrar o trial
      }
    }

    // Se o usuário está em período de teste ativo (trial), exibe aviso a cada sessão
    if (isTrial) {
      const sessionKey = 'trial_promo_shown_this_session';
      if (!sessionStorage.getItem(sessionKey)) {
        setPromoType('trial');
        if (expiresAt) {
          const diffSeconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
          setTimeLeft(Math.max(0, diffSeconds));
        }
        setShowCard(true);
      }
    } else {
      setShowCard(false);
    }
  }, [authLoading, subLoading, user, isHiddenRoute, isAdmin, isPremium, isTrial, expiresAt, incrementAppOpenCount, getPromoKey]);

  // Atualizar timer da promo 24h
  useEffect(() => {
    if (promoType !== '24h' || !showCard) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 && promoType === '24h') {
          clearInterval(timer);
          setShowCard(false); // Esconde ao expirar apenas se for 24h
          return 0;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [promoType, showCard]);

  const handleClose = () => {
    haptic.light();
    setShowCard(false);
    
    // Se for trial, registra na sessão atual que já foi mostrado
    if (promoType === 'trial') {
      try {
        sessionStorage.setItem('trial_promo_shown_this_session', '1');
      } catch {}
    }
  };

  const handleAction = () => {
    haptic.selection();
    if (promoType === '24h') {
      setCheckoutPlan('anual_pix');
    } else {
      // Redirecionar para tela de planos ou abrir checkout genérico
      navigate('/assinatura');
      handleClose(); // Registra fechamento
    }
  };

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (promoType === 'trial') {
      if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const userEmail = user?.email || '';
  const initialName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '';

  return (
    <>
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
          setShowCard(false);
        }}
      />

      <AnimatePresence>
        {showCard && promoType && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[110]"
          >
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl shadow-black/80 flex flex-col p-4">
              
              {/* Background FX */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
              
              {/* Close Button */}
              <button 
                onClick={handleClose}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${promoType === '24h' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {promoType === '24h' ? <Sparkles className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-sm leading-tight">
                      {promoType === '24h' ? 'Oferta de Boas-Vindas' : 'Seu teste está acabando'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {promoType === '24h' 
                        ? 'Desconto exclusivo no plano vitalício. Aproveite antes que acabe!' 
                        : 'Você tem apenas alguns dias de acesso gratuito restante.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${promoType === '24h' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-mono tracking-wider">{formatTime(timeLeft)}</span>
                  </div>

                  <button 
                    onClick={handleAction}
                    className={`flex-1 rounded-xl py-2.5 px-3 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center ${
                      promoType === '24h' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    {promoType === 'trial' ? 'Assinar Agora' : 'Ver Planos'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
