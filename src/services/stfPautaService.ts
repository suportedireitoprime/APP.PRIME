import { supabase } from '@/integrations/supabase/client';

export interface STFPautaItem {
  id: string;
  titulo: string;
  relator: string;
  resumo: string;
  data: string;
  orgao: string;
}

export const stfPautaService = {
  async getPautaDoDia(): Promise<STFPautaItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('stf-pauta', {
        method: 'POST',
      });

      if (error) {
        console.error('Erro ao buscar pauta do STF via Edge Function:', error);
        throw error;
      }

      return data as STFPautaItem[];
    } catch (err) {
      console.error('Erro na requisição da pauta STF:', err);
      throw err;
    }
  }
};
