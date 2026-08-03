/**
 * Proteção de tela — DESATIVADA.
 *
 * A captura de tela e a gravação estão liberadas em todo o app (necessário
 * para produzir as capturas exigidas pela Google Play e pela App Store).
 * As funções seguem exportadas como no-op para não quebrar quem as chama.
 */
import { useEffect } from 'react';

export async function protegerTela(_motivo: string): Promise<void> {
  /* captura de tela liberada */
}

export async function desprotegerTela(_motivo: string): Promise<void> {
  /* captura de tela liberada */
}

/** Hook mantido por compatibilidade — não aplica nenhuma restrição. */
export function useProtecaoTela(_motivo: string, _ativo = true): void {
  useEffect(() => {
    /* no-op */
  }, []);
}
