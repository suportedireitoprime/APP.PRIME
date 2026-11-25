// Tipos oficiais do catálogo de Audiobooks + re-export do catálogo leve de metadados.
// Os capítulos e timestamps completos (18+ MB) são carregados sob demanda por livro via src/lib/audiobooksLoader.ts.

export interface AudiobookCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface AudiobookImagem {
  url: string;
  startTime: number;
  endTime: number;
  ordem: number;
  arquivo: string;
}

export interface AudiobookCapitulo {
  numero: number;
  id: string;
  titulo: string;
  autor: string;
  descricao: string;
  duracaoSegundos: number;
  duracaoFormatada: string;
  audioUrl: string;
  audioTituloUrl?: string;
  srtUrl?: string;
  cues: AudiobookCue[];
  imagens: AudiobookImagem[];
}

export interface AudiobookLivro {
  id: string;
  tableId?: number;
  titulo: string;
  subtitulo?: string;
  autor: string;
  ano?: number | string | null;
  descricao: string;
  sinopse?: string;
  capaUrl: string;
  totalCapitulos: number;
  duracaoTotalSegundos?: number;
  duracaoTotalFormatada?: string;
  tags?: string[];
  status: 'disponivel' | 'em_breve';
  capitulos: AudiobookCapitulo[];
  temResumo?: boolean;
  resumoAudioUrl?: string;
  resumoSrtUrl?: string;
  resumoDuracaoFormatada?: string;
}

export {
  AUDIOBOOKS_CATALOGO_META as AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS_META as O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
} from './audiobooksMeta';
