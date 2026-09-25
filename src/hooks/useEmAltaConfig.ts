import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EmAltaConfig = string[]; // Array of IDs

export const useEmAltaConfig = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['em-alta-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('em_alta_config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching em alta config:', error);
        return null;
      }

      return (data?.em_alta_config as EmAltaConfig) || null;
    },
  });

  const { mutate: updateConfig, isPending: isUpdating } = useMutation({
    mutationFn: async (newConfig: EmAltaConfig) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          em_alta_config: newConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return newConfig;
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['em-alta-config'], newConfig);
      toast.success('Configurações salvas!');
    },
    onError: (err) => {
      console.error('Update config error:', err);
      toast.error('Erro ao salvar configurações.');
    }
  });

  return { config, isLoading, updateConfig, isUpdating };
};
