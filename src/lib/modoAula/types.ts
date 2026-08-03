/** Tipos do Modo Aula. */

export interface Disciplina {
  id: string;
  user_id: string;
  nome: string;
  professor: string | null;
  cor: string | null;
  periodo: string | null;
  created_at: string;
}

export type StatusAula = 'rascunho' | 'gravando' | 'processando' | 'transcrita' | 'erro';

export interface Aula {
  id: string;
  user_id: string;
  disciplina_id: string | null;
  titulo: string;
  numero: number | null;
  professor: string | null;
  data: string;
  status: StatusAula;
  duracao_seg: number;
  gratuita: boolean;
  erro: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoMidia = 'audio' | 'foto_lousa' | 'foto_slide' | 'foto_caderno' | 'anotacao';

export interface AulaMidia {
  id: string;
  aula_id: string;
  tipo: TipoMidia;
  storage_path: string | null;
  mime: string | null;
  bytes: number | null;
  duracao_seg: number | null;
  ordem: number;
  ocr_texto: string | null;
  texto: string | null;
  created_at: string;
}

export interface FalaTranscrita {
  ini: number;
  fim: number;
  fala: string;
  speaker?: string;
}

export interface AulaTranscricao {
  id: string;
  aula_id: string;
  texto: string;
  segmentos: FalaTranscrita[];
  idioma: string | null;
}

export type TipoMarcador = 'manual' | 'prova' | 'exemplo' | 'pergunta' | 'conceito';

export interface AulaMarcador {
  id: string;
  aula_id: string;
  segundo: number;
  tipo: TipoMarcador;
  texto: string | null;
  created_at: string;
}
