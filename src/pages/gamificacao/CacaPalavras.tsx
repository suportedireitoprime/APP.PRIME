import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoCacaPalavras } from '@/components/gamificacao/JogoCacaPalavras';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { BookOpenText, ChevronRight, Loader2, Star, Sparkles, Lock, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { gamificacaoService } from '@/services/gamificacaoService';
import ShapeGrid from '@/components/ui/ShapeGrid';
import type { GamificacaoCacaPalavras } from '@/types/gamificacao';

interface TemaPenal {
  id: string;
  numero: string;
  nome: string;
  rawMateria: string;
  subtitulo?: string;
  artigos?: string;
  disponivel: boolean;
  totalNiveis: number;
}

const TEMAS_DIREITO_PENAL: TemaPenal[] = [
  {
    id: 'tema-01-crimes-contra-a-familia',
    numero: '01',
    nome: 'Crimes Contra a Família',
    rawMateria: '01. Crimes Contra a Família',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-02-criminologia',
    numero: '02',
    nome: 'Criminologia',
    rawMateria: '02. Criminologia',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-03-direito-penal-do-inimigo',
    numero: '03',
    nome: 'Direito Penal do Inimigo',
    rawMateria: '03. Direito Penal do Inimigo',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-04-critica-ao-direito-penal-do-inimigo',
    numero: '04',
    nome: 'Crítica ao Direito Penal do Inimigo',
    rawMateria: '04. Crítica ao Direito Penal do Inimigo',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-05-escolas-penais',
    numero: '05',
    nome: 'Escolas Penais',
    rawMateria: '05. Escolas Penais',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-06-nocoes-gerais-de-direito-penal',
    numero: '06',
    nome: 'Noções Gerais de Direito Penal',
    rawMateria: '06. Noções Gerais de Direito Penal',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-07-principios-penais',
    numero: '07',
    nome: 'Princípios Penais',
    rawMateria: '07. Princípios Penais',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-08-interpretacao-e-integracao-da-lei-penal',
    numero: '08',
    nome: 'Interpretação e Integração da Lei Penal',
    rawMateria: '08. Interpretação e Integração da Lei Penal',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-09-lei-penal-no-espaco-e-no-tempo',
    numero: '09',
    nome: 'Lei Penal no Espaço e no Tempo',
    rawMateria: '09. Lei Penal no Espaço e no Tempo',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-10-teoria-geral-do-delito',
    numero: '10',
    nome: 'Teoria Geral do Delito',
    rawMateria: '10. Teoria Geral do Delito',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-11-iter-criminis',
    numero: '11',
    nome: 'Iter Criminis',
    rawMateria: '11. Iter Criminis',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-12-principio-da-insignificancia',
    numero: '12',
    nome: 'Princípio da Insignificância',
    rawMateria: '12. Princípio da Insignificância',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-13-teoria-do-erro',
    numero: '13',
    nome: 'Teoria do Erro',
    rawMateria: '13. Teoria do Erro',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-14-imputabilidade-e-concurso-de-pessoas',
    numero: '14',
    nome: 'Imputabilidade e Concurso de Pessoas',
    rawMateria: '14. Imputabilidade e Concurso de Pessoas',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-15-imputabilidade-e-concurso-de-pessoas',
    numero: '15',
    nome: 'Imputabilidade e Concurso de Pessoas',
    rawMateria: '15. Imputabilidade e Concurso de Pessoas',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-16-concurso-de-pessoas-e-autoria-imediata',
    numero: '16',
    nome: 'Concurso de Pessoas e Autoria Imediata',
    rawMateria: '16. Concurso de Pessoas e Autoria Imediata',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-17-teoria-da-pena',
    numero: '17',
    nome: 'Teoria da Pena',
    rawMateria: '17. Teoria da Pena',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-18-funcoes-da-pena',
    numero: '18',
    nome: 'Funções da Pena',
    rawMateria: '18. Funções da Pena',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-19-concurso-de-crimes',
    numero: '19',
    nome: 'Concurso de Crimes',
    rawMateria: '19. Concurso de Crimes',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-20-dosimetria-da-pena',
    numero: '20',
    nome: 'Dosimetria da Pena',
    rawMateria: '20. Dosimetria da Pena',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-21-suspensao-condicional-da-pena-e-livramento-condicional',
    numero: '21',
    nome: 'Suspensão Condicional da Pena e Livramento Condicional',
    rawMateria: '21. Suspensão Condicional da Pena e Livramento Condicional',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-22-efeitos-da-condenacao-e-reabilitacao',
    numero: '22',
    nome: 'Efeitos da Condenação e Reabilitação',
    rawMateria: '22. Efeitos da Condenação e Reabilitação',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-23-medidas-de-seguranca',
    numero: '23',
    nome: 'Medidas de Segurança',
    rawMateria: '23. Medidas de Segurança',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-24-extincao-da-punibilidade-e-prescricao',
    numero: '24',
    nome: 'Extinção da Punibilidade e Prescrição',
    rawMateria: '24. Extinção da Punibilidade e Prescrição',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-25-prescricao-penal',
    numero: '25',
    nome: 'Prescrição Penal',
    rawMateria: '25. Prescrição Penal',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-26-crimes-contra-a-pessoa',
    numero: '26',
    nome: 'Crimes Contra a Pessoa',
    rawMateria: '26. Crimes Contra a Pessoa',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-27-crimes-contra-a-vida',
    numero: '27',
    nome: 'Crimes Contra a Vida',
    rawMateria: '27. Crimes Contra a Vida',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-28-crimes-contra-a-honra',
    numero: '28',
    nome: 'Crimes Contra a Honra',
    rawMateria: '28. Crimes Contra a Honra',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-29-crimes-contra-o-patrimonio',
    numero: '29',
    nome: 'Crimes contra o Patrimônio',
    rawMateria: '29. Crimes contra o Patrimônio',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-30-crimes-contra-a-dignidade-sexual',
    numero: '30',
    nome: 'Crimes contra a Dignidade Sexual',
    rawMateria: '30. Crimes contra a Dignidade Sexual',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-31-direito-penal-sexual-teoria-geral-e-reflexos-tipicos',
    numero: '31',
    nome: 'Direito Penal Sexual - Teoria Geral e Reflexos Típicos',
    rawMateria: '31. Direito Penal Sexual - Teoria Geral e Reflexos Típicos',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-32-crimes-contra-a-organizacao-do-trabalho',
    numero: '32',
    nome: 'Crimes Contra a Organização do Trabalho',
    rawMateria: '32. Crimes Contra a Organização do Trabalho',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-33-crimes-contra-a-propriedade-imaterial',
    numero: '33',
    nome: 'Crimes Contra a Propriedade Imaterial',
    rawMateria: '33. Crimes Contra a Propriedade Imaterial',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-34-crimes-praticados-por-funcionario-publico-contra-a-administracao',
    numero: '34',
    nome: 'Crimes praticados por Funcionário Público contra a Administração',
    rawMateria: '34. Crimes praticados por Funcionário Público contra a Administração',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-35-crimes-praticados-por-particular-contra-a-administracao-em-geral-e-estrangeira',
    numero: '35',
    nome: 'Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira',
    rawMateria: '35. Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-36-crimes-contra-o-sentimento-religioso',
    numero: '36',
    nome: 'Crimes Contra o Sentimento Religioso',
    rawMateria: '36. Crimes Contra o Sentimento Religioso',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-37-crimes-praticados-em-licitacoes-e-contratos-administrativos',
    numero: '37',
    nome: 'Crimes Praticados em Licitações e Contratos Administrativos',
    rawMateria: '37. Crimes Praticados em Licitações e Contratos Administrativos',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-38-crimes-contra-a-fe-publica',
    numero: '38',
    nome: 'Crimes Contra a Fé Pública',
    rawMateria: '38. Crimes Contra a Fé Pública',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-39-crimes-contra-a-administracao-da-justica',
    numero: '39',
    nome: 'Crimes Contra a Administração da Justiça',
    rawMateria: '39. Crimes Contra a Administração da Justiça',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-40-lei-de-drogas',
    numero: '40',
    nome: 'Lei de Drogas',
    rawMateria: '40. Lei de Drogas',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-41-estatuto-do-desarmamento',
    numero: '41',
    nome: 'Estatuto do Desarmamento',
    rawMateria: '41. Estatuto do Desarmamento',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-42-legislacao-penal-extravagante',
    numero: '42',
    nome: 'Legislação Penal Extravagante',
    rawMateria: '42. Legislação Penal Extravagante',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-43-responsabilidade-penal-da-pessoa-juridica',
    numero: '43',
    nome: 'Responsabilidade Penal da Pessoa Jurídica',
    rawMateria: '43. Responsabilidade Penal da Pessoa Jurídica',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-44-classificacao-e-especie-das-infracoes-penais',
    numero: '44',
    nome: 'Classificação e espécie das infrações penais',
    rawMateria: '44. Classificação e espécie das infrações penais',
    disponivel: true,
    totalNiveis: 5,
  },
  {
    id: 'tema-51-preambulo-constitucional-e-principios-fundamentais',
    numero: '51',
    nome: 'Preâmbulo Constitucional e Princípios Fundamentais',
    rawMateria: '51. Preâmbulo Constitucional e Princípios Fundamentais',
    disponivel: true,
    totalNiveis: 5,
  }
];

const CacaPalavrasPage = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [selectedTema, setSelectedTema] = useState<TemaPenal | null>(null);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  
  const [niveis, setNiveis] = useState<GamificacaoCacaPalavras[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<GamificacaoCacaPalavras | null>(null);
  
  const [progresso, setProgresso] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Caça-Palavras | Direito Prime";
    setDisciplinas(TEMAS_DIREITO_PENAL.map(t => t.nome));
    setLoading(false);
  }, []);

  const getProgressoTema = (tema: TemaPenal) => {
    try {
      const saved = localStorage.getItem(`caca_palavras_progresso_${tema.rawMateria}`)
                 || localStorage.getItem(`caca_palavras_progresso_${tema.nome}`)
                 || localStorage.getItem(`caca_palavras_progresso_${tema.id}`);
      if (!saved) return { concluidos: 0, total: tema.totalNiveis, percent: 0 };
      const parsed = JSON.parse(saved);
      const concluidos = Object.values(parsed).filter((s: any) => Number(s) > 0).length;
      const percent = Math.min(100, Math.round((concluidos / tema.totalNiveis) * 100));
      return { concluidos, total: tema.totalNiveis, percent };
    } catch {
      return { concluidos: 0, total: tema.totalNiveis, percent: 0 };
    }
  };

  const loadProgresso = (tema: TemaPenal) => {
    try {
      const saved = localStorage.getItem(`caca_palavras_progresso_${tema.rawMateria}`)
                 || localStorage.getItem(`caca_palavras_progresso_${tema.nome}`)
                 || localStorage.getItem(`caca_palavras_progresso_${tema.id}`);
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
    if (!selectedTema && !selectedDisciplina) return;
    const key = selectedTema ? selectedTema.rawMateria : selectedDisciplina!;
    setProgresso(prev => {
      const current = prev[nivel] || 0;
      if (estrelas <= current) return prev; // Mantém a melhor pontuação
      const updated = { ...prev, [nivel]: estrelas };
      localStorage.setItem(`caca_palavras_progresso_${key}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDisciplinaSelect = async (tema: TemaPenal) => {
    setSelectedTema(tema);
    setSelectedDisciplina(tema.nome);
    loadProgresso(tema);
    setLoading(true);
    // Busca por rawMateria ("01. Crimes Contra a Família") e se necessário por nome limpo
    let trilha = await gamificacaoService.getTrilhaCacaPalavras(tema.rawMateria);
    if (!trilha || trilha.length === 0) {
      trilha = await gamificacaoService.getTrilhaCacaPalavras(tema.nome);
    }
    setNiveis(trilha);
    setLoading(false);
  };

  const handleNivelSelect = (nivel: GamificacaoCacaPalavras) => {
    setSelectedNivel(nivel);
  };

  const handleBack = () => {
    if (selectedNivel) {
      setSelectedNivel(null);
    } else if (selectedDisciplina || selectedTema) {
      setSelectedDisciplina(null);
      setSelectedTema(null);
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
                        const prog = getProgressoTema(tema);

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
                                  handleDisciplinaSelect(tema);
                                } else {
                                  toast.info("Tema em elaboração", {
                                    description: `Os níveis de "${tema.nome}" serão disponibilizados em breve!`
                                  });
                                }
                              }}
                              className={`
                                relative w-[46%] sm:w-[45%] max-w-[225px] min-h-[175px] sm:min-h-[195px] h-auto p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden select-none box-border transition-all duration-300 z-10
                                ${tema.disponivel 
                                  ? 'bg-brand-gradient border border-white/25 shadow-[0_12px_28px_-6px_rgba(225,29,72,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(225,29,72,0.55)] cursor-pointer active:scale-[0.97] group' 
                                  : 'bg-gradient-to-br from-zinc-900/95 via-[#181116] to-[#120e14] border border-zinc-800/80 shadow-md cursor-not-allowed opacity-75 hover:opacity-85'}
                              `}
                            >
                              {/* Imagem vazada de Direito Penal (marca d'água de alta definição alinhada à direita) */}
                              <img
                                src="/images/gamificacao/direito_penal_vazado.webp"
                                alt=""
                                aria-hidden="true"
                                loading="eager"
                                decoding="async"
                                className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] object-contain opacity-25 group-hover:opacity-35 transition-opacity duration-300 z-0 select-none"
                              />

                              {/* Cabeçalho da Capa: Etapa e Status */}
                              <div className="flex items-center justify-between gap-1 z-[1] w-full">
                                <span className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-normal px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${
                                  tema.disponivel 
                                    ? 'bg-black/40 text-white border border-white/15' 
                                    : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
                                }`}>
                                  Etapa {tema.numero}
                                </span>

                                {!tema.disponivel && (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-500">
                                    <Lock className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </div>

                              {/* Centro da Capa: Título do Tema Sem Negrito e Sem Abreviações */}
                              <div className="my-auto py-2 z-[1] w-full">
                                <h3 className={`font-sans font-normal text-[12.5px] sm:text-[14px] leading-snug break-words ${
                                  tema.disponivel ? 'text-white drop-shadow-sm' : 'text-zinc-300'
                                }`}>
                                  {tema.nome}
                                </h3>
                              </div>

                              {/* Rodapé da Capa: Progresso ou Status */}
                              <div className="z-[1] pt-1.5 border-t border-white/15 w-full">
                                {tema.disponivel ? (
                                  <div>
                                    <div className="flex items-center justify-between text-[10px] font-normal text-white/90 mb-1">
                                      <span>{prog.concluidos > 0 ? `${prog.concluidos}/${prog.total} concluídos` : 'Iniciar'}</span>
                                      <span className="font-normal font-sans">{prog.percent}%</span>
                                    </div>
                                    <div className="w-full bg-black/35 h-1.5 rounded-full overflow-hidden border border-white/20">
                                      <div 
                                        className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${Math.max(prog.percent, 8)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between text-[9.5px] text-zinc-400 font-normal">
                                    <span>Bloqueado</span>
                                    <span className="uppercase text-[8.5px] font-normal tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 text-zinc-400">
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
                <h2 className="text-xl sm:text-2xl font-normal uppercase tracking-widest text-white">{selectedDisciplina}</h2>
                <p className="text-zinc-400 mt-2 font-normal">Encontre as palavras ocultas e decifre os conceitos!</p>
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
                              <span className="font-normal text-xs tracking-wider uppercase">{nivelItem.nivel}</span>
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
