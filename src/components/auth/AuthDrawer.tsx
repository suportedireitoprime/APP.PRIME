import React, { useState, useEffect, startTransition } from 'react';
import { Capacitor } from '@capacitor/core';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalSheet } from '@/components/auth/LegalSheet';
import { track } from '@/lib/analyticsEvents';
import { toastErroAuth } from './authUtils';

export type AuthMode = 'login' | 'signup' | 'forgot' | null;

interface AuthDrawerProps {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onClose: () => void;
}

export const AuthDrawer: React.FC<AuthDrawerProps> = ({ mode, setMode, onClose }) => {
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
  }, [mode]);

  useEffect(() => {
    if (mode === 'signup' || mode === 'login') {
      import('@/pages/Onboarding').catch(() => {});
      import('@/components/onboarding/CadastroOnboardingOverlay').catch(() => {});
      import('@/components/onboarding/NotificacoesPermissaoStep').catch(() => {});
    }
  }, [mode]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      toastErroAuth(err.message || 'Não consegui entrar com o Google.');
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) throw error;
    } catch (err: any) {
      toastErroAuth(err.message || 'Não consegui entrar com a Apple.');
      setAppleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    track(`${mode}_attempted`, { email_domain: email.split('@')[1] ?? 'unknown' });
    try {
      if (mode === 'forgot') {
        if (!resetEmailSent) {
          const { error } = await resetPassword(email);
          if (error) throw error;
          track('password_reset_sent', { email_domain: email.split('@')[1] ?? 'unknown' });
          toast.success('Enviamos o código de recuperação para seu email.');
          setResetEmailSent(true);
        } else {
          if (!resetCode || !resetNewPassword) {
            toastErroAuth('Preencha o código e a nova senha.');
            setSubmitting(false);
            return;
          }
          if (resetNewPassword.length < 6) {
            toastErroAuth('A nova senha deve ter pelo menos 6 caracteres.');
            setSubmitting(false);
            return;
          }
          const { error: otpError } = await verifyOtp(email, resetCode.trim(), 'recovery');
          if (otpError) throw otpError;
          const { error: updateError } = await updatePassword(resetNewPassword);
          if (updateError) throw updateError;
          toast.success('Senha atualizada com sucesso! Entrando...');
          track('password_reset_success', { email_domain: email.split('@')[1] ?? 'unknown' });
          let sessao = null as Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
          for (let i = 0; i < 6 && !sessao; i++) {
            const { data: sess } = await supabase.auth.getSession();
            sessao = sess.session;
            if (!sessao) await new Promise((r) => setTimeout(r, 250));
          }
          if (sessao) {
            startTransition(() => {
              navigateForm('/', { replace: true });
            });
          }
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        track('login_success', { method: 'email' });
      } else {
        if (password !== confirmPassword) {
          toastErroAuth('As senhas não coincidem.');
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        track('signup_success', { method: 'email', has_display_name: Boolean(displayName) });
        try {
          (await import('@/lib/analytics')).grantConsent();
        } catch {}
        toast.success('Conta criada! Verifique seu email para confirmar.');
        let sessao = null as Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
        for (let i = 0; i < 6 && !sessao; i++) {
          const { data: sess } = await supabase.auth.getSession();
          sessao = sess.session;
          if (!sessao) await new Promise((r) => setTimeout(r, 250));
        }
        if (sessao) {
          startTransition(() => {
            navigateForm('/onboarding', { replace: true });
          });
        }
      }
    } catch (err: any) {
      track(`${mode}_failed`, { erro: err.message ?? 'unknown' });
      toastErroAuth(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full pl-5 pr-14 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-base font-body text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all';

  if (!mode) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
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
                {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Recuperar Senha'}
              </h2>
              <p className="text-sm font-body text-white/60 mt-1">
                {mode === 'login' && 'Bem-vindo de volta.'}
                {mode === 'signup' && 'Comece sua jornada jurídica.'}
                {mode === 'forgot' && 'Não se preocupe, vamos recuperar.'}
              </p>
            </div>
            {showEmailForm && mode !== 'forgot' && (
              <button
                onClick={() => setShowEmailForm(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!showEmailForm && mode !== 'forgot' ? (
              <motion.div
                key="social-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {(() => {
                  const googleBtn = (
                    <button
                      key="google"
                      type="button"
                      onClick={handleGoogle}
                      disabled={googleLoading}
                      className={`relative overflow-hidden w-full py-4 rounded-2xl font-body font-semibold text-base flex items-center justify-center transition-colors ${
                        googleLoading
                          ? 'bg-neutral-200 text-neutral-400'
                          : 'bg-white text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      {googleLoading && (
                        <motion.div
                          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className={googleLoading ? 'opacity-50 grayscale' : ''}
                        >
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                          />
                        </svg>
                        Continuar com Google
                      </span>
                    </button>
                  );
                  const appleBtn = (
                    <button
                      key="apple"
                      type="button"
                      onClick={handleApple}
                      disabled={appleLoading}
                      className={`relative overflow-hidden w-full py-4 rounded-2xl font-body font-semibold text-base flex items-center justify-center transition-colors ${
                        appleLoading
                          ? 'bg-neutral-200 text-neutral-400'
                          : 'bg-white text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      {appleLoading && (
                        <motion.div
                          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          className={appleLoading ? 'opacity-50' : ''}
                        >
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.92 15.35 3.71 7.56 9.6 7.23c1.27.07 2.17.74 2.92.8 1.17-.24 2.29-.93 3.57-.84 1.36.1 2.36.66 3.05 1.68-2.76 1.68-2.29 5.98.22 7.13-.57 1.5-1.31 2.99-2.31 4.28zm-5.85-15.1c.07-2.04 1.76-3.79 3.74-3.95.29 2.32-1.93 4.48-3.74 3.95z" />
                        </svg>
                        Continuar com Apple
                      </span>
                    </button>
                  );
                  const isIOS = Capacitor.getPlatform() === 'ios';
                  return isIOS ? [appleBtn, googleBtn] : [googleBtn, appleBtn];
                })()}

                <div className="relative py-3 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs font-body font-medium text-white/40">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-body font-semibold text-base flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-5 h-5 opacity-70" />
                  Usar E-mail
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
                className="space-y-4"
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

                {mode === 'signup' && (
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Nome de exibição"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputCls}
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name={mode === 'signup' ? 'new-password' : 'current-password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
                )}

                {mode === 'signup' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={inputCls}
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' && 'Acessar'}
                        {mode === 'signup' && 'Criar Conta'}
                        {mode === 'forgot' && 'Enviar link de recuperação'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {resetEmailSent && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Redefinir Senha
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {mode === 'signup' && (
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
                )}

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setResetEmailSent(false);
                    }}
                    className="w-full text-center text-sm font-body text-white/60 hover:text-white mt-2 transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                )}

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setResetEmailSent(false);
                    }}
                    className="w-full text-center text-sm font-body text-white/60 hover:text-white mt-2 transition-colors"
                  >
                    {resetEmailSent ? 'Entendi, voltar ao login' : 'Voltar ao login'}
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <LegalSheet
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
        kind={legalOpen ?? 'privacidade'}
      />
    </>
  );
};
