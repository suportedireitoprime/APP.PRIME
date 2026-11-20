import { directImg } from '@/lib/cdnImg';
import { PILULAS_MATERIAS } from './pilulasMateriasConfig';

export interface PillGalleryItem {
  image: string;
  text: string;
  fullName: string;
  id?: string;
  descricao?: string;
  borderColor?: string;
  totalTopicos?: number;
  totalModulos?: number;
  sigla?: string;
  slug?: string;
}

/**
 * Itens de matérias/códigos para galeria e lista (todas as 23 matérias do Direito).
 * Compartilhado entre PilulasHome e PilulasLista.
 */
export const CODIGOS_ITEMS: PillGalleryItem[] = PILULAS_MATERIAS.map(mat => ({
  id: mat.id,
  slug: mat.slug,
  image: mat.image,
  text: mat.nome,
  fullName: mat.nome,
  descricao: mat.descricao,
  borderColor: mat.borderColor,
  totalTopicos: mat.totalTopicos,
  totalModulos: mat.totalModulos,
  sigla: mat.sigla,
}));


/**
 * Itens de clássicos do direito para galeria.
 * Usado em PilulasHome.
 */
export const CLASSICOS_ITEMS: PillGalleryItem[] = [
  { id: '133', slug: 'ihering', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg', 400), text: 'A Luta pelo\nDireito', fullName: 'Rudolf von Ihering', descricao: 'A luta pelo direito como dever ético do cidadão', borderColor: '#F97316' },
  { id: '138', slug: 'mill', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg', 400), text: 'Sobre a\nLiberdade', fullName: 'John Stuart Mill', descricao: 'A liberdade individual e os limites da sociedade', borderColor: '#38BDF8' },
  { id: '125', slug: 'suntzu', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg', 400), text: 'A Arte da\nGuerra', fullName: 'Sun Tzu', descricao: 'Tratado clássico de estratégia e resolução de conflitos', borderColor: '#E11D48' },
  { id: '130', slug: 'montesquieu', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg', 400), text: 'O Espírito\ndas Leis', fullName: 'Montesquieu', descricao: 'A separação dos poderes e a estrutura das leis', borderColor: '#A855F7' },
  { id: '137', slug: 'sagan', image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg', 400), text: 'O Mundo Assombrado\npelos Demônios', fullName: 'Carl Sagan', descricao: 'Ciência, razão e pensamento crítico', borderColor: '#10B981' },
];

