import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoForca } from '@/components/gamificacao/JogoForca';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star } from 'lucide-react';
import { gamificacaoService } from '@/services/gamificacaoService';

const ForcaPage = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  
  const [artigos, setArtigos] = useState<string[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Jogo da Forca | Direito Prime";
    
    // Buscar disciplinas disponíveis (hardcoded por enquanto ou buscar distinct)
    // No momento temos apenas Código Penal
    setDisciplinas(['Código Penal']);
    setLoading(false);
  }, []);

  const handleDisciplinaSelect = async (disciplina: string) => {
    setSelectedDisciplina(disciplina);
    setLoading(true);
    const trilha = await gamificacaoService.getTrilha('forca', disciplina);
    setArtigos(trilha);
    setLoading(false);
  };

  const handleArtigoSelect = (artigo: string) => {
    setSelectedArtigo(artigo);
  };

  const handleBack = () => {
    if (selectedArtigo) {
      setSelectedArtigo(null);
    } else if (selectedDisciplina) {
      setSelectedDisciplina(null);
    } else {
      navigate('/ferramentas');
    }
  };

  return (
    <DesktopPageLayout>
      {!selectedArtigo && (
        <PageHeader 
          title="JOGO DA FORCA" 
          subtitle="Trilha de Aprendizado"
          onBack={handleBack}
        />
      )}
      
      <div className={selectedArtigo ? "pt-4 pb-20" : "max-w-[700px] mx-auto px-4 md:px-0 pb-20 pt-4"}>
        <AnimatePresence mode="wait">
          {!selectedDisciplina ? (
            <motion.div
              key="disciplinas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wide">ÁREA DO DIREITO</h2>
              <div className="grid gap-3">
                {loading && (
                   <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                )}
                {disciplinas.map(disc => (
                  <button
                    key={disc}
                    onClick={() => handleDisciplinaSelect(disc)}
                    className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpenText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-display font-bold text-lg leading-tight">{disc === 'Código Penal' ? 'Direito Penal' : disc}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !selectedArtigo ? (
            <motion.div
              key="artigos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wide">
                {selectedDisciplina === 'Código Penal' ? 'Direito Penal' : selectedDisciplina}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Selecione o artigo para jogar a forca!</p>
              
              <div className="pr-2 pb-6">
                {loading && (
                   <div className="py-10 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Carregando trilha...</span>
                   </div>
                )}
                <div className="space-y-12">
                  <div className="relative">
                    <div className="relative bg-[#0D0D0D] py-4 border-b border-primary/20 mb-8 rounded-b-3xl mx-2">
                      <h3 className="font-display font-black text-lg text-primary text-center px-4 leading-tight">Artigos Disponíveis</h3>
                    </div>
                    <div className="flex flex-col items-center gap-8 py-2">
                      {artigos.map((artigo, i) => {
                         // Zig-zag pattern
                         const offset = i % 4 === 0 ? '-translate-x-12' : i % 4 === 1 ? 'translate-x-0' : i % 4 === 2 ? 'translate-x-12' : 'translate-x-0';
                         
                         return (
                           <div key={artigo} className={`relative flex justify-center ${offset} transition-all duration-300`}>
                             <button
                               onClick={() => handleArtigoSelect(artigo)}
                               className="relative flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full border-4 shadow-xl hover:scale-105 active:scale-95 transition-transform z-10 bg-card border-border hover:border-primary/50"
                             >
                                <span className="font-display font-black text-lg leading-none text-foreground text-center">
                                  {artigo.replace('Artigo ', '')}
                                </span>
                             </button>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <JogoForca 
                disciplina={selectedDisciplina} 
                artigo={selectedArtigo} 
                onBack={handleBack} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DesktopPageLayout>
  );
};

export default ForcaPage;
