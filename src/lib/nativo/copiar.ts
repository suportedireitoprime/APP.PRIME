import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

/** Fallback legado via textarea + execCommand (funciona em qualquer contexto). */
function execCommandCopy(texto: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

/**
 * Copia texto para a área de transferência.
 * Nativo: @capacitor/clipboard. Web: navigator.clipboard com fallback legado.
 */
export async function copiar(texto: string, mensagem = 'Copiado'): Promise<boolean> {
  // 1. Capacitor nativo
  if (Capacitor.isNativePlatform()) {
    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write({ string: texto });
      if (mensagem) toast.success(mensagem);
      return true;
    } catch (e) {
      console.error('Falha Capacitor clipboard:', e);
    }
  }

  // 2. navigator.clipboard (pode falhar em HTTP, WebView, Sheet/Portal)
  try {
    await navigator.clipboard.writeText(texto);
    if (mensagem) toast.success(mensagem);
    return true;
  } catch { /* ignora e tenta fallback */ }

  // 3. execCommand (síncrono, funciona em qualquer contexto)
  if (execCommandCopy(texto)) {
    if (mensagem) toast.success(mensagem);
    return true;
  }

  toast.error('Não foi possível copiar');
  return false;
}

/** Copia sem mostrar toast de sucesso (para quem já mostra o próprio feedback). */
export const copiarTexto = (texto: string) => copiar(texto, '');
