export interface Peticao {
  id: string;
  user_id: string;
  titulo: string;
  fatos_texto: string | null;
  area_direito: string | null;
  tags: string[];
  resumo: string | null;
  pedidos: any;
  partes: any;
  dados_sensiveis: any;
  peca_markdown: string | null;
  jurisprudencias: any;
  fontes: any;
  status: string;
  etapa: number;
}

export interface Juris {
  tribunal: string;
  tipo?: string;
  numero?: string;
  titulo?: string;
  tese?: string;
  ementa?: string;
  link?: string;
  relator?: string;
  data?: string;
}

export const CAMPOS_SENSIVEIS = [
  { key: 'NOME_AUTOR', label: 'Nome completo do autor', mask: '' },
  { key: 'CPF_AUTOR', label: 'CPF do autor', mask: '000.000.000-00' },
  { key: 'RG_AUTOR', label: 'RG do autor', mask: '' },
  { key: 'ENDERECO_AUTOR', label: 'Endereço do autor', mask: '' },
  { key: 'TEL_AUTOR', label: 'Telefone do autor', mask: '(00) 00000-0000' },
  { key: 'EMAIL_AUTOR', label: 'E-mail do autor', mask: '' },
  { key: 'CIDADE_AUTOR', label: 'Cidade', mask: '' },
  { key: 'NOME_REU', label: 'Nome do réu', mask: '' },
  { key: 'CNPJ_REU', label: 'CNPJ do réu', mask: '00.000.000/0000-00' },
  { key: 'ENDERECO_REU', label: 'Endereço do réu', mask: '' },
  { key: 'VALOR_CAUSA', label: 'Valor da causa (R$)', mask: '' },
  { key: 'NOME_ADVOGADO', label: 'Nome do advogado', mask: '' },
  { key: 'OAB_ADVOGADO', label: 'Número da OAB', mask: '' },
];

export const SECOES = [
  { id: 'cabecalho', label: 'Endereçamento e qualificação' },
  { id: 'fatos', label: 'Dos fatos' },
  { id: 'direito', label: 'Do direito' },
  { id: 'jurisprudencia', label: 'Da jurisprudência' },
  { id: 'pedidos', label: 'Dos pedidos' },
  { id: 'encerramento', label: 'Valor da causa e encerramento' },
];

export const STEPS = [
  { n: 1, label: 'Fatos' },
  { n: 2, label: 'Triagem' },
  { n: 3, label: 'Resumo' },
  { n: 4, label: 'Partes' },
  { n: 5, label: 'Jurisprudência' },
  { n: 6, label: 'Elaboração' },
  { n: 7, label: 'Pronta' },
];
