import { supabase } from '@/integrations/supabase/client';

export interface STFPautaItem {
  id: string;
  modalidade: string;
  data_sessao: string;
  orgao_julgador: string;
  processo: string;
  relator: string;
  partes: string;
  tema_repercussao: string;
  resumo: string;
  status: string;
}

export const stfPautaService = {
  async getPautasSTF(): Promise<STFPautaItem[]> {
    try {
      const { data, error } = await supabase
        .from('stf_pautas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pautas do STF do banco:', error);
        throw error;
      }

      return (data || []) as STFPautaItem[];
    } catch (err) {
      console.error('Erro na requisição da pauta STF:', err);
      throw err;
    }
  }
};

