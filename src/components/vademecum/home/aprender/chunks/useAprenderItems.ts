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
      
      return {
        id: area.id,
        image,
        text: area.fullName,
        fullName: area.fullName,
        descricao: area.descricao,
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
