import type { ArtigoLei } from "@/data/mockData";
import type { LeiCapituloItem } from "@/lib/leiStructure";

export interface NarracaoItem {
  artigo_numero: string;
  audio_url: string;
  titulo_artigo?: string;
  word_timings?: unknown;
}

export interface LawOption {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  descricao: string;
  tipo: string;
  artigosCount?: number;
  status: "completo" | "em_breve";
  color: string;
}

export interface CapituloComAudiosData {
  capitulo: LeiCapituloItem;
  realArtigos: ArtigoLei[];
  audiosDisponiveis: Array<{ artigo: ArtigoLei; narracao: NarracaoItem }>;
  totalArts: number;
  totalAudios: number;
  pctGravado: number;
}
