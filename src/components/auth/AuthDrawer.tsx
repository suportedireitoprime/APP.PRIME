import React, { useState, useEffect, startTransition } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalSheet } from '@/components/auth/LegalSheet';
import { track } from '@/lib/analyticsEvents';
import { toastErroAuth } from './authUtils';
import { SocialButtons } from './SocialButtons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

export type AuthMode = 'login' | 'signup' | 'forgot' | null;

interface AuthDrawerProps {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onClose: () => void;
}

export const AuthDrawer: React.FC<AuthDrawerProps> = ({ mode, setMode, onClose }) => {
  useBodyScrollLock(mode !== null, 'auth-drawer');
  
  const {
    signIn,
    signUp,
    resetPassword,
    verifyOtp,
    updatePassword,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();
  const navigateForm = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | 'privacidade' | 'termos'>(null);

  useEffect(() => {
    if (mode === 'login') document.title = 'Entrar na sua Conta | Direito Prime';
    else if (mode === 'signup') document.title = 'Criar Nova Conta | Direito Prime';
    else if (mode === 'forgot') document.title = 'Recuperar Senha | Direito Prime';

    if (mode === 'forgot') setShowEmailForm(true);
    if (mode === 'signup') setShowEmailForm(false);
  }, [mode]);

  useEffect(() => {
    if (mode === 'signup' || mode === 'login') {
      import('@/pages/Onboarding').catch(() => {});
      import('@/components/onboarding/CadastroOnboardingOverlay').catch(() => {});
      import('@/components/onboarding/NotificacoesPermissaoStep').catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    // Reset de loading infinito caso o usuário retorne ao app/janela e a sessão ainda não esteja pronta
    const resetLoaders = () => {
      setGoogleLoading(false);
      setAppleLoading(false);
    };

    window.addEventListener('focus', resetLoaders);
    let appListener: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) resetLoaders();
      }).then(l => appListener = l);
    }

    return () => {
      window.removeEventListener('focus', resetLoaders);
      if (appListener) {
        appListener.remove();
      }
    };
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.toLowerCase().includes('cancel') || (err as {code?: string})?.code === 'ERR_CANCELED') {
        setGoogleLoading(false);
        return;
      }
      toastErroAuth(msg || 'Não consegui entrar com o Google.');
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) throw error;
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.toLowerCase().includes('cancel') || (err as {code?: string})?.code === 'ERR_CANCELED') {
        setAppleLoading(false);
        return;
      }
      toastErroAuth(msg || 'Não consegui entrar com a Apple.');
      setAppleLoading(false);
    }
  };

  const passwordStrength = React.useMemo(() => {
    if (!password) {
      return { score: 0, label: '', color: 'bg-white/10', hasLetter: false, hasNumber: false, hasMinLength: false };
    }
    const hasMinLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const isEight = password.length >= 8;

    let score = 0;
    if (hasMinLength) score++;
    if (hasLetter && hasNumber) score++;
    if (isEight && (hasSpecial || password.length >= 10)) score++;

    let label = 'Fraca';
    let color = 'bg-red-500';
    if (score === 2) {
      label = 'Média';
      color = 'bg-amber-500';
    } else if (score >= 3) {
      label = 'Forte';
      color = 'bg-emerald-500';
    }

    return { score, label, color, hasLetter, hasNumber, hasMinLength };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || googleLoading || appleLoading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (mode === 'signup' && (!cleanEmail || !password || !displayName)) {
      toastErroAuth('Preencha e-mail, senha e seu nome.');
      return;
    }

    setSubmitting(true);
    track(`${mode}_attempted`, { email_domain: cleanEmail.split('@')[1] ?? 'unknown' });
    try {
      if (mode === 'forgot') {
        if (!resetEmailSent) {
          const { error } = await resetPassword(cleanEmail);
          if (error) throw error;
          track('password_reset_sent', { email_domain: cleanEmail.split('@')[1] ?? 'unknown' });
          toast.success('Enviamos o código de recuperação para seu email.');
          setResetEmailSent(true);
        } else {
          if (!resetCode || !resetNewPassword) {
            toastErroAuth('Preencha o código e a nova senha.');
            return;
          }
          if (resetNewPassword.length < 6) {
            toastErroAuth('A nova senha deve ter pelo menos 6 caracteres.');
            return;
          }
          const { error: otpError } = await verifyOtp(cleanEmail, resetCode.trim(), 'recovery');
          if (otpError) throw otpError;
          const { error: updateError } = await updatePassword(resetNewPassword);
          if (updateError) throw updateError;
          toast.success('Senha atualizada com sucesso! Entrando...');
          track('password_reset_success', { email_domain: cleanEmail.split('@')[1] ?? 'unknown' });
        }
      } else if (mode === 'login') {
        const { error } = await signIn(cleanEmail, password);
        if (error) throw error;
        track('login_success', { method: 'email' });
      } else if (mode === 'signup') {
        const { error } = await signUp(cleanEmail, password, cleanDisplayName);
        if (error) throw error;
        track('signup_success', { method: 'email' });
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error).message ?? 'unknown';
      if (errorMsg.toLowerCase().includes('already registered')) {
        toast.error('Essa conta já tem cadastro. Faça login.');
        setMode('login');
      } else {
        track(`${mode}_failed`, { erro: errorMsg });
        toastErroAuth(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full pl-5 pr-14 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-base font-body text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all';

  return (
    <>
      <AnimatePresence>
      {mode && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.15, duration: 0.25 } }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {mode && (
        <motion.div
          key="drawer"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed left-0 right-0 z-50 bg-[#0d0f12] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300 ${
            showEmailForm || googleLoading || appleLoading
              ? 'top-0 bottom-0 rounded-none max-h-screen'
              : 'bottom-0 rounded-t-[32px] max-h-[90vh]'
          }`}
        >
          {/* Handle bar */}
          <div
            className={`w-full pb-2 flex justify-center shrink-0 cursor-grab active:cursor-grabbing transition-all ${
              showEmailForm || googleLoading || appleLoading
                ? 'pt-[calc(var(--sai-top,0px)+1.5rem)]'
                : 'pt-4'
            }`}
            onClick={onClose}
          >
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        <div className="px-6 flex-1 pb-[calc(var(--sai-bottom,0px)+2rem)] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {mode === 'login'
                  ? showEmailForm
                    ? 'Entrar com E-mail'
                    : 'Entrar'
                  : mode === 'signup'
                  ? 'Criar Conta'
                  : 'Recuperar Senha'}
              </h2>
              <p className="text-sm font-body text-white/60 mt-1">
                {mode === 'login' && !showEmailForm && 'Bem-vindo de volta.'}
                {mode === 'login' && showEmailForm && 'Acesse com seu e-mail e senha.'}
                {mode === 'signup' && 'Cadastre-se rapidamente com Google ou Apple.'}
                {mode === 'forgot' && 'Não se preocupe, vamos recuperar.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
              aria-label="Fechar"
            >
              <ArrowLeft className="w-5 h-5 hidden" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'signup' ? (
              <motion.div
                key="signup-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <SocialButtons 
                  onGoogle={handleGoogle} 
                  onApple={handleApple} 
                  googleLoading={googleLoading} 
                  appleLoading={appleLoading}
                  mode="signup"
                />

                <div className="flex flex-col items-center text-center mt-6 pt-4 pb-2">
                  <div className="relative h-[60px] mb-2">
                    <img
                      src={primeLogo}
                      alt="Direito Prime"
                      loading="eager"
                      decoding="async"
                      className="w-auto h-[60px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                    />
                  </div>
                  <h1 className="font-serif italic text-white text-[18px] sm:text-[20px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    Estudos Jurídicos
                  </h1>
                  <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
                    USO PROFISSIONAL
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed font-body text-white/50 text-center px-2 mt-4">
                  Ao criar sua conta, você concorda com os{' '}
                  <button
                    type="button"
                    onClick={() => setLegalOpen('termos')}
                    className="text-white font-medium underline hover:text-primary transition-colors"
                  >
                    Termos de Uso
                  </button>{' '}
                  e com a{' '}
                  <button
                    type="button"
                    onClick={() => setLegalOpen('privacidade')}
                    className="text-white font-medium underline hover:text-primary transition-colors"
                  >
                    Política de Privacidade
                  </button>
                  .
                </p>
              </motion.div>
            ) : !showEmailForm && mode !== 'forgot' ? (
              <motion.div
                key="social-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <SocialButtons 
                  onGoogle={handleGoogle} 
                  onApple={handleApple} 
                  googleLoading={googleLoading} 
                  appleLoading={appleLoading}
                  mode="login"
                />
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                    <span className="bg-[#0d0f12] px-3 text-white/40">ou continue com email</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-4 rounded-2xl font-body font-semibold text-base bg-white/5 border border-white/10 text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-5 h-5 text-white/70" />
                  Entrar com e-mail e senha
                </button>


              </motion.div>
            ) : (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className={`space-y-4 ${submitting ? 'pointer-events-none opacity-85' : ''}`}
              >
                {mode === 'forgot' && (
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                      {resetEmailSent ? (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      ) : (
                        <KeyRound className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-body text-muted-foreground mt-1">
                      {resetEmailSent
                        ? `Abra o link enviado para ${email} para criar uma nova senha.`
                        : 'Informe seu email para receber o link de redefinição'}
                    </p>
                  </div>
                )}

                {(mode !== 'forgot' || !resetEmailSent) && (
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputCls}
                      autoFocus
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="current-password"
                        autoComplete="current-password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'forgot' && resetEmailSent && (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        name="code"
                        placeholder="Código de 6 dígitos"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                        className={inputCls}
                        maxLength={6}
                      />
                      <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="new-password"
                        placeholder="Nova senha (mín. 6 caracteres)"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                )}

                {!resetEmailSent && (
                  <button
                    type="submit"
                    disabled={submitting || googleLoading || appleLoading}
                    className="relative w-full py-4 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-80 disabled:pointer-events-none mt-2 cursor-pointer overflow-hidden"
                  >
                    {submitting ? (
                      <>
                        <span className="opacity-90">
                          {mode === 'login' ? 'Acessando...' : 'Enviando...'}
                        </span>
                        {/* Shimmer / Reflexo Animado */}
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </>
                    ) : (
                      <>
                        {mode === 'login' && 'Acessar'}
                        {mode === 'forgot' && 'Enviar link de recuperação'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {resetEmailSent && (
                  <button
                    type="submit"
                    disabled={submitting || googleLoading || appleLoading}
                    className="relative w-full py-4 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-80 disabled:pointer-events-none mt-2 cursor-pointer overflow-hidden"
                  >
                    {submitting ? (
                      <>
                        <span className="opacity-90">Acessando...</span>
                        {/* Shimmer / Reflexo Animado */}
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </>
                    ) : (
                      <>
                        Entrar com a nova senha
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {mode === 'login' && (
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setResetEmailSent(false);
                      }}
                      className="w-full text-center text-sm font-body text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      Esqueceu sua senha?
                    </button>


                  </div>
                )}

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setResetEmailSent(false);
                    }}
                    className="w-full text-center text-sm font-body text-white/60 hover:text-white mt-2 transition-colors cursor-pointer"
                  >
                    {resetEmailSent ? 'Entendi, voltar ao login' : 'Voltar ao login'}
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      )}
      </AnimatePresence>

      <LegalSheet
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
        kind={legalOpen ?? 'privacidade'}
      />
    </>
  );
};
