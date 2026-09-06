import { directImg } from '@/lib/cdnImg';

export interface PillGalleryItem {
  image: string;
  text: string;
  fullName: string;
  id?: string;
  descricao?: string;
  borderColor?: string;
}

/**
 * Itens de código para galeria e lista.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
export const CODIGOS_ITEMS: PillGalleryItem[] = [
  {
    id: 'cp',
    image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'),
    text: 'CP',
    fullName: 'Código Penal',
    descricao: 'Artigos fundamentais comentados em áudios rápidos',
    borderColor: '#EF4444',
  },
  {
    id: 'cf88',
    image: '/pilulas/cf_portrait.jpg',
    text: 'CF88',
    fullName: 'Constituição Federal',
    descricao: 'Direitos fundamentais e organização dos poderes',
    borderColor: '#10B981',
  },
  {
    id: 'cc',
    image: '/pilulas/cc_portrait.png',
    text: 'CC',
    fullName: 'Código Civil',
    descricao: 'Pessoas, negócios jurídicos, obrigações e contratos',
    borderColor: '#3B82F6',
  },
  {
    id: 'cpp',
    image: '/pilulas/cpp_portrait.jpg',
    text: 'CPP',
    fullName: 'Código de Processo Penal',
    descricao: 'Inquérito, provas, prisões cautelares e recursos',
    borderColor: '#8B5CF6',
  },
  {
    id: 'clt',
    image: '/pilulas/clt_portrait.jpg',
    text: 'CLT',
    fullName: 'Consolidação das Leis do Trabalho',
    descricao: 'Jornada, verbas rescisórias e garantias do trabalhador',
    borderColor: '#F59E0B',
  },
];

/**
 * Itens de ministros do STF para galeria e lista.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
export const MINISTROS_ITEMS: PillGalleryItem[] = [
  { id: 'moraes', image: "/pilulas/ministros/moraes.jpg", text: "Moraes", fullName: "Alexandre de Moraes", descricao: 'Ministro do STF • Direito Constitucional e Eleitoral', borderColor: '#D4AF37' },
  { id: 'mendonca', image: "/pilulas/ministros/mendonca.jpg", text: "Mendonça", fullName: "André Mendonça", descricao: 'Ministro do STF • Advocacia Pública e Estado', borderColor: '#D4AF37' },
  { id: 'carmen', image: "/pilulas/ministros/carmen.jpg", text: "Cármen", fullName: "Cármen Lúcia", descricao: 'Ministra do STF • Jurisdição Constitucional', borderColor: '#D4AF37' },
  { id: 'zanin', image: "/pilulas/ministros/zanin.jpg", text: "Zanin", fullName: "Cristiano Zanin", descricao: 'Ministro do STF • Garantias Fundamentais e Processo', borderColor: '#D4AF37' },
  { id: 'toffoli', image: "/pilulas/ministros/toffoli.jpg", text: "Toffoli", fullName: "Dias Toffoli", descricao: 'Ministro do STF • Ordem Institucional e Econômica', borderColor: '#D4AF37' },
  { id: 'fachin', image: "/pilulas/ministros/fachin.jpg", text: "Fachin", fullName: "Edson Fachin", descricao: 'Ministro do STF • Direito Civil e Direitos Humanos', borderColor: '#D4AF37' },
  { id: 'dino', image: "/pilulas/ministros/dino.jpg", text: "Dino", fullName: "Flávio Dino", descricao: 'Ministro do STF • Direito Público e Administrativo', borderColor: '#D4AF37' },
  { id: 'mendes', image: "/pilulas/ministros/mendes.jpg", text: "Mendes", fullName: "Gilmar Mendes", descricao: 'Ministro do STF • Controle de Constitucionalidade', borderColor: '#D4AF37' },
  { id: 'fux', image: "/pilulas/ministros/fux.jpg", text: "Fux", fullName: "Luiz Fux", descricao: 'Ministro do STF • Teoria Geral do Processo Civil', borderColor: '#D4AF37' },
  { id: 'marques', image: "/pilulas/ministros/marques.jpg", text: "Marques", fullName: "Nunes Marques", descricao: 'Ministro do STF • Direito Constitucional e Tributário', borderColor: '#D4AF37' },
  { id: 'barroso', image: "/pilulas/ministros/barroso.jpg", text: "Barroso", fullName: "Roberto Barroso", descricao: 'Presidente do STF • Neoconstitucionalismo e Jurisdição', borderColor: '#D4AF37' },
];

/**
 * Itens de clássicos do direito para galeria.
 * Usado em PilulasHome.
 */
export const CLASSICOS_ITEMS: PillGalleryItem[] = [
  { id: 'ihering', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg', text: 'A Luta pelo\nDireito', fullName: 'Rudolf von Ihering', descricao: 'A luta pelo direito como dever ético do cidadão', borderColor: '#F97316' },
  { id: 'mill', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg', text: 'Sobre a\nLiberdade', fullName: 'John Stuart Mill', descricao: 'A liberdade individual e os limites da sociedade', borderColor: '#38BDF8' },
  { id: 'suntzu', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg', text: 'A Arte da\nGuerra', fullName: 'Sun Tzu', descricao: 'Tratado clássico de estratégia e resolução de conflitos', borderColor: '#E11D48' },
  { id: 'montesquieu', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg', text: 'O Espírito\ndas Leis', fullName: 'Montesquieu', descricao: 'A separação dos poderes e a estrutura das leis', borderColor: '#A855F7' },
  { id: 'sagan', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg', text: 'O Mundo Assombrado\npelos Demônios', fullName: 'Carl Sagan', descricao: 'Ciência, razão e pensamento crítico', borderColor: '#10B981' },
];
