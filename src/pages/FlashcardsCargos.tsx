import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { Briefcase, Building, ChevronRight, Scale, Search, Shield, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Cargo = {
  id: string;
  cargo: string;
  orgao: string;
  banca: string | null;
  descricao_geral: string | null;
  edital_disciplinas: any;
};

export default function FlashcardsCargos() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCargos() {
      try {
        const { data, error } = await supabase
          .from('flashcards_cargos')
          .select('*')
          .order('cargo');
        
        if (error) throw error;
        setCargos(data || []);
      } catch (err) {
        console.error('Erro ao carregar cargos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCargos();
  }, []);

  const filtered = cargos.filter(c => 
    c.cargo.toLowerCase().includes(busca.toLowerCase()) || 
    c.orgao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader title="Cargos e Editais" onBack={() => navigate('/flashcards')} />
        
        <div className="pt-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cargo ou órgão..."
              className="pl-12 h-14 rounded-2xl bg-card border-border/50 text-base shadow-sm focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-36 bg-card/50 animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((cargo, i) => (
                <motion.button
                  key={cargo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/flashcards/cargos/${cargo.id}`);
                  }}
                  className="w-full text-left bg-card rounded-3xl p-5 border border-border/50 shadow-sm active:scale-95 transition-all hover:border-primary/50"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
                        <Building className="w-3.5 h-3.5" />
                        {cargo.orgao}
                        {cargo.banca && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-primary/40 mx-1" />
                            {cargo.banca}
                          </>
                        )}
                      </div>
                      
                      <h2 className="font-display text-xl sm:text-2xl font-black leading-tight mb-2">
                        {cargo.cargo}
                      </h2>
                      
                      {cargo.descricao_geral && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {cargo.descricao_geral}
                        </p>
                      )}
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ChevronRight className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p>Nenhum cargo encontrado com "{busca}".</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <FlashcardsBottomNav />
    </div>
  );
}
