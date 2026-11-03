export interface SlideItem {
  tipo:
    | "Capa"
    | "Conteúdo"
    | "Questão"
    | "Questão de banca"
    | "Flashcard"
    | "Ligar termos"
    | "Completar"
    | "Verdadeiro ou falso"
    | "Linha do tempo"
    | "Mapa mental"
    | "Desafio"
    | "Comparador"
    | "Explorar"
    | "Toque e revele"
    | "Karaokê"
    | "Encerramento"
    | "Ouro"
    | string;
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
  certa?: number;
  feedback?: string;
  explicacao?: string;
  comentario?: string;
  frente?: string;
  verso?: string;
  instrucao?: string;
  pares?: [string, string][];
  ordemDefs?: number[];
  rotuloL?: string;
  rotuloR?: string;
  img2?: string;
  // Completar a frase
  partes?: string[];
  respostas?: string[];
  banco?: string[];
  fecho?: string;
  // Verdadeiro ou falso
  afirmacoes?: { t: string; v: boolean; exp: string }[];
  // Linha do tempo
  marcos?: { ano: string; titulo: string; texto: string }[];
  // Mapa mental
  centro?: string;
  ramos?: { nome: string; texto: string; chips: string[] }[];
  // Desafio Quiz
  perguntas?: any[];
  // Explorar / Hotspots / Pontos principais
  pontos?: any[];
  // Toque e revele
  cartas?: { p: string; r: string }[];
  // Frases de karaokê
  frases?: string[];
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
  urlHtmlR2?: string;
  urlJsonR2?: string;
}
