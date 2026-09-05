import { directImg } from '@/lib/cdnImg';

export interface PillGalleryItem {
  image: string;
  text: string;
  fullName: string;
}

/**
 * Itens de código para galeria e lista.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
export const CODIGOS_ITEMS: PillGalleryItem[] = [
  { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'), text: 'CP', fullName: 'Código Penal' },
  { image: '/pilulas/cf_portrait.jpg', text: 'CF88', fullName: 'Constituição Federal' },
  { image: '/pilulas/cc_portrait.png', text: 'CC', fullName: 'Código Civil' },
  { image: '/pilulas/cpp_portrait.jpg', text: 'CPP', fullName: 'Código de Processo Penal' },
  { image: '/pilulas/clt_portrait.jpg', text: 'CLT', fullName: 'Consolidação das Leis do Trabalho' },
];

/**
 * Itens de ministros do STF para galeria e lista.
 * Compartilhado entre PilulasHome e PilulasLista.
 */
export const MINISTROS_ITEMS: PillGalleryItem[] = [
  { image: "/pilulas/ministros/moraes.jpg", text: "Moraes", fullName: "Alexandre de Moraes" },
  { image: "/pilulas/ministros/mendonca.jpg", text: "Mendonça", fullName: "André Mendonça" },
  { image: "/pilulas/ministros/carmen.jpg", text: "Cármen", fullName: "Cármen Lúcia" },
  { image: "/pilulas/ministros/zanin.jpg", text: "Zanin", fullName: "Cristiano Zanin" },
  { image: "/pilulas/ministros/toffoli.jpg", text: "Toffoli", fullName: "Dias Toffoli" },
  { image: "/pilulas/ministros/fachin.jpg", text: "Fachin", fullName: "Edson Fachin" },
  { image: "/pilulas/ministros/dino.jpg", text: "Dino", fullName: "Flávio Dino" },
  { image: "/pilulas/ministros/mendes.jpg", text: "Mendes", fullName: "Gilmar Mendes" },
  { image: "/pilulas/ministros/fux.jpg", text: "Fux", fullName: "Luiz Fux" },
  { image: "/pilulas/ministros/marques.jpg", text: "Marques", fullName: "Nunes Marques" },
  { image: "/pilulas/ministros/barroso.jpg", text: "Barroso", fullName: "Roberto Barroso" },
];

/**
 * Itens de clássicos do direito para galeria.
 * Usado em PilulasHome.
 */
export const CLASSICOS_ITEMS: PillGalleryItem[] = [
  { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg', text: 'A Luta pelo\nDireito', fullName: 'Rudolf von Ihering' },
  { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg', text: 'Sobre a\nLiberdade', fullName: 'John Stuart Mill' },
  { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg', text: 'A Arte da\nGuerra', fullName: 'Sun Tzu' },
  { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg', text: 'O Espírito\ndas Leis', fullName: 'Montesquieu' },
  { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg', text: 'O Mundo Assombrado\npelos Demônios', fullName: 'Carl Sagan' },
];
