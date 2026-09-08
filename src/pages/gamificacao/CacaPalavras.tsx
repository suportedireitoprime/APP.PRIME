import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoCacaPalavras } from '@/components/gamificacao/JogoCacaPalavras';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { gamificacaoService } from '@/services/gamificacaoService';
import ShapeGrid from '@/components/ui/ShapeGrid';
import type { GamificacaoCacaPalavras } from '@/types/gamificacao';

interface TemaPenal {
  id: string;
  numero: string;
  nome: string;
  subtitulo: string;
  artigos: string;
  disponivel: boolean;
  totalNiveis: number;
}

const TEMAS_DIREITO_PENAL: TemaPenal[] = [
  {
    id: 'crimes-familia',
    numero: '01',
    nome: 'Crimes Contra a Família',
    subtitulo: 'Casamento, Filiação, Assistência e Pátrio Poder',
    artigos: 'Arts. 235 a 249',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'crimes-pessoa',
    numero: '02',
    nome: 'Crimes Contra a Pessoa',
    subtitulo: 'Homicídio, Lesão Corporal e Honra',
    artigos: 'Arts. 121 a 154',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-patrimonio',
    numero: '03',
    nome: 'Crimes Contra o Patrimônio',
    subtitulo: 'Furto, Roubo, Extorsão e Estelionato',
    artigos: 'Arts. 155 a 183',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-dignidade-sexual',
    numero: '04',
    nome: 'Crimes Contra a Dignidade Sexual',
    subtitulo: 'Estupro, Violação e Assédio Sexual',
    artigos: 'Arts. 213 a 234',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-incolumidade',
    numero: '05',
    nome: 'Crimes Contra a Incolumidade Pública',
    subtitulo: 'Perigo Comum e Saúde Pública',
    artigos: 'Arts. 250 a 285',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-paz-publica',
    numero: '06',
    nome: 'Crimes Contra a Paz Pública',
    subtitulo: 'Incitação, Associação Criminosa e Milícia',
    artigos: 'Arts. 286 a 288',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-fe-publica',
    numero: '07',
    nome: 'Crimes Contra a Fé Pública',
    subtitulo: 'Moeda Falsa e Falsidade Documental',
    artigos: 'Arts. 289 a 311',
    disponivel: false,
    totalNiveis: 5,
  },
  {
    id: 'crimes-administracao',
    numero: '08',
    nome: 'Crimes Contra a Administração Pública',
    subtitulo: 'Peculato, Concussão e Corrupção',
    artigos: 'Arts. 312 a 359',
    disponivel: false,
    totalNiveis: 5,
  },
];

const CacaPalavrasPage = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  
  const [niveis, setNiveis] = useState<GamificacaoCacaPalavras[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<GamificacaoCacaPalavras | null>(null);
  
  const [progresso, setProgresso] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Caça-Palavras | Direito Prime";
    setDisciplinas(['Crimes Contra a Família']); // Poderia ser dinâmico buscando disciplinas únicas
    setLoading(false);
  }, []);

  const getProgressoTema = (nomeTema: string, totalNiveis: number = 5) => {
    try {
      const saved = localStorage.getItem(`caca_palavras_progresso_${nomeTema}`);
      if (!saved) return { concluidos: 0, total: totalNiveis, percent: 0 };
      const parsed = JSON.parse(saved);
      const concluidos = Object.values(parsed).filter((s: any) => Number(s) > 0).length;
      const percent = Math.min(100, Math.round((concluidos / totalNiveis) * 100));
      return { concluidos, total: totalNiveis, percent };
    } catch {
      return { concluidos: 0, total: totalNiveis, percent: 0 };
    }
  };

  const loadProgresso = (disciplina: string) => {
    try {
      const saved = localStorage.getItem(`caca_palavras_progresso_${disciplina}`);
      if (saved) {
        setProgresso(JSON.parse(saved));
      } else {
        setProgresso({});
      }
    } catch (e) {
      setProgresso({});
    }
  };

  const saveProgresso = (nivel: string, estrelas: number) => {
    if (!selectedDisciplina) return;
    setProgresso(prev => {
      const current = prev[nivel] || 0;
      if (estrelas <= current) return prev; // Mantém a melhor pontuação
      const updated = { ...prev, [nivel]: estrelas };
      localStorage.setItem(`caca_palavras_progresso_${selectedDisciplina}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDisciplinaSelect = async (disciplina: string) => {
    setSelectedDisciplina(disciplina);
    loadProgresso(disciplina);
    setLoading(true);
    const trilha = await gamificacaoService.getTrilhaCacaPalavras(disciplina);
    setNiveis(trilha);
    setLoading(false);
  };

  const handleNivelSelect = (nivel: GamificacaoCacaPalavras) => {
    setSelectedNivel(nivel);
  };

  const handleBack = () => {
    if (selectedNivel) {
      setSelectedNivel(null);
    } else if (selectedDisciplina) {
      setSelectedDisciplina(null);
    } else {
      navigate('/ferramentas');
    }
  };

  const handleGameEnd = () => {
    if (selectedNivel) {
      saveProgresso(selectedNivel.nivel, 3); // Dá 3 estrelas sempre por concluir
      
      // Opcional: avançar automaticamente ou apenas mostrar parabéns e voltar
      // Para manter simples, volta para a trilha após 2 segundos
      setTimeout(() => {
        setSelectedNivel(null);
      }, 2000);
    }
  };

  return (
    <DesktopPageLayout>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>
      
      <div className="relative z-10 min-h-screen">
        <PageHeader 
          title={selectedNivel ? selectedNivel.materia : "CAÇA-PALAVRAS"} 
          subtitle={selectedNivel ? `${selectedNivel.nivel} - ${selectedNivel.titulo_nivel}` : (selectedDisciplina || "Trilha de Aprendizado")}
          onBack={handleBack}
        />
        
        <div className={selectedNivel ? "pt-2 pb-16 px-1 sm:px-4 w-full" : "max-w-[700px] mx-auto px-4 md:px-0 pb-20 pt-4"}>
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpenText className="w-5 h-5 text-primary" />
                      <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">Selecione a Disciplina</h2>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                      Direito Penal
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {TEMAS_DIREITO_PENAL.map(tema => {
                      const prog = getProgressoTema(tema.nome, tema.totalNiveis);
                      return (
                        <div
                          key={tema.id}
                          onClick={() => {
                            if (tema.disponivel) {
                              handleDisciplinaSelect(tema.nome);
                            } else {
                              toast.info("Tema em elaboração", {
                                description: `Os níveis de "${tema.nome}" serão disponibilizados em breve!`
                              });
                            }
                          }}
                          className={`
                            flex flex-col w-full p-4 sm:p-5 text-left rounded-2xl border transition-all select-none
                            ${tema.disponivel 
                              ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 cursor-pointer shadow-lg active:scale-[0.99] group' 
                              : 'bg-zinc-900/40 border-zinc-800/60 opacity-60 cursor-not-allowed hover:opacity-75'}
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Número no lado esquerdo */}
                              <div className={`
                                w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border
                                ${tema.disponivel 
                                  ? 'bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-white transition-colors' 
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'}
                              `}>
                                {tema.numero}
                              </div>

                              {/* Título Menor e Subtítulo */}
                              <div className="min-w-0">
                                <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider truncate ${tema.disponivel ? 'text-zinc-100 group-hover:text-primary transition-colors' : 'text-zinc-400'}`}>
                                  {tema.nome}
                                </h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                  {tema.subtitulo} • <span className="text-zinc-500 font-medium">{tema.artigos}</span>
                                </p>
                              </div>
                            </div>

                            {/* Badge ou Seta */}
                            {tema.disponivel ? (
                              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800/90 text-zinc-400 border border-zinc-700 shrink-0">
                                Em breve
                              </span>
                            )}
                          </div>

                          {/* Barra de Progresso onde a pessoa parou */}
                          <div className="mt-3.5 pt-3 border-t border-zinc-800/60 w-full">
                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                              <span className="text-zinc-400">
                                {tema.disponivel 
                                  ? (prog.concluidos > 0 ? `${prog.concluidos}/${prog.total} níveis concluídos` : 'Não iniciado') 
                                  : 'Disponível em breve'}
                              </span>
                              <span className={prog.percent > 0 ? "text-primary font-bold" : "text-zinc-500"}>
                                {prog.percent}%
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800/80 h-1.5 sm:h-2 rounded-full overflow-hidden border border-zinc-700/30">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${prog.percent > 0 ? 'bg-primary shadow-sm shadow-primary/40' : 'bg-transparent'}`}
                                style={{ width: `${prog.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          ) : !selectedNivel ? (
            <motion.div
              key="niveis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-black uppercase tracking-widest text-white">{selectedDisciplina}</h2>
                <p className="text-zinc-400 mt-2">Encontre as palavras ocultas e decifre os conceitos!</p>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : niveis.length === 0 ? (
                <div className="text-center p-12 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                  <p className="text-zinc-400">Nenhum nível encontrado para esta disciplina.</p>
                </div>
              ) : (
                <div className="relative py-10 flex flex-col items-center">
                  <div className="w-full max-w-sm mb-12 py-4 bg-zinc-900/80 border-y border-zinc-800 backdrop-blur text-center">
                    <span className="font-bold text-primary uppercase tracking-widest">Níveis Disponíveis</span>
                  </div>

                  <div className="flex flex-col relative z-10 w-full max-w-md items-center">
                    {niveis.map((nivelItem, idx) => {
                      const isLeft = idx % 2 === 0;
                      const hasNext = idx < niveis.length - 1;
                      const estrelas = progresso[nivelItem.nivel] || 0;
                      const hasCompleted = estrelas > 0;
                      
                      return (
                        <div key={idx} className="relative w-full h-[140px] flex justify-center">
                          <div 
                            className={`absolute z-10 flex flex-col items-center group cursor-pointer ${isLeft ? '-ml-24' : 'ml-24'}`}
                            onClick={() => handleNivelSelect(nivelItem)}
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
                              w-24 h-24 rounded-full flex flex-col items-center justify-center 
                              border-4 transition-all duration-300 shadow-xl
                              ${hasCompleted 
                                ? 'bg-primary/20 border-primary text-white shadow-primary/20 scale-105' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:border-zinc-600 group-hover:bg-zinc-800'}
                            `}>
                              <span className="font-black text-sm tracking-widest uppercase">{nivelItem.nivel.replace('Nível ', 'NV ')}</span>
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
              exit={{ opacity: 0, scale: 0.95 }}
              className="min-h-screen"
            >
              <JogoCacaPalavras 
                nivelData={selectedNivel}
                onVenceu={handleGameEnd}
                onBack={() => setSelectedNivel(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </DesktopPageLayout>
  );
};

export default CacaPalavrasPage;
