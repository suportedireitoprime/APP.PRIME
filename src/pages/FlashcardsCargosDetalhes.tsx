import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { Briefcase, Building, ChevronRight, Scale, Shield, Play, ArrowLeft } from 'lucide-react';
import { useFlashcardsTrilhasStore } from '@/lib/flashcardsTrilhasStore';

type DisciplinaEdital = {
  area: string;
  peso: string;
  descricao: string;
};

type Cargo = {
  id: string;
  cargo: string;
  orgao: string;
  banca: string | null;
  descricao_geral: string | null;
  edital_disciplinas: DisciplinaEdital[];
};

export default function FlashcardsCargosDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const addTrilha = useFlashcardsTrilhasStore(s => s.adicionarTrilha);

  useEffect(() => {
    async function loadCargo() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('flashcards_cargos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setCargo(data as Cargo);
      } catch (err) {
        console.error('Erro ao carregar cargo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCargo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
        <PageHeader title="Detalhes do Edital" onBack={() => navigate('/flashcards/cargos')} />
        <div className="p-4 space-y-4 pt-10">
          <div className="h-32 bg-card/50 animate-pulse rounded-3xl" />
          <div className="h-24 bg-card/50 animate-pulse rounded-3xl" />
          <div className="h-40 bg-card/50 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
        <PageHeader title="Cargo não encontrado" onBack={() => navigate('/flashcards/cargos')} />
      </div>
    );
  }

  const handleEstudarDisciplina = (area: string) => {
    haptic.selection();
    // Cria uma trilha temporária/rápida para essa área
    addTrilha({
      id: crypto.randomUUID(),
      nome: `${cargo.orgao} - ${area}`,
      area: area,
      tema: 'Todos os Temas',
      metaDias: 30,
      cardsPorDia: 25,
      criadaEm: new Date().toISOString()
    });
    navigate('/flashcards/trilhas');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-4">
          <button 
            onClick={() => { haptic.selection(); navigate('/flashcards/cargos'); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-black text-xl line-clamp-1">
              {cargo.cargo}
            </h1>
          </div>
        </div>
        
        <div className="pt-2 space-y-6">
          <section
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-xl border border-white/10"
            style={{
              background: 'linear-gradient(155deg, hsl(var(--primary) / 0.96) 0%, hsl(348 72% 34%) 62%, hsl(348 70% 24%) 100%)',
            }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Building className="w-4 h-4" />
              {cargo.orgao}
              {cargo.banca && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40 mx-1" />
                  {cargo.banca}
                </>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight mb-3">
              Raio-X do Edital
            </h2>
            
            {cargo.descricao_geral && (
              <p className="text-sm text-primary-foreground/90 leading-relaxed font-medium">
                {cargo.descricao_geral}
              </p>
            )}
          </section>

          <section>
            <h3 className="font-black text-lg mb-4 px-1 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Disciplinas Estratégicas
            </h3>
            
            <div className="space-y-3">
              {cargo.edital_disciplinas.map((disc, i) => {
                const isHigh = disc.peso.toLowerCase().includes('alto');
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-base">{disc.area}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isHigh ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                            Peso: {disc.peso}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {disc.descricao}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleEstudarDisciplina(disc.area)}
                        className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-primary" />
                        Montar Trilha
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      
      <FlashcardsBottomNav />
    </div>
  );
}
