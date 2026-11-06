import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, CheckCircle2, XCircle, Sparkles, BookOpen,
  Bot, Headphones, Award, Layers, Search, Cloud, Smartphone,
  Zap, FileText, Check, ArrowRight, Scale, Brain, Shield,
  Database, RefreshCw, Lock, Compass, Flame, TrendingUp
} from 'lucide-react';

interface Props {
  planoNome?: string;
}

export default function AssinaturaDireitosGuia({ planoNome = 'Plano Anual' }: Props) {
  const itensTabela = [
    {
      recurso: 'Vade Mecum & Legislação Completa',
      descricao: 'CF/88, Códigos, Estatutos, Súmulas e Legislação Extravagante',
      gratuito: 'Apenas 3 códigos demonstrativos',
      premium: 'Mais de 2.000 leis e códigos completos',
      destaque: true,
    },
    {
      recurso: 'Inteligência Artificial Jurídica (Tutor 24/7)',
      descricao: 'Respostas doutrinárias, correlações e explicação de artigos',
      gratuito: 'Limite diário de 3 perguntas simples',
      premium: 'Acesso Ilimitado 24/7 sem filtros ou cotas',
      destaque: true,
    },
    {
      recurso: 'Narração em Áudio de Artigos & Leis',
      descricao: 'Ouça artigos no trânsito, academia ou transporte com voz HD',
      gratuito: 'Bloqueado',
      premium: 'Áudio contínuo em segundo plano (0.75x a 2.0x)',
      destaque: false,
    },
    {
      recurso: 'Aulas Interativas em Três Atos',
      descricao: 'Fundamentos, Aprofundamento Doutrinário e Fixação Prática',
      gratuito: 'Apenas aula introdutória',
      premium: 'Todas as disciplinas e trilhas completas',
      destaque: false,
    },
    {
      recurso: 'Banco de Questões OAB & Concursos',
      descricao: 'Milhares de itens com gabarito comentado alternativa por alternativa',
      gratuito: '5 questões demonstrativas',
      premium: 'Acesso total a milhares de questões comentadas',
      destaque: true,
    },
    {
      recurso: 'Flashcards Inteligentes com Algoritmo SRS',
      descricao: 'Repetição espaçada baseada na curva de esquecimento de Ebbinghaus',
      gratuito: '1 baralho básico fixo',
      premium: 'Baralhos ilimitados com cálculo científico de revisão',
      destaque: false,
    },
    {
      recurso: 'Modo de Leitura 100% Offline',
      descricao: 'Estude sem internet no metrô, viagens ou locais sem sinal',
      gratuito: 'Não disponível',
      premium: 'Download completo no dispositivo sem gastar dados',
      destaque: true,
    },
    {
      recurso: 'Marcações, Grifos e Notas Pessoais',
      descricao: 'Destaques coloridos e anotações marginais seguras na nuvem',
      gratuito: 'Máximo de 5 grifos',
      premium: 'Grifos policromáticos e anotações ilimitadas',
      destaque: false,
    },
    {
      recurso: 'Sincronização Multidispositivo',
      descricao: 'Mesma conta no Celular Android, iPhone, iPad, PC e Web',
      gratuito: 'Apenas 1 dispositivo local',
      premium: 'Acesso simultâneo em todos os seus aparelhos',
      destaque: false,
    },
    {
      recurso: 'Informativos STF & STJ Esquematizados',
      descricao: 'Jurisprudência selecionada, repercussões gerais e teses',
      gratuito: 'Apenas manchetes resumidas',
      premium: 'Análise detalhada de teses e repercussões',
      destaque: false,
    },
    {
      recurso: 'Peças & Modelos Processuais Práticos',
      descricao: 'Modelos para a 2ª Fase da OAB e prática da advocacia',
      gratuito: 'Bloqueado',
      premium: 'Acervo completo com modelos de petições e recursos',
      destaque: false,
    },
    {
      recurso: 'Ambiente Livre de Publicidade',
      descricao: 'Zero anúncios, zero banners invasivos, 100% focado no aprendizado',
      gratuito: 'Com anúncios e interrupções',
      premium: 'Experiência 100% limpa, veloz e sem anúncios',
      destaque: true,
    },
  ];

  const paragrafos = [
    {
      num: '§ 01',
      titulo: 'Vade Mecum Digital Inteligente e Legislação Viva',
      texto: 'Sua assinatura assegura acesso integral, irrestrito e atualizado em tempo real a todo o acervo legislativo do país: Constituição Federal de 1988, Código Civil, Código de Processo Civil, Código Penal, Código de Processo Penal, Consolidação das Leis do Trabalho (CLT), Código Tributário Nacional, Código de Defesa do Consumidor, Código de Trânsito Brasileiro, Estatuto da Criança e do Adolescente, Estatuto da OAB e um repositório exaustivo de leis federais extravagantes com remissões cruzadas e índice alfabético-remissivo instantâneo.',
    },
    {
      num: '§ 02',
      titulo: 'Inteligência Artificial Jurídica Ilimitada 24 Horas',
      texto: 'Você dispõe de um consultor e tutor jurídico de inteligência artificial de altíssima precisão técnica, treinado especificamente nos repertórios de Direito Público e Privado, sem qualquer limite diário de mensagens ou travas de créditos. Tire dúvidas doutrinárias imediatas, solicite correlações entre dispositivos legais, peça explicações em português claro ou obtenha análises de admissibilidade e distinção jurisprudencial (distinguishing).',
    },
    {
      num: '§ 03',
      titulo: 'Narração em Áudio Humano e Sintético de Alta Resolução',
      texto: 'Transforme o tempo perdido no trânsito, na academia, no transporte público ou durante tarefas domésticas em horas líquidas de estudo. Todos os artigos de lei, códigos e aulas contam com reprodutor de áudio dedicado com controle de velocidade de 0.75x até 2.0x, reprodução contínua em segundo plano com a tela do celular apagada e sincronismo em tempo real com o texto legal.',
    },
    {
      num: '§ 04',
      titulo: 'Aulas Interativas na Metodologia Pedagógica em Três Atos',
      texto: 'O aprendizado é estruturado segundo as melhores práticas das ciências cognitivas: Ato 1 (Fundamentos da Norma e Letra da Lei Seca), Ato 2 (Aprofundamento Doutrinário e Debates Jurisprudenciais) e Ato 3 (Fixação Ativa com Casos Práticos e Questões). Essa abordagem garante que você não apenas memorize termos, mas domine os conceitos essenciais exigidos nas provas discursivas e orais.',
    },
    {
      num: '§ 05',
      titulo: 'Banco Completo de Questões Comentadas de OAB e Concursos',
      texto: 'Pratique com milhares de questões reais extraídas dos exames da Ordem dos Advogados do Brasil (FGV) e dos principais concursos públicos de carreiras jurídicas (Cebraspe, FCC, Vunesp, etc.). Cada item conta com gabarito justificado detalhadamente, apontando os vícios das alternativas incorretas e citando o dispositivo exato da lei ou súmula aplicável.',
    },
    {
      num: '§ 06',
      titulo: 'Sistema de Repetição Espaçada com Flashcards (Algoritmo SRS)',
      texto: 'Chega de esquecer prazos processuais, quóruns constitucionais e teorias penais dias após a leitura. O algoritmo SRS do Direito Prime replica matematicamente a Curva do Esquecimento de Hermann Ebbinghaus, agendando revisões personalizadas para o dia exato em que seu cérebro começaria a desvanecer a informação, garantindo retenção de longo prazo.',
    },
    {
      num: '§ 07',
      titulo: 'Informativos e Jurisprudência Compilada do STF e STJ',
      texto: 'Mantenha-se na vanguarda jurídica com resumos esquematizados dos julgamentos mais recentes do Supremo Tribunal Federal e do Superior Tribunal de Justiça. Tenha acesso a teses de Repercussão Geral, Recursos Especiais Repetitivos, Súmulas Vinculantes e controvérsias das Turmas de Direito Público, Privado e Criminal com linguagem analítica e direta.',
    },
    {
      num: '§ 08',
      titulo: 'Operação 100% Offline e Economia de Dados Móveis',
      texto: 'Estude em qualquer lugar do Brasil sem gastar seu plano de internet móvel ou depender de redes Wi-Fi instáveis. O aplicativo conta com arquitetura de armazenamento local criptografado que permite consultar códigos, resolver questões já baixadas e revisar flashcards no metrô, avião ou em salas de aula sem conectividade.',
    },
    {
      num: '§ 09',
      titulo: 'Marcações Policromáticas e Anotações na Nuvem',
      texto: 'Personalize seu material de estudos com até 6 cores exclusivas de grifos táteis e elabore anotações marginais detalhadas nos artigos. Todas as suas personalizações são sincronizadas automaticamente com a nuvem Supabase, de modo que você nunca perderá seus apontamentos, mesmo trocando de smartphone ou reinstalando o aplicativo.',
    },
    {
      num: '§ 10',
      titulo: 'Atualizações Legislativas Automáticas em Tempo Real',
      texto: 'Esqueça os velhos Vade Mecums físicos em papel que ficam desatualizados dias após a compra. Nossa engenharia monitora diariamente o Diário Oficial da União e o Congresso Nacional, incorporando Emendas Constitucionais, Leis Complementares e Leis Ordinárias recém-sancionadas diretamente no corpo do texto legal, sem nenhuma taxa adicional de atualização.',
    },
    {
      num: '§ 11',
      titulo: 'Biblioteca de Peças e Modelos Processuais Práticos',
      texto: 'Acelere sua preparação para a 2ª Fase da OAB e para a advocacia prática com modelos de peças estruturados: petições iniciais, contestações, embargos de declaração, apelações, agravos de instrumento, recursos especiais e habeas corpus. Cada modelo inclui orientações sobre endereçamento, dosimetria de teses e pedidos de tutela provisória.',
    },
    {
      num: '§ 12',
      titulo: 'Dicionário Jurídico Enciclopédico e Brocardos Latinos',
      texto: 'Consulte rapidamente o significado forense de expressões arcaicas, institutos do Direito Romano e brocardos latinos utilizados com frequência em acórdãos e peças jurídicas de alto nível. Cada verbete traz a tradução literal, o contexto histórico e sua real aplicação no ordenamento jurídico pátrio vigente.',
    },
    {
      num: '§ 13',
      titulo: 'Artigos Doutrinários Exclusivos do Blogger Jurídico',
      texto: 'Leituras aprofundadas com análises sobre filosofia do Direito, sociologia jurídica, evolução das decisões do Supremo e temas de alta indagação doutrinária. Os artigos do blog são selecionados para enriquecer a bagagem cultural e a capacidade argumentativa necessária para etapas discursivas e provas orais.',
    },
    {
      num: '§ 14',
      titulo: 'Cronogramas Estruturados por Carreiras Jurídicas',
      texto: 'Otimize seu planejamento diário através de trilhas de estudo estruturadas para Carreiras da Magistratura Estadual e Federal, Ministério Público, Defensoria Pública, Delegado de Polícia Civil e Federal, Procuradorias e OAB 1ª Fase, direcionando seu tempo para os tópicos estatisticamente mais cobrados por banca.',
    },
    {
      num: '§ 15',
      titulo: 'Mapas Mentais e Diagramas Visuais de Fixação Rápida',
      texto: 'Disponibilidade de esquemas conceituais em alta definição para memorizar temas áridos com facilidade: Teoria do Fato Típico, Linha do Tempo da Execução Penal, Procedimento Comum do CPC, Remédios Constitucionais e Repartição de Competências Federativas.',
    },
    {
      num: '§ 16',
      titulo: 'Multiplataforma Total com Licença Unificada',
      texto: 'Sua assinatura é única e concede acesso simultâneo em todos os seus ecossistemas digitais: utilize no smartphone Android enquanto se desloca, no iPad ou tablet durante a leitura noturna, e no computador ou notebook (Web/Desktop) para redigir peças e responder simulados extensos com o conforto do teclado físico.',
    },
    {
      num: '§ 17',
      titulo: 'Ambiente 100% Livre de Anúncios e Distrações',
      texto: 'A cognição humana necessita de foco pleno para absorver matérias densas. Por isso, a versão Premium é rigorosamente desprovida de banners promocionais de terceiros, popups invasivos, contadores de tempo artificiais ou vídeos de publicidade, proporcionando uma experiência de leitura limpa e de alta performance.',
    },
    {
      num: '§ 18',
      titulo: 'Painel Analítico de Desempenho e Métricas de Produtividade',
      texto: 'Acompanhe visualmente sua evolução através de relatórios de desempenho: total de artigos lidos, taxa de acerto por matéria, tempo diário dedicado e mapeamento dos pontos fracos que necessitam de reforço antes da data da sua prova.',
    },
    {
      num: '§ 19',
      titulo: 'Processamento Prioritário em Servidores de Baixa Latência',
      texto: 'Assinantes contam com nós dedicados de processamento na nuvem, garantindo buscas instantâneas na lei seca em menos de 30 milissegundos, geração imediata de resumos e respostas prioritárias no motor de inteligência artificial mesmo em horários de pico.',
    },
    {
      num: '§ 20',
      titulo: 'Garantia Bancária Asaas e Liberdade de Gestão',
      texto: 'Todas as operações de cobrança são processadas com criptografia bancária militar através da instituição regulada Asaas Pagamentos e das lojas oficiais Google Play e Apple Store. Você mantém total autonomia sobre seu plano, com histórico financeiro transparente e controle de cancelamento da renovação automática a qualquer momento com um único clique.',
    },
  ];

  return (
    <section className="mt-10 space-y-10">
      {/* Header do Guia com Badge Premium */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Guia Exclusivo do Assinante
        </div>
        <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wide text-foreground">
          O Que Sua Assinatura Garante
        </h3>
        <p className="font-body text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Conheça cada um dos direitos, recursos e garantias inclusos no seu <span className="text-foreground font-semibold">{planoNome}</span>. Um ecossistema de alto rendimento projetado para a sua aprovação.
        </p>
      </div>

      {/* INFOGRÁFICO SVG 1: O Ecossistema Direito Prime (SVG Gráfico Ilustrado) */}
      <div className="rounded-3xl border border-border/70 bg-card/50 p-5 sm:p-7 shadow-xl backdrop-blur-md overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-border/50 pb-4">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-wider text-primary">
              Infográfico 01 · Arquitetura Integrada
            </span>
            <h4 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground">
              O Ecossistema Completo Direito Prime
            </h4>
          </div>
          <span className="text-xs text-muted-foreground font-body">
            4 Pilares de Alta Performance
          </span>
        </div>

        {/* SVG Diagrama do Ecossistema */}
        <div className="w-full flex items-center justify-center py-4 overflow-x-auto">
          <svg
            viewBox="0 0 760 380"
            className="w-full max-w-[760px] h-auto drop-shadow-2xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Definições de Gradientes e Efeitos */}
            <defs>
              <linearGradient id="primeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <linearGradient id="nodeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="nodeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="nodeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="nodeGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.05" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Linhas de Conexão Radiantes com feixes de luz */}
            <line x1="380" y1="190" x2="150" y2="90" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.6" />
            <line x1="380" y1="190" x2="610" y2="90" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.6" />
            <line x1="380" y1="190" x2="150" y2="290" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.6" />
            <line x1="380" y1="190" x2="610" y2="290" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.6" />

            {/* Anéis Centrais Orbitais */}
            <circle cx="380" cy="190" r="85" stroke="#DC2626" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="380" cy="190" r="115" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.1" />

            {/* NÓ CENTRAL: DIREITO PRIME CORE */}
            <circle cx="380" cy="190" r="54" fill="url(#primeGrad)" filter="url(#glowFilter)" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.4" />
            <text x="380" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">DIREITO</text>
            <text x="380" y="202" textAnchor="middle" fill="#FEE2E2" fontSize="12" fontWeight="800" fontFamily="sans-serif" letterSpacing="2">PRIME</text>
            <text x="380" y="218" textAnchor="middle" fill="#FECACA" fontSize="8" fontWeight="600" fontFamily="sans-serif" letterSpacing="1">PREMIUM</text>

            {/* NÓ 1 (Superior Esquerdo): LEGISLAÇÃO & VADE MECUM */}
            <g transform="translate(40, 30)">
              <rect width="220" height="90" rx="16" fill="url(#nodeGrad1)" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.5" />
              <circle cx="30" cy="45" r="16" fill="#1E3A8A" fillOpacity="0.6" />
              <path d="M24 45L28 49L36 41" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="56" y="38" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">VADE MECUM VIVO</text>
              <text x="56" y="54" fill="#93C5FD" fontSize="9.5" fontWeight="500" fontFamily="sans-serif">2.000+ Leis, Códigos & Súmulas</text>
              <text x="56" y="68" fill="#60A5FA" fontSize="8.5" fontWeight="400" fontFamily="sans-serif">Atualizações em tempo real</text>
            </g>

            {/* NÓ 2 (Superior Direito): INTELIGÊNCIA ARTIFICIAL */}
            <g transform="translate(500, 30)">
              <rect width="220" height="90" rx="16" fill="url(#nodeGrad4)" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.5" />
              <circle cx="30" cy="45" r="16" fill="#4C1D95" fillOpacity="0.6" />
              <path d="M24 45L28 49L36 41" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="56" y="38" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">IA JURÍDICA ILIMITADA</text>
              <text x="56" y="54" fill="#C4B5FD" fontSize="9.5" fontWeight="500" fontFamily="sans-serif">Tutor Forense 24h sem cotas</text>
              <text x="56" y="68" fill="#A78BFA" fontSize="8.5" fontWeight="400" fontFamily="sans-serif">Explicações e Doutrina instantânea</text>
            </g>

            {/* NÓ 3 (Inferior Esquerdo): FIXAÇÃO & QUESTÕES */}
            <g transform="translate(40, 245)">
              <rect width="220" height="90" rx="16" fill="url(#nodeGrad2)" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.5" />
              <circle cx="30" cy="45" r="16" fill="#064E3B" fillOpacity="0.6" />
              <path d="M24 45L28 49L36 41" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="56" y="38" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">FIXAÇÃO & QUESTÕES</text>
              <text x="56" y="54" fill="#A7F3D0" fontSize="9.5" fontWeight="500" fontFamily="sans-serif">Flashcards SRS + Questões OAB</text>
              <text x="56" y="68" fill="#34D399" fontSize="8.5" fontWeight="400" fontFamily="sans-serif">Comentadas e com repetição</text>
            </g>

            {/* NÓ 4 (Inferior Direito): MULTIPLATAFORMA & ÁUDIO */}
            <g transform="translate(500, 245)">
              <rect width="220" height="90" rx="16" fill="url(#nodeGrad3)" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.5" />
              <circle cx="30" cy="45" r="16" fill="#78350F" fillOpacity="0.6" />
              <path d="M24 45L28 49L36 41" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <text x="56" y="38" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">ÁUDIO & OFFLINE TOTAL</text>
              <text x="56" y="54" fill="#FDE68A" fontSize="9.5" fontWeight="500" fontFamily="sans-serif">Ouça em 2º plano sem internet</text>
              <text x="56" y="68" fill="#FBBF24" fontSize="8.5" fontWeight="400" fontFamily="sans-serif">iOS, Android, Web e Desktop</text>
            </g>
          </svg>
        </div>
      </div>

      {/* INFOGRÁFICO SVG 2: Ciclo de Alta Performance nos Estudos */}
      <div className="rounded-3xl border border-border/70 bg-card/50 p-5 sm:p-7 shadow-xl backdrop-blur-md overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-border/50 pb-4">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Infográfico 02 · Metodologia Científica
            </span>
            <h4 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground">
              O Ciclo de Aprendizagem Acelerada
            </h4>
          </div>
          <span className="text-xs text-muted-foreground font-body">
            Do Primeiro Contato à Aprovação
          </span>
        </div>

        {/* SVG Pipeline de Aprendizagem */}
        <div className="w-full flex items-center justify-center py-4 overflow-x-auto">
          <svg
            viewBox="0 0 740 180"
            className="w-full max-w-[740px] h-auto drop-shadow-xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Linha mestra conectora */}
            <line x1="80" y1="80" x2="660" y2="80" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
            <line x1="80" y1="80" x2="660" y2="80" stroke="#DC2626" strokeWidth="2" strokeDasharray="8 8" />

            {/* PASSO 1: LEITURA ATIVA */}
            <g transform="translate(80, 80)">
              <circle cx="0" cy="0" r="26" fill="#1F2937" stroke="#DC2626" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="sans-serif">1</text>
              <text x="0" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">LEITURA DA LEI</text>
              <text x="0" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="8.5" fontFamily="sans-serif">Grifos policromáticos</text>
            </g>

            {/* PASSO 2: IA & DOUTRINA */}
            <g transform="translate(225, 80)">
              <circle cx="0" cy="0" r="26" fill="#1F2937" stroke="#8B5CF6" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="sans-serif">2</text>
              <text x="0" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">TUTOR IA</text>
              <text x="0" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="8.5" fontFamily="sans-serif">Dúvidas doutrinárias</text>
            </g>

            {/* PASSO 3: AULAS 3 ATOS */}
            <g transform="translate(370, 80)">
              <circle cx="0" cy="0" r="26" fill="#1F2937" stroke="#3B82F6" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="sans-serif">3</text>
              <text x="0" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">AULAS 3 ATOS</text>
              <text x="0" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="8.5" fontFamily="sans-serif">Aprofundamento</text>
            </g>

            {/* PASSO 4: SRS FLASHCARDS */}
            <g transform="translate(515, 80)">
              <circle cx="0" cy="0" r="26" fill="#1F2937" stroke="#F59E0B" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="sans-serif">4</text>
              <text x="0" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">REPETIÇÃO SRS</text>
              <text x="0" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="8.5" fontFamily="sans-serif">Memória de longo prazo</text>
            </g>

            {/* PASSO 5: QUESTÕES & SIMULADOS */}
            <g transform="translate(660, 80)">
              <circle cx="0" cy="0" r="26" fill="#1F2937" stroke="#10B981" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="sans-serif">5</text>
              <text x="0" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">QUESTÕES OAB</text>
              <text x="0" y="58" textAnchor="middle" fill="#9CA3AF" fontSize="8.5" fontFamily="sans-serif">Domínio e Aprovação</text>
            </g>
          </svg>
        </div>
      </div>

      {/* TABELA COMPARATIVA COMPLETA: GRATUITO VS PREMIUM */}
      <div className="rounded-3xl border border-border/70 bg-card/50 p-4 sm:p-7 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-border/50 pb-4">
          <div>
            <span className="font-body text-[11px] font-bold uppercase tracking-wider text-primary">
              Comparativo Oficial de Recursos
            </span>
            <h4 className="font-display text-lg sm:text-2xl font-bold uppercase tracking-wide text-foreground">
              Conta Gratuita vs Assinante Premium
            </h4>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Você é Premium
          </span>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/30">
                <th className="py-3 px-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground w-[40%]">
                  Recurso & Benefício
                </th>
                <th className="py-3 px-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground w-[30%]">
                  Modo Gratuito
                </th>
                <th className="py-3 px-4 font-display text-xs font-bold uppercase tracking-wider text-primary w-[30%]">
                  Assinante Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs sm:text-sm">
              {itensTabela.map((item, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-secondary/20 ${
                    item.destaque ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <p className="font-display font-bold text-foreground text-sm">
                      {item.recurso}
                    </p>
                    <p className="font-body text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      {item.descricao}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground/80 font-body">
                    <div className="flex items-start gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-500/70 shrink-0 mt-0.5" />
                      <span>{item.gratuito}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-body font-semibold text-emerald-400">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item.premium}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 20 PARÁGRAFOS EXPLICATIVOS DETALHADOS */}
      <div className="rounded-3xl border border-border/70 bg-card/40 p-5 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div className="border-b border-border/50 pb-4">
          <span className="font-body text-[11px] font-bold uppercase tracking-wider text-primary">
            Detalhamento Contratual Completo
          </span>
          <h4 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground mt-1">
            Os 20 Direitos Assegurados na Sua Assinatura
          </h4>
          <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">
            Cada cláusula e funcionalidade abaixo está plenamente ativa e garantida para a sua conta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {paragrafos.map((p, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-secondary/20 p-4 sm:p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary font-display font-bold text-xs tracking-wider">
                  {p.num}
                </span>
                <h5 className="font-display font-bold text-sm sm:text-base text-foreground uppercase tracking-tight">
                  {p.titulo}
                </h5>
              </div>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed text-justify">
                {p.texto}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Selo de Garantia e Infraestrutura Asaas */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-foreground">
              Ambiente Criptografado & Auditado
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Transações financeiras processadas via Asaas Pagamentos e protegidas por SSL 256-bit.
            </p>
          </div>
        </div>
        <span className="font-display text-xs font-semibold text-foreground/80 px-3 py-1 rounded-lg bg-secondary border border-border/60">
          Direito Prime Premium
        </span>
      </div>
    </section>
  );
}
