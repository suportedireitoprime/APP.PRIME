import type React from 'react';
import {
  Compass,
  Trophy,
  Mic,
  Languages,
  GraduationCap,
  Award,
  Scale,
} from 'lucide-react';

export interface CategoriaMeioConfig {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  defaultCount: number;
  corTema: string;
  corSecundaria: string;
  corSombra: string;
  Icon: React.ElementType;
}

export const DEMAIS_CATEGORIAS_CARROSSEL: CategoriaMeioConfig[] = [
  {
    id: 'classicos',
    label: 'Clássicos',
    title: 'CLÁSSICOS DO DIREITO',
    subtitle: 'Obras fundamentais do pensamento e da teoria jurídica universal',
    badgeLabel: 'Clássicos',
    defaultCount: 21,
    corTema: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    Icon: Scale,
  },
  {
    id: 'fora-da-toga',
    label: 'Fora da Toga',
    title: 'FORA DA TOGA',
    subtitle: 'Leituras além do Direito para enriquecer sua formação humana',
    badgeLabel: 'Fora da Toga',
    defaultCount: 34,
    corTema: '#10B981',
    corSecundaria: '#6EE7B7',
    corSombra: 'rgba(16, 185, 129, 0.45)',
    Icon: Compass,
  },
  {
    id: 'lideranca',
    label: 'Liderança',
    title: 'LIDERANÇA & GESTÃO',
    subtitle: 'Estratégia, inteligência emocional e autoridade profissional',
    badgeLabel: 'Liderança',
    defaultCount: 18,
    corTema: '#F59E0B',
    corSecundaria: '#FDE68A',
    corSombra: 'rgba(245, 158, 11, 0.45)',
    Icon: Trophy,
  },
  {
    id: 'oratoria',
    label: 'Oratória',
    title: 'ORATÓRIA JURÍDICA',
    subtitle: 'Retórica clássica, sustentação oral e persuasão em juízo',
    badgeLabel: 'Oratória',
    defaultCount: 15,
    corTema: '#EC4899',
    corSecundaria: '#FBCFE8',
    corSombra: 'rgba(236, 72, 153, 0.45)',
    Icon: Mic,
  },
  {
    id: 'portugues',
    label: 'Português Forense',
    title: 'PORTUGUÊS FORENSE',
    subtitle: 'Redação jurídica de alto nível, gramática e clareza forense',
    badgeLabel: 'Português',
    defaultCount: 12,
    corTema: '#3B82F6',
    corSecundaria: '#BFDBFE',
    corSombra: 'rgba(59, 130, 246, 0.45)',
    Icon: Languages,
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa Acadêmica',
    title: 'PESQUISA ACADÊMICA',
    subtitle: 'Normas ABNT, teses, dissertações e artigos científicos',
    badgeLabel: 'Pesquisa',
    defaultCount: 10,
    corTema: '#06B6D4',
    corSecundaria: '#A5F3FC',
    corSombra: 'rgba(6, 182, 212, 0.45)',
    Icon: GraduationCap,
  },
  {
    id: 'oab',
    label: 'Exame OAB',
    title: 'REVISÃO & EXAME OAB',
    subtitle: 'Obras de referência e preparação para o Exame de Ordem',
    badgeLabel: 'OAB',
    defaultCount: 24,
    corTema: '#EF4444',
    corSecundaria: '#FECACA',
    corSombra: 'rgba(239, 68, 68, 0.45)',
    Icon: Award,
  },
];

export interface MateriaTabConfig {
  id: string;
  label: string;
  fullName: string;
  corPrimaria: string;
  corSecundaria: string;
  corBadgeNum: string;
  corSombra: string;
  corFundoBotao: string;
  subtitulo: string;
  defaultCount: number;
}

export const MATERIAS_DIREITO_TABS: MateriaTabConfig[] = [
  {
    id: 'administrativo',
    label: 'Administrativo',
    fullName: 'Direito Administrativo',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Regime jurídico-administrativo, licitações, contratos e servidores públicos',
    defaultCount: 26,
  },
  {
    id: 'ambiental',
    label: 'Ambiental',
    fullName: 'Direito Ambiental',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Princípios ambientais, SISNAMA, licenciamento e tutela ecológica',
    defaultCount: 7,
  },
  {
    id: 'civil',
    label: 'Civil',
    fullName: 'Direito Civil',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Parte geral, obrigações, contratos, coisas, família e sucessões',
    defaultCount: 56,
  },
  {
    id: 'constitucional',
    label: 'Constitucional',
    fullName: 'Direito Constitucional',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria da Constituição, controle de constitucionalidade e direitos fundamentais',
    defaultCount: 45,
  },
  {
    id: 'humanos',
    label: 'Direitos Humanos',
    fullName: 'Direitos Humanos',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Sistemas internacionais de proteção, tratados e direitos universais',
    defaultCount: 7,
  },
  {
    id: 'empresarial',
    label: 'Empresarial',
    fullName: 'Direito Empresarial',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria da empresa, sociedades, títulos de crédito e falência',
    defaultCount: 12,
  },
  {
    id: 'filosofia',
    label: 'Filosofia',
    fullName: 'Teoria e Filosofia do Direito',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Jusnaturalismo, positivismo, hermenêutica e teoria da justiça',
    defaultCount: 17,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    fullName: 'Direito Financeiro',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Orçamento público, receita, despesa, dívida pública e LRF',
    defaultCount: 16,
  },
  {
    id: 'internacional',
    label: 'Internacional',
    fullName: 'Direito Internacional Público',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Tratados, soberania, tribunais internacionais e diplomacia',
    defaultCount: 10,
  },
  {
    id: 'penal',
    label: 'Penal',
    fullName: 'Direito Penal',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria do crime, penas, parte geral e crimes em espécie',
    defaultCount: 44,
  },
  {
    id: 'penal-especial',
    label: 'Penal Especial',
    fullName: 'Lei Penal Especial',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Drogas, armas, crimes hediondos, lavagem e legislação penal extravagante',
    defaultCount: 14,
  },
  {
    id: 'politicas-publicas',
    label: 'Políticas Públicas',
    fullName: 'Políticas Públicas',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Governança, regulação, controle social e políticas de Estado',
    defaultCount: 14,
  },
  {
    id: 'previdenciario',
    label: 'Previdenciário',
    fullName: 'Direito Previdenciário',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Seguridade social, RGPS, benefícios, aposentadorias e custeio',
    defaultCount: 15,
  },
  {
    id: 'processual-civil',
    label: 'Proc. Civil',
    fullName: 'Direito Processual Civil',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Procedimento comum, recursos, execução e tutelas provisórias',
    defaultCount: 51,
  },
  {
    id: 'processual-penal',
    label: 'Proc. Penal',
    fullName: 'Direito Processual Penal',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Inquérito policial, provas, prisões, recursos e júri',
    defaultCount: 22,
  },
  {
    id: 'processual-trabalho',
    label: 'Proc. Trabalho',
    fullName: 'Direito Processual do Trabalho',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Competência da JT, petição inicial trabalhista, audiências e recursos',
    defaultCount: 11,
  },
  {
    id: 'trabalho',
    label: 'Trabalho',
    fullName: 'Direito do Trabalho',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Relações de emprego, contratos individuais, direito coletivo e reforma',
    defaultCount: 29,
  },
  {
    id: 'tributario',
    label: 'Tributário',
    fullName: 'Direito Tributário',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Sistema tributário nacional, competências, espécies tributárias e CTN',
    defaultCount: 39,
  },
];

export function normBiblioteca(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
