import {
  Landmark, Gavel, BookMarked, Scale, Columns3, PocketKnife, Scroll, Stamp, FileWarning,
  ShieldAlert, House, CircleDollarSign, FileText, ShieldCheck, Briefcase, Store, Building,
  Vote, HeartPulse, TreePine, ShoppingCart, Baby, Shield, Globe, Map,
  Library, Video, NotebookPen, Headphones, Brain, BookA, Presentation,
  CalendarCheck, GraduationCap, PieChart, LayoutGrid, Flame, type LucideIcon
} from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';

export interface Cat {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
}

export const GRID_CATS: Cat[] = [
  { id: 'constituicao',    label: 'Constituição',    sublabel: 'CF/88',                     icon: Landmark,   color: '#d97706' },
  { id: 'codigo',          label: 'Códigos',         sublabel: 'Civil, Penal, Processo…',   icon: Gavel,      color: '#dc2626' },
  { id: 'estatuto',        label: 'Estatutos',       sublabel: 'ECA, Idoso, OAB…',          icon: BookMarked, color: '#0284c7' },
  { id: 'jurisprudencia',  label: 'Jurisprudência',  sublabel: 'STF, STJ, Vinculantes',     icon: Scale,      color: '#059669' },
  { id: 'lei-ordinaria',   label: 'Leis Ordinárias', sublabel: 'Federais complementares',   icon: Columns3,   color: '#ea580c' },
  { id: 'lei-especial',    label: 'Penal Especial',  sublabel: 'Leis penais extravagantes', icon: PocketKnife, color: '#475569' },
];

export type RadarCat = Cat & { radarTipo: string; normaSlug: string };
export const RADAR_CATS: RadarCat[] = [
  { id: 'radar-lei',       label: 'Leis Ordinárias',     sublabel: 'Leis ordinárias publicadas no DOU',   icon: Scroll,     color: 'hsl(348 78% 38%)', radarTipo: 'Lei',                normaSlug: 'leis' },
  { id: 'radar-lc',        label: 'Leis Complementares', sublabel: 'Complementares à Constituição',       icon: Stamp,      color: 'hsl(348 78% 38%)', radarTipo: 'Lei Complementar',   normaSlug: 'leis-complementares' },
  { id: 'radar-decreto',   label: 'Decretos',            sublabel: 'Regulamentos do Executivo',           icon: Stamp,      color: 'hsl(348 78% 38%)', radarTipo: 'Decreto',            normaSlug: 'decretos' },
  { id: 'radar-mp',        label: 'Medidas Provisórias', sublabel: 'Editadas pelo Presidente',            icon: FileWarning,color: 'hsl(348 78% 38%)', radarTipo: 'Medida Provisória',  normaSlug: 'medidas-provisorias' },
];

export const LIST_CATS: Cat[] = [
  { id: 'decreto',         label: 'Decretos (Coleção)', sublabel: 'Regulamentos do Executivo', icon: Stamp,      color: 'hsl(348 78% 38%)' },
];

export const ALL_CATS: Cat[] = [...GRID_CATS, ...LIST_CATS];

export interface AreaCat extends Cat { leiIds: string[]; }

export const AREA_CATS: AreaCat[] = [
  { id: 'area-penal',          label: 'Penal',          sublabel: 'CP, CPP, LEP, Lei Maria da Penha…',          icon: ShieldAlert, color: 'hsl(348 78% 38%)', leiIds: ['cp','cpp','lep','lmp','ld','loc','laa','lcp','lch','ltort','lcsf','lpt','laa'] },
  { id: 'area-civil',          label: 'Civil',          sublabel: 'CC, LI, LRP, alimentos, alienação…',          icon: House,       color: '#3B82F6', leiIds: ['cc','li','lrp','lalim','lalp','lgpd','mci','ld','laa'] },
  { id: 'area-tributario',     label: 'Tributário',     sublabel: 'CTN, LRF, Reforma Tributária…',              icon: CircleDollarSign, color: '#10B981', leiIds: ['ctn','lrf','lrt'] },
  { id: 'area-constitucional', label: 'Constitucional', sublabel: 'CF/88, LINDB, LPAF, LAI…',                  icon: Landmark,    color: '#FFD400', leiIds: ['cf88','lindb','lpaf','lai','lap','lap','lmi','lms','lhd'] },
  { id: 'area-processual-civil',  label: 'Processual Civil',  sublabel: 'CPC, LJE, mandado de segurança…',       icon: FileText,    color: '#DC2626', leiIds: ['cpc','lje','lms','lmi','lhd'] },
  { id: 'area-processual-penal',  label: 'Processual Penal',  sublabel: 'CPP, interceptação, mandado…',        icon: ShieldCheck, color: '#F97316', leiIds: ['cpp','lit','lpt','lms'] },
  { id: 'area-trabalho',       label: 'Trabalho',    sublabel: 'CLT, legislação trabalhista…',              icon: Briefcase,   color: '#8B5CF6', leiIds: ['clt'] },
  { id: 'area-empresarial',    label: 'Empresarial',    sublabel: 'CCom, LSA, LF, arbitragem, startups…',      icon: Store,       color: '#A855F7', leiIds: ['ccom','lsa','lf','la','lpi','lace','lcon','lppp','lmls','lda','eme','lfl'] },
  { id: 'area-administrativo', label: 'Administrativo', sublabel: 'LIA, LPAF, licitações, improbidade…',       icon: Building,    color: '#06B6D4', leiIds: ['lia','lpaf','nll','lai','lms','l8112','loman','lotcu','ces'] },
  { id: 'area-eleitoral',      label: 'Eleitoral',      sublabel: 'CE, LPP, Lei das Eleições, Ficha Limpa…',   icon: Vote,        color: '#6366F1', leiIds: ['ce','lpp','lele','lfl','line'] },
  { id: 'area-previdenciario', label: 'Previdenciário', sublabel: 'LBPS, LCSS, LPC, LOAS…',                    icon: HeartPulse,  color: '#14B8A6', leiIds: ['lbps','lcss','lpc','loas'] },
  { id: 'area-ambiental',      label: 'Ambiental',      sublabel: 'Código Florestal, crimes ambientais, biossegurança…', icon: TreePine, color: '#16A34A', leiIds: ['cflor','lca','lbio'] },
  { id: 'area-consumidor',     label: 'Consumidor',  sublabel: 'CDC, defesa do consumidor…',                icon: ShoppingCart, color: '#EC4899', leiIds: ['cdc'] },
  { id: 'area-crianca-idoso',  label: 'Criança, Idoso e PCD',   sublabel: 'ECA, Estatuto do Idoso, EPD…',              icon: Baby,        color: '#F43F5E', leiIds: ['eca','ei','epd'] },
  { id: 'area-militar',        label: 'Militar',        sublabel: 'CPM, CPPM, Estatuto dos Militares…',        icon: Shield,      color: '#64748B', leiIds: ['cpm','cppm','em'] },
  { id: 'area-internacional',  label: 'Internacional',  sublabel: 'Estatuto da Migração, Refugiado…',          icon: Globe,       color: '#0891B2', leiIds: ['emig','eref'] },
];

export interface CategoriaFormal extends Cat { route?: string; leiIds?: string[]; }

export const CATEGORIA_CATS: CategoriaFormal[] = [
  { id: 'cat-federais',      label: 'Leis Federais',      sublabel: 'Constituição, Códigos, Estatutos…', icon: Stamp, color: 'hsl(348 78% 38%)', leiIds: LEIS_CATALOG.map(l => l.id) },
  { id: 'cat-estadual',      label: 'Legislação Estadual', sublabel: '27 unidades federativas',           icon: Map,        color: '#38BDF8', route: '/legislacao-estadual' },
  { id: 'cat-jurisprudencia',label: 'Jurisprudência',      sublabel: 'STF, STJ, Súmulas Vinculantes',     icon: Gavel,      color: '#EC4899' },
  { id: 'cat-oab',           label: 'OAB',                 sublabel: 'Estatuto, ética e advocacia',       icon: Scale,      color: '#1D4ED8' },
  { id: 'cat-decretos',      label: 'Decretos',            sublabel: 'Regulamentos do Executivo',         icon: Stamp,      color: 'hsl(348 78% 38%)', route: '/normas/decretos' },
];

export const JURI_OPCOES = [
  { id: 'STF_VINCULANTE', nome: 'Súmulas Vinculantes', desc: 'Efeito vinculante para o Judiciário' },
  { id: 'STF',            nome: 'Súmulas do STF',      desc: 'Supremo Tribunal Federal' },
  { id: 'STJ',            nome: 'Súmulas do STJ',      desc: 'Superior Tribunal de Justiça' },
];

export type EmAltaCat = Cat & { route: string; emBreve?: boolean };
export const EMALTA_CATS: EmAltaCat[] = [
  { id: 'ea-biblioteca',  label: 'Biblioteca',     sublabel: 'Livros, clássicos e coleções',   icon: Library,     color: 'hsl(var(--primary))', route: '/bibliotecas' },
  { id: 'ea-videoaulas',  label: 'Videoaulas',     sublabel: 'Aulas em vídeo por área',        icon: Video,       color: 'hsl(var(--primary))', route: '/videoaulas' },
  { id: 'ea-resumos',     label: 'Resumos',        sublabel: 'Resumos jurídicos por tema',     icon: NotebookPen, color: 'hsl(var(--primary))', route: '/resumos-juridicos' },
  { id: 'ea-audioaulas',  label: 'Audioaulas',     sublabel: 'Estude ouvindo, onde estiver',   icon: Headphones,  color: 'hsl(var(--primary))', route: '/audioaulas' },
  { id: 'ea-mapas',       label: 'Mapas Mentais',  sublabel: 'Mapas, infográficos e fluxogramas',    icon: Brain,       color: 'hsl(var(--primary))', route: '/assistente' },
  { id: 'ea-dicionario',  label: 'Dicionário',     sublabel: 'Termos jurídicos explicados',    icon: BookA,       color: 'hsl(var(--primary))', route: '/ferramentas/dicionario' },
  { id: 'ea-lei-seca',    label: 'Lei Seca',       sublabel: 'Treine o texto da lei por área',  icon: Scale,       color: 'hsl(var(--primary))', route: '/lei-seca' },
  { id: 'ea-apresentacao', label: 'Apresentação',  sublabel: 'Aulas narradas em slides',       icon: Presentation, color: 'hsl(var(--primary))', route: '/apresentacoes' },
];

export const FAST_PILLS_ITEMS = [
  { id: 'cp', image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg', text: 'CP', fullName: 'Código Penal' },
  { id: 'cf', image: '/pilulas/cf_portrait.jpg', text: 'CF88', fullName: 'Constituição Federal' },
  { id: 'cc', image: '/pilulas/cc_portrait.png', text: 'CC', fullName: 'Código Civil' },
  { id: 'cpp', image: '/pilulas/cpp_portrait.jpg', text: 'CPP', fullName: 'Cód. Proc. Penal' },
  { id: 'clt', image: '/pilulas/clt_portrait.jpg', text: 'CLT', fullName: 'Leis Trabalhistas' },
];

export const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export type Tab = 'agenda' | 'estudos' | 'faculdade' | 'documentos' | 'categorias' | 'emalta' | 'areas';

export const TABS_HOME: { id: Tab; label: string; icon: any }[] = [
  { id: 'agenda',     label: 'Pendências',     icon: CalendarCheck },
  { id: 'estudos',    label: 'Estudos',    icon: GraduationCap },
  { id: 'faculdade',  label: 'Gráficos',  icon: PieChart },
];

export const TABS_VADEMECUM: { id: Tab; label: string; icon: any }[] = [
  { id: 'categorias', label: 'Categorias', icon: LayoutGrid },
  { id: 'emalta',     label: 'Em Alta',     icon: Flame },
  { id: 'areas',      label: 'Áreas',       icon: Scale },
];

export const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
