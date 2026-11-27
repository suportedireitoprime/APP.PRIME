import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { toastErroAuth } from './authUtils';
import { track } from '@/lib/analyticsEvents';

type Mode = 'login' | 'signup' | 'forgot';

const DesktopEmailLogin: React.FC = () => {
  const { signIn, signUp, resetPassword, verifyOtp, updatePassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setResetEmailSent(false);
    setResetCode('');
    setResetNewPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail) {
      toastErroAuth('Informe seu e-mail.');
      return;
    }

    if (mode === 'signup' && (!cleanName || !password)) {
      toastErroAuth('Preencha nome, e-mail e senha.');
      return;
    }

    if (mode === 'login' && !password) {
      toastErroAuth('Informe sua senha.');
      return;
    }

    setSubmitting(true);
    track(`${mode}_attempted`, { email_domain: cleanEmail.split('@')[1] ?? 'unknown', platform: 'desktop' });

    try {
      if (mode === 'login') {
        const { error } = await signIn(cleanEmail, password);
        if (error) throw error;
        track('login_success', { method: 'email', platform: 'desktop' });
      } else if (mode === 'signup') {
        const { error } = await signUp(cleanEmail, password, cleanName);
        if (error) throw error;
        track('signup_success', { method: 'email', platform: 'desktop' });
        toast.success('Conta criada! Verifique seu e-mail se necessário.');
      } else if (mode === 'forgot') {
        if (!resetEmailSent) {
          const { error } = await resetPassword(cleanEmail);
          if (error) throw error;
          toast.success('Código de recuperação enviado para seu e-mail.');
          setResetEmailSent(true);
        } else {
          const cleanCode = resetCode.trim().replace(/[\s-]/g, '');
          if (cleanCode.length < 6 || resetNewPassword.length < 6) {
            toastErroAuth('Informe o código recebido e uma senha de ao menos 6 caracteres.');
            return;
          }
          const { error: otpErr } = await verifyOtp(cleanEmail, cleanCode, 'recovery');
          if (otpErr) throw otpErr;
          const { error: updErr } = await updatePassword(resetNewPassword);
          if (updErr) throw updErr;
          toast.success('Senha atualizada com sucesso! Entrando...');
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'unknown';
      if (msg.toLowerCase().includes('already registered')) {
        toast.error('Este e-mail já possui conta. Faça login.');
        switchMode('login');
      } else {
        toastErroAuth(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/25 transition-all';

  return (
    <div className="w-full space-y-5 text-left">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">
          {mode === 'login' && 'Entrar com e-mail'}
          {mode === 'signup' && 'Criar conta'}
          {mode === 'forgot' && 'Recuperar senha'}
        </h2>
        <p className="text-xs text-zinc-400">
          {mode === 'login' && 'Acesse sua conta do Direito Prime no computador.'}
          {mode === 'signup' && 'Comece seus estudos jurídicos gratuitamente.'}
          {mode === 'forgot' &&
            (resetEmailSent
              ? 'Digite o código enviado para seu e-mail e defina uma nova senha.'
              : 'Enviaremos um código de verificação para o seu e-mail.')}
        </p>
      </div>

      {/* Alternância rápida Entrar / Criar conta */}
      {mode !== 'forgot' && (
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/10">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Criar conta
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className={inputClass}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>

        {mode !== 'forgot' && (
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Crie uma senha (mín. 6 caracteres)' : 'Sua senha'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        {mode === 'forgot' && resetEmailSent && (
          <>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Código recebido por e-mail"
              inputMode="numeric"
              className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary/70"
            />
            <input
              type="password"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              autoComplete="new-password"
              className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary/70"
            />
          </>
        )}

        {mode === 'login' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>
                {mode === 'login' && 'Entrar'}
                {mode === 'signup' && 'Criar conta'}
                {mode === 'forgot' && (resetEmailSent ? 'Redefinir senha' : 'Enviar código')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="w-full py-2 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para entrar</span>
          </button>
        )}
      </form>
    </div>
  );
};

export default DesktopEmailLogin;
