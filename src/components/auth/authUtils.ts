import { toast } from 'sonner';

/** Traduz mensagens de erro comuns do Supabase Auth para PT-BR. */
export const traduzirErroAuth = (raw?: string): string => {
  const msg = (raw || '').toLowerCase();
  if (!msg) return 'Ocorreu um erro. Tente novamente.';
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials'))
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (msg.includes('user not found')) return 'Não encontramos uma conta com este e-mail.';
  if (msg.includes('user already registered') || msg.includes('already registered'))
    return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
  if (msg.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('weak password') || msg.includes('password is too weak'))
    return 'Senha muito fraca. Use letras, números e ao menos 6 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  if (msg.includes('token has expired') || msg.includes('otp expired'))
    return 'O código expirou. Solicite um novo.';
  if (msg.includes('invalid token') || msg.includes('invalid otp'))
    return 'Código inválido. Verifique e tente novamente.';
  if (msg.includes('network') || msg.includes('failed to fetch'))
    return 'Sem conexão. Verifique sua internet e tente novamente.';
  if (msg.includes('email') && msg.includes('invalid')) return 'E-mail inválido.';
  return raw || 'Ocorreu um erro. Tente novamente.';
};

export const toastErroAuth = (raw?: string) =>
  toast.error(traduzirErroAuth(raw), {
    position: 'top-center',
    duration: 5000,
    className:
      'rounded-2xl border border-red-400/30 bg-neutral-900/95 backdrop-blur-xl shadow-2xl text-white px-4 py-3 z-[9999]',
    style: { minWidth: '320px', maxWidth: '92vw' },
  });

export const LEGAL_TERMS = [
  "DOLO", "CULPA", "HABEAS CORPUS", "JURISPRUDÊNCIA", "VADE MECUM",
  "PETIÇÃO INICIAL", "LIMINAR", "AGRAVO", "RECURSO", "SÚMULA",
  "CONSTITUIÇÃO", "PROCESSO", "ACÓRDÃO", "EMBARGOS", "SENTENÇA",
  "MÉRITO", "TRÂNSITO EM JULGADO", "JURISDIÇÃO", "USUCAPIÃO", "CONTRATO",
  "DOLO EVENTUAL", "PRESCRIÇÃO", "DECADÊNCIA", "CITAÇÃO", "INTIMAÇÃO"
];
