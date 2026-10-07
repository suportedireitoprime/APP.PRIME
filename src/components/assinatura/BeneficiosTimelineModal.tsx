import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Sparkles, Scale, Bot, CheckCircle2, FileText, Headphones, Zap, Landmark, Layers, WifiOff, Award, ArrowRight, ShieldCheck, Check, Target, BookOpen, Brain, Library, GraduationCap, Tv, Gavel, Podcast, Mic, Bell, Briefcase, PenTool, Search, Trophy, Gamepad2, Map, Newspaper, FolderOpen, Globe } from 'lucide-react';
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
    id: 'feat_0',
    numero: '01',
    titulo: 'Vade Mecum Inteligente',
    categoria: 'RECURSO INCLUSO',
    badge: 'O Mais Completo',
    cor: 'from-rose-600 to-amber-600',
    icon: Scale,
    funcoes: [
      'Todas as leis federais atualizadas',
      'Busca por termo, número ou assunto',
      'Súmulas Vinculantes e STJ integradas',
      'Leitura formatada e confortável',
      'Histórico de artigos lidos',
      'Organização por áreas do Direito',
      'Comparador de versões da lei',
      'Índice e hierarquia completa'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_1',
    numero: '02',
    titulo: 'IA Jurídica (Horus)',
    categoria: 'RECURSO INCLUSO',
    badge: 'Exclusivo',
    cor: 'from-amber-500 to-orange-500',
    icon: Brain,
    funcoes: [
      'Assistente 24h no WhatsApp',
      'Tira-dúvidas ilimitado sobre leis',
      'Gerador de peças e contratos',
      'Resumos automáticos de artigos',
      'Explicações em linguagem simples',
      'Exemplos práticos instantâneos',
      'Análise de jurisprudência',
      'Sugestão de teses e argumentos'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_2',
    numero: '03',
    titulo: 'Biblioteca Jurídica',
    categoria: 'RECURSO INCLUSO',
    badge: '+200 Títulos Premium',
    cor: 'from-primary to-rose-600',
    icon: Library,
    funcoes: [
      '+200 livros e ebooks jurídicos',
      'Resumos dos temas mais cobrados',
      'Doutrinas e clássicos do Direito',
      'Biografias de juristas históricos',
      'Leitura offline com progresso',
      'Curadoria da equipe editorial',
      'Audiobooks por capítulo',
      'Destaques e notas pessoais'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_3',
    numero: '04',
    titulo: 'Questões & Simulados',
    categoria: 'RECURSO INCLUSO',
    badge: 'Essencial',
    cor: 'from-blue-500 to-indigo-600',
    icon: GraduationCap,
    funcoes: [
      'Milhares de questões comentadas',
      'Simulados por cargo e banca',
      'Trilhas de estudo progressivas',
      'Desafios diários gamificados',
      'Cadernos de erros inteligente',
      'Estatísticas de desempenho',
      'Revisão espaçada automática',
      'Questões por área e matéria'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_4',
    numero: '05',
    titulo: 'Kit de Estudos',
    categoria: 'RECURSO INCLUSO',
    badge: 'Aceleração',
    cor: 'from-cyan-500 to-blue-500',
    icon: Sparkles,
    funcoes: [
      'Narração nativa com voz humana',
      'Milhares de Flashcards integrados',
      'Mapas mentais da legislação',
      'Simulados comentados por banca',
      'Grifos virtuais sincronizados',
      'Anotações salvas por artigo',
      'Planos de estudo personalizados',
      'Questões com gabarito comentado'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_5',
    numero: '06',
    titulo: 'Videoaulas',
    categoria: 'RECURSO INCLUSO',
    badge: 'Catálogo Premium',
    cor: 'from-emerald-500 to-teal-500',
    icon: Tv,
    funcoes: [
      'Videoaulas por lei e matéria',
      'Professores especializados',
      'Trilhas completas por cargo',
      'Anotações integradas ao vídeo',
      'Conquistas e progresso visual',
      'Velocidade de reprodução',
      'Mini-player flutuante',
      'Catálogo por concurso'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_6',
    numero: '07',
    titulo: 'Flashcards Avançado',
    categoria: 'RECURSO INCLUSO',
    badge: 'Memorização Ativa',
    cor: 'from-teal-500 to-blue-600',
    icon: Layers,
    funcoes: [
      'Flashcards por lei e matéria',
      'Decks de jurisprudência',
      'Prazos e exceções processuais',
      'Termos e classificações',
      'Filósofos e juristas históricos',
      'Cartões Cornell de revisão',
      'Desafios cronometrados',
      'Progresso por categoria'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_7',
    numero: '08',
    titulo: 'Jurisprudência',
    categoria: 'RECURSO INCLUSO',
    badge: 'STF & STJ',
    cor: 'from-emerald-500 to-teal-600',
    icon: Gavel,
    funcoes: [
      'Jurisprudência comentada por IA',
      'Pesquisas prontas organizadas',
      'Informativos STF e STJ',
      'Teses e entendimentos atuais',
      'Súmulas com explicação',
      'Busca por tema e número',
      'Favoritar decisões relevantes',
      'Conexão com artigos da lei'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_8',
    numero: '09',
    titulo: 'Peças e Petições',
    categoria: 'RECURSO INCLUSO',
    badge: 'IA Generativa',
    cor: 'from-purple-500 to-pink-600',
    icon: FileText,
    funcoes: [
      'Gerador de petições iniciais',
      'Editor jurídico completo',
      'Modelos por área e ação',
      'Revisão inteligente por IA',
      'Formatação ABNT automática',
      'Fundamentação legal sugerida',
      'Exportação em PDF',
      'Histórico de peças salvas'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_9',
    numero: '10',
    titulo: 'Resumos Jurídicos',
    categoria: 'RECURSO INCLUSO',
    badge: 'Estudo Dirigido',
    cor: 'from-orange-500 to-red-500',
    icon: BookOpen,
    funcoes: [
      'Resumos por matéria e lei',
      'Resumos de jurisprudência',
      'Texto otimizado para fixação',
      'Organização por temas',
      'Áudio dos resumos narrados',
      'Favoritar e compartilhar',
      'Atualização automática',
      'Ideal para revisão final'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_10',
    numero: '11',
    titulo: 'Podcasts Jurídicos',
    categoria: 'RECURSO INCLUSO',
    badge: 'Em Qualquer Lugar',
    cor: 'from-indigo-500 to-purple-600',
    icon: Podcast,
    funcoes: [
      'Episódios sobre legislação',
      'Comentários de atualidades',
      'Player com velocidade ajustável',
      'Reprodução em segundo plano',
      'Curadoria por área do Direito',
      'Notificação de novos episódios',
      'Acesso offline salvo no app',
      'Temas de concurso e OAB'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_11',
    numero: '12',
    titulo: 'Leis Cantadas',
    categoria: 'RECURSO INCLUSO',
    badge: 'Fixação Musical',
    cor: 'from-pink-500 to-rose-600',
    icon: Mic,
    funcoes: [
      'Artigos musicados e cantados',
      'Player com letra sincronizada',
      'Fixação auditiva da lei seca',
      'Áudios por matéria do Direito',
      'Mini-player global flutuante',
      'Reprodução contínua e offline',
      'Velocidade de reprodução',
      'Conteúdo exclusivo original'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_12',
    numero: '13',
    titulo: 'Audioaulas',
    categoria: 'RECURSO INCLUSO',
    badge: 'Estude Ouvindo',
    cor: 'from-rose-500 to-primary',
    icon: Headphones,
    funcoes: [
      'Aulas narradas profissionais',
      'Ouça em trânsito e exercícios',
      'Player com velocidade variável',
      'Progresso salvo por capítulo',
      'Conteúdo por lei e matéria',
      'Mini-player em background',
      'Download para modo offline',
      'Notificação de novos áudios'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_13',
    numero: '14',
    titulo: 'Três Poderes Ao Vivo',
    categoria: 'RECURSO INCLUSO',
    badge: 'Tempo Real',
    cor: 'from-yellow-500 to-orange-500',
    icon: Landmark,
    funcoes: [
      'Agenda da Câmara dos Deputados',
      'Pauta do Senado Federal',
      'Sessões ao vivo do STF',
      'Radar de votações do Congresso',
      'Rankings de parlamentares',
      'Proposições legislativas do dia',
      'Portais oficiais integrados',
      'Perfil detalhado por deputado'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_14',
    numero: '15',
    titulo: 'Radar Legislativo',
    categoria: 'RECURSO INCLUSO',
    badge: 'Alertas Inteligentes',
    cor: 'from-green-500 to-emerald-500',
    icon: Bell,
    funcoes: [
      'Alertas de novas leis publicadas',
      'Monitoramento por área jurídica',
      'Proposições em alta no Congresso',
      'Impacto de leis na sua área',
      'Categorias personalizáveis',
      'Notificações push em tempo real',
      'Histórico de alterações legais',
      'Radar por estado e competência'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_15',
    numero: '16',
    titulo: 'Ferramentas Pro',
    categoria: 'RECURSO INCLUSO',
    badge: 'Ecossistema',
    cor: 'from-cyan-400 to-blue-500',
    icon: Briefcase,
    funcoes: [
      'Radar de novas leis em tempo real',
      'App iOS, Android, Web e Desktop',
      'Offline Premium sem internet',
      'Zero anúncios e interrupções',
      'Suporte prioritário exclusivo',
      'Acesso antecipado a novidades',
      'Boletins legislativos diários',
      'Exportação de grifos e notas'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_16',
    numero: '17',
    titulo: 'Aprender (Trilhas)',
    categoria: 'RECURSO INCLUSO',
    badge: 'Gamificação',
    cor: 'from-violet-500 to-purple-600',
    icon: Zap,
    funcoes: [
      'Trilhas de aprendizado guiadas',
      'Teoria + questões integradas',
      'Progresso visual por módulo',
      'Desempenho e estatísticas',
      'Flashcards dentro da trilha',
      'Aulas interativas com IA',
      'Módulos por área e assunto',
      'Sistema de conquistas e XP'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_17',
    numero: '18',
    titulo: 'Modo Aula',
    categoria: 'RECURSO INCLUSO',
    badge: 'Estudo Focado',
    cor: 'from-red-500 to-orange-500',
    icon: PenTool,
    funcoes: [
      'Sessões de estudo cronometradas',
      'Aulas estruturadas por tema',
      'Chat com IA dentro da aula',
      'Avaliação inteligente ao final',
      'Progresso e sessões salvas',
      'Gráficos de desempenho',
      'Revisão de erros e acertos',
      'Metodologia de estudo ativa'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_18',
    numero: '19',
    titulo: 'Dicionário Jurídico',
    categoria: 'RECURSO INCLUSO',
    badge: 'Consulta Rápida',
    cor: 'from-rose-600 to-amber-600',
    icon: Search,
    funcoes: [
      'Termos jurídicos explicados',
      'Busca por palavra ou conceito',
      'Exemplos de uso no Direito',
      'Conexão com artigos da lei',
      'Linguagem acessível e direta',
      'Referências doutrinárias',
      'Histórico de consultas',
      'Favoritos e coleções'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_19',
    numero: '20',
    titulo: 'Gamificação & Metas',
    categoria: 'RECURSO INCLUSO',
    badge: 'Motivação Constante',
    cor: 'from-amber-500 to-orange-500',
    icon: Trophy,
    funcoes: [
      'Sistema de XP e níveis',
      'Conquistas por categoria',
      'Streak de dias consecutivos',
      'Desafios semanais exclusivos',
      'Rankings e posições',
      'Metas personalizadas',
      'Lembretes de estudo',
      'Histórico completo de progresso'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_20',
    numero: '21',
    titulo: 'Laboratório Visual',
    categoria: 'RECURSO INCLUSO',
    badge: 'Experiência Imersiva',
    cor: 'from-primary to-rose-600',
    icon: Gamepad2,
    funcoes: [
      'Artigos do Código em 3D',
      'Cenas interativas por tema',
      'Visual jurídico animado',
      'Grafo de conexões entre artigos',
      'Explicações visuais da lei',
      'Navegação imersiva',
      'Conteúdo exclusivo curado',
      'Ideal para estudo visual'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_21',
    numero: '22',
    titulo: 'Legislação Estadual',
    categoria: 'RECURSO INCLUSO',
    badge: 'Todos os Estados',
    cor: 'from-blue-500 to-indigo-600',
    icon: Map,
    funcoes: [
      'Constituições estaduais',
      'Leis orgânicas e estatutos',
      'Busca por estado e matéria',
      'Texto integral formatado',
      'Comparação entre estados',
      'Atualização automática',
      'Favoritar leis estaduais',
      'Portal oficial integrado'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_22',
    numero: '23',
    titulo: 'Notícias Jurídicas',
    categoria: 'RECURSO INCLUSO',
    badge: 'Atualidade',
    cor: 'from-cyan-500 to-blue-500',
    icon: Newspaper,
    funcoes: [
      'Feed de notícias em tempo real',
      'STF, STJ, Congresso e OAB',
      'Análise de impacto na lei',
      'Curadoria por área de atuação',
      'Notificações de breaking news',
      'Boletim matinal por WhatsApp',
      'Novidades e atualizações do app',
      'Edição diária do blog jurídico'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_23',
    numero: '24',
    titulo: 'Meu Espaço Pessoal',
    categoria: 'RECURSO INCLUSO',
    badge: 'Tudo Organizado',
    cor: 'from-emerald-500 to-teal-500',
    icon: FolderOpen,
    funcoes: [
      'Grifos e destaques unificados',
      'Anotações em um só lugar',
      'Leis e artigos favoritos',
      'Livros e filmes salvos',
      'Downloads para offline',
      'Minhas leituras em progresso',
      'Meus resumos e videoaulas',
      'Documentos pessoais na nuvem'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
  {
    id: 'feat_24',
    numero: '25',
    titulo: 'Temáticas & Filmes',
    categoria: 'RECURSO INCLUSO',
    badge: 'Cultura Jurídica',
    cor: 'from-teal-500 to-blue-600',
    icon: Globe,
    funcoes: [
      'Filmes e séries sobre Direito',
      'Ficha técnica e análise jurídica',
      'Conexão com leis e artigos',
      'Trilha de aprendizado por tema',
      'Sugestões personalizadas',
      'Avaliação e recomendação',
      'Porque assistir cada título',
      'Curadoria da equipe editorial'
    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },
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
            
            {/* Banner de Introdução Persuasivo */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-xl mx-auto mb-10 sm:mb-14"
            >
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                Tudo o que você desbloqueia <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-400 to-amber-400">
                  ao assinar o Direito Prime
                </span>
              </h1>
              <p className="text-[13px] sm:text-[14px] text-zinc-400 font-medium mt-3 leading-relaxed">
                Descubra por que milhares de estudantes e operadores do Direito abandonaram métodos tradicionais e alcançaram a aprovação com o nosso ecossistema integrado.
              </p>
            </motion.div>

            {/* Linha do Tempo (Timeline) */}
            <div className="relative mt-8">
              {/* Eixo Vertical Central Luminoso */}
              <motion.div 
                initial={{ height: 0 }}
                whileInView={{ height: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                aria-hidden="true"
                className="absolute left-1/2 top-4 w-[2px] -translate-x-1/2 bg-gradient-to-b from-primary via-emerald-500/80 to-amber-500 rounded-full shadow-[0_0_15px_rgba(224,31,71,0.5)] z-0 origin-top" 
              />

              <div className="space-y-12 sm:space-y-16 relative z-10">
                {BENEFICIOS.map((item, index) => {
                  const Icon = item.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, type: "spring", bounce: 0.3, delay: 0.1 }}
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
                        className={`relative w-[calc(50%-1.25rem)] sm:w-[calc(50%-1.5rem)] md:w-[45%] flex flex-col p-4 pt-8 sm:p-6 sm:pt-10 rounded-2xl sm:rounded-3xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-300 mt-6`}
                      >
                        {/* Ícone Vazado Centralizado */}
                        <div className={`absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-transparent flex items-center justify-center shrink-0 z-10`}>
                          <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${item.cor.split(' ')[0].replace('from-', 'text-')} stroke-[1.5] drop-shadow-xl`} />
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
                        {item.descricaoPersuasiva && (<p className="text-[11px] sm:text-[14px] text-zinc-300 leading-relaxed font-normal mb-3 sm:mb-5">{item.descricaoPersuasiva}</p>)}

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
