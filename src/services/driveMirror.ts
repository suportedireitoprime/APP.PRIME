import { supabase } from '@/integrations/supabase/client';

export type CategoriaDrive = 'resumo' | 'mapa_mental' | 'infografico' | 'fluxograma' | 'diagrama' | 'outro';

export interface RespostaDrive {
  link: string;
  reutilizado?: boolean;
  fileId?: string;
  nome?: string;
}

/**
 * Consulta se o PDF já foi gerado e salvo no Google Drive anteriormente.
 * Se já existir, devolve o link imediatamente sem gastar processamento.
 * Se não existir, gera o base64, faz o upload no Google Drive e retorna o link público.
 */
export async function obterOuSalvarResumoNoDrive(opts: {
  titulo: string;
  gerarBase64: () => Promise<string>;
}): Promise<RespostaDrive | null> {
  try {
    const tituloLimpo = opts.titulo.trim();

    // 1. Verifica no Google Drive se já foi salvo anteriormente
    const { data: checkData } = await supabase.functions.invoke('drive-upload', {
      body: {
        categoria: 'resumo',
        titulo: tituloLimpo,
        checkOnly: true,
      },
    });

    if (checkData?.reutilizado && checkData?.link) {
      return {
        link: checkData.link,
        reutilizado: true,
        fileId: checkData.file_id,
        nome: checkData.nome,
      };
    }

    // 2. Não existe no Drive: gera o base64 do PDF e faz o upload
    const base64 = await opts.gerarBase64();
    if (!base64) return null;

    const { data: uploadData, error } = await supabase.functions.invoke('drive-upload', {
      body: {
        categoria: 'resumo',
        titulo: tituloLimpo,
        base64,
        mime: 'application/pdf',
      },
    });

    if (error) throw error;
    if (uploadData?.link) {
      return {
        link: uploadData.link,
        reutilizado: false,
        fileId: uploadData.file_id,
        nome: uploadData.nome,
      };
    }

    return null;
  } catch (err) {
    console.error('obterOuSalvarResumoNoDrive error:', err);
    return null;
  }
}

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
