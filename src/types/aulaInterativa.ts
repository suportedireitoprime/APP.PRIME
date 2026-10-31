export interface SlideItem {
  tipo: 'Capa' | 'Conteúdo' | 'Questão' | 'Questão de banca' | 'Flashcard' | 'Ligar termos' | 'Encerramento' | string;
  img?: string;
  imgUrl?: string;
  alt?: string;
  kicker?: string;
  titulo?: string;
  corpo?: string;
  narr?: string;
  // Propriedades interativas
  intro?: string;
  questao?: string;
  opcoes?: string[];
  correta?: number;
  frente?: string;
  verso?: string;
  instrucao?: string;
  pares?: [string, string][];
  ordemDefs?: number[];
  rotuloL?: string;
  rotuloR?: string;
  img2?: string;
  [key: string]: any;
}

export interface AulaData {
  aulaId: string;
  titulo: string;
  disciplinaId: string;
  totalEtapas: number;
  slides: SlideItem[];
  imagens: Record<string, string>;
  audioBaseUrl?: string;
}
