import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoForca } from '@/components/gamificacao/JogoForca';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star, Footprints } from 'lucide-react';
import { gamificacaoService } from '@/services/gamificacaoService';
import ShapeGrid from '@/components/ui/ShapeGrid';

const ForcaPage = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  
  const [artigos, setArtigos] = useState<string[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState<string | null>(null);
  
  const [progresso, setProgresso] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Jogo da Forca | Direito Prime";
    setDisciplinas(['Código Penal']);
    setLoading(false);
  }, []);

  const loadProgresso = (disciplina: string) => {
    try {
      const saved = localStorage.getItem(`forca_progresso_${disciplina}`);
      if (saved) {
        setProgresso(JSON.parse(saved));
      } else {
        setProgresso({});
      }
    } catch (e) {
      setProgresso({});
    }
  };

  const saveProgresso = (artigo: string, estrelas: number) => {
    if (!selectedDisciplina) return;
    setProgresso(prev => {
      const current = prev[artigo] || 0;
      if (estrelas <= current) return prev; // Mantém a melhor pontuação
      const updated = { ...prev, [artigo]: estrelas };
      localStorage.setItem(`forca_progresso_${selectedDisciplina}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDisciplinaSelect = async (disciplina: string) => {
    setSelectedDisciplina(disciplina);
    loadProgresso(disciplina);
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

  const handleNextArticle = () => {
    if (!selectedArtigo) return;
    const currentIndex = artigos.indexOf(selectedArtigo);
    if (currentIndex >= 0 && currentIndex < artigos.length - 1) {
      setSelectedArtigo(artigos[currentIndex + 1]);
    } else {
      setSelectedArtigo(null);
    }
  };

  const handleGameEnd = (venceu: boolean, erros: number) => {
    if (venceu && selectedArtigo) {
      let stars = 3;
      if (erros > 0 && erros <= 2) stars = 2;
      if (erros > 2) stars = 1;
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoForca } from '@/components/gamificacao/JogoForca';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star } from 'lucide-react';
import { gamificacaoService } from '@/services/gamificacaoService';
import ShapeGrid from '@/components/ui/ShapeGrid';

const ForcaPage = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  
  const [artigos, setArtigos] = useState<string[]>([]);
  const [selectedArtigo, setSelectedArtigo] = useState<string | null>(null);
  
  const [progresso, setProgresso] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Jogo da Forca | Direito Prime";
    setDisciplinas(['Código Penal']);
    setLoading(false);
  }, []);

  const loadProgresso = (disciplina: string) => {
    try {
      const saved = localStorage.getItem(`forca_progresso_${disciplina}`);
      if (saved) {
        setProgresso(JSON.parse(saved));
      } else {
        setProgresso({});
      }
    } catch (e) {
      setProgresso({});
    }
  };

  const saveProgresso = (artigo: string, estrelas: number) => {
    if (!selectedDisciplina) return;
    setProgresso(prev => {
      const current = prev[artigo] || 0;
      if (estrelas <= current) return prev; // Mantém a melhor pontuação
      const updated = { ...prev, [artigo]: estrelas };
      localStorage.setItem(`forca_progresso_${selectedDisciplina}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDisciplinaSelect = async (disciplina: string) => {
    setSelectedDisciplina(disciplina);
    loadProgresso(disciplina);
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

  const handleNextArticle = () => {
    if (!selectedArtigo) return;
    const currentIndex = artigos.indexOf(selectedArtigo);
    if (currentIndex >= 0 && currentIndex < artigos.length - 1) {
      setSelectedArtigo(artigos[currentIndex + 1]);
    } else {
      setSelectedArtigo(null);
    }
  };

  const handleGameEnd = (venceu: boolean, erros: number) => {
    if (venceu && selectedArtigo) {
      let stars = 3;
      if (erros > 0 && erros <= 2) stars = 2;
      if (erros > 2) stars = 1;
      saveProgresso(selectedArtigo, stars);
    }
  };

  const formatAbrev = (text: string) => {
    return text.replace(/Artigo/i, 'Art.');
  };

  return (
    <DesktopPageLayout>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>
      
      <div className="relative z-10 min-h-screen">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpenText className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold uppercase tracking-wider text-white">Selecione a Disciplina</h2>
                  </div>
                  <div className="grid gap-3">
                    {disciplinas.map(disc => (
                      <button
                        key={disc}
                        onClick={() => handleDisciplinaSelect(disc)}
                        className="flex items-center justify-between w-full p-6 text-left bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                      >
                        <span className="text-lg font-bold text-zinc-100 uppercase tracking-wide">{disc}</span>
                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : !selectedArtigo ? (
            <motion.div
              key="artigos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-black uppercase tracking-widest text-white">{selectedDisciplina}</h2>
                <p className="text-zinc-400 mt-2">Selecione o artigo para jogar a forca!</p>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : artigos.length === 0 ? (
                <div className="text-center p-12 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                  <p className="text-zinc-400">Nenhum artigo encontrado com jogos da forca para esta disciplina.</p>
                </div>
              ) : (
                <div className="relative py-10 flex flex-col items-center">
                  <div className="w-full max-w-sm mb-12 py-4 bg-zinc-900/80 border-y border-zinc-800 backdrop-blur text-center">
                    <span className="font-bold text-primary uppercase tracking-widest">Artigos Disponíveis</span>
                  </div>

                  <div className="flex flex-col relative z-10 w-full max-w-md items-center">
                    {artigos.map((artigo, idx) => {
                      const isLeft = idx % 2 === 0;
                      const hasNext = idx < artigos.length - 1;
                      const estrelas = progresso[artigo] || 0;
                      const hasCompleted = estrelas > 0;
                      
                      return (
                        <div key={idx} className="relative w-full h-[140px] flex justify-center">
                          <div 
                            className={`absolute z-10 flex flex-col items-center group cursor-pointer ${isLeft ? '-ml-24' : 'ml-24'}`}
                            onClick={() => handleArtigoSelect(artigo)}
                          >
                            <div className={`flex gap-1 mb-2 ${hasCompleted ? 'opacity-100' : 'opacity-30'}`}>
                              {[1, 2, 3].map(s => (
                                <Star 
                                  key={s} 
                                  className={`w-4 h-4 ${s <= estrelas ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`} 
                                />
                              ))}
                            </div>
                            
                            <div className={`
                              w-24 h-24 rounded-full flex items-center justify-center 
                              border-4 transition-all duration-300 shadow-xl
                              ${hasCompleted 
                                ? 'bg-primary/20 border-primary text-white shadow-primary/20 scale-105' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:border-zinc-600 group-hover:bg-zinc-800'}
                            `}>
                              <span className="font-black text-sm tracking-widest uppercase">{formatAbrev(artigo)}</span>
                            </div>
                          </div>

                          {hasNext && (
                            <svg 
                              className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[160px] h-[140px] pointer-events-none z-0"
                              viewBox="0 0 160 140"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                d={isLeft 
                                  ? "M 32 0 C 80 40, 128 100, 128 140" 
                                  : "M 128 0 C 80 40, 32 100, 32 140" 
                                } 
                                stroke="#3f3f46" 
                                strokeWidth="4" 
                                strokeDasharray="8 8"
                                className="opacity-50"
                              />
                              <g transform={isLeft ? "translate(80, 70) rotate(-25)" : "translate(80, 70) rotate(25)"} className="opacity-40">
                                <path d="M-8,-8 C-12,-8 -12,2 -8,4 C-4,6 0,2 0,-2 C0,-6 -4,-8 -8,-8 Z" fill="#fff"/>
                                <path d="M8,0 C4,0 4,10 8,12 C12,14 16,10 16,6 C16,2 12,0 8,0 Z" fill="#fff"/>
                                <circle cx="-14" cy="-10" r="2" fill="#fff"/>
                                <circle cx="-10" cy="-13" r="2" fill="#fff"/>
                                <circle cx="-5" cy="-14" r="2" fill="#fff"/>
                                <circle cx="0" cy="-12" r="2" fill="#fff"/>
                                <circle cx="2" cy="-2" r="2" fill="#fff"/>
                                <circle cx="6" cy="-5" r="2" fill="#fff"/>
                                <circle cx="11" cy="-6" r="2" fill="#fff"/>
                                <circle cx="16" cy="-4" r="2" fill="#fff"/>
                              </g>
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="jogo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full"
            >
              <JogoForca 
                disciplina={selectedDisciplina} 
                artigo={selectedArtigo} 
                onBack={handleBack} 
                onNextArticle={handleNextArticle}
                onGameEnd={handleGameEnd}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </DesktopPageLayout>
  );
};

export default ForcaPage;
