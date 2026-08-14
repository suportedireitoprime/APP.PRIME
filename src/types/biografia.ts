export type BioTabType = 'historia' | 'obras' | 'tabela' | 'linha_do_tempo' | 'legado';

export interface BioTimelineItem {
  ano: string;
  evento: string;
  detalhe: string;
}

export interface BioTabelaItem {
  topico: string;
  personagem: string; 
  oponente: string;
}

export interface BioTab {
  id: BioTabType;
  label: string;
  conteudo_md?: string;
  timeline?: BioTimelineItem[];
  tabela?: {
    oponenteNome: string;
    items: BioTabelaItem[];
  };
}

export interface BiografiaData {
  id: string;
  categoriaId: string;
  nome: string;
  subtitulo: string;
  imagemUrl?: string;
  tabs: BioTab[];
}
