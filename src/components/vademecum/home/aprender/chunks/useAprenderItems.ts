import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAST_PILLS_ITEMS } from '@/components/vademecum/home/sections/homeSectionsData';
import { AprenderItem } from './aprenderCarouselTypes';
import { getAreaCover } from '@/lib/areasDireitoCovers';

const APRENDER_AREAS = [
  {
    id: 'direito-administrativo',
    label: 'Direito Administrativo',
    fullName: 'Direito Administrativo',
    descricao: 'Regime jurídico, licitações, contratos e servidores públicos',
  },
  {
    id: 'direito-civil',
    label: 'Direito Civil',
    fullName: 'Direito Civil',
    descricao: 'Parte geral, obrigações, contratos, família e sucessões',
  },
  {
    id: 'direito-penal',
    label: 'Direito Penal',
    fullName: 'Direito Penal',
    descricao: 'Teoria do crime, penas, tipicidade e crimes em espécie',
  },
  {
    id: 'direito-constitucional',
    label: 'Direito Constitucional',
    fullName: 'Direito Constitucional',
    descricao: 'Direitos fundamentais, organização do Estado e controle',
  },
  {
    id: 'direito-processual-civil',
    label: 'Direito Processual Civil',
    fullName: 'Direito Processual Civil',
    descricao: 'Procedimentos, tutela provisória, execução e recursos',
  },
  {
    id: 'direito-processual-penal',
    label: 'Direito Processual Penal',
    fullName: 'Direito Processual Penal',
    descricao: 'Inquérito, ação penal, provas, prisões e procedimentos',
  },
  {
    id: 'direito-tributario',
    label: 'Direito Tributário',
    fullName: 'Direito Tributário',
    descricao: 'Sistema tributário, impostos, taxas e execução fiscal',
  },
  {
    id: 'direito-do-trabalho',
    label: 'Direito do Trabalho',
    fullName: 'Direito do Trabalho',
    descricao: 'Contrato individual, verbas, jornada e estabilidade',
  },
  {
    id: 'direito-empresarial',
    label: 'Direito Empresarial',
    fullName: 'Direito Empresarial',
    descricao: 'Sociedades, títulos de crédito, recuperação e falência',
  },
  {
    id: 'direito-ambiental',
    label: 'Direito Ambiental',
    fullName: 'Direito Ambiental',
    descricao: 'Princípios ambientais, licenciamento e crimes ecológicos',
  },
  {
    id: 'direitos-humanos',
    label: 'Direitos Humanos',
    fullName: 'Direitos Humanos',
    descricao: 'Tratados internacionais e proteção da dignidade humana',
  },
  {
    id: 'direito-internacional-publico',
    label: 'Direito Internacional Público',
    fullName: 'Direito Internacional Público',
    descricao: 'Soberania, tratados, imunidades e tribunais mundiais',
  },
  {
    id: 'direito-previdenciario',
    label: 'Direito Previdenciário',
    fullName: 'Direito Previdenciário',
    descricao: 'Regime geral, aposentadorias, benefícios e custeio',
  },
  {
    id: 'direito-desportivo',
    label: 'Direito Desportivo',
    fullName: 'Direito Desportivo',
    descricao: 'Legislação esportiva, contratos e justiça desportiva',
  },
  {
    id: 'direito-processual-do-trabalho',
    label: 'Direito Processual do Trabalho',
    fullName: 'Direito Processual do Trabalho',
    descricao: 'Dissídios individuais, audiências, ritos e execução',
  },
  {
    id: 'direito-financeiro',
    label: 'Direito Financeiro',
    fullName: 'Direito Financeiro',
    descricao: 'Orçamento público, despesas e responsabilidade fiscal',
  },
  {
    id: 'direito-concorrencial',
    label: 'Direito Concorrencial',
    fullName: 'Direito Concorrencial',
    descricao: 'Defesa da concorrência, cartéis e regulação do CADE',
  },
  {
    id: 'direito-urbanistico',
    label: 'Direito Urbanístico',
    fullName: 'Direito Urbanístico',
    descricao: 'Estatuto da Cidade, plano diretor e política urbana',
  },
  {
    id: 'direito-internacional-privado',
    label: 'Direito Internacional Privado',
    fullName: 'Direito Internacional Privado',
    descricao: 'Conflito de leis no espaço e cooperação internacional',
  },
  {
    id: 'lei-penal-especial',
    label: 'Legislação Penal Especial',
    fullName: 'Legislação Penal Especial',
    descricao: 'Crimes de drogas, armas, trânsito e lavagem de capitais',
  },
  {
    id: 'formacao-complementar',
    label: 'Formação Complementar',
    fullName: 'Formação Complementar',
    descricao: 'Oratória, argumentação, deontologia e ética jurídica',
  },
  {
    id: 'pesquisa-cientifica',
    label: 'Pesquisa Científica',
    fullName: 'Pesquisa Científica',
    descricao: 'Metodologia científica e elaboração de artigos e TCC',
  },
  {
    id: 'politicas-publicas',
    label: 'Políticas Públicas',
    fullName: 'Políticas Públicas',
    descricao: 'Ciclo governamental, controle social e eficácia legal',
  },
  {
    id: 'portugues',
    label: 'Língua Portuguesa',
    fullName: 'Língua Portuguesa',
    descricao: 'Gramática aplicada, redação forense e estilo jurídico',
  },
  {
    id: 'pratica-profissional',
    label: 'Prática Profissional',
    fullName: 'Prática Profissional',
    descricao: 'Prática da advocacia, peticionamento e rotina forense',
  },
  {
    id: 'revisao-oab',
    label: 'Revisão OAB',
    fullName: 'Revisão para a OAB',
    descricao: 'Temas recorrentes e preparação estratégica para a OAB',
  },
  {
    id: 'teoria-e-filosofia-do-direito',
    label: 'Teoria e Filosofia do Direito',
    fullName: 'Teoria e Filosofia do Direito',
    descricao: 'Conceito de justiça, hermenêutica e correntes jurídicas',
  },
];

export const AREA_THEME_COLORS: Record<string, { border: string; glow: string }> = {
  'direito-ambiental': { border: '#10B981', glow: 'rgba(16, 185, 129, 0.55)' },
  'direito-penal': { border: '#E11D48', glow: 'rgba(225, 29, 72, 0.55)' },
  'direito-civil': { border: '#3B82F6', glow: 'rgba(59, 130, 246, 0.55)' },
  'direito-constitucional': { border: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.55)' },
  'direito-administrativo': { border: '#F97316', glow: 'rgba(249, 115, 22, 0.55)' },
  'direito-tributario': { border: '#EAB308', glow: 'rgba(234, 179, 8, 0.55)' },
  'direito-do-trabalho': { border: '#EC4899', glow: 'rgba(236, 72, 153, 0.55)' },
  'direito-empresarial': { border: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.55)' },
  'direito-processual-civil': { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.55)' },
  'direito-processual-penal': { border: '#A855F7', glow: 'rgba(168, 85, 247, 0.55)' },
  'direitos-humanos': { border: '#F43F5E', glow: 'rgba(244, 63, 94, 0.55)' },
  'direito-internacional-publico': { border: '#06B6D4', glow: 'rgba(6, 182, 212, 0.55)' },
  'direito-internacional-privado': { border: '#14B8A6', glow: 'rgba(20, 184, 166, 0.55)' },
  'direito-previdenciario': { border: '#FB7185', glow: 'rgba(251, 113, 133, 0.55)' },
  'direito-desportivo': { border: '#FBBF24', glow: 'rgba(251, 191, 36, 0.55)' },
  'direito-processual-do-trabalho': { border: '#D946EF', glow: 'rgba(217, 70, 239, 0.55)' },
  'direito-financeiro': { border: '#FACC15', glow: 'rgba(250, 204, 21, 0.55)' },
  'direito-concorrencial': { border: '#FDE047', glow: 'rgba(253, 224, 71, 0.55)' },
  'direito-urbanistico': { border: '#FB923C', glow: 'rgba(251, 146, 60, 0.55)' },
  'lei-penal-especial': { border: '#BE123C', glow: 'rgba(190, 18, 60, 0.55)' },
  'formacao-complementar': { border: '#818CF8', glow: 'rgba(129, 140, 248, 0.55)' },
  'pesquisa-cientifica': { border: '#38BDF8', glow: 'rgba(56, 189, 248, 0.55)' },
  'politicas-publicas': { border: '#F472B6', glow: 'rgba(244, 114, 182, 0.55)' },
  'portugues': { border: '#FBBF24', glow: 'rgba(251, 191, 36, 0.55)' },
  'pratica-profissional': { border: '#94A3B8', glow: 'rgba(148, 163, 184, 0.55)' },
  'revisao-oab': { border: '#F59E0B', glow: 'rgba(245, 158, 11, 0.55)' },
  'teoria-e-filosofia-do-direito': { border: '#A78BFA', glow: 'rgba(167, 139, 250, 0.55)' },
};

export function useAprenderItems() {
  const navigate = useNavigate();

  const items = useMemo<AprenderItem[]>(() => {
    // Filtra apenas as áreas que possuem uma capa própria carregada
    const availableAreas = APRENDER_AREAS.filter(area => {
      const coverObj = getAreaCover(area.fullName) || getAreaCover(area.label);
      return !!coverObj;
    });
    
    // Ordena as matérias em ordem alfabética
    const sortedAreas = availableAreas.sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
    
    const cpImage = FAST_PILLS_ITEMS[0].image;

    return sortedAreas.map((area, index) => {
      const coverObj = getAreaCover(area.fullName) || getAreaCover(area.label);
      const image = coverObj?.cover || cpImage;
      const theme = AREA_THEME_COLORS[area.id] || { border: '#E11D48', glow: 'rgba(225, 29, 72, 0.55)' };
      
      return {
        id: area.id,
        image,
        text: area.fullName,
        fullName: area.fullName,
        descricao: area.descricao,
        borderColor: theme.border,
        glowColor: theme.glow,
        progress: Math.min(0.85, 0.2 + (index * 0.08)),
        showPlayButton: true,
        position: 'inside-bottom',
      };
    });
  }, []);

  const handleItemClick = useCallback(
    (item: { id: string }) => {
      import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
      navigate(`/aprender/area/${item.id}`);
    },
    [navigate]
  );

  return { items, handleItemClick };
}
