import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, PlayCircle, X } from 'lucide-react';

export default function StfLiveBanner() {
  const [liveSession, setLiveSession] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchLiveSession = async () => {
    const { data } = await supabase
      .from('stf_sessions')
      .select('id, title')
      .eq('status', 'live')
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLiveSession(data);
    } else {
      setLiveSession(null);
    }
  };

  useEffect(() => {
    fetchLiveSession();

    const channel = supabase
      .channel('stf_live_banner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stf_sessions' },
        (payload: any) => {
          // Re-fetch to ensure we have the correct live status
          fetchLiveSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Hide banner if user is already on the STF page
  if (location.pathname === '/ferramentas/stf') {
    return null;
  }

  return (
    <AnimatePresence>
      {liveSession && !dismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed top-safe z-50 left-0 right-0 p-2 md:p-4 pointer-events-none"
        >
          <div className="max-w-md mx-auto relative pointer-events-auto shadow-2xl">
            <div className="bg-card/90 backdrop-blur-md border border-red-500/30 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-gradient-x" />
              
              <div className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center relative">
                  <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75" />
                  <Scale className="w-5 h-5 text-red-500" />
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">STF Ao Vivo</span>
                  </div>
                  <h3 className="text-sm font-semibold truncate text-foreground">
                    {liveSession.title}
                  </h3>
                  <button 
                    onClick={() => navigate('/ferramentas/stf')}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full transition-colors w-max"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Assistir Sessão
                  </button>
                </div>
                
                <button 
                  onClick={() => setDismissed(true)}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
