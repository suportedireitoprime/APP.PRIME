import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useProfileSummary } from './useProfileSummary';
import { supabase } from '@/integrations/supabase/client';

export function useTrialEndedNotice() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useProfileSummary();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || isLoading || !summary) return;
    
    // Se o usurio ainda for premium, ele nǜo perdeu o acesso. Nǜo mostra aviso.
    if (summary.isPremium) return;

    // Se jǭ viu o aviso antes (gravado no local storage)
    const lsKey = `horus_trial_ended_notice_seen_${user.id}`;
    if (localStorage.getItem(lsKey)) return;

    async function checkPastSubscriptions() {
      // Checa se o usuǭrio tem ou jǭ teve alguma assinatura registrada no banco
      const { data: play } = await supabase.from('play_subscriptions').select('id').eq('user_id', user!.id).limit(1);
      if (play && play.length > 0) {
        setShow(true);
        return;
      }
      const { data: asaas } = await supabase.from('asaas_subscriptions').select('id').eq('user_id', user!.id).limit(1);
      if (asaas && asaas.length > 0) {
        setShow(true);
      }
    }
    
    checkPastSubscriptions();
  }, [user, summary, isLoading]);

  const acknowledge = () => {
    if (user) {
      localStorage.setItem(`horus_trial_ended_notice_seen_${user.id}`, 'true');
    }
    setShow(false);
  };

  return { show, acknowledge };
}
