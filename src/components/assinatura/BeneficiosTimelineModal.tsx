import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Crown, 
  Sparkles, 
  Scale, 
  Bot, 
  CheckCircle2, 
  FileText, 
  Headphones, 
  Zap, 
  Landmark, 
  Layers, 
  WifiOff, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Check,
  Target,
  BookOpen
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ShapeGrid } from '@/components/ui/ShapeGrid';

interface BeneficioTimelineItem {
  id: string;
  numero: string;
  titulo: string;
  categoria: string;
  badge: string;
  cor: string;
  icon: React.ElementType;
  funcoes: string[];
  descricaoPersuasiva: string;
  impacto: string;
}

const BENEFICIOS: BeneficioTimelineItem[] = [
  {
    id: 'vade_mecum',
    numero: '01',
    titulo: 'Vade Mecum Interativo',
    categoria: 'LEGISLAÇÃO INTELIGENTE',
    badge: '100% Atualizado',
    cor: 'from-rose-600 to-amber-600',
    icon: Scale,
    funcoes: [
      'Narração de artigos em áudio profissional nativo',
      'Grifos coloridos e anotações pessoais salvas na nuvem',
      'Remissões inteligentes e notas doutrinárias',
      'Texto legal sempre compilado com as últimas leis'
    ],
    descricaoPersuasiva: 'Abandone os livros físicos pesados e desatualizados. Nosso Vade Mecum carrega instantaneamente em 0ms, lê os artigos para você e organiza seus destaques de forma sincronizada.',
    impacto: 'Legislação consolidada sempre à mão onde estiver'
  },
  {
    id: 'biblioteca',
    numero: '02',
    titulo: 'Biblioteca Digital Completa',
    categoria: 'ACERVO DOUTRINÁRIO',
    badge: 'Livros e Artigos',
    cor: 'from-amber-500 to-orange-500',
    icon: FileText,
    funcoes: [
      'Dezenas de obras doutrinárias atualizadas',
      'Leitor imersivo com ajustes de fonte e tema',
      'Sincronização de progresso de leitura',
      'Marcações e anotações vinculadas ao seu perfil'
    ],
    descricaoPersuasiva: 'Diga adeus às assinaturas caras de bibliotecas digitais. Tenha acesso a um acervo completo de doutrinas, artigos e obras jurídicas essenciais para o seu aprofundamento.',
    impacto: 'Aprofunde-se nos temas mais complexos'
  },
  {
    id: 'horus_ia',
    numero: '03',
    titulo: 'Inteligência Artificial Horus',
    categoria: 'TUTOR JURÍDICO 24H',
    badge: 'No WhatsApp e no App',
    cor: 'from-primary to-rose-600',
    icon: Bot,
    funcoes: [
      'Tira dúvidas jurídicas e doutrinárias em segundos',
      'Disponível 24h no seu WhatsApp sem burocracia',
      'Explica artigos difíceis em português claro',
      'Conectada à jurisprudência atual do STF e STJ'
    ],
    descricaoPersuasiva: 'Nunca mais perca horas travado em uma dúvida complexa. Tenha um mentor jurídico de elite no seu bolso pronto para esclarecer qualquer ponto de matéria a qualquer hora.',
    impacto: 'Estude até 3x mais rápido sem travar em dúvidas'
  },
  {
    id: 'flashcards',
    numero: '04',
    titulo: 'Flashcards com Repetição Espaçada',
    categoria: 'MEMORIZAÇÃO CIENTÍFICA',
    badge: 'Método Ativo',
    cor: 'from-blue-500 to-indigo-600',
    icon: Zap,
    funcoes: [
      'Baralhos prontos divididos por matérias e temas',
      'Algoritmo que recalcula quando você deve revisar',
      'Fixação de prazos, súmulas e fórmulas jurídicas',
      'Histórico de retenção e curvas de esquecimento'
    ],
    descricaoPersuasiva: 'Elimine a sensação de estudar muito e esquecer tudo depois de uma semana. O método mnemônico de repetição espaçada grava a matéria na sua memória de longo prazo.',
    impacto: 'Nunca mais esqueça prazos e súmulas cruciais'
  },
  {
    id: 'questoes',
    numero: '05',
    titulo: 'Banco de Questões',
    categoria: 'TREINO DIÁRIO',
    badge: 'Gabaritos Comentados',
    cor: 'from-cyan-500 to-blue-500',
    icon: CheckCircle2,
    funcoes: [
      'Filtros por banca examinadora, cargo e ano',
      'Gabaritos comentados alternativa por alternativa',
      'Métricas de precisão, tempo médio e acertos',
      'Criação de cadernos de erros personalizados'
    ],
    descricaoPersuasiva: 'A aprovação se constrói resolvendo questões. Treine com o padrão exato da banca do seu concurso ou da 1ª Fase da OAB, mapeando seus pontos fracos.',
    impacto: 'Domine o estilo de cobrança de cada banca'
  },
  {
    id: 'simulados',
    numero: '06',
    titulo: 'Simulados de Alta Performance',
    categoria: 'PREPARAÇÃO PARA PROVA',
    badge: 'Ranking Nacional',
    cor: 'from-emerald-500 to-teal-500',
    icon: Target,
    funcoes: [
      'Simulados inéditos focados nos maiores editais',
      'Ambiente de prova com cronômetro real',
      'Relatórios de desempenho por disciplina',
      'Comparativo com outros candidatos (Ranking)'
    ],
    descricaoPersuasiva: 'Teste seus conhecimentos em condições reais de prova. Identifique exatamente onde você perde tempo e quais matérias precisam de mais revisão.',
    impacto: 'Chegue na prova com controle emocional e de tempo'
  },
  {
    id: 'aulas',
    numero: '07',
    titulo: 'Videoaulas & Audioaulas',
    categoria: 'APRENDIZADO MULTIFORMATO',
    badge: 'Direto ao Ponto',
    cor: 'from-teal-500 to-blue-600',
    icon: Headphones,
    funcoes: [
      'Aulas objetivas sem enrolação teórica excessiva',
      'Player avançado com aceleração de até 2x',
      'Modo áudio para ouvir no trânsito ou academia',
      'Mini-player contínuo em segundo plano'
    ],
    descricaoPersuasiva: 'Transforme momentos ociosos do seu dia em tempo de estudo produtivo. Escute audioaulas no trânsito, na caminhada ou no intervalo, mantendo o cérebro sempre ativo.',
    impacto: 'Aproveite até 2 horas extras de estudo por dia'
  },
  {
    id: 'resumos',
    numero: '08',
    titulo: 'Resumos Jurídicos Prontos',
    categoria: 'SÍNTESES DE ALTA RETENÇÃO',
    badge: 'Economia de Tempo',
    cor: 'from-emerald-500 to-teal-600',
    icon: FileText,
    funcoes: [
      'Doutrina esquematizada dos tópicos mais cobrados',
      'Tabelas comparativas e quadros sinóticos',
      'Linguagem direta focada no que cai nas provas',
      'Leitura fluida otimizada para celular e tablet'
    ],
    descricaoPersuasiva: 'Economize centenas de horas na produção de materiais. Acesse resumos cirúrgicos elaborados por especialistas com foco estrito nos temas de maior incidência em exames.',
    impacto: 'Revise matérias inteiras na véspera da prova'
  },
  {
    id: 'mapas_3d',
    numero: '09',
    titulo: 'Mapas Mentais',
    categoria: 'ESTUDO VISUAL IMERSIVO',
    badge: 'Visualização Clara',
    cor: 'from-purple-500 to-pink-600',
    icon: Layers,
    funcoes: [
      'Visualização gráfica de fluxos de processos',
      'Cenas jurídicas ilustradas para fixação visual',
      'Artigos do Código em 3D e mapas conceituais',
      'Conexões estruturais entre ramos do Direito'
    ],
    descricaoPersuasiva: 'Perfeito para quem aprende melhor visualmente. Entenda procedimentos intricados e divisões de competência com diagramas interativos de clareza imediata.',
    impacto: 'Compreenda temas complexos em um único olhar'
  },
  {
    id: 'dicionario',
    numero: '10',
    titulo: 'Dicionário Jurídico',
    categoria: 'CONSULTA RÁPIDA',
    badge: 'Termos e Brocardos',
    cor: 'from-orange-500 to-red-500',
    icon: BookOpen,
    funcoes: [
      'Milhares de verbetes jurídicos explicados de forma simples',
      'Tradução de brocardos e expressões em latim',
      'Exemplos práticos de aplicação de cada termo',
      'Busca instantânea e offline'
    ],
    descricaoPersuasiva: 'Nunca mais fique perdido com o "juridiquês". Acesse o significado de qualquer termo ou expressão latina em segundos, sem interromper seu raciocínio.',
    impacto: 'Domine o vocabulário das provas e bancas'
  },
  {
    id: 'radar',
    numero: '11',
    titulo: 'Radar Legislativo & Jurisprudência',
    categoria: 'ATUALIZAÇÃO EM TEMPO REAL',
    badge: 'Primeira Mão',
    cor: 'from-indigo-500 to-purple-600',
    icon: Landmark,
    funcoes: [
      'Alertas instantâneos de novas leis publicadas no DOU',
      'Pauta de julgamentos do STF e sessões ao vivo',
      'Informativos esquematizados e comentados',
      'Classificação por área de impacto no Direito'
    ],
    descricaoPersuasiva: 'Esteja sempre atualizado com as mudanças que surpreendem a maioria dos candidatos. Seja informado no mesmo dia em que uma lei ou tese jurisprudencial for aprovada.',
    impacto: 'Esteja à frente das novidades que pegam todos de surpresa'
  },
  {
    id: 'offline',
    numero: '12',
    titulo: 'Modo Offline Premium',
    categoria: 'ACESSO EM QUALQUER LUGAR',
    badge: 'Zero Consumo 4G',
    cor: 'from-pink-500 to-rose-600',
    icon: WifiOff,
    funcoes: [
      'Download completo de leis, códigos e resumos',
      'Estudo ininterrupto no metrô, avião ou viagens',
      'Sincronização automática quando reconectar à internet',
      'Economia total do seu plano de dados móveis'
    ],
    descricaoPersuasiva: 'Sua rotina de estudos não pode parar por falta de sinal de internet. Com o modo offline nativo, você estuda em qualquer lugar com máxima velocidade e fluidez.',
    impacto: 'Estude em qualquer lugar sem depender de sinal'
  },
  {
    id: 'gamificacao',
    numero: '13',
    titulo: 'Gamificação & Meu Espaço',
    categoria: 'DISCIPLINA INABALÁVEL',
    badge: 'Rotina Diária',
    cor: 'from-rose-500 to-primary',
    icon: Award,
    funcoes: [
      'Metas diárias de estudo e sequência de consistência',
      'Ganho de experiência (XP), níveis e conquistas',
      'Central unificada com seus grifos e notas exportáveis',
      'Painel estatístico completo da sua evolução real'
    ],
    descricaoPersuasiva: 'O segredo da aprovação é a constância diária. Nosso sistema de gamificação transforma a rotina pesada de estudos em um desafio estimulante e recompensador.',
    impacto: 'Mantenha o foco diário até o dia da sua aprovação'
  }
];

interface BeneficiosTimelineModalProps {
  open: boolean;
  onClose: () => void;
  onGoToPlans: () => void;
}

export const BeneficiosTimelineModal: React.FC<BeneficiosTimelineModalProps> = ({
  open,
  onClose,
  onGoToPlans
}) => {
  useBodyScrollLock(open);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[10000] bg-[#08090C] text-white flex flex-col overflow-hidden"
      >
        {/* Fundo Padrão ShapeGrid */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <ShapeGrid />
        </div>

        {/* Corpo com Scroll e Linha do Tempo */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pt-[calc(4rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(7.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
          <div className="max-w-4xl mx-auto pt-6">
            
            {/* Linha do Tempo (Timeline) */}
            <div className="relative mt-8">
              {/* Eixo Vertical Central Luminoso */}
              <div 
                aria-hidden="true"
                className="absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-gradient-to-b from-primary via-emerald-500/80 to-amber-500 rounded-full shadow-[0_0_15px_rgba(224,31,71,0.5)] z-0" 
              />

              <div className="space-y-12 sm:space-y-16 relative z-10">
                {BENEFICIOS.map((item, index) => {
                  const Icon = item.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`relative flex items-center w-full ${isEven ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Marcador Central da Timeline com Número */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-neutral-900 border-2 border-primary/70 shadow-[0_0_15px_rgba(224,31,71,0.4)] flex items-center justify-center z-20 group shrink-0"
                      >
                        <span className="font-display font-black text-[11px] sm:text-sm text-primary">
                          {item.numero}
                        </span>
                      </div>

                      {/* Card Único Integrado */}
                      <div 
                        className={`relative w-[calc(50%-1.25rem)] sm:w-[calc(50%-1.5rem)] md:w-[45%] flex flex-col p-4 pt-6 sm:p-6 sm:pt-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-300 mt-6`}
                      >
                        {/* Ícone Vazado Metade Dentro/Metade Fora */}
                        <div className={`absolute -top-5 sm:-top-6 left-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-white/20 bg-[#08090C] flex items-center justify-center shadow-xl shrink-0 z-10`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 stroke-[1.5]" />
                        </div>

                        {/* Topo do Card */}
                        <div className="flex flex-col gap-1 mb-3">
                          <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${item.cor} block mb-0.5`}>
                            {item.categoria}
                          </span>
                          <h3 className="font-display font-black text-sm sm:text-lg text-white leading-tight">
                            {item.titulo}
                          </h3>
                        </div>

                        {/* Descrição Persuasiva */}
                        <p className="text-[11px] sm:text-[14px] text-zinc-300 leading-relaxed font-normal mb-3 sm:mb-5">
                          {item.descricaoPersuasiva}
                        </p>

                        {/* Lista de Recursos */}
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          {item.funcoes.map((funcao, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2">
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                              </div>
                              <span className="text-[10px] sm:text-[13px] text-zinc-300 font-medium leading-snug">
                                {funcao}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Impacto Direto e Badge */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-primary font-bold text-[10px] sm:text-xs line-clamp-2 sm:line-clamp-1">{item.impacto}</span>
                          <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 text-zinc-400 border border-white/5 shrink-0">
                            {item.badge}
                          </span>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Chamada Final na Linha do Tempo */}
            <div className="mt-14 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-black/60 to-neutral-900/90 border border-primary/30 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider mb-2">
                Comece agora sem nenhum risco
              </h2>
              <p className="text-[13px] sm:text-sm text-zinc-300 max-w-md mx-auto mb-5 leading-relaxed">
                Você tem <strong>7 dias de garantia incondicional</strong>. Se não sentir que seus estudos deram um salto de qualidade, devolvemos 100% do seu investimento.
              </p>
              <button
                onClick={() => {
                  haptic.medium();
                  onGoToPlans();
                }}
                className="btn-shine-loop inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-primary/30 active:scale-95 transition-all cursor-pointer"
              >
                <span>VER PLANOS E PREÇOS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Rodapé Fixo com Botão de Ação Imediata */}
        <footer className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-[#08090C]/90 backdrop-blur-2xl border-t border-white/10 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] flex items-center justify-center shadow-2xl">
          <div className="max-w-md w-full flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                haptic.medium();
                onGoToPlans();
              }}
              className="btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl font-display font-black text-sm sm:text-base tracking-wider bg-primary text-primary-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/40 group cursor-pointer uppercase"
            >
              <span>VER PLANOS</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </footer>

      </motion.div>
    </AnimatePresence>
  );
};
