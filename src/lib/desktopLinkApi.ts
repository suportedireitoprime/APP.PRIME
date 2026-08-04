import { supabase } from '@/integrations/supabase/client';

/**
 * Chamadas da edge function `desktop-link` sempre no projeto atual.
 * (Antes a URL/anon key estavam fixas num projeto antigo, o que fazia o
 * celular enviar um token de sessão de outro projeto → "invalid_session".)
 */
export async function callDesktopLink<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('desktop-link', { body });
  if (error) {
    // Erros de negócio (401/404/409/410) vêm no corpo — repassa quando existir.
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        return (await ctx.json()) as T;
      } catch {
        /* ignore */
      }
    }
    return { error: error.message } as T;
  }
  return data as T;
}

const ERROS_PT: Record<string, string> = {
  invalid_session: 'Sua sessão no celular expirou. Saia e entre novamente no app.',
  missing_auth: 'Você precisa estar logado no app do celular.',
  token_not_found: 'Código não encontrado. Gere um novo QR-code no computador.',
  token_already_used: 'Este código já foi usado. Gere um novo no computador.',
  token_expired: 'Código expirado. Gere um novo QR-code no computador.',
  invalid_token: 'Código inválido. Gere um novo QR-code no computador.',
};

export function mensagemErroDesktopLink(codigo?: string | null): string {
  if (!codigo) return 'Tente novamente.';
  return ERROS_PT[codigo] ?? codigo;
}
