import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StfMinistrosPanel({ selected, setSelected }: { selected: any; setSelected: (v: any) => void }) {
  const [ministros, setMinistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMinistros() {
      const { data } = await (supabase as any)
        .from('radar_stf_ministros')
        .select('*')
        .order('data_posse', { ascending: true }); // do mais antigo ao mais novo

      if (data) setMinistros(data);
      setLoading(false);
    }
    fetchMinistros();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ministros.map((min, idx) => (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={min.id}
            onClick={() => setSelected(min)}
            className="flex flex-col items-center bg-zinc-900/40 border border-white/5 rounded-2xl p-4 hover:bg-zinc-900 transition-colors text-left"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 border-2 border-white/10 shrink-0">
              <img src={min.foto_url} alt={min.nome} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="text-center w-full">
              <h3 className="text-sm font-semibold text-white tracking-widest uppercase mb-1 line-clamp-2">{min.nome}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Indicado por {min.indicacao}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setSelected(null)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                  <span className="text-2xl font-light">×</span>
                </button>
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <img src={selected.foto_url} alt={selected.nome} className="w-32 h-32 rounded-full border-4 border-primary/20 object-cover shadow-xl mb-4" />
                <h2 className="text-xl font-bold tracking-widest text-white uppercase">{selected.nome}</h2>
                <span className="text-sm text-primary uppercase tracking-widest mt-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  Posse: {new Date(selected.data_posse).toLocaleDateString('pt-BR')}
                </span>
                
                <div className="mt-8 text-left w-full">
                  <h4 className="text-xs text-white/40 tracking-[0.2em] mb-3 border-b border-white/5 pb-2">BIOGRAFIA</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selected.bio_resumo}
                  </p>
                </div>
                
                <div className="mt-6 text-left w-full">
                  <h4 className="text-xs text-white/40 tracking-[0.2em] mb-3 border-b border-white/5 pb-2">INDICAÇÃO</h4>
                  <p className="text-sm text-zinc-300">
                    Indicado(a) por <strong className="text-white">{selected.indicacao}</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
