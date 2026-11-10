import React, { useState, useEffect, useMemo, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Lock, ArrowRight, Flame } from 'lucide-react';
import { useSubscription, calcTrial } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';

export const TrialCountdownBar = memo(function TrialCountdownBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sub = useSubscription();

  // Se já for assinante pago (Asaas, Play, Apple) ou admin, a barra NUNCA aparece
  const isPaidSubscriber =
    sub.isAdminOverride ||
    (sub.isPremium && !sub.isTrial && (sub.source === 'asaas' || sub.source === 'play' || sub.source === 'apple'));

  // Não exibe na tela de auth, landing ou checkout direto
  const isHiddenRoute =
    location.pathname === '/auth' ||
    location.pathname === '/landing' ||
    location.pathname === '/assinatura';

  // Cálculo de tempo restante
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trialInfo = useMemo(() => {
    return calcTrial(user?.created_at || sub.startedAt);
  }, [user?.created_at, sub.startedAt]);

  const remainingMs = useMemo(() => {
    if (!trialInfo.trialExpiresAt) return 0;
    const expiresTime = new Date(trialInfo.trialExpiresAt).getTime();
    return Math.max(0, expiresTime - now);
  }, [trialInfo.trialExpiresAt, now]);

  const inTrial = remainingMs > 0;
  const isExpired = !inTrial && (trialInfo.trialExpired || sub.isTrialExpired);
  const isLast6Hours = inTrial && remainingMs <= 6 * 60 * 60 * 1000;

  // Formatação do tempo restante (dias, horas, minutos, segundos)
  const formattedTime = useMemo(() => {
    const totalSec = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }, [remainingMs]);

  // Verifica se a rota atual possui barra inferior (BottomNav) — Hook SEMPRE no topo para evitar erro #310
  const isBottomNavRoute = (p: string) => {
    const prefixes = ['/', '/biblioteca', '/radar', '/flashcards', '/ferramentas/dicionario', '/videoaulas', '/questoes', '/resumos-juridicos', '/lei-seca'];
    return prefixes.some(r => p === r || (r !== '/' && p.startsWith(r)));
  };

  const [hasBottomNav, setHasBottomNav] = useState(() => isBottomNavRoute(location.pathname));

  useEffect(() => {
    if (isPaidSubscriber || isHiddenRoute) return;
    const checkNav = () => {
      const navEl = document.querySelector('nav.fixed.bottom-0, [data-bottom-nav], footer.fixed.bottom-0');
      const isVisible = !!navEl && window.getComputedStyle(navEl).display !== 'none' && !navEl.classList.contains('opacity-0');
      setHasBottomNav(isBottomNavRoute(location.pathname) || isVisible);
    };
    checkNav();
    const t = setTimeout(checkNav, 150);
    return () => clearTimeout(t);
  }, [location.pathname, isPaidSubscriber, isHiddenRoute]);

  const handleClick = () => {
    haptic.selection();
    navigate('/assinatura');
  };

  // Retorno condicional posicionado APÓS todos os hooks do componente
  if (isPaidSubscriber || isHiddenRoute) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes sheen-7s {
          0%, 72% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          75% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(450%) skewX(-25deg);
            opacity: 0;
          }
        }
      `}</style>

      <div
        data-allow-trial-click="true"
        className={`fixed left-0 right-0 z-40 px-3 transition-all duration-300 pointer-events-none ${
          hasBottomNav
            ? 'bottom-[calc(76px+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:bottom-4'
            : 'bottom-[calc(0.6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:bottom-4'
        }`}
      >
        <div className="max-w-xl mx-auto w-full pointer-events-auto">
          <button
            type="button"
            data-allow-trial-click="true"
            onClick={handleClick}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#B45309] via-[#F59E0B] to-[#D97706] p-[1.5px] shadow-[0_6px_25px_rgba(245,158,11,0.45)] active:scale-[0.985] transition-transform cursor-pointer"
            aria-label={inTrial ? `Degustação gratuita: ${formattedTime} restantes` : 'Teste gratuito de 3 dias expirado'}
          >
            {/* Feixe reflexivo dourado que passa a cada 7 segundos */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{
                animation: 'sheen-7s 7s infinite ease-in-out',
                willChange: 'transform, opacity',
              }}
            />

            <div className="relative flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[14.5px] bg-[#0F0D07]/90 backdrop-blur-md">
              {/* Lado esquerdo: Ícone + Textos de Status */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-900/40 border border-amber-300/40">
                  {inTrial ? (
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 fill-slate-950" />
                  ) : (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                  )}
                </div>

                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-black text-[12px] sm:text-[13px] uppercase tracking-wider text-amber-300 leading-tight">
                      {isLast6Hours
                        ? '⚡ Últimas 6h de Teste VIP'
                        : inTrial
                          ? 'Degustação Premium'
                          : 'Teste de 3 Dias Encerrado'}
                    </span>
                    {inTrial && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                        isLast6Hours
                          ? 'bg-rose-500/25 text-amber-200 border border-amber-400/50 shadow-sm animate-pulse'
                          : 'bg-amber-500/20 text-amber-200 border border-amber-400/30 text-amber-200'
                      }`}>
                        {isLast6Hours ? <Flame className="w-2.5 h-2.5 text-amber-300 animate-bounce" /> : <Sparkles className="w-2.5 h-2.5 text-amber-300" />}
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-[11px] sm:text-[12px] text-zinc-300 truncate mt-0.5">
                    {isLast6Hours
                      ? 'Vitalício R$ 149,90 ou Anual R$ 89,90 com 62% OFF'
                      : inTrial
                        ? 'Acesso total liberado · Garanta até 62% OFF'
                        : 'Assine a partir de R$ 19,90/mês para continuar'}
                  </p>
                </div>
              </div>

              {/* Lado direito: Botão de Ação */}
              <div className="shrink-0 flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 px-2.5 py-1.5 sm:px-3 sm:py-1.5 font-display font-black text-[11px] sm:text-[12px] uppercase tracking-wide shadow-sm group-hover:scale-105 transition-transform">
                <span>{isLast6Hours ? 'Garantir' : inTrial ? 'Assinar' : 'Liberar'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
});
