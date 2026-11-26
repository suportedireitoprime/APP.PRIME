export interface AnimacaoItem {
  slug: string;
  titulo: string;
  tituloHtml?: string;
  categoria: string;
  gabarito: string | null;
  artigoRef: string | null;
  exameRef: string | null;
  resumo: string;
  tratamentoMd: string;
  htmlR2Url: string;
  audiosR2Urls: string[];
  totalAudios: number;
  driveFolderId: string;
}
