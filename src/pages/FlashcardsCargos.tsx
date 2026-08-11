import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { Briefcase, Building, ChevronRight, Scale, Search, Shield, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import prfLogo from '@/assets/cargos/policia-rodoviaria-federal.webp';
import pfLogo from '@/assets/cargos/policia-federal.webp';

function getCategoriaCargo(cargo: string, orgao: string): string {
  const t = (cargo + " " + orgao).toLowerCase();
  if (t.includes('oab')) return 'OAB';
  if (t.includes('polícia') || t.includes('policial') || t.includes('prf') || t.includes('pf') || t.includes('agente')) return 'Carreira Policial';
  if (t.includes('juiz') || t.includes('magistratura') || t.includes('tj')) return 'Carreira de Juiz';
  return 'Outros Cargos';
}

function getLogoAndStyles(cargo: string, orgao: string) {
  const t = (cargo + " " + orgao).toLowerCase();
  if (t.includes('rodoviária federal') || t.includes('prf')) {
    return { logoSrc: prfLogo, iconType: 'image' };
  }
  if (t.includes('polícia federal') || t.includes('pf')) {
    return { logoSrc: pfLogo, iconType: 'image' };
  }
  if (t.includes('oab')) {
    return { icon: Scale, iconType: 'icon' };
  }
  if (t.includes('juiz') || t.includes('tj')) {
    return { icon: Scale, iconType: 'icon' };
  }
  return { icon: Building, iconType: 'icon' };
}

function getDisplayTitleAndSub(cargo: string, orgao: string) {
  if (cargo.includes('RODOVIÁRIO FEDERAL')) {
    return { title: 'PRF', subtitle: 'Polícia Rodoviária Federal' };
  }
  if (cargo.includes('AGENTE DE POLÍCIA FEDERAL')) {
    return { title: 'PF', subtitle: 'Agente de Polícia Federal' };
  }
  return { title: cargo, subtitle: orgao };
}

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

  const categoriasOrdem = [
    'Carreira Policial',
    'Carreira de Juiz',
    'OAB',
    'Outros Cargos'
  ];

  const groupedCargos = categoriasOrdem.map(cat => ({
    categoria: cat,
    itens: filtered.filter(c => getCategoriaCargo(c.cargo, c.orgao) === cat)
  })).filter(g => g.itens.length > 0);

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

          <div className="pt-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-card/50 animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : groupedCargos.length > 0 ? (
              <div className="space-y-10">
                {groupedCargos.map((grupo) => (
                  <div key={grupo.categoria} className="space-y-4">
                    <h3 className="font-display text-lg font-black text-foreground border-b border-border/50 pb-2 uppercase tracking-wide">
                      {grupo.categoria}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {grupo.itens.map((cargo, i) => {
                        const { icon: Icon, logoSrc, iconType } = getLogoAndStyles(cargo.cargo, cargo.orgao);
                        const { title, subtitle } = getDisplayTitleAndSub(cargo.cargo, cargo.orgao);
                        return (
                          <motion.button
                            key={cargo.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => {
                              haptic.selection();
                              navigate(`/flashcards/cargos/${cargo.id}`);
                            }}
                            className="w-full text-left bg-card rounded-3xl p-5 border border-border/50 shadow-sm active:scale-95 transition-all hover:border-primary/50 aspect-square flex flex-col relative overflow-hidden group"
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex-1">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 overflow-hidden">
                                  {iconType === 'image' ? (
                                    <img src={logoSrc} alt={cargo.orgao} className="w-12 h-12 object-contain p-1" />
                                  ) : Icon && (
                                    <Icon className="w-6 h-6 text-primary" />
                                  )}
                                </div>
                                
                                <h2 className="font-display text-base sm:text-lg font-black leading-tight mb-1.5 line-clamp-3">
                                  {title}
                                </h2>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2 line-clamp-2">
                                  {subtitle}
                                </p>
                              </div>
                              
                              <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                  {cargo.edital_disciplinas ? `${cargo.edital_disciplinas.length} Matérias` : 'Edital'}
                                </p>
                                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
