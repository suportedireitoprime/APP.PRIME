import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoCacaPalavras } from '@/components/gamificacao/JogoCacaPalavras';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star, Sparkles, Lock, Play, ArrowUpRight } from 'lucide-react';
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
        
        <div className={selectedNivel ? "pt-2 pb-16 px-1 sm:px-4 w-full max-w-full min-w-0 overflow-x-hidden box-border" : "w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-20 pt-4 min-w-0 overflow-x-hidden box-border"}>
        <AnimatePresence mode="wait">
          {!selectedDisciplina ? (
            <motion.div
              key="disciplinas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 w-full min-w-0 max-w-full"
            >
              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpenText className="w-5 h-5 text-primary shrink-0" />
                      <h2 className="text-xs sm:text-sm font-bold font-sans uppercase tracking-widest text-white truncate">Selecione a Disciplina</h2>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold font-sans text-zinc-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
                      Direito Penal
                    </span>
                  </div>

                  {/* Trilha em Linha do Tempo Elegante (Alternando Esquerda/Direita) */}
                  <div className="relative py-6 w-full min-w-0 max-w-full overflow-hidden">
                    {/* Linha vertical central luminosa */}
                    <div className="absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 bg-gradient-to-b from-primary via-primary/40 to-zinc-800/80 rounded-full z-0 pointer-events-none" />

                    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                      {TEMAS_DIREITO_PENAL.map((tema, i) => {
                        const isLeft = i % 2 === 0;
                        const prog = getProgressoTema(tema.nome, tema.totalNiveis);

                        return (
                          <div
                            key={tema.id}
                            className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                          >
                            {/* Linha conectando o nó central ao card */}
                            <div 
                              className={`absolute top-1/2 w-[calc(50%-1.25rem)] h-[1.5px] border-b-2 border-dashed -translate-y-1/2 z-0 pointer-events-none ${
                                tema.disponivel ? 'border-primary/60' : 'border-zinc-800'
                              } ${isLeft ? 'left-1/2' : 'right-1/2'}`} 
                            />

                            {/* Nó Central (Milestone da Linha do Tempo) */}
                            <div
                              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full font-bold transition-transform ${
                                tema.disponivel
                                  ? 'w-8 h-8 sm:w-9 sm:h-9 bg-primary border-4 border-[#0D0D0D] text-white shadow-[0_0_16px_rgba(225,29,72,0.85)] scale-105'
                                  : 'w-7 h-7 sm:w-8 sm:h-8 bg-zinc-900 border-4 border-[#0D0D0D] text-zinc-500 text-xs'
                              }`}
                            >
                              <span className="text-[11px] sm:text-xs font-bold font-sans">
                                {tema.numero}
                              </span>
                              {tema.disponivel && (
                                <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping -z-10 pointer-events-none" />
                              )}
                            </div>

                            {/* Card no formato de Capa de Livro (com fundo da recomendação de livros) */}
                            <div
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
                                relative w-[45%] max-w-[210px] min-h-[165px] sm:min-h-[185px] p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden select-none box-border transition-all duration-300 z-10
                                ${tema.disponivel 
                                  ? 'bg-brand-gradient border border-white/25 shadow-[0_12px_28px_-6px_rgba(225,29,72,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(225,29,72,0.55)] cursor-pointer active:scale-[0.97] group' 
                                  : 'bg-gradient-to-br from-zinc-900/95 via-[#181116] to-[#120e14] border border-zinc-800/80 shadow-md cursor-not-allowed opacity-75 hover:opacity-85'}
                              `}
                            >
                              {/* SVGs jurídicos decorativos em marca d'água ao fundo (Padrão Recomendação de Livro) */}
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 200 200"
                                className="pointer-events-none absolute -right-3 -bottom-3 w-[95px] h-[95px] text-white/10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
                                <path d="M35 95 Q55 135 75 95 Z" />
                                <path d="M125 95 Q145 135 165 95 Z" />
                              </svg>
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 100 100"
                                className="pointer-events-none absolute top-1 right-1 w-[38px] h-[38px] text-white/10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              >
                                <path d="M18 78 L58 38" />
                                <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
                                <path d="M10 88 H50" />
                              </svg>

                              {/* Cabeçalho da Capa: Etapa e Ícone de Ação */}
                              <div className="flex items-center justify-between gap-1 z-[1] w-full">
                                <span className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${
                                  tema.disponivel 
                                    ? 'bg-black/40 text-white border border-white/15' 
                                    : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
                                }`}>
                                  Etapa {tema.numero}
                                </span>

                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md ${
                                  tema.disponivel 
                                    ? 'bg-white/20 border border-white/30 text-white shadow-sm group-hover:scale-110 transition-transform' 
                                    : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-500'
                                }`}>
                                  {tema.disponivel ? (
                                    <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                                  ) : (
                                    <Lock className="w-2.5 h-2.5" />
                                  )}
                                </div>
                              </div>

                              {/* Centro da Capa: Título do Tema */}
                              <div className="my-auto py-2 z-[1]">
                                <h3 className={`font-sans font-bold text-[13.5px] sm:text-[15px] leading-snug line-clamp-3 ${
                                  tema.disponivel ? 'text-white drop-shadow-sm' : 'text-zinc-300'
                                }`}>
                                  {tema.nome}
                                </h3>
                              </div>

                              {/* Rodapé da Capa: Progresso ou Status */}
                              <div className="z-[1] pt-1.5 border-t border-white/15 w-full">
                                {tema.disponivel ? (
                                  <div>
                                    <div className="flex items-center justify-between text-[10px] font-medium text-white/90 mb-1">
                                      <span>{prog.concluidos > 0 ? `${prog.concluidos}/${prog.total} conc.` : 'Iniciar'}</span>
                                      <span className="font-bold font-sans">{prog.percent}%</span>
                                    </div>
                                    <div className="w-full bg-black/35 h-1.5 rounded-full overflow-hidden border border-white/20">
                                      <div 
                                        className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${Math.max(prog.percent, 8)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between text-[9.5px] text-zinc-400 font-medium">
                                    <span>Bloqueado</span>
                                    <span className="uppercase text-[8.5px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 text-zinc-400">
                                      Em breve
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
