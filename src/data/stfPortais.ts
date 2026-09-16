import { Search, ListChecks, Activity, MonitorPlay, CalendarDays, FileSearch, UploadCloud, FileCheck2, BookOpen, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StfPortal {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  category: string;
  fullExplanation: string;
}

export const STF_PORTAIS: StfPortal[] = [
  // Jurisprudência & Súmulas
  {
    id: 'jurisprudencia',
    title: 'Pesquisa de Jurisprudência',
    description: 'Consulta ao acervo de decisões e acórdãos.',
    url: 'https://jurisprudencia.stf.jus.br/',
    icon: Search,
    color: '#3B82F6', // blue-500
    category: 'Jurisprudência & Súmulas',
    fullExplanation: 'A Pesquisa de Jurisprudência é a principal ferramenta para estudantes, advogados e juízes que buscam entender como a Suprema Corte decide. \n\nAtravés deste portal, você tem acesso ao acervo completo de acórdãos, decisões monocráticas e informativos de jurisprudência do STF. É possível utilizar filtros avançados por relator, órgão julgador, período e tipo de decisão para montar sua tese de forma assertiva.'
  },
  {
    id: 'sumulas',
    title: 'Súmulas Vinculantes',
    description: 'Listagem dos enunciados com força vinculante.',
    url: 'https://portal.stf.jus.br/jurisprudencia/sumulas.asp',
    icon: ListChecks,
    color: '#F59E0B', // amber-500
    category: 'Jurisprudência & Súmulas',
    fullExplanation: 'As Súmulas Vinculantes representam a cristalização do entendimento da Corte Suprema sobre temas constitucionais polêmicos.\n\nA grande força deste instituto reside na sua obrigatoriedade: uma vez aprovada, a Súmula Vinculante deve ser seguida por todos os juízes e por toda a Administração Pública (federal, estadual e municipal). Acesse este portal para consultar a redação oficial, os precedentes que originaram a súmula e eventuais propostas de cancelamento ou revisão.'
  },
  {
    id: 'repercussao-geral',
    title: 'Repercussão Geral',
    description: 'Painel de teses fixadas pela Suprema Corte.',
    url: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/',
    icon: Activity,
    color: '#10B981', // emerald-500
    category: 'Jurisprudência & Súmulas',
    fullExplanation: 'A Repercussão Geral é um filtro criado para que o STF julgue apenas temas que possuam relevância social, política, econômica ou jurídica que ultrapassem os interesses das partes do processo.\n\nNeste painel, você consegue acompanhar os Temas de Repercussão Geral, verificando quais já tiveram o mérito julgado (teses fixadas) e quais ainda estão pendentes de análise, impactando milhões de processos sobrestados no Brasil.'
  },

  // Serviços Processuais
  {
    id: 'sessao-virtual',
    title: 'Sessão Virtual',
    description: 'Acompanhamento em tempo real de votos e placares.',
    url: 'https://portal.stf.jus.br/sessao-virtual/',
    icon: MonitorPlay,
    color: '#8B5CF6', // violet-500
    category: 'Serviços Processuais',
    fullExplanation: 'O Plenário Virtual revolucionou o julgamento no STF. Em vez da clássica sessão presencial transmitida pela TV Justiça, os Ministros depositam seus votos no ambiente virtual ao longo de uma semana.\n\nO portal da Sessão Virtual permite que qualquer cidadão acompanhe o placar ao vivo, leia os votos já disponibilizados pelos Ministros e saiba o status exato de um julgamento, sem precisar aguardar a proclamação final do resultado.'
  },
  {
    id: 'pauta-sessao',
    title: 'Pautas de Julgamento',
    description: 'Calendário de processos agendados (Presencial e Virtual).',
    url: 'https://portal.stf.jus.br/pautaSessao/',
    icon: CalendarDays,
    color: '#EC4899', // pink-500
    category: 'Serviços Processuais',
    fullExplanation: 'Quer saber quando um processo específico será julgado? O portal de Pautas de Julgamento reúne a previsão oficial das sessões do Plenário e das Turmas do STF.\n\nAlém de visualizar o calendário do semestre, você pode acessar a lista completa de processos pautados para cada dia, incluindo informações sobre os relatores, as partes envolvidas e as sustentações orais agendadas.'
  },
  {
    id: 'processos',
    title: 'Acompanhamento Processual',
    description: 'Busca processual por número, classe ou partes.',
    url: 'https://portal.stf.jus.br/processos/',
    icon: FileSearch,
    color: '#0EA5E9', // sky-500
    category: 'Serviços Processuais',
    fullExplanation: 'Ferramenta indispensável para o acompanhamento diário. A consulta processual do STF permite o rastreamento completo de qualquer ação em trâmite na Corte.\n\nVocê tem acesso aos andamentos (fases do processo), despachos e decisões proferidas (em inteiro teor, formato PDF), além da lista de todas as partes, advogados e amicus curiae habilitados nos autos.'
  },
  {
    id: 'peticionamento',
    title: 'Peticionamento (e-STF)',
    description: 'Protocolo de petições iniciais e incidentais.',
    url: 'https://peticionamento.stf.jus.br/',
    icon: UploadCloud,
    color: '#6366F1', // indigo-500
    category: 'Serviços Processuais',
    fullExplanation: 'O e-STF é a porta de entrada digital para a Suprema Corte. Restrito a usuários cadastrados (com certificado digital), é o portal oficial por onde os advogados e procuradores fazem o envio de petições iniciais e o protocolo de manifestações nos processos em andamento.\n\nAlém do envio, o sistema consolida o protocolo eletrônico emitindo os comprovantes e recibos de entrega exigidos por lei.'
  },
  {
    id: 'certidoes',
    title: 'Emissão de Certidões',
    description: 'Emissão gratuita de certidões judiciais oficiais.',
    url: 'https://portal.stf.jus.br/servicos/certidoes/',
    icon: FileCheck2,
    color: '#14B8A6', // teal-500
    category: 'Serviços Processuais',
    fullExplanation: 'Necessita comprovar que uma decisão não cabe mais recurso ou que não existem ações em seu nome na mais alta Corte do país?\n\nO portal de Certidões do STF permite a emissão automática e gratuita de documentos fundamentais, como a Certidão de Distribuição (Ações Originárias e Recursais) e certidões atestando o Trânsito em Julgado (fim dos recursos) para processos específicos.'
  },

  // Diários & Transparência
  {
    id: 'dje',
    title: 'Diário da Justiça Eletrônico',
    description: 'Publicações diárias de acórdãos e despachos.',
    url: 'https://portal.stf.jus.br/dje/',
    icon: BookOpen,
    color: '#EAB308', // yellow-500
    category: 'Diários & Transparência',
    fullExplanation: 'O DJe (Diário da Justiça Eletrônico) é o veículo de comunicação oficial do STF. É aqui que começam a contar os prazos processuais para os advogados.\n\nPublicado diariamente, compila todos os acórdãos, decisões monocráticas, pautas de julgamento, atas e atos administrativos. A plataforma permite a pesquisa textual e o download integral de qualquer edição publicada desde 2008.'
  },
  {
    id: 'transparencia',
    title: 'Corte Aberta / Transparência',
    description: 'Painéis estatísticos e produtividade de cada ministro.',
    url: 'https://transparencia.stf.jus.br/',
    icon: BarChart3,
    color: '#F43F5E', // rose-500
    category: 'Diários & Transparência',
    fullExplanation: 'Sob o compromisso de máxima publicidade, o portal Corte Aberta reúne painéis de Business Intelligence (BI) e estatísticas detalhadas sobre o funcionamento do Supremo.\n\nExplore dados sobre a produtividade do Tribunal, o acervo de processos pendentes no gabinete de cada Ministro, o tempo médio de julgamento, além dos dados tradicionais de governança, folha de pagamento e orçamento público.'
  }
];
