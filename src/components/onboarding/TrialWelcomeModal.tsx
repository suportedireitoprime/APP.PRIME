import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onDone: () => void;
}

export default function TrialWelcomeModal({ onDone }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    if (!user) {
      onDone();
      return;
    }
    setLoading(true);
    try {
      // 3 days from now
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.auth.updateUser({
        data: { trial_ends_at: trialEndsAt }
      });
      if (error) {
        console.error('Failed to update trial_ends_at:', error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-amber-500" />
        
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="font-display text-2xl font-black text-foreground leading-tight">
            Seu presente de boas-vindas chegou.
          </h2>
          
          <p className="font-body text-sm text-muted-foreground leading-relaxed px-2">
            Desbloqueamos o <b className="text-foreground">Direito Prime PRO</b> para você experimentar tudo sem limitações.
          </p>

          <div className="w-full space-y-3 pt-3">
            {[
              'IA Jurídica Ilimitada',
              'Vade Mecum Narrado e Comentado',
              'Acesso Desktop e Web Sincronizados',
              'Biblioteca Premium e Radar Legislativo'
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                </div>
                <span className="font-body text-[13px] font-semibold text-foreground/90">{text}</span>
              </div>
            ))}
          </div>

          <div className="w-full pt-6">
            <Button
              onClick={startTrial}
              disabled={loading}
              className="w-full h-14 rounded-2xl font-display text-lg font-bold bg-primary text-primary-foreground shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 btn-attention-shine"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Iniciar 3 dias gratuitos
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <p className="font-body text-[11px] text-muted-foreground mt-3 uppercase tracking-wider font-semibold">
              Sem cartão de crédito · Sem compromisso
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
