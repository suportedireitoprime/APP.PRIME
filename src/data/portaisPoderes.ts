import { 
  Search, ListChecks, Activity, MonitorPlay, CalendarDays, FileSearch, 
  UploadCloud, FileCheck2, BookOpen, BarChart3, Users, MessageSquare, 
  Mic, Lightbulb, BellRing, Scale, FileText, Vote, GraduationCap, Building2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PortalPoder {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  category: string;
  fullExplanation: string;
  practicalExample: string;
  topics: string[];
}

export interface PoderPortaisData {
  title: string;
  subtitle: string;
  portais: PortalPoder[];
}

export const PORTAIS_PODERES: Record<string, PoderPortaisData> = {
  stf: {
    title: 'PORTAIS DO STF',
    subtitle: 'Serviços Oficiais',
    portais: [
      // Jurisprudência & Súmulas
      {
        id: 'jurisprudencia',
        title: 'Pesquisa de Jurisprudência',
        description: 'Consulta ao acervo de decisões e acórdãos.',
        url: 'https://jurisprudencia.stf.jus.br/',
        icon: Search,
        color: '#3B82F6',
        category: 'Jurisprudência & Súmulas',
        fullExplanation: 'A Pesquisa de Jurisprudência é a principal ferramenta para estudantes, advogados e juízes que buscam entender como a Suprema Corte decide. Através deste portal, você tem acesso ao acervo completo de acórdãos, decisões monocráticas e informativos de jurisprudência do STF.',
        practicalExample: 'Ao escrever uma petição, você pode usar este portal para buscar decisões recentes do Ministro Alexandre de Moraes sobre bloqueio de perfis em redes sociais, fortalecendo sua argumentação com precedentes exatos da Corte.',
        topics: ['Filtros avançados por relator e período', 'Acesso ao inteiro teor (PDF)', 'Informativos de Jurisprudência resumidos', 'Pesquisa de teses de Repercussão Geral']
      },
      {
        id: 'sumulas',
        title: 'Súmulas Vinculantes',
        description: 'Listagem dos enunciados com força vinculante.',
        url: 'https://portal.stf.jus.br/jurisprudencia/sumulas.asp',
        icon: ListChecks,
        color: '#F59E0B',
        category: 'Jurisprudência & Súmulas',
        fullExplanation: 'As Súmulas Vinculantes representam a cristalização do entendimento da Corte Suprema sobre temas constitucionais polêmicos. Uma vez aprovada, a Súmula Vinculante deve ser seguida por todos os juízes e por toda a Administração Pública.',
        practicalExample: 'Se a prefeitura da sua cidade descumprir uma regra clara, como exigir depósito prévio para recurso administrativo, você verifica aqui a Súmula Vinculante 21 e usa para embasar uma Reclamação direta no STF.',
        topics: ['Redação oficial e atualizada', 'Histórico de precedentes', 'Súmulas pendentes de aprovação', 'Índice temático e alfabético']
      },
      {
        id: 'repercussao-geral',
        title: 'Repercussão Geral',
        description: 'Painel de teses fixadas pela Suprema Corte.',
        url: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/',
        icon: Activity,
        color: '#10B981',
        category: 'Jurisprudência & Súmulas',
        fullExplanation: 'A Repercussão Geral é um filtro criado para que o STF julgue apenas temas que possuam relevância social, política, econômica ou jurídica. Neste painel, você consegue acompanhar os Temas de Repercussão Geral, verificando quais já tiveram o mérito julgado.',
        practicalExample: 'Seu processo sobre reajuste de FGTS está travado (sobrestado) na primeira instância. Você entra neste portal, digita o número do Tema e acompanha se o STF já marcou a data para decidir a questão que irá destravar sua ação.',
        topics: ['Teses fixadas com mérito julgado', 'Temas reconhecidos pendentes de julgamento', 'Acompanhamento do Plenário Virtual da RG', 'Impacto nos processos sobrestados']
      },
      // Serviços Processuais
      {
        id: 'sessao-virtual',
        title: 'Sessão Virtual',
        description: 'Acompanhamento em tempo real de votos e placares.',
        url: 'https://portal.stf.jus.br/sessao-virtual/',
        icon: MonitorPlay,
        color: '#8B5CF6',
        category: 'Serviços Processuais',
        fullExplanation: 'O Plenário Virtual revolucionou o julgamento no STF. Os Ministros depositam seus votos no ambiente virtual ao longo de uma semana. O portal permite acompanhar o placar ao vivo, ler os votos já disponibilizados e saber o status de um julgamento.',
        practicalExample: 'Na sexta-feira à noite, você abre este portal para ver se o seu recurso extraordinário, pautado na Turma Virtual, já recebeu votos ou se algum Ministro pediu vista e interrompeu a contagem.',
        topics: ['Placar de votação em tempo real', 'Leitura da íntegra dos votos inseridos', 'Acesso às sustentações orais gravadas', 'Acompanhamento de pedidos de vista/destaque']
      },
      {
        id: 'pauta-sessao',
        title: 'Pautas de Julgamento',
        description: 'Calendário de processos agendados (Presencial e Virtual).',
        url: 'https://portal.stf.jus.br/pautaSessao/',
        icon: CalendarDays,
        color: '#EC4899',
        category: 'Serviços Processuais',
        fullExplanation: 'O portal de Pautas de Julgamento reúne a previsão oficial das sessões do Plenário e das Turmas do STF. Você pode acessar a lista completa de processos pautados para cada dia, incluindo informações sobre os relatores e as partes envolvidas.',
        practicalExample: 'Seu escritório enviou um memorial para os Ministros na semana passada. Hoje você usa a pauta para verificar se o processo foi incluído na sessão plenária de quinta-feira e se preparar para assistir.',
        topics: ['Calendário do semestre completo', 'Pautas do Plenário e das 1ª e 2ª Turmas', 'Divisão entre sessões físicas e virtuais', 'Inscrição para sustentação oral']
      },
      {
        id: 'processos',
        title: 'Acompanhamento Processual',
        description: 'Busca processual por número, classe ou partes.',
        url: 'https://portal.stf.jus.br/processos/',
        icon: FileSearch,
        color: '#0EA5E9',
        category: 'Serviços Processuais',
        fullExplanation: 'Ferramenta indispensável para o acompanhamento diário. A consulta processual do STF permite o rastreamento completo de qualquer ação em trâmite na Corte. Você tem acesso aos andamentos, despachos e decisões proferidas.',
        practicalExample: 'Para descobrir o que aconteceu com uma Habeas Corpus de repercussão nacional, você digita o nome do paciente aqui, abre a linha do tempo do processo e baixa a última decisão liminar concedida pelo relator.',
        topics: ['Pesquisa por OAB, nome, ou número único', 'Linha do tempo interativa de andamentos', 'Acesso ao inteiro teor de decisões/despachos', 'Relação de advogados e Amicus Curiae']
      },
      {
        id: 'peticionamento',
        title: 'Peticionamento (e-STF)',
        description: 'Protocolo de petições iniciais e incidentais.',
        url: 'https://peticionamento.stf.jus.br/',
        icon: UploadCloud,
        color: '#6366F1',
        category: 'Serviços Processuais',
        fullExplanation: 'O e-STF é a porta de entrada digital para a Suprema Corte. Restrito a usuários cadastrados (com certificado digital), é o portal oficial por onde os advogados e procuradores fazem o envio de petições iniciais e incidentais.',
        practicalExample: 'No último dia do prazo recursal (23h50), o advogado acessa o e-STF usando seu Token OAB, faz o upload do Agravo em Recurso Extraordinário e salva o recibo de protocolo eletrônico emitido pelo sistema.',
        topics: ['Protocolo de peças iniciais (HC, MS, ADI)', 'Protocolo de petições intermediárias', 'Assinatura digital padrão ICP-Brasil', 'Emissão imediata de recibo de protocolo']
      },
      {
        id: 'certidoes',
        title: 'Emissão de Certidões',
        description: 'Emissão gratuita de certidões judiciais oficiais.',
        url: 'https://portal.stf.jus.br/servicos/certidoes/',
        icon: FileCheck2,
        color: '#14B8A6',
        category: 'Serviços Processuais',
        fullExplanation: 'O portal de Certidões do STF permite a emissão automática e gratuita de documentos fundamentais, atestando a existência de ações originárias, recursais ou o trânsito em julgado para processos específicos.',
        practicalExample: 'Você foi aprovado em um concurso público federal e a banca exige uma "Certidão Negativa do STF". Você acessa este portal, digita seu CPF e recebe o PDF autenticado na mesma hora para anexar à posse.',
        topics: ['Certidão de Distribuição Criminal/Cível', 'Certidão de Trânsito em Julgado', 'Validação de autenticidade por QR Code', 'Emissão online gratuita e instantânea']
      },
      // Diários & Transparência
      {
        id: 'dje',
        title: 'Diário da Justiça Eletrônico',
        description: 'Publicações diárias de acórdãos e despachos.',
        url: 'https://portal.stf.jus.br/dje/',
        icon: BookOpen,
        color: '#EAB308',
        category: 'Diários & Transparência',
        fullExplanation: 'O DJe (Diário da Justiça Eletrônico) é o veículo de comunicação oficial do STF. Publicado diariamente, compila todos os acórdãos, decisões monocráticas, pautas de julgamento, atas e atos administrativos.',
        practicalExample: 'Ao final do dia, você acessa o DJe, pesquisa pelo nome do seu cliente no PDF e descobre que a decisão que você aguardava foi formalmente publicada, iniciando a contagem do prazo recursal a partir de amanhã.',
        topics: ['Edições diárias separadas por caderno', 'Pesquisa de publicações por palavras-chave', 'Download integral do PDF do diário', 'Acervo histórico desde 2008']
      },
      {
        id: 'transparencia',
        title: 'Corte Aberta / Transparência',
        description: 'Painéis estatísticos e produtividade.',
        url: 'https://transparencia.stf.jus.br/',
        icon: BarChart3,
        color: '#F43F5E',
        category: 'Diários & Transparência',
        fullExplanation: 'O portal Corte Aberta reúne painéis de Business Intelligence (BI) e estatísticas detalhadas sobre o funcionamento do Supremo. Explore dados sobre a produtividade do Tribunal e o acervo de processos pendentes de cada Ministro.',
        practicalExample: 'Um pesquisador de Direito Constitucional usa o Painel de Produtividade para descobrir quantos Habeas Corpus o STF julgou no último ano, embasando sua dissertação de mestrado com dados gráficos oficiais.',
        topics: ['Painel de processos aguardando julgamento', 'Estatísticas de produtividade por Ministro', 'Gastos, folha de pagamento e licitações', 'Indicadores de cumprimento das Metas CNJ']
      }
    ]
  },
  senado: {
    title: 'PORTAIS DO SENADO',
    subtitle: 'Participação e Cidadania',
    portais: [
      // Participação e e-Cidadania
      {
        id: 'ideia-legislativa',
        title: 'Ideia Legislativa',
        description: 'Envio de propostas de novas leis pela sociedade.',
        url: 'https://www12.senado.leg.br/ecidadania/principalideia',
        icon: Lightbulb,
        color: '#F59E0B',
        category: 'Participação e e-Cidadania',
        fullExplanation: 'A Ideia Legislativa permite que qualquer cidadão proponha a criação de novas leis ou alterações na legislação atual. Se a sua ideia alcançar 20.000 apoios em 4 meses, ela é obrigatoriamente debatida pelos Senadores na Comissão de Direitos Humanos e Legislação Participativa (CDH).',
        practicalExample: 'Você percebe uma brecha na lei de defesa do consumidor. Você escreve sua proposta na Ideia Legislativa, compartilha o link no WhatsApp com amigos, alcança os 20 mil apoios e a sua ideia vira, de fato, um Projeto de Lei no Senado.',
        topics: ['Proposição direta de leis pelo cidadão', 'Necessidade de 20 mil apoios (assinaturas virtuais)', 'Conversão em Sugestão Legislativa (SUG)', 'Mecanismo de democracia direta e engajamento']
      },
      {
        id: 'consulta-publica',
        title: 'Consulta Pública',
        description: 'Votação cidadã em projetos de lei em andamento.',
        url: 'https://www12.senado.leg.br/ecidadania/principalmateria',
        icon: Vote,
        color: '#3B82F6',
        category: 'Participação e e-Cidadania',
        fullExplanation: 'A Consulta Pública é um termômetro oficial. Toda proposta em tramitação no Senado fica aberta para votação (SIM ou NÃO) da população. Os Senadores e relatores utilizam esses resultados para medir o apoio popular antes de tomarem suas decisões.',
        practicalExample: 'Está em pauta a redução da maioridade penal ou a mudança nas regras da aposentadoria. Você entra na Consulta Pública, lê o resumo do projeto e vota. O relator cita os milhões de votos da população em seu parecer oficial.',
        topics: ['Voto SIM ou NÃO em PLs, PECs e MPs', 'Gráficos estatísticos de apoio popular', 'Acesso ao texto base da proposta', 'Geração de pressão política legítima']
      },
      {
        id: 'eventos-interativos',
        title: 'Eventos Interativos',
        description: 'Participação ao vivo em sabatinas e audiências.',
        url: 'https://www12.senado.leg.br/ecidadania/principalaudiencia',
        icon: MessageSquare,
        color: '#10B981',
        category: 'Participação e e-Cidadania',
        fullExplanation: 'Sempre que há uma Audiência Pública ou Sabatina (como a escolha de um novo Ministro do STF ou PGR), o evento é transmitido ao vivo no portal e os cidadãos podem enviar perguntas e comentários que são lidos oficialmente pelos Senadores.',
        practicalExample: 'Durante a sabatina do presidente do Banco Central, você envia uma pergunta sobre a taxa de juros pelo portal. O Senador lê a sua pergunta ao vivo, citando seu nome, e o sabatinado é forçado a responder em rede nacional.',
        topics: ['Perguntas lidas ao vivo nas comissões', 'Agenda de futuras audiências públicas', 'Sabatinas de autoridades (PGR, STF, BC)', 'Transmissão em vídeo (TV Senado web)']
      },
      {
        id: 'ouvidoria-senado',
        title: 'Ouvidoria do Senado',
        description: 'Canal oficial de denúncias, reclamações e elogios.',
        url: 'https://www12.senado.leg.br/transparencia/ouvidoria',
        icon: Mic,
        color: '#EF4444',
        category: 'Participação e e-Cidadania',
        fullExplanation: 'A Ouvidoria é a ponte institucional para a resolução de problemas. Qualquer cidadão pode registrar denúncias sobre irregularidades, fazer reclamações do funcionamento da Casa ou solicitar informações públicas amparadas pela Lei de Acesso à Informação (LAI).',
        practicalExample: 'Você descobre que os gastos de gabinete de um Senador estão inacessíveis ou incompletos. Você usa a Ouvidoria para formalizar uma denúncia sob a LAI, obrigando o Senado a abrir e explicar essas despesas em um prazo oficial.',
        topics: ['Pedidos de Lei de Acesso à Informação (LAI)', 'Canal de proteção ao denunciante (Whistleblower)', 'Acompanhamento do protocolo', 'Transparência ativa e passiva']
      },
      
      // Pesquisa e Atividade
      {
        id: 'pesquisa-materias',
        title: 'Atividade Legislativa',
        description: 'Busca e acompanhamento de PLs, PECs e MPs.',
        url: 'https://www25.senado.leg.br/web/atividade/materias',
        icon: Search,
        color: '#8B5CF6',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'O principal motor de busca do Senado. Permite consultar o andamento exato de todas as matérias legislativas. Fornece relatórios detalhados, os textos originais, substitutivos, emendas e o histórico completo de movimentações nas comissões e no plenário.',
        practicalExample: 'Você precisa saber se o PL da Regulamentação da IA (Inteligência Artificial) já passou pela CCJ. Busca pelo número do PL e acessa a aba de "Tramitação", descobrindo que o relator apresentou o parecer ontem.',
        topics: ['Pesquisa por autor, ano, número ou palavra-chave', 'Acesso ao Inteiro Teor (PDFs dos projetos)', 'Quadro resumo da tramitação', 'Textos das emendas propostas']
      },
      {
        id: 'agenda-senado',
        title: 'Agenda do Senado',
        description: 'Calendário do plenário e das comissões.',
        url: 'https://www25.senado.leg.br/web/atividade/agenda',
        icon: CalendarDays,
        color: '#EC4899',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'O portal de Agenda centraliza a previsão de trabalhos legislativos do dia e da semana. Apresenta o horário e o local de cada sessão das comissões, além da Ordem do Dia (lista de votação) do Plenário.',
        practicalExample: 'Como jornalista ou assessor, você acessa a agenda de terça-feira para confirmar se a votação da Reforma Tributária foi realmente pautada para a sessão plenária das 14h ou se ficou para as comissões da manhã.',
        topics: ['Ordem do Dia (o que será votado)', 'Pauta das Comissões Permanentes', 'Pauta de Comissões Parlamentares de Inquérito (CPIs)', 'Horários de sessões solenes']
      },
      {
        id: 'senadores',
        title: 'Senadores (Perfil)',
        description: 'Lista completa de senadores, gastos e discursos.',
        url: 'https://www25.senado.leg.br/web/senadores',
        icon: Users,
        color: '#0EA5E9',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'Portal da transparência parlamentar. Aqui você encontra a ficha completa dos 81 senadores: quem são, de qual partido, como votaram nas principais sessões, os discursos proferidos e a prestação de contas exata da Cota Parlamentar (CEAPS).',
        practicalExample: 'Você quer verificar como o Senador do seu estado votou no projeto de corte de impostos e analisar quanto ele gastou em passagens aéreas e aluguel de carros no último mês, utilizando os recibos digitalizados.',
        topics: ['Lista por estado e partido', 'Acompanhamento de gastos da Cota (CEAPS)', 'Histórico de votos em plenário', 'Íntegra dos discursos proferidos']
      },
      {
        id: 'diario-senado',
        title: 'Diário do Senado',
        description: 'Publicações oficiais das sessões e atos.',
        url: 'https://www25.senado.leg.br/web/diarios',
        icon: BookOpen,
        color: '#EAB308',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'O Diário do Senado Federal é o espelho oficial e documental de tudo o que acontece na casa. Contém a transcrição *ipsis litteris* dos discursos no plenário, aprovação de projetos, nomeações e demais atos administrativos institucionais.',
        practicalExample: 'Um pesquisador necessita da transcrição oficial e inquestionável do discurso de um Senador que causou polêmica na semana anterior. Ele baixa o PDF do Diário daquela sessão e cita o trecho exato no seu artigo acadêmico.',
        topics: ['Notas taquigráficas (transcrição dos discursos)', 'Atos da Mesa Diretora', 'Leitura oficial de propostas e relatórios', 'Acervo documental com valor jurídico']
      },
      {
        id: 'transparencia-senado',
        title: 'Painel de Transparência',
        description: 'Gastos institucionais, licitações e salários.',
        url: 'https://www12.senado.leg.br/transparencia',
        icon: BarChart3,
        color: '#F43F5E',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'O portal da Transparência joga luz sobre o funcionamento orçamentário da instituição Senado Federal (e não apenas dos parlamentares individualmente). Lista servidores concursados, cargos comissionados, salários, editais de licitação e contratos vigentes.',
        practicalExample: 'Você é um prestador de serviços e quer participar de um pregão para fornecer equipamentos de TI para o Senado. Você acessa a Transparência, vai em Licitações e baixa o edital atual para concorrer.',
        topics: ['Folha de pagamento de servidores', 'Gastos com publicidade institucional', 'Portal de Compras e Licitações', 'Relatórios de Gestão Fiscal (LRF)']
      },
      {
        id: 'livraria-senado',
        title: 'Livraria e Edições',
        description: 'Acesso a livros e constituições (Gratuitos/Pagos).',
        url: 'https://livraria.senado.leg.br/',
        icon: GraduationCap,
        color: '#6366F1',
        category: 'Pesquisa e Atividade',
        fullExplanation: 'O Senado possui uma forte atuação editorial e de preservação histórica. Na Livraria do Senado, qualquer cidadão pode baixar Constituições, Códigos (Civil, Penal) e obras raras em PDF gratuito, ou comprar as versões impressas a preço de custo (subsidiadas).',
        practicalExample: 'Você é estudante de Direito e precisa do Vade Mecum ou da Constituição atualizada. Em vez de comprar caro em uma livraria comercial, você baixa o PDF oficial e garantido pelo Senado gratuitamente, ou compra a versão impressa por R$ 15.',
        topics: ['Legislação básica impressa a preço de custo', 'Obras de história política do Brasil', 'Downloads em PDF e ePub gratuitos', 'Coleção "Constituições do Brasil"']
      }
    ]
  },
  camara: {
    title: 'PORTAIS DA CÂMARA',
    subtitle: 'Acompanhamento Legislativo',
    portais: [
      // Acompanhamento Legislativo
      {
        id: 'pesquisa-projetos',
        title: 'Pesquisa de Projetos (PL/PEC)',
        description: 'Busca detalhada da tramitação de propostas.',
        url: 'https://www.camara.leg.br/busca-portal?contextoBusca=BuscaProposicoes',
        icon: FileSearch,
        color: '#3B82F6',
        category: 'Acompanhamento Legislativo',
        fullExplanation: 'Portal principal para rastreamento de Projetos de Lei (PL), Propostas de Emenda à Constituição (PEC) e Medidas Provisórias (MPV). A ficha de tramitação da Câmara exibe comissões designadas, apensados, relatores e textos originais.',
        practicalExample: 'Para descobrir se o projeto que criminaliza o uso indevido de IA já saiu da CCJ (Comissão de Constituição e Justiça), você busca o PL aqui e descobre que ele foi aprovado e agora aguarda votação no Plenário.',
        topics: ['Status da tramitação em tempo real', 'Histórico de despacho e comissões', 'Consulta aos pareceres dos relatores', 'Diferenciação por tipo e ano da matéria']
      },
      {
        id: 'deputados-perfil',
        title: 'Deputados e Gastos',
        description: 'Perfil dos 513 parlamentares e uso da cota.',
        url: 'https://www.camara.leg.br/deputados/quem-sao',
        icon: Users,
        color: '#F59E0B',
        category: 'Acompanhamento Legislativo',
        fullExplanation: 'O painel de transparência individual dos 513 Deputados Federais. Permite consultar a biografia, liderança partidária, histórico de votação nominal e as notas fiscais digitalizadas referentes aos gastos da Cota para Exercício da Atividade Parlamentar (CEAP).',
        practicalExample: 'Se um deputado divulga no Instagram que é contra aumento de gastos públicos, um eleitor pode entrar neste portal, puxar a planilha de gastos do CEAP e verificar se ele utilizou R$ 40.000 de dinheiro público para alugar jatos particulares no último mês.',
        topics: ['Notas fiscais digitalizadas da CEAP', 'Remuneração e auxílio-moradia', 'Presenças e ausências em plenário', 'Relação de projetos de autoria do deputado']
      },
      {
        id: 'pauta-plenario-camara',
        title: 'Pauta do Plenário',
        description: 'O que está sendo votado no momento na casa.',
        url: 'https://www.camara.leg.br/internet/ordemdodia/',
        icon: ListChecks,
        color: '#10B981',
        category: 'Acompanhamento Legislativo',
        fullExplanation: 'A "Ordem do Dia" é o documento oficial que dita a pauta da Câmara dos Deputados. Este portal lista as Medidas Provisórias trancando a pauta, os projetos em urgência e os requerimentos que serão alvo de debate e votação naquela sessão.',
        practicalExample: 'A imprensa noticiou que a "Reforma Administrativa será votada hoje". Você entra neste portal e verifica se ela realmente está como o item número 1 da Ordem do Dia, confirmando que a votação vai acontecer.',
        topics: ['Ordem do dia detalhada', 'Projetos em regime de urgência', 'Medidas Provisórias (MPs) trancando a pauta', 'Pautas do Congresso Nacional (Sessões Conjuntas)']
      },
      {
        id: 'camara-live',
        title: 'Câmara Live (Ao Vivo)',
        description: 'Transmissões do plenário e comissões.',
        url: 'https://www.camara.leg.br/tv/',
        icon: MonitorPlay,
        color: '#EF4444',
        category: 'Acompanhamento Legislativo',
        fullExplanation: 'O sistema de WebTV da Câmara. Vai além do que passa na TV Câmara oficial, permitindo ao cidadão acessar canais simultâneos para assistir audiências de comissões secundárias, CPIs, sessões solenes e o próprio plenário em tempo real.',
        practicalExample: 'Ocorre um tumulto na CPI e a TV aberta cortou a transmissão. Você entra na Câmara Live, seleciona a sala "Anexo II, Plenário 3" e acompanha a íntegra, sem cortes, pelo próprio portal da casa.',
        topics: ['Transmissão do Plenário', 'Transmissão simultânea de até 15 comissões', 'CPIs ao vivo', 'Acervo gravado de sessões passadas']
      },
      
      // Participação e e-Democracia
      {
        id: 'e-democracia',
        title: 'Portal e-Democracia',
        description: 'Enquetes e debates diretos em textos da lei.',
        url: 'https://edemocracia.camara.leg.br/',
        icon: Vote,
        color: '#8B5CF6',
        category: 'Participação e e-Democracia',
        fullExplanation: 'Uma das plataformas mais premiadas de participação digital no mundo. O e-Democracia oferece o Wikilegis (onde cidadãos sugerem alterações diretas nos artigos da lei escritos pelo relator) e bate-papos virtuais (Expressão) com os deputados.',
        practicalExample: 'O projeto do Marco Civil da Internet está sendo debatido. Pelo Wikilegis, você vai exatamente no Artigo 10 e adiciona um comentário dizendo "Este inciso prejudica startups". O relator lê o seu comentário e ajusta o artigo na versão final.',
        topics: ['Wikilegis (Edição colaborativa de leis)', 'Audiências interativas (Expressão)', 'Comunidades temáticas de discussão', 'Adoção massiva por relatores e comissões']
      },
      {
        id: 'siga-propostas',
        title: 'Siga Propostas',
        description: 'Alertas por e-mail sobre projetos de interesse.',
        url: 'https://www.camara.leg.br/siga',
        icon: BellRing,
        color: '#EC4899',
        category: 'Participação e e-Democracia',
        fullExplanation: 'Um serviço de notificações push e e-mail muito útil para ativistas, associações e advogados. Permite que você marque PLs específicos, temas gerais ou deputados específicos e receba um aviso automático sempre que houver movimentação.',
        practicalExample: 'Sua ONG de proteção animal cadastra a palavra-chave "Maus-tratos" no Siga Propostas. Na mesma hora que um deputado de qualquer estado protocolar um projeto sobre o assunto, você recebe um e-mail avisando.',
        topics: ['Notificação imediata de movimentação processual', 'Monitoramento por palavra-chave', 'Acompanhamento do perfil de um deputado', 'Resumos quinzenais de atividades']
      },
      {
        id: 'fale-conosco-camara',
        title: 'Fale Conosco / LAI',
        description: 'Solicitação de informações via LAI.',
        url: 'https://www.camara.leg.br/fale-conosco',
        icon: MessageSquare,
        color: '#14B8A6',
        category: 'Participação e e-Democracia',
        fullExplanation: 'A central de relacionamento oficial da Câmara. Recebe desde simples perguntas de estudantes ("Como funciona a Câmara?") até pedidos duros sob a Lei de Acesso à Informação (LAI), exigindo documentos públicos de deputados e diretores.',
        practicalExample: 'Você deseja saber o custo total da reforma do Anexo IV da Câmara e a cópia do contrato da empreiteira. Você formula o pedido via LAI aqui, e a diretoria tem o prazo máximo de 20 dias para entregar os PDFs.',
        topics: ['Pedidos de Lei de Acesso à Informação (e-SIC)', 'Reclamações contra deputados (Corregedoria)', 'Dúvidas legislativas (Cedi)', 'Acesso ao Disque-Câmara (0800)']
      },

      // Institucional e Dados
      {
        id: 'dados-abertos',
        title: 'Dados Abertos (API)',
        description: 'APIs e planilhas com toda a atividade da casa.',
        url: 'https://dadosabertos.camara.leg.br/',
        icon: Building2,
        color: '#F97316',
        category: 'Institucional e Dados',
        fullExplanation: 'O paraíso de programadores, jornalistas de dados e pesquisadores. A Câmara disponibiliza sua API oficial gratuita e planilhas (CSV/XML) com todos os dados brutos: votações, orçamentos, projetos, deputados e discursos.',
        practicalExample: 'Você quer criar um aplicativo que mostre aos eleitores quem falta mais nas votações. Você não precisa raspar as páginas: conecta seu app à API de Dados Abertos da Câmara, puxa a lista de votações em JSON e atualiza seu app em tempo real.',
        topics: ['Documentação de API REST (Swagger)', 'Bases completas de deputados e partidos', 'Registro bruto da Cota Parlamentar (CEAP)', 'Dados para maratonas hackers e jornalismo']
      },
      {
        id: 'escola-camara',
        title: 'Escola da Câmara',
        description: 'Cursos gratuitos com certificado oficial.',
        url: 'https://escola.camara.leg.br/',
        icon: GraduationCap,
        color: '#8B5CF6',
        category: 'Institucional e Dados',
        fullExplanation: 'A Escola da Câmara (CEFOR) oferece cursos à distância abertos a toda a sociedade. São módulos focados em Educação Política, Ciência Política, Orçamento Público, Processo Legislativo e História, conferindo certificados oficiais aos aprovados.',
        practicalExample: 'Você é um estudante de Direito (ou um futuro assessor parlamentar) que precisa de horas complementares ou quer entender o "Orçamento Impositivo". Inscreve-se online gratuitamente e recebe o certificado após a prova final.',
        topics: ['Cursos EAD gratuitos de curta duração', 'Mestrado Profissional (para servidores e público)', 'Simulações (Câmara Jovem / Parlamento Jovem)', 'Publicações acadêmicas (Revista E-Legis)']
      },
      {
        id: 'transparencia-camara',
        title: 'Transparência Câmara',
        description: 'Orçamento, licitações, concursos e contratos.',
        url: 'https://www.camara.leg.br/transparencia',
        icon: Scale,
        color: '#EAB308',
        category: 'Institucional e Dados',
        fullExplanation: 'A aba central que reúne a prestação de contas do órgão Câmara dos Deputados (Administração). O cidadão pode fiscalizar a folha de pagamento geral, diárias e passagens de servidores, editais de concursos e o andamento de grandes licitações da casa.',
        practicalExample: 'Após a notícia de que a Câmara iria comprar 500 novos notebooks, você acessa este painel de Licitações, baixa o termo de referência e vê as especificações e o preço máximo unitário para auditar a compra.',
        topics: ['Quadro de servidores e remuneração', 'Avisos e Editais de Licitações', 'Execução Orçamentária e Financeira', 'Resultados e editais de Concursos Públicos']
      }
    ]
  }
};
