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
    id: 'penal',
    image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg', 400),
    text: 'Direito Penal',
    fullName: 'Direito Penal',
    descricao: 'Áudios esquematizados, legendas sincronizadas e resumos Cornell',
    borderColor: '#EF4444',
  },
  {
    id: 'cf88',
    image: '/pilulas/cf_portrait.webp',
    text: 'CF88',
    fullName: 'Constituição Federal',
    descricao: 'Direitos fundamentais e organização dos poderes',
    borderColor: '#10B981',
  },
  {
    id: 'cc',
    image: '/pilulas/cc_portrait.webp',
    text: 'CC',
    fullName: 'Código Civil',
    descricao: 'Pessoas, negócios jurídicos, obrigações e contratos',
    borderColor: '#3B82F6',
  },
  {
    id: 'cpp',
    image: '/pilulas/cpp_portrait.webp',
    text: 'CPP',
    fullName: 'Código de Processo Penal',
    descricao: 'Inquérito, provas, prisões cautelares e recursos',
    borderColor: '#8B5CF6',
  },
  {
    id: 'clt',
    image: '/pilulas/clt_portrait.webp',
    text: 'CLT',
    fullName: 'Consolidação das Leis do Trabalho',
    descricao: 'Jornada, verbas rescisórias e garantias do trabalhador',
    borderColor: '#F59E0B',
  },
];


/**
 * Itens de clássicos do direito para galeria.
 * Usado em PilulasHome.
 */
export const CLASSICOS_ITEMS: PillGalleryItem[] = [
  { id: 'ihering', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg', 400), text: 'A Luta pelo\nDireito', fullName: 'Rudolf von Ihering', descricao: 'A luta pelo direito como dever ético do cidadão', borderColor: '#F97316' },
  { id: 'mill', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg', 400), text: 'Sobre a\nLiberdade', fullName: 'John Stuart Mill', descricao: 'A liberdade individual e os limites da sociedade', borderColor: '#38BDF8' },
  { id: 'suntzu', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg', 400), text: 'A Arte da\nGuerra', fullName: 'Sun Tzu', descricao: 'Tratado clássico de estratégia e resolução de conflitos', borderColor: '#E11D48' },
  { id: 'montesquieu', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg', 400), text: 'O Espírito\ndas Leis', fullName: 'Montesquieu', descricao: 'A separação dos poderes e a estrutura das leis', borderColor: '#A855F7' },
  { id: 'sagan', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg', 400), text: 'O Mundo Assombrado\npelos Demônios', fullName: 'Carl Sagan', descricao: 'Ciência, razão e pensamento crítico', borderColor: '#10B981' },
];

