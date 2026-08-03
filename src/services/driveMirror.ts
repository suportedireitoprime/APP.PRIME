import { supabase } from '@/integrations/supabase/client';

export type CategoriaDrive = 'resumo' | 'mapa_mental' | 'infografico' | 'fluxograma' | 'diagrama' | 'outro';

/**
 * Espelha no Google Drive (pasta PDFs/<categoria>) um arquivo já gerado no app.
 * Nunca lança: o download local do usuário não pode depender do Drive.
 */
export async function espelharNoDrive(opts: {
  categoria: CategoriaDrive;
  titulo: string;
  base64: string;
  mime?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('drive-upload', {
      body: {
        categoria: opts.categoria,
        titulo: opts.titulo,
        base64: opts.base64,
        mime: opts.mime ?? 'application/pdf',
      },
    });
    if (error) throw error;
    return (data as any)?.link ?? null;
  } catch (e) {
    console.warn('espelharNoDrive falhou:', e);
    return null;
  }
}
